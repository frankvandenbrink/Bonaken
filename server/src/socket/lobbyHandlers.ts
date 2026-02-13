import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, GameSettings } from 'shared';
import { gameManager } from '../game/GameManager';
import { initBiddingState } from '../game/bidding';
import { startBidTimer } from './biddingHandlers';
import { emitSystemMessage, getChatHistory } from './chatHandlers';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function broadcastGameList(io: TypedServer) {
  const games = gameManager.getAvailableGames();
  io.emit('game-list', { games });
}

export function setupLobbyHandlers(io: TypedServer, socket: TypedSocket) {
  // Lijst beschikbare spellen
  socket.on('list-games', () => {
    const games = gameManager.getAvailableGames();
    socket.emit('game-list', { games });
  });

  // Maak nieuw spel aan
  socket.on('create-game', ({ nickname, settings }) => {
    console.log(`Speler ${nickname} maakt spel "${settings.gameName}" aan`);

    const game = gameManager.createGame(socket.id, nickname, settings);

    // Join socket room
    socket.join(game.id);

    // Stuur bevestiging naar creator
    socket.emit('game-created', { id: game.id, name: game.name });
    socket.emit('lobby-updated', {
      players: game.players,
      settings: game.settings
    });

    // Broadcast updated game list
    broadcastGameList(io);

    console.log(`Spel "${game.name}" (${game.id}) aangemaakt door ${nickname}`);
  });

  // Join bestaand spel
  socket.on('join-game', ({ gameId, nickname }) => {
    console.log(`Speler ${nickname} probeert spel ${gameId} te joinen`);

    const result = gameManager.joinGame(gameId, socket.id, nickname);

    if (!result.success) {
      socket.emit('error', { message: result.error! });
      return;
    }

    const game = result.game!;

    // Join socket room
    socket.join(game.id);

    // Stuur update naar nieuwe speler
    socket.emit('game-state', game);

    // Broadcast naar alle spelers in lobby
    const newPlayer = game.players.find(p => p.id === socket.id)!;
    io.to(game.id).emit('player-joined', { player: newPlayer });
    io.to(game.id).emit('lobby-updated', {
      players: game.players,
      settings: game.settings
    });

    // Send chat history to joining player
    socket.emit('chat-history', { messages: getChatHistory(game.id) });

    // System message
    emitSystemMessage(io, game.id, `${nickname} is toegetreden`);

    // Broadcast updated game list
    broadcastGameList(io);

    console.log(`${nickname} heeft spel ${game.id} gejoined`);
  });

  // Update game settings (alleen host)
  socket.on('update-settings', ({ settings }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    const result = gameManager.updateSettings(game.id, socket.id, settings);
    if (!result.success) {
      socket.emit('error', { message: result.error! });
      return;
    }

    // Broadcast nieuwe settings
    io.to(game.id).emit('lobby-updated', {
      players: game.players,
      settings: game.settings
    });

    // Broadcast updated game list (name or max players may have changed)
    broadcastGameList(io);
  });

  // Start spel (alleen host)
  socket.on('start-game', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Je bent niet in een spel' });
      return;
    }

    const canStart = gameManager.canStartGame(game.id, socket.id);
    if (!canStart.canStart) {
      socket.emit('error', { message: canStart.error! });
      return;
    }

    const { game: startedGame, hands, tableCards } = gameManager.startGame(game.id);
    if (startedGame && hands && tableCards) {
      console.log(`Spel "${startedGame.name}" gestart met ${startedGame.players.length} spelers`);

      // Notify all players game is starting
      io.to(game.id).emit('game-starting');
      emitSystemMessage(io, game.id, 'Het spel begint!');

      // Send each player their hand + table cards (open only for non-bid-winner)
      for (const player of startedGame.players) {
        const playerHand = hands.get(player.id);
        if (playerHand) {
          io.to(player.id).emit('cards-dealt', {
            hand: playerHand,
            tableCards: tableCards.map(tc => ({
              card: tc.faceUp ? tc.card : { suit: tc.card.suit, rank: tc.card.rank, id: 'blind' },
              faceUp: tc.faceUp
            }))
          });
        }
      }

      // Initialize bidding
      const biddingState = initBiddingState(startedGame.players, startedGame.currentDealer);
      startedGame.biddingOrder = biddingState.biddingOrder;
      startedGame.currentTurn = biddingState.firstBidder;

      // Reset passed state
      startedGame.players.forEach(p => { p.hasPassed = false; });

      // Start timer for first bidder if configured
      startBidTimer(io, startedGame);

      // Send bidding start
      io.to(game.id).emit('bidding-start', {
        biddingOrder: biddingState.biddingOrder,
        firstBidder: biddingState.firstBidder
      });

      // Create sanitized game state
      const sanitizedGame = {
        ...startedGame,
        players: startedGame.players.map(p => ({
          ...p,
          hand: []
        })),
        sleepingCards: [],
        tableCards: tableCards.map(tc => ({
          card: tc.faceUp ? tc.card : { suit: 'harten' as const, rank: '7' as const, id: 'blind' },
          faceUp: tc.faceUp
        }))
      };

      io.to(game.id).emit('game-state', sanitizedGame);

      // Broadcast updated game list (game no longer available)
      broadcastGameList(io);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Capture game + nickname before removal
    const gameBeforeRemoval = gameManager.getGameByPlayerId(socket.id);
    const disconnectedPlayer = gameBeforeRemoval?.players.find(p => p.id === socket.id);
    const disconnectedNickname = disconnectedPlayer?.nickname || 'Onbekend';

    const result = gameManager.removePlayer(socket.id);

    if (result.game && !result.isEmpty) {
      io.to(result.game.id).emit('player-disconnected', {
        playerId: socket.id,
        nickname: disconnectedNickname
      });
      emitSystemMessage(io, result.game.id, `${disconnectedNickname} heeft het spel verlaten`);
      io.to(result.game.id).emit('lobby-updated', {
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

    // Broadcast updated game list
    broadcastGameList(io);
  });
}
