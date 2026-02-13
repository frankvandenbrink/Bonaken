import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, GameState, PlayedCard } from 'shared';
import { getTrickPoints } from 'shared';
import { gameManager } from '../game/GameManager';
import { isValidCard, getValidCardIds } from '../game/cardValidation';
import { getTrickWinnerId } from '../game/trickWinner';
import { getNextPlayer } from '../game/turnManager';
import { initBiddingState } from '../game/bidding';
import { dealCards } from '../game/dealing';
import { determineRoundResult, isGameComplete } from '../game/scoring';
import { startTimer, cancelTimer } from '../game/timer';
import { startBidTimer } from './biddingHandlers';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const TRICK_DISPLAY_DELAY = 2500;
const ROUND_END_DELAY = 5500;

/**
 * Start een beurt voor een speler, inclusief timer
 */
export function startTurn(io: TypedServer, game: GameState, playerId: string) {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return;

  game.currentTurn = playerId;
  const validCardIds = getValidCardIds(player.hand, game.currentTrick, game.trump);

  console.log(`Beurt van ${player.nickname}, ${validCardIds.length} geldige kaarten`);

  // Start timer als geconfigureerd
  const seconds = game.settings.turnTimerSeconds;
  if (seconds) {
    const deadline = startTimer(game.id, seconds, () => {
      // Auto-play: speel willekeurige geldige kaart
      if (game.phase === 'playing' && game.currentTurn === playerId) {
        const currentValidIds = getValidCardIds(player.hand, game.currentTrick, game.trump);
        if (currentValidIds.length > 0) {
          const randomCardId = currentValidIds[Math.floor(Math.random() * currentValidIds.length)];
          game.turnDeadline = null;

          io.to(game.id).emit('timer-expired', { playerId, autoAction: 'auto-kaart' });

          // Speel de kaart
          const cardIndex = player.hand.findIndex(c => c.id === randomCardId);
          if (cardIndex !== -1) {
            const card = player.hand[cardIndex];
            player.hand.splice(cardIndex, 1);

            const playedCard: PlayedCard = { playerId, card };
            game.currentTrick.push(playedCard);

            console.log(`${player.nickname} speelt auto: ${card.rank} ${card.suit}`);
            io.to(game.id).emit('card-played', { playerId, card });

            const activePlayers = game.players.filter(p => p.status !== 'erin' && p.status !== 'eruit');
            if (game.currentTrick.length === activePlayers.length) {
              handleTrickComplete(io, game);
            } else {
              const nextPlayer = getNextActivePlayer(game, playerId);
              if (nextPlayer) {
                startTurn(io, game, nextPlayer.id);
              }
            }

            game.lastActivity = Date.now();
          }
        }
      }
    });
    game.turnDeadline = deadline;
  } else {
    game.turnDeadline = null;
  }

  io.to(game.id).emit('turn-start', {
    playerId,
    validCardIds,
    deadline: game.turnDeadline
  });
}

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

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    socket.emit('error', { message: 'Kaart niet in hand' });
    return;
  }

  const card = player.hand[cardIndex];

  if (!isValidCard(cardId, player.hand, game.currentTrick, game.trump)) {
    socket.emit('error', { message: 'Deze kaart mag niet gespeeld worden' });
    return;
  }

  cancelTimer(game.id);
  game.turnDeadline = null;

  player.hand.splice(cardIndex, 1);

  const playedCard: PlayedCard = { playerId: socket.id, card };
  game.currentTrick.push(playedCard);

  console.log(`${player.nickname} speelt ${card.rank} ${card.suit}`);

  io.to(game.id).emit('card-played', { playerId: socket.id, card });

  // Check of slag compleet is (alle actieve spelers)
  const activePlayers = game.players.filter(p => p.status !== 'erin' && p.status !== 'eruit');
  if (game.currentTrick.length === activePlayers.length) {
    handleTrickComplete(io, game);
  } else {
    const nextPlayer = getNextActivePlayer(game, socket.id);
    if (nextPlayer) {
      startTurn(io, game, nextPlayer.id);
    }
  }

  game.lastActivity = Date.now();
}

/**
 * Krijg de volgende actieve speler (niet erin/eruit)
 */
function getNextActivePlayer(game: GameState, currentPlayerId: string) {
  const currentIndex = game.players.findIndex(p => p.id === currentPlayerId);
  for (let i = 1; i <= game.players.length; i++) {
    const nextIndex = (currentIndex + i) % game.players.length;
    const nextPlayer = game.players[nextIndex];
    if (nextPlayer.status !== 'erin' && nextPlayer.status !== 'eruit') {
      return nextPlayer;
    }
  }
  return null;
}

function handleTrickComplete(io: TypedServer, game: GameState) {
  const winnerId = getTrickWinnerId(game.currentTrick, game.trump);
  const winner = game.players.find(p => p.id === winnerId);

  // Bereken kaartpunten van deze slag
  const trickPts = getTrickPoints(game.currentTrick, game.trump);

  if (winner) {
    winner.tricksWon++;
    winner.trickPoints += trickPts;
    console.log(`${winner.nickname} wint de slag (${trickPts} punten, ${winner.tricksWon} slagen totaal)`);
  }

  const tricksWon: Record<string, number> = {};
  const playerTrickPoints: Record<string, number> = {};
  game.players.forEach(p => {
    tricksWon[p.id] = p.tricksWon;
    playerTrickPoints[p.id] = p.trickPoints;
  });

  io.to(game.id).emit('trick-complete', { winnerId, trickPoints: trickPts, tricksWon, playerTrickPoints });

  setTimeout(() => {
    game.currentTrick = [];
    io.to(game.id).emit('trick-cleared');

    const activePlayers = game.players.filter(p => p.status !== 'erin' && p.status !== 'eruit');
    const allCardsPlayed = activePlayers.every(p => p.hand.length === 0);

    if (allCardsPlayed) {
      handleRoundComplete(io, game);
    } else {
      startTurn(io, game, winnerId);
    }
  }, TRICK_DISPLAY_DELAY);
}

function handleRoundComplete(io: TypedServer, game: GameState) {
  console.log('Ronde compleet!');

  const bidWinner = game.bidWinner;
  const bid = game.currentBid;

  if (!bidWinner || !bid) {
    startNextRound(io, game);
    return;
  }

  // Gebruik scoring module voor ronde-resultaat
  const result = determineRoundResult(
    game.players,
    bidWinner,
    bid,
    game.trump,
    game.roemDeclarations
  );

  game.phase = 'round-end';

  io.to(game.id).emit('round-result', result);

  // Check of spel voorbij is
  if (isGameComplete(game.players)) {
    handleGameEnd(io, game);
  } else {
    setTimeout(() => {
      startNextRound(io, game);
    }, ROUND_END_DELAY);
  }

  game.lastActivity = Date.now();
}

function handleGameEnd(io: TypedServer, game: GameState) {
  cancelTimer(game.id);
  game.turnDeadline = null;
  game.phase = 'game-end';

  const playerStatuses: Record<string, import('shared').PlayerStatus> = {};
  game.players.forEach(p => {
    playerStatuses[p.id] = p.status;
  });

  console.log('Spel voorbij!', playerStatuses);

  io.to(game.id).emit('game-ended', { playerStatuses });
  game.lastActivity = Date.now();
}

function handleRematchRequest(io: TypedServer, socket: TypedSocket, game: GameState) {
  const player = game.players.find(p => p.id === socket.id);
  if (!player) return;

  if (!game.rematchRequests.includes(socket.id)) {
    game.rematchRequests.push(socket.id);
    console.log(`${player.nickname} wil een rematch (${game.rematchRequests.length}/${game.players.length})`);

    io.to(game.id).emit('rematch-requested', {
      playerId: socket.id,
      nickname: player.nickname
    });
  }

  if (game.rematchRequests.length === game.players.length) {
    console.log('Iedereen wil rematch - nieuw spel starten!');
    resetForRematch(game);
    io.to(game.id).emit('rematch-started');
    startNextRound(io, game);
  }

  game.lastActivity = Date.now();
}

function resetForRematch(game: GameState) {
  game.players.forEach(p => {
    p.status = 'suf';
    p.tricksWon = 0;
    p.trickPoints = 0;
    p.declaredRoem = 0;
    p.hasPassed = false;
    p.hand = [];
  });

  const currentDealerIndex = game.players.findIndex(p => p.id === game.currentDealer);
  const nextDealerIndex = (currentDealerIndex + 1) % game.players.length;
  game.currentDealer = game.players[nextDealerIndex].id;

  game.bidWinner = null;
  game.currentBid = null;
  game.trump = null;
  game.currentTrick = [];
  game.roundNumber = 1;
  game.rematchRequests = [];
  game.sleepingCards = [];
  game.tableCards = [];
  game.roemDeclarations = [];
  game.turnDeadline = null;
}

function startNextRound(io: TypedServer, game: GameState) {
  // Roteer deler
  const currentDealerIndex = game.players.findIndex(p => p.id === game.currentDealer);
  const nextDealerIndex = (currentDealerIndex + 1) % game.players.length;
  game.currentDealer = game.players[nextDealerIndex].id;

  // Reset voor nieuwe ronde
  game.players.forEach(p => {
    p.tricksWon = 0;
    p.trickPoints = 0;
    p.declaredRoem = 0;
    p.hasPassed = false;
  });

  game.bidWinner = null;
  game.currentBid = null;
  game.trump = null;
  game.currentTrick = [];
  game.roemDeclarations = [];
  game.roundNumber++;

  console.log(`Start ronde ${game.roundNumber}, deler: ${game.players[nextDealerIndex].nickname}`);

  // Deal nieuwe kaarten
  const activePlayers = game.players.filter(p => p.status !== 'erin' && p.status !== 'eruit');
  const { hands, tableCards, sleepingCards } = dealCards(activePlayers);

  for (const p of activePlayers) {
    const hand = hands.get(p.id);
    if (hand) {
      p.hand = hand;
    }
  }
  game.tableCards = tableCards;
  game.sleepingCards = sleepingCards;

  // Send cards to each active player
  for (const p of activePlayers) {
    const playerSocket = io.sockets.sockets.get(p.id);
    if (playerSocket) {
      playerSocket.emit('cards-dealt', {
        hand: p.hand,
        tableCards: tableCards.map(tc => ({
          card: tc.faceUp ? tc.card : { suit: tc.card.suit, rank: tc.card.rank, id: 'blind' },
          faceUp: tc.faceUp
        }))
      });
    }
  }

  // Initialize bidding
  const biddingState = initBiddingState(activePlayers, game.currentDealer);
  game.biddingOrder = biddingState.biddingOrder;
  game.currentTurn = biddingState.firstBidder;
  game.phase = 'bidding';

  io.to(game.id).emit('bidding-start', {
    biddingOrder: biddingState.biddingOrder,
    firstBidder: biddingState.firstBidder
  });

  startBidTimer(io, game);
  game.lastActivity = Date.now();
}

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

export { startTurn as startPlayerTurn };
