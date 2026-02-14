import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, TableCard, Suit } from 'shared';
import { gameManager } from '../game/GameManager';
import { isValidBid, getNextBidder, isBiddingComplete, initBiddingState } from '../game/bidding';
import { dealCards } from '../game/dealing';
import { startTimer, cancelTimer } from '../game/timer';
import { startPlayerTurn } from './gameplayHandlers';
import { emitSystemMessage } from './chatHandlers';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Start een bied-timer voor de huidige bieder.
 * Bij timeout wordt automatisch gepast.
 */
export function startBidTimer(io: TypedServer, game: import('shared').GameState) {
  const seconds = game.settings.turnTimerSeconds;
  if (!seconds || !game.currentTurn) return;

  const playerId = game.currentTurn;

  const deadline = startTimer(game.id, seconds, () => {
    // Auto-pas bij timeout
    const player = game.players.find(p => p.id === playerId);
    if (player && game.phase === 'bidding' && game.currentTurn === playerId) {
      player.hasPassed = true;
      game.turnDeadline = null;

      io.to(game.id).emit('timer-expired', { playerId, autoAction: 'auto-pas' });
      io.to(game.id).emit('bid-passed', { playerId });
      emitSystemMessage(io, game.id, `${player.nickname} past`);

      // Check of bieden compleet is
      const passedPlayers = new Set(game.players.filter(p => p.hasPassed).map(p => p.id));
      const { complete, winner } = isBiddingComplete(game.biddingOrder, passedPlayers, game.currentBid);

      if (complete) {
        if (winner && game.currentBid) {
          game.bidWinner = winner;
          const winnerName = game.players.find(p => p.id === winner)?.nickname || 'Onbekend';
          io.to(game.id).emit('bidding-complete', { winner, bid: game.currentBid });
          emitSystemMessage(io, game.id, `${winnerName} wint het bieden`);
          game.phase = 'card-swap';
          game.currentTurn = winner;

          const revealedTableCards = game.tableCards.map(tc => ({ ...tc, faceUp: true }));
          io.to(game.id).emit('card-swap-start', { playerId: winner, tableCards: revealedTableCards });
          startSwapTimer(io, game);
        } else {
          // Iedereen gepast
          io.to(game.id).emit('all-passed');
          emitSystemMessage(io, game.id, 'Iedereen heeft gepast, opnieuw delen');
          handleAllPassed(io, game);
        }
      } else {
        const nextBidder = getNextBidder(game.biddingOrder, playerId, passedPlayers);
        if (nextBidder) {
          game.currentTurn = nextBidder;
          startBidTimer(io, game);
          io.to(game.id).emit('turn-start', {
            playerId: nextBidder,
            validCardIds: [],
            deadline: game.turnDeadline
          });
        }
      }
      game.lastActivity = Date.now();
    }
  });

  game.turnDeadline = deadline;
}

/**
 * Exporteer startSwapTimer zodat trumpHandlers het kan gebruiken
 */
export function startSwapTimer(io: TypedServer, game: import('shared').GameState) {
  const seconds = game.settings.turnTimerSeconds;
  if (!seconds || !game.currentTurn) return;

  const playerId = game.currentTurn;

  const deadline = startTimer(game.id, seconds, () => {
    // Auto-discard: eerste N kaarten uit de hand
    if (game.phase === 'card-swap' && game.currentTurn === playerId) {
      const player = game.players.find(p => p.id === playerId);
      if (!player) return;

      game.turnDeadline = null;

      // Voeg tafelkaarten toe aan hand
      for (const tc of game.tableCards) {
        player.hand.push(tc.card);
      }

      // Leg de eerste tableCardCount kaarten af
      const discardCount = game.tableCards.length;
      const discarded = player.hand.splice(0, discardCount);

      game.tableCards = [];

      io.to(game.id).emit('timer-expired', { playerId, autoAction: 'auto-afleggen' });
      io.to(game.id).emit('cards-swapped', { discardCount: discarded.length });
      io.to(playerId).emit('cards-dealt', { hand: player.hand, tableCards: [] });

      // Troefkeuze of zwabber/misère
      if (game.currentBid?.type === 'zwabber' || game.currentBid?.type === 'misere') {
        game.trump = null;
        game.phase = 'playing';
        io.to(game.id).emit('trump-selected', { trump: null as unknown as import('shared').Suit });
        setTimeout(() => {
          io.to(game.id).emit('playing-start');
          startPlayerTurn(io, game, game.bidWinner!);
        }, 1000);
      } else {
        game.phase = 'trump-selection';
        game.currentTurn = playerId;
        io.to(game.id).emit('trump-selection-start', { selectorId: playerId });
        startTrumpTimer(io, game);
      }
      game.lastActivity = Date.now();
    }
  });

  game.turnDeadline = deadline;
  io.to(game.id).emit('timer-update', { deadline });
}

/**
 * Start een timer voor troefkeuze. Bij timeout: willekeurige kleur.
 */
export function startTrumpTimer(io: TypedServer, game: import('shared').GameState) {
  const seconds = game.settings.turnTimerSeconds;
  if (!seconds || !game.currentTurn) return;

  const playerId = game.currentTurn;
  const suits: import('shared').Suit[] = ['harten', 'ruiten', 'klaveren', 'schoppen'];

  const deadline = startTimer(game.id, seconds, () => {
    if (game.phase === 'trump-selection' && game.currentTurn === playerId) {
      game.turnDeadline = null;

      // Willekeurige troefkleur
      const randomSuit = suits[Math.floor(Math.random() * suits.length)];
      game.trump = randomSuit;

      io.to(game.id).emit('timer-expired', { playerId, autoAction: `auto-troef: ${randomSuit}` });
      io.to(game.id).emit('trump-selected', { trump: randomSuit });

      setTimeout(() => {
        game.phase = 'playing';
        game.lastActivity = Date.now();
        io.to(game.id).emit('playing-start');
        startPlayerTurn(io, game, game.bidWinner!);
      }, 1500);

      game.lastActivity = Date.now();
    }
  });

  game.turnDeadline = deadline;
  io.to(game.id).emit('timer-update', { deadline });
}

/**
 * Herstart bieden na iedereen gepast
 */
function handleAllPassed(io: TypedServer, game: import('shared').GameState) {
  const activePlayers = game.players.filter(p => p.status !== 'erin' && p.status !== 'eruit');
  const { hands, tableCards, sleepingCards } = dealCards(activePlayers);

  for (const p of activePlayers) {
    const hand = hands.get(p.id);
    if (hand) p.hand = hand;
    p.hasPassed = false;
  }

  game.tableCards = tableCards;
  game.sleepingCards = sleepingCards;
  game.currentBid = null;
  game.bidWinner = null;

  // Roteer deler — sla erin/eruit spelers over
  const dealerIndex = game.players.findIndex(p => p.id === game.currentDealer);
  let nextDealerIndex = (dealerIndex + 1) % game.players.length;
  for (let i = 0; i < game.players.length; i++) {
    if (game.players[nextDealerIndex].status !== 'erin' && game.players[nextDealerIndex].status !== 'eruit') {
      break;
    }
    nextDealerIndex = (nextDealerIndex + 1) % game.players.length;
  }
  game.currentDealer = game.players[nextDealerIndex].id;

  setTimeout(() => {
    for (const p of activePlayers) {
      const playerHand = hands.get(p.id);
      if (playerHand) {
        io.to(p.id).emit('cards-dealt', {
          hand: playerHand,
          tableCards: tableCards.map(tc => ({
            card: tc.faceUp ? tc.card : { suit: tc.card.suit, rank: tc.card.rank, id: 'blind' },
            faceUp: tc.faceUp
          }))
        });
      }
    }

    const biddingState = initBiddingState(activePlayers, game.currentDealer);
    game.biddingOrder = biddingState.biddingOrder;
    game.currentTurn = biddingState.firstBidder;
    game.phase = 'bidding';

    io.to(game.id).emit('bidding-start', {
      biddingOrder: biddingState.biddingOrder,
      firstBidder: biddingState.firstBidder
    });

    startBidTimer(io, game);
  }, 2000);
}

export function setupBiddingHandlers(io: TypedServer, socket: TypedSocket) {
  // Plaats een bod
  socket.on('place-bid', ({ type, amount }) => {
    const game = gameManager.getGameByPlayerId(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    if (game.phase !== 'bidding') {
      socket.emit('error', { message: 'Het is geen biedfase' });
      return;
    }

    if (game.currentTurn !== socket.id) {
      socket.emit('error', { message: 'Het is niet jouw beurt om te bieden' });
      return;
    }

    if (!isValidBid(type, amount, game.currentBid)) {
      socket.emit('error', { message: 'Ongeldig bod' });
      return;
    }

    cancelTimer(game.id);
    game.turnDeadline = null;

    const bid = { playerId: socket.id, type, amount };
    game.currentBid = bid;

    const bidderName = game.players.find(p => p.id === socket.id)?.nickname || 'Onbekend';
    io.to(game.id).emit('bid-placed', { playerId: socket.id, bid });
    emitSystemMessage(io, game.id, `${bidderName} biedt ${amount}`);

    // Bepaal volgende bieder
    const passedPlayers = new Set(game.players.filter(p => p.hasPassed).map(p => p.id));
    const { complete, winner } = isBiddingComplete(game.biddingOrder, passedPlayers, game.currentBid);

    if (complete && winner) {
      game.bidWinner = winner;
      const winnerName = game.players.find(p => p.id === winner)?.nickname || 'Onbekend';
      io.to(game.id).emit('bidding-complete', { winner, bid: game.currentBid });
      emitSystemMessage(io, game.id, `${winnerName} wint het bieden`);

      // Ga naar card-swap fase
      game.phase = 'card-swap';
      game.currentTurn = winner;

      const revealedTableCards = game.tableCards.map(tc => ({
        ...tc,
        faceUp: true
      }));

      io.to(game.id).emit('card-swap-start', {
        playerId: winner,
        tableCards: revealedTableCards
      });

      startSwapTimer(io, game);
    } else {
      const nextBidder = getNextBidder(game.biddingOrder, socket.id, passedPlayers);
      if (nextBidder) {
        game.currentTurn = nextBidder;
        startBidTimer(io, game);
        io.to(game.id).emit('turn-start', {
          playerId: nextBidder,
          validCardIds: [],
          deadline: game.turnDeadline
        });
      }
    }

    game.lastActivity = Date.now();
  });

  // Pas bij bieden
  socket.on('pass-bid', () => {
    const game = gameManager.getGameByPlayerId(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    if (game.phase !== 'bidding') {
      socket.emit('error', { message: 'Het is geen biedfase' });
      return;
    }

    if (game.currentTurn !== socket.id) {
      socket.emit('error', { message: 'Het is niet jouw beurt om te bieden' });
      return;
    }

    cancelTimer(game.id);
    game.turnDeadline = null;

    const player = game.players.find(p => p.id === socket.id);
    if (player) {
      player.hasPassed = true;
    }

    const passerName = game.players.find(p => p.id === socket.id)?.nickname || 'Onbekend';
    io.to(game.id).emit('bid-passed', { playerId: socket.id });
    emitSystemMessage(io, game.id, `${passerName} past`);

    const passedPlayers = new Set(game.players.filter(p => p.hasPassed).map(p => p.id));
    const { complete, winner } = isBiddingComplete(game.biddingOrder, passedPlayers, game.currentBid);

    if (complete) {
      if (winner && game.currentBid) {
        game.bidWinner = winner;
        const winnerName = game.players.find(p => p.id === winner)?.nickname || 'Onbekend';
        io.to(game.id).emit('bidding-complete', { winner, bid: game.currentBid });
        emitSystemMessage(io, game.id, `${winnerName} wint het bieden`);

        game.phase = 'card-swap';
        game.currentTurn = winner;

        const revealedTableCards = game.tableCards.map(tc => ({
          ...tc,
          faceUp: true
        }));

        io.to(game.id).emit('card-swap-start', {
          playerId: winner,
          tableCards: revealedTableCards
        });

        startSwapTimer(io, game);
      } else {
        io.to(game.id).emit('all-passed');
        emitSystemMessage(io, game.id, 'Iedereen heeft gepast, opnieuw delen');
        handleAllPassed(io, game);
      }
    } else {
      const nextBidder = getNextBidder(game.biddingOrder, socket.id, passedPlayers);
      if (nextBidder) {
        game.currentTurn = nextBidder;
        startBidTimer(io, game);
        io.to(game.id).emit('turn-start', {
          playerId: nextBidder,
          validCardIds: [],
          deadline: game.turnDeadline
        });
      }
    }

    game.lastActivity = Date.now();
  });
}
