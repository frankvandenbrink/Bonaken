import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, GameState, PlayedCard } from '../../../shared/src/index';
import { gameManager } from '../game/GameManager';
import { isValidCard, getValidCardIds } from '../game/cardValidation';
import { getTrickWinnerId } from '../game/trickWinner';
import { getNextPlayer, getFirstPlayer, getMajorityThreshold } from '../game/turnManager';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Delay constants
const TRICK_DISPLAY_DELAY = 2500; // 2.5 seconden om slag te bekijken
const ROUND_END_DELAY = 1500; // 1.5 seconden voor ronde-einde

/**
 * Start een beurt voor een speler
 */
export function startTurn(io: TypedServer, game: GameState, playerId: string) {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return;

  game.currentTurn = playerId;
  const validCardIds = getValidCardIds(player.hand, game.currentTrick, game.trump);

  console.log(`Beurt van ${player.nickname}, ${validCardIds.length} geldige kaarten`);

  io.to(game.code).emit('turn-start', {
    playerId,
    validCardIds
  });
}

/**
 * Verwerk een gespeelde kaart
 */
function handlePlayCard(
  io: TypedServer,
  socket: TypedSocket,
  game: GameState,
  cardId: string
) {
  const player = game.players.find(p => p.id === socket.id);
  if (!player) {
    socket.emit('error', { message: 'Speler niet gevonden' });
    return;
  }

  // Vind de kaart in de hand
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    socket.emit('error', { message: 'Kaart niet in hand' });
    return;
  }

  const card = player.hand[cardIndex];

  // Valideer of kaart gespeeld mag worden
  if (!isValidCard(cardId, player.hand, game.currentTrick, game.trump)) {
    socket.emit('error', { message: 'Deze kaart mag niet gespeeld worden' });
    return;
  }

  // Verwijder kaart uit hand
  player.hand.splice(cardIndex, 1);

  // Voeg toe aan huidige slag
  const playedCard: PlayedCard = {
    playerId: socket.id,
    card
  };
  game.currentTrick.push(playedCard);

  console.log(`${player.nickname} speelt ${card.rank} ${card.suit}`);

  // Broadcast naar alle spelers
  io.to(game.code).emit('card-played', {
    playerId: socket.id,
    card
  });

  // Check of slag compleet is
  if (game.currentTrick.length === game.players.length) {
    handleTrickComplete(io, game);
  } else {
    // Volgende speler aan de beurt
    const nextPlayer = getNextPlayer(game.players, socket.id);
    startTurn(io, game, nextPlayer.id);
  }

  game.lastActivity = Date.now();
}

/**
 * Verwerk een complete slag
 */
function handleTrickComplete(io: TypedServer, game: GameState) {
  const winnerId = getTrickWinnerId(game.currentTrick, game.trump);
  const winner = game.players.find(p => p.id === winnerId);

  if (winner) {
    winner.tricksWon++;
    console.log(`${winner.nickname} wint de slag (${winner.tricksWon} slagen totaal)`);
  }

  // Collect tricksWon for all players
  const tricksWon: Record<string, number> = {};
  game.players.forEach(p => {
    tricksWon[p.id] = p.tricksWon;
  });

  // Emit trick complete with updated scores
  io.to(game.code).emit('trick-complete', { winnerId, tricksWon });

  // Wacht even zodat spelers de slag kunnen zien
  setTimeout(() => {
    // Clear de slag
    game.currentTrick = [];
    io.to(game.code).emit('trick-cleared');

    // Check of ronde voorbij is (alle kaarten gespeeld)
    const allCardsPlayed = game.players.every(p => p.hand.length === 0);

    if (allCardsPlayed) {
      handleRoundComplete(io, game);
    } else {
      // Winnaar begint volgende slag
      startTurn(io, game, winnerId);
    }
  }, TRICK_DISPLAY_DELAY);
}

/**
 * Verwerk het einde van een ronde
 */
function handleRoundComplete(io: TypedServer, game: GameState) {
  console.log('Ronde compleet!');

  // Bereken scores
  const totalTricks = game.players[0]?.tricksWon !== undefined
    ? game.players.reduce((sum, p) => sum + p.tricksWon, 0)
    : 0;

  const majorityThreshold = getMajorityThreshold(totalTricks);
  let bonakenSucceeded: boolean | null = null;

  const roundScores: Record<string, number> = {};
  game.players.forEach(p => {
    roundScores[p.id] = 0;
  });

  if (game.bonaker) {
    // Iemand heeft gebonaakt
    const bonaker = game.players.find(p => p.id === game.bonaker);
    if (bonaker) {
      bonakenSucceeded = bonaker.tricksWon >= majorityThreshold;

      if (bonakenSucceeded) {
        // Bonaken geslaagd: +1 voor alle anderen
        console.log(`${bonaker.nickname} heeft succesvol gebonaakt!`);
        game.players.forEach(p => {
          if (p.id !== game.bonaker) {
            roundScores[p.id] = 1;
            p.score += 1;
          }
        });
      } else {
        // Bonaken mislukt: +3 voor bonaker
        console.log(`${bonaker.nickname} is mislukt met bonaken!`);
        roundScores[game.bonaker] = 3;
        bonaker.score += 3;
      }
    }
  } else {
    // Niemand heeft gebonaakt: +1 voor speler(s) met minste slagen
    const minTricks = Math.min(...game.players.map(p => p.tricksWon));
    game.players.forEach(p => {
      if (p.tricksWon === minTricks) {
        roundScores[p.id] = 1;
        p.score += 1;
      }
    });
    console.log(`Niemand bonakte, spelers met ${minTricks} slagen krijgen +1`);
  }

  // Emit round scores
  io.to(game.code).emit('round-scores', {
    scores: roundScores,
    bonakenSucceeded
  });

  // Emit updated game scores
  const gameScores: Record<string, number> = {};
  game.players.forEach(p => {
    gameScores[p.id] = p.score;
  });
  io.to(game.code).emit('game-scores', { scores: gameScores });

  // Check of iemand 10+ punten heeft (verloren)
  const loser = game.players.find(p => p.score >= 10);
  if (loser) {
    handleGameEnd(io, game, loser.id);
  } else {
    // Start volgende ronde na korte delay
    setTimeout(() => {
      startNextRound(io, game);
    }, ROUND_END_DELAY);
  }

  game.lastActivity = Date.now();
}

/**
 * Verwerk het einde van het spel
 */
function handleGameEnd(io: TypedServer, game: GameState, loserId: string) {
  game.phase = 'game-end';

  const finalScores: Record<string, number> = {};
  game.players.forEach(p => {
    finalScores[p.id] = p.score;
  });

  const loser = game.players.find(p => p.id === loserId);
  console.log(`Spel voorbij! ${loser?.nickname} heeft verloren met ${loser?.score} punten`);

  io.to(game.code).emit('game-ended', {
    loserId,
    finalScores
  });

  game.lastActivity = Date.now();
}

/**
 * Reset het spel voor een rematch
 */
function resetForRematch(game: GameState) {
  // Reset alle scores
  game.players.forEach(p => {
    p.score = 0;
    p.tricksWon = 0;
    p.hand = [];
  });

  // Roteer deler naar volgende speler
  const currentDealerIndex = game.players.findIndex(p => p.id === game.currentDealer);
  const nextDealerIndex = (currentDealerIndex + 1) % game.players.length;
  game.currentDealer = game.players[nextDealerIndex].id;

  // Reset game state
  game.bonaker = null;
  game.trump = null;
  game.currentTrick = [];
  game.roundNumber = 1;
  game.rematchRequests = [];
  game.sleepingCards = [];
  game.bonakenChoices = [];
}

/**
 * Verwerk een rematch verzoek
 */
function handleRematchRequest(io: TypedServer, socket: TypedSocket, game: GameState) {
  const player = game.players.find(p => p.id === socket.id);
  if (!player) return;

  // Voeg toe aan rematch requests als nog niet aanwezig
  if (!game.rematchRequests.includes(socket.id)) {
    game.rematchRequests.push(socket.id);
    console.log(`${player.nickname} wil een rematch (${game.rematchRequests.length}/${game.players.length})`);

    io.to(game.code).emit('rematch-requested', {
      playerId: socket.id,
      nickname: player.nickname
    });
  }

  // Check of iedereen rematch wil
  if (game.rematchRequests.length === game.players.length) {
    console.log('Iedereen wil rematch - nieuw spel starten!');
    resetForRematch(game);
    io.to(game.code).emit('rematch-started');

    // Start nieuw spel (kaarten delen etc.)
    startNextRound(io, game);
  }

  game.lastActivity = Date.now();
}

/**
 * Start een nieuwe ronde
 */
function startNextRound(io: TypedServer, game: GameState) {
  // Roteer deler naar volgende speler
  const currentDealerIndex = game.players.findIndex(p => p.id === game.currentDealer);
  const nextDealerIndex = (currentDealerIndex + 1) % game.players.length;
  game.currentDealer = game.players[nextDealerIndex].id;

  // Reset tricksWon
  game.players.forEach(p => {
    p.tricksWon = 0;
  });

  // Reset game state voor nieuwe ronde
  game.bonaker = null;
  game.trump = null;
  game.currentTrick = [];
  game.roundNumber++;

  console.log(`Start ronde ${game.roundNumber}, deler: ${game.players[nextDealerIndex].nickname}`);

  // Deal nieuwe kaarten
  const { dealCards } = require('./lobbyHandlers').default || require('../game/dealing');
  const { hands, sleepingCards } = require('../game/dealing').dealCards(game.players);

  // Assign hands to players
  for (const player of game.players) {
    const hand = hands.get(player.id);
    if (hand) {
      player.hand = hand;
    }
  }
  game.sleepingCards = sleepingCards;

  // Send cards to each player
  for (const player of game.players) {
    const playerSocket = io.sockets.sockets.get(player.id);
    if (playerSocket) {
      playerSocket.emit('cards-dealt', { hand: player.hand });
    }
  }

  // Initialize bonaken choices
  game.bonakenChoices = game.players.map(p => ({
    playerId: p.id,
    choice: null
  }));

  // Go to bonaken phase
  game.phase = 'bonaken';
  io.to(game.code).emit('bonaken-phase-start');

  game.lastActivity = Date.now();
}

/**
 * Setup gameplay handlers
 */
export function setupGameplayHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('play-card', ({ cardId }) => {
    const game = gameManager.getGameByPlayerId(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    if (game.phase !== 'playing') {
      socket.emit('error', { message: 'Het is geen speelfase' });
      return;
    }

    if (game.currentTurn !== socket.id) {
      socket.emit('error', { message: 'Het is niet jouw beurt' });
      return;
    }

    handlePlayCard(io, socket, game, cardId);
  });

  socket.on('request-rematch', () => {
    const game = gameManager.getGameByPlayerId(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    if (game.phase !== 'game-end') {
      socket.emit('error', { message: 'Het spel is nog niet afgelopen' });
      return;
    }

    handleRematchRequest(io, socket, game);
  });
}

// Export startTurn for use in trumpHandlers
export { startTurn as startPlayerTurn };
