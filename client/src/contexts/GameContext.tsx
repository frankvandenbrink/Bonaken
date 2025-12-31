import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import type { GameState, Player, GameSettings, Card, Suit } from '@shared/index';

interface GameContextType {
  // Connection
  isConnected: boolean;

  // Player
  nickname: string;
  setNickname: (name: string) => void;
  playerId: string | null;
  isHost: boolean;

  // Game state
  gameCode: string | null;
  gamePhase: GameState['phase'] | null;
  players: Player[];
  settings: GameSettings;
  hand: Card[];
  trump: Suit | null;

  // Error handling
  error: string | null;
  clearError: () => void;

  // Actions
  createGame: (settings: GameSettings) => void;
  joinGame: (code: string) => void;
  updateSettings: (settings: GameSettings) => void;
  startGame: () => void;
  leaveGame: () => void;
}

const defaultSettings: GameSettings = {
  minPlayers: 2,
  maxPlayers: 4
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected, emit, on } = useSocket();

  // Player state
  const [nickname, setNicknameState] = useState(() =>
    localStorage.getItem('bonaken-nickname') || ''
  );
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Game state
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<GameState['phase'] | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [hand, setHand] = useState<Card[]>([]);
  const [trump, setTrump] = useState<Suit | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Persist nickname
  const setNickname = useCallback((name: string) => {
    setNicknameState(name);
    localStorage.setItem('bonaken-nickname', name);
  }, []);

  // Computed
  const isHost = players.find(p => p.id === playerId)?.isHost ?? false;

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    setPlayerId(socket.id ?? null);

    const unsubscribers = [
      on('game-created', ({ code }) => {
        setGameCode(code);
        setGamePhase('lobby');
      }),

      on('game-state', (state) => {
        setGameCode(state.code);
        setGamePhase(state.phase);
        setPlayers(state.players);
        setSettings(state.settings);
      }),

      on('lobby-updated', ({ players: newPlayers, settings: newSettings }) => {
        setPlayers(newPlayers);
        setSettings(newSettings);
      }),

      on('player-joined', ({ player }) => {
        setPlayers(prev => [...prev.filter(p => p.id !== player.id), player]);
      }),

      on('player-disconnected', ({ playerId: disconnectedId }) => {
        setPlayers(prev => prev.filter(p => p.id !== disconnectedId));
      }),

      on('game-starting', () => {
        setGamePhase('dealing');
      }),

      on('cards-dealt', ({ hand: dealtHand }) => {
        setHand(dealtHand);
        console.log(`Received ${dealtHand.length} cards`);
      }),

      on('bonaken-phase-start', () => {
        setGamePhase('bonaken');
      }),

      on('trump-selected', ({ trump: selectedTrump }) => {
        setTrump(selectedTrump);
      }),

      on('error', ({ message }) => {
        setError(message);
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub?.());
    };
  }, [socket, on]);

  // Update playerId when socket connects
  useEffect(() => {
    if (socket?.id) {
      setPlayerId(socket.id);
    }
  }, [socket?.id]);

  // Actions
  const createGame = useCallback((gameSettings: GameSettings) => {
    if (!nickname.trim()) {
      setError('Voer eerst een bijnaam in');
      return;
    }
    emit('create-game', { nickname: nickname.trim(), settings: gameSettings });
  }, [emit, nickname]);

  const joinGame = useCallback((code: string) => {
    if (!nickname.trim()) {
      setError('Voer eerst een bijnaam in');
      return;
    }
    emit('join-game', { code: code.toUpperCase(), nickname: nickname.trim() });
  }, [emit, nickname]);

  const updateSettings = useCallback((newSettings: GameSettings) => {
    emit('update-settings', { settings: newSettings });
  }, [emit]);

  const startGame = useCallback(() => {
    emit('start-game');
  }, [emit]);

  const leaveGame = useCallback(() => {
    setGameCode(null);
    setGamePhase(null);
    setPlayers([]);
    setSettings(defaultSettings);
    // Socket disconnect will handle server-side cleanup
    window.location.reload();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <GameContext.Provider value={{
      isConnected,
      nickname,
      setNickname,
      playerId,
      isHost,
      gameCode,
      gamePhase,
      players,
      settings,
      hand,
      trump,
      error,
      clearError,
      createGame,
      joinGame,
      updateSettings,
      startGame,
      leaveGame
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
