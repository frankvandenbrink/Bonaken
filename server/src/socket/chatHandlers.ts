import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, ChatMessage } from 'shared';
import { gameManager } from '../game/GameManager';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const MAX_MESSAGES_PER_GAME = 200;
const RATE_LIMIT_MS = 500;
const MAX_MESSAGE_LENGTH = 200;

// In-memory chat storage per game
const chatHistory = new Map<string, ChatMessage[]>();

// Rate limiting per player
const lastMessageTime = new Map<string, number>();

let messageCounter = 0;

function generateId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export function emitSystemMessage(io: TypedServer, gameId: string, text: string) {
  const message: ChatMessage = {
    id: generateId(),
    type: 'system',
    playerId: null,
    nickname: null,
    text,
    timestamp: Date.now(),
  };

  const messages = chatHistory.get(gameId) || [];
  messages.push(message);
  if (messages.length > MAX_MESSAGES_PER_GAME) {
    messages.splice(0, messages.length - MAX_MESSAGES_PER_GAME);
  }
  chatHistory.set(gameId, messages);

  io.to(gameId).emit('chat-message', { message });
}

export function getChatHistory(gameId: string): ChatMessage[] {
  return chatHistory.get(gameId) || [];
}

export function cleanupChatHistory(gameId: string) {
  chatHistory.delete(gameId);
}

export function setupChatHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('send-chat', ({ text }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) return;

    // Rate limiting
    const now = Date.now();
    const lastTime = lastMessageTime.get(socket.id) || 0;
    if (now - lastTime < RATE_LIMIT_MS) return;
    lastMessageTime.set(socket.id, now);

    // Sanitize
    const sanitized = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!sanitized) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    const message: ChatMessage = {
      id: generateId(),
      type: 'player',
      playerId: socket.id,
      nickname: player.nickname,
      text: sanitized,
      timestamp: now,
    };

    const messages = chatHistory.get(game.id) || [];
    messages.push(message);
    if (messages.length > MAX_MESSAGES_PER_GAME) {
      messages.splice(0, messages.length - MAX_MESSAGES_PER_GAME);
    }
    chatHistory.set(game.id, messages);

    io.to(game.id).emit('chat-message', { message });
  });

  // Cleanup rate limit on disconnect
  socket.on('disconnect', () => {
    lastMessageTime.delete(socket.id);
  });
}
