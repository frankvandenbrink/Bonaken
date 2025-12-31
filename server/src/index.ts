import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type {
  GameState,
  ServerToClientEvents,
  ClientToServerEvents
} from '../../shared/src/index';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// In-memory game storage
const games = new Map<string, GameState>();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size });
});

io.on('connection', (socket) => {
  console.log('Speler verbonden:', socket.id);

  socket.on('disconnect', () => {
    console.log('Speler losgekoppeld:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Bonaken server draait op poort ${PORT}`);
});
