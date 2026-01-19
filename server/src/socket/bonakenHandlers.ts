import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from 'shared';
import { gameManager } from '../game/GameManager';
import {
  registerChoice,
  allPlayersChosen,
  getChosenCount,
  determineBonaker,
  hasPlayerChosen
} from '../game/bonaken';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupBonakenHandlers(io: TypedServer, socket: TypedSocket) {
  // Speler maakt bonaken keuze
  socket.on('bonaken-choice', ({ choice }) => {
    const game = gameManager.getGameByPlayerId(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    if (game.phase !== 'bonaken') {
      socket.emit('error', { message: 'Het is geen bonaken fase' });
      return;
    }

    // Check of speler al gekozen heeft
    if (hasPlayerChosen(game.bonakenChoices, socket.id)) {
      socket.emit('error', { message: 'Je hebt al gekozen' });
      return;
    }

    // Registreer de keuze
    const success = registerChoice(game.bonakenChoices, socket.id, choice);

    if (!success) {
      socket.emit('error', { message: 'Kon keuze niet registreren' });
      return;
    }

    console.log(`Speler ${socket.id} koos: ${choice}`);

    // Broadcast dat deze speler heeft gekozen (zonder keuze te onthullen)
    io.to(game.code).emit('player-chose', { playerId: socket.id });

    // Check of iedereen gekozen heeft
    if (allPlayersChosen(game.bonakenChoices)) {
      // Bepaal de bonaker
      const bonakerId = determineBonaker(
        game.bonakenChoices,
        game.players,
        game.currentDealer
      );

      // Update game state
      game.bonaker = bonakerId;

      // Log resultaat
      if (bonakerId) {
        const bonaker = game.players.find(p => p.id === bonakerId);
        console.log(`Bonaker bepaald: ${bonaker?.nickname}`);
      } else {
        console.log('Niemand bonaakt deze ronde');
      }

      // Broadcast alle keuzes en de bonaker
      io.to(game.code).emit('bonaken-revealed', {
        choices: game.bonakenChoices,
        bonaker: bonakerId
      });

      // Wacht even en ga dan naar troef selectie fase
      setTimeout(() => {
        game.phase = 'trump-selection';
        game.lastActivity = Date.now();

        // De troef selector is de bonaker, of de deler als niemand bonaakt
        const selectorId = bonakerId || game.currentDealer;

        io.to(game.code).emit('trump-selection-start', { selectorId });
      }, 2500); // 2.5 seconden om resultaat te zien
    }

    game.lastActivity = Date.now();
  });
}
