import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, Suit } from 'shared';
import { gameManager } from '../game/GameManager';
import { startPlayerTurn } from './gameplayHandlers';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Bepaal wie troef mag kiezen: bonaker of deler (als niemand bonaakt)
 */
export function getTrumpSelector(bonaker: string | null, dealerId: string): string {
  return bonaker || dealerId;
}

/**
 * Valideer of een suit geldig is
 */
function isValidSuit(suit: string): suit is Suit {
  return ['harten', 'ruiten', 'klaveren', 'schoppen'].includes(suit);
}

export function setupTrumpHandlers(io: TypedServer, socket: TypedSocket) {
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

    // Bepaal wie mag selecteren
    const selectorId = getTrumpSelector(game.bonaker, game.currentDealer);

    if (socket.id !== selectorId) {
      socket.emit('error', { message: 'Je mag geen troef kiezen' });
      return;
    }

    // Valideer de suit
    if (!isValidSuit(suit)) {
      socket.emit('error', { message: 'Ongeldige troefkleur' });
      return;
    }

    // Set troef
    game.trump = suit;

    console.log(`Troef gekozen: ${suit} door ${game.players.find(p => p.id === socket.id)?.nickname}`);

    // Broadcast naar alle spelers
    io.to(game.code).emit('trump-selected', { trump: suit });

    // Geef slapende kaarten aan de bonaker (als er een bonaker is)
    if (game.bonaker && game.sleepingCards.length > 0) {
      const bonaker = game.players.find(p => p.id === game.bonaker);
      if (bonaker) {
        bonaker.hand.push(...game.sleepingCards);
        console.log(`${bonaker.nickname} ontvangt ${game.sleepingCards.length} slapende kaarten`);

        // Stuur bijgewerkte hand naar bonaker
        const bonakerSocket = io.sockets.sockets.get(game.bonaker);
        if (bonakerSocket) {
          bonakerSocket.emit('cards-dealt', { hand: bonaker.hand });
        }
      }
      game.sleepingCards = [];
    }

    // Wacht even en ga dan naar speelfase
    setTimeout(() => {
      game.phase = 'playing';
      game.lastActivity = Date.now();

      // Bepaal eerste speler (links van deler = volgende in de rij)
      const dealerIndex = game.players.findIndex(p => p.id === game.currentDealer);
      const firstPlayerIndex = (dealerIndex + 1) % game.players.length;
      const firstPlayer = game.players[firstPlayerIndex];

      console.log(`Spel start! Eerste speler: ${firstPlayer.nickname}`);

      // Start eerste beurt
      startPlayerTurn(io, game, firstPlayer.id);
    }, 1500); // 1.5 seconden om troef te zien

    game.lastActivity = Date.now();
  });
}
