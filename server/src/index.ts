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
import { setupBiddingHandlers } from './socket/biddingHandlers';
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
    origin: process.env.NODE_ENV === 'production'
      ? [
          'https://bonaken.frankvdbrink.nl',
          'https://localhost',
          'capacitor://localhost',
          'http://localhost',
        ]
      : [
          'http://localhost:5173',
          'http://localhost:5174',
          'https://localhost',
          'capacitor://localhost',
          'http://localhost',
        ],
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
  setupBiddingHandlers(io, socket);
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
