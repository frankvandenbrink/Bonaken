import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import type {
  ServerToClientEvents,
  ClientToServerEvents
} from 'shared';
import { setupLobbyHandlers } from './socket/lobbyHandlers';
import { setupBonakenHandlers } from './socket/bonakenHandlers';
import { setupTrumpHandlers } from './socket/trumpHandlers';
import { setupGameplayHandlers } from './socket/gameplayHandlers';
import { gameManager } from './game/GameManager';

const app = express();
app.use(cors());

// Serve static files from client build
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

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

// SPA catch-all route - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Speler verbonden:', socket.id);

  // Setup handlers voor deze socket
  setupLobbyHandlers(io, socket);
  setupBonakenHandlers(io, socket);
  setupTrumpHandlers(io, socket);
  setupGameplayHandlers(io, socket);
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
