import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, Suit } from 'shared';
import { gameManager } from '../game/GameManager';
import { startPlayerTurn } from './gameplayHandlers';
import { cancelTimer } from '../game/timer';
import { startTrumpTimer } from './biddingHandlers';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function isValidSuit(suit: string): suit is Suit {
  return ['harten', 'ruiten', 'klaveren', 'schoppen'].includes(suit);
}

export function setupTrumpHandlers(io: TypedServer, socket: TypedSocket) {
  // Card swap: bieder legt kaarten af na tafelkaarten oppakken
  socket.on('swap-cards', ({ discardCardIds }) => {
    const game = gameManager.getGameByPlayerId(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    if (game.phase !== 'card-swap') {
      socket.emit('error', { message: 'Het is geen kaart-ruil fase' });
      return;
    }

    if (socket.id !== game.bidWinner) {
      socket.emit('error', { message: 'Alleen de bieder mag kaarten ruilen' });
      return;
    }

    cancelTimer(game.id);
    game.turnDeadline = null;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    // Aantal af te leggen kaarten = aantal tafelkaarten
    const tableCardCount = game.tableCards.length;
    if (discardCardIds.length !== tableCardCount) {
      socket.emit('error', { message: `Je moet precies ${tableCardCount} kaarten afleggen` });
      return;
    }

    // Voeg tafelkaarten toe aan hand
    for (const tc of game.tableCards) {
      player.hand.push(tc.card);
    }

    // Verwijder afgelegde kaarten uit hand
    const discardedCards = [];
    for (const cardId of discardCardIds) {
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        socket.emit('error', { message: 'Kaart niet gevonden in je hand' });
        return;
      }
      discardedCards.push(player.hand[cardIndex]);
      player.hand.splice(cardIndex, 1);
    }

    // Afgelegde kaarten punten zijn voor de tegenpartij (opgeslagen voor scoring)
    game.tableCards = []; // Tafel leeg

    io.to(game.id).emit('cards-swapped', { discardCount: discardedCards.length });

    // Stuur bijgewerkte hand naar bieder
    io.to(socket.id).emit('cards-dealt', {
      hand: player.hand,
      tableCards: []
    });

    // Bepaal of troefkeuze nodig is
    if (game.currentBid?.type === 'zwabber') {
      // Zwabber = geen troef
      game.trump = null;
      game.phase = 'playing';

      io.to(game.id).emit('trump-selected', { trump: null as unknown as Suit });

      // Start speelfase
      setTimeout(() => {
        const dealerIndex = game.players.findIndex(p => p.id === game.currentDealer);
        const firstPlayerIndex = (dealerIndex + 1) % game.players.length;
        const firstPlayer = game.players[firstPlayerIndex];
        startPlayerTurn(io, game, firstPlayer.id);
      }, 1000);
    } else {
      // Troefkeuze fase
      game.phase = 'trump-selection';
      game.currentTurn = socket.id;
      io.to(game.id).emit('trump-selection-start', { selectorId: socket.id });
      startTrumpTimer(io, game);
    }

    game.lastActivity = Date.now();
  });

  // Speler selecteert troef
  socket.on('select-trump', ({ suit }) => {
    const game = gameManager.getGameByPlayerId(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    if (game.phase !== 'trump-selection') {
      socket.emit('error', { message: 'Het is geen troef selectie fase' });
      return;
    }

    if (socket.id !== game.bidWinner) {
      socket.emit('error', { message: 'Je mag geen troef kiezen' });
      return;
    }

    if (!isValidSuit(suit)) {
      socket.emit('error', { message: 'Ongeldige troefkleur' });
      return;
    }

    cancelTimer(game.id);
    game.turnDeadline = null;

    game.trump = suit;

    console.log(`Troef gekozen: ${suit} door ${game.players.find(p => p.id === socket.id)?.nickname}`);

    io.to(game.id).emit('trump-selected', { trump: suit });

    // Start speelfase na korte pauze
    setTimeout(() => {
      game.phase = 'playing';
      game.lastActivity = Date.now();

      const dealerIndex = game.players.findIndex(p => p.id === game.currentDealer);
      const firstPlayerIndex = (dealerIndex + 1) % game.players.length;
      const firstPlayer = game.players[firstPlayerIndex];

      console.log(`Spel start! Eerste speler: ${firstPlayer.nickname}`);
      startPlayerTurn(io, game, firstPlayer.id);
    }, 1500);

    game.lastActivity = Date.now();
  });
}
