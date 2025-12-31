import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, GameSettings } from '../../../shared/src/index';
import { gameManager } from '../game/GameManager';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupLobbyHandlers(io: TypedServer, socket: TypedSocket) {
  // Maak nieuw spel aan
  socket.on('create-game', ({ nickname, settings }) => {
    console.log(`Speler ${nickname} maakt spel aan`);

    const game = gameManager.createGame(socket.id, nickname, settings);

    // Join socket room
    socket.join(game.code);

    // Stuur bevestiging naar creator
    socket.emit('game-created', { code: game.code });
    socket.emit('lobby-updated', {
      players: game.players,
      settings: game.settings
    });

    console.log(`Spel ${game.code} aangemaakt door ${nickname}`);
  });

  // Join bestaand spel
  socket.on('join-game', ({ code, nickname }) => {
    console.log(`Speler ${nickname} probeert spel ${code} te joinen`);

    const result = gameManager.joinGame(code, socket.id, nickname);

    if (!result.success) {
      socket.emit('error', { message: result.error! });
      return;
    }

    const game = result.game!;

    // Join socket room
    socket.join(game.code);

    // Stuur update naar nieuwe speler
    socket.emit('game-state', game);

    // Broadcast naar alle spelers in lobby
    const newPlayer = game.players.find(p => p.id === socket.id)!;
    io.to(game.code).emit('player-joined', { player: newPlayer });
    io.to(game.code).emit('lobby-updated', {
      players: game.players,
      settings: game.settings
    });

    console.log(`${nickname} heeft spel ${code} gejoined`);
  });

  // Update game settings (alleen host)
  socket.on('update-settings', ({ settings }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    const result = gameManager.updateSettings(game.code, socket.id, settings);
    if (!result.success) {
      socket.emit('error', { message: result.error! });
      return;
    }

    // Broadcast nieuwe settings
    io.to(game.code).emit('lobby-updated', {
      players: game.players,
      settings: game.settings
    });
  });

  // Start spel (alleen host)
  socket.on('start-game', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    const canStart = gameManager.canStartGame(game.code, socket.id);
    if (!canStart.canStart) {
      socket.emit('error', { message: canStart.error! });
      return;
    }

    const startedGame = gameManager.startGame(game.code);
    if (startedGame) {
      console.log(`Spel ${game.code} gestart met ${startedGame.players.length} spelers`);
      io.to(game.code).emit('game-starting');
      io.to(game.code).emit('game-state', startedGame);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const result = gameManager.removePlayer(socket.id);

    if (result.game && !result.isEmpty) {
      io.to(result.game.code).emit('player-disconnected', {
        playerId: socket.id,
        nickname: 'Onbekend'
      });
      io.to(result.game.code).emit('lobby-updated', {
        players: result.game.players,
        settings: result.game.settings
      });

      if (result.wasHost) {
        const newHost = result.game.players.find(p => p.isHost);
        if (newHost) {
          console.log(`Nieuwe host: ${newHost.nickname}`);
        }
      }
    }
  });
}
