import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type {
  ServerToClientEvents,
  ClientToServerEvents
} from '../../shared/src/index';
import { setupLobbyHandlers } from './socket/lobbyHandlers';
import { setupBonakenHandlers } from './socket/bonakenHandlers';
import { setupTrumpHandlers } from './socket/trumpHandlers';
import { gameManager } from './game/GameManager';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST']
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: gameManager.getActiveGamesCount() });
});

io.on('connection', (socket) => {
  console.log('Speler verbonden:', socket.id);

  // Setup handlers voor deze socket
  setupLobbyHandlers(io, socket);
  setupBonakenHandlers(io, socket);
  setupTrumpHandlers(io, socket);
});

// Cleanup inactieve games elke minuut
setInterval(() => {
  const cleaned = gameManager.cleanupInactiveGames();
  if (cleaned > 0) {
    console.log(`${cleaned} inactieve spellen opgeruimd`);
  }
}, 60000);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Bonaken server draait op poort ${PORT}`);
});
