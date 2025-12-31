import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import type { GameState, Player, GameSettings, Card, Suit, BonakChoice, PlayedCard } from '@shared/index';

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

  // Bonaken state
  bonakenChoices: BonakChoice[];
  bonaker: string | null;
  chosenCount: number;
  hasChosen: boolean;
  trumpSelector: string | null;

  // Playing state
  currentTurn: string | null;
  currentTrick: PlayedCard[];
  validCardIds: string[];
  trickWinner: string | null;
  roundScores: Record<string, number> | null;
  gameScores: Record<string, number>;
  bonakenSucceeded: boolean | null;

  // Game end state
  loserId: string | null;

  // Rematch state
  rematchRequests: string[];

  // Error handling
  error: string | null;
  clearError: () => void;

  // Actions
  createGame: (settings: GameSettings) => void;
  joinGame: (code: string) => void;
  updateSettings: (settings: GameSettings) => void;
  startGame: () => void;
  leaveGame: () => void;
  makeBonakChoice: (choice: 'bonaken' | 'passen') => void;
  selectTrump: (suit: Suit) => void;
  playCard: (cardId: string) => void;
  requestRematch: () => void;
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

  // Bonaken state
  const [bonakenChoices, setBonakenChoices] = useState<BonakChoice[]>([]);
  const [bonaker, setBonaker] = useState<string | null>(null);
  const [chosenCount, setChosenCount] = useState(0);
  const [trumpSelector, setTrumpSelector] = useState<string | null>(null);

  // Playing state
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [currentTrick, setCurrentTrick] = useState<PlayedCard[]>([]);
  const [validCardIds, setValidCardIds] = useState<string[]>([]);
  const [trickWinner, setTrickWinner] = useState<string | null>(null);
  const [roundScores, setRoundScores] = useState<Record<string, number> | null>(null);
  const [gameScores, setGameScores] = useState<Record<string, number>>({});
  const [bonakenSucceeded, setBonakenSucceeded] = useState<boolean | null>(null);

  // Game end state
  const [loserId, setLoserId] = useState<string | null>(null);

  // Rematch state
  const [rematchRequests, setRematchRequests] = useState<string[]>([]);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Persist nickname
  const setNickname = useCallback((name: string) => {
    setNicknameState(name);
    localStorage.setItem('bonaken-nickname', name);
  }, []);

  // Computed
  const isHost = players.find(p => p.id === playerId)?.isHost ?? false;
  const hasChosen = bonakenChoices.find(c => c.playerId === playerId)?.choice !== null &&
                   bonakenChoices.find(c => c.playerId === playerId)?.choice !== undefined;

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
        // Initialize bonaken choices if in bonaken phase
        if (state.phase === 'bonaken' && state.players.length > 0) {
          setBonakenChoices(state.players.map(p => ({
            playerId: p.id,
            choice: null
          })));
        }
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
        setChosenCount(0);
        setBonaker(null);
        // Initialize bonaken choices for all players
        setBonakenChoices(players.map(p => ({
          playerId: p.id,
          choice: null
        })));
      }),

      on('player-chose', ({ playerId: chosenPlayerId }) => {
        setChosenCount(prev => prev + 1);
        // Update local choices to mark this player as having chosen
        setBonakenChoices(prev =>
          prev.map(c =>
            c.playerId === chosenPlayerId
              ? { ...c, choice: c.choice ?? 'passen' } // Mark as chosen but don't reveal
              : c
          )
        );
      }),

      on('bonaken-revealed', ({ choices, bonaker: winner }) => {
        setBonakenChoices(choices);
        setBonaker(winner);
        console.log('Bonaken revealed:', choices, 'Winner:', winner);
      }),

      on('trump-selection-start', ({ selectorId }) => {
        setGamePhase('trump-selection');
        setTrumpSelector(selectorId);
        console.log('Trump selection started, selector:', selectorId);
      }),

      on('trump-selected', ({ trump: selectedTrump }) => {
        setTrump(selectedTrump);
      }),

      on('turn-start', ({ playerId: turnPlayerId, validCardIds: validIds }) => {
        setGamePhase('playing');
        setCurrentTurn(turnPlayerId);
        setValidCardIds(validIds);
        setTrickWinner(null); // Clear previous trick winner
        console.log(`Turn started for ${turnPlayerId}, valid cards:`, validIds);
      }),

      on('card-played', ({ playerId: cardPlayerId, card }) => {
        setCurrentTrick(prev => [...prev, { playerId: cardPlayerId, card }]);
        // Remove card from hand if it's our card
        if (cardPlayerId === socket?.id) {
          setHand(prev => prev.filter(c => c.id !== card.id));
        }
      }),

      on('trick-complete', ({ winnerId, tricksWon }) => {
        setTrickWinner(winnerId);
        setCurrentTurn(null);
        // Update players' tricksWon
        setPlayers(prev => prev.map(p => ({
          ...p,
          tricksWon: tricksWon[p.id] ?? p.tricksWon
        })));
        console.log(`Trick complete! Winner: ${winnerId}`, tricksWon);
      }),

      on('trick-cleared', () => {
        setCurrentTrick([]);
        setTrickWinner(null);
      }),

      on('round-scores', ({ scores, bonakenSucceeded: succeeded }) => {
        setRoundScores(scores);
        setBonakenSucceeded(succeeded);
        setGamePhase('round-end');
      }),

      on('game-scores', ({ scores }) => {
        setGameScores(scores);
      }),

      on('game-ended', ({ loserId: loser, finalScores }) => {
        setGamePhase('game-end');
        setGameScores(finalScores);
        setLoserId(loser);
        setRematchRequests([]); // Reset rematch requests
        console.log(`Game ended! Loser: ${loser}`);
      }),

      on('rematch-requested', ({ playerId: requesterId, nickname: requesterName }) => {
        setRematchRequests(prev =>
          prev.includes(requesterId) ? prev : [...prev, requesterId]
        );
        console.log(`${requesterName} wil een rematch`);
      }),

      on('rematch-started', () => {
        setRematchRequests([]);
        setGameScores({});
        setRoundScores(null);
        setBonakenSucceeded(null);
        setBonaker(null);
        setTrump(null);
        setCurrentTrick([]);
        setTrickWinner(null);
        setLoserId(null);
        console.log('Rematch gestart!');
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

  const makeBonakChoice = useCallback((choice: 'bonaken' | 'passen') => {
    emit('bonaken-choice', { choice });
  }, [emit]);

  const selectTrump = useCallback((suit: Suit) => {
    emit('select-trump', { suit });
  }, [emit]);

  const playCard = useCallback((cardId: string) => {
    emit('play-card', { cardId });
  }, [emit]);

  const requestRematch = useCallback(() => {
    emit('request-rematch');
  }, [emit]);

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
      bonakenChoices,
      bonaker,
      chosenCount,
      hasChosen,
      trumpSelector,
      currentTurn,
      currentTrick,
      validCardIds,
      trickWinner,
      roundScores,
      gameScores,
      bonakenSucceeded,
      loserId,
      rematchRequests,
      error,
      clearError,
      createGame,
      joinGame,
      updateSettings,
      startGame,
      leaveGame,
      makeBonakChoice,
      selectTrump,
      playCard,
      requestRematch
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
