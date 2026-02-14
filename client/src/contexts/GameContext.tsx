import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import type {
  GameState, Player, GameSettings, Card, Suit, PlayedCard,
  AvailableGame, Bid, BidType, TableCard, RoemDeclaration, PlayerStatus, ChatMessage
} from '@shared/index';

interface GameContextType {
  // Connection
  isConnected: boolean;
  isDisconnected: boolean;

  // Player
  nickname: string;
  setNickname: (name: string) => void;
  playerId: string | null;
  isHost: boolean;

  // Game Browser
  availableGames: AvailableGame[];
  listGames: () => void;

  // Game state
  gameId: string | null;
  gameName: string | null;
  gamePhase: GameState['phase'] | null;
  players: Player[];
  settings: GameSettings;
  hand: Card[];
  trump: Suit | null;
  tableCards: TableCard[];

  // Bidding state
  currentBid: Bid | null;
  bidWinner: string | null;
  biddingOrder: string[];

  // Playing state
  currentTurn: string | null;
  currentTrick: PlayedCard[];
  validCardIds: string[];
  trickWinner: string | null;
  turnDeadline: number | null;

  // Roem
  roemDeclarations: RoemDeclaration[];

  // Round/Game results
  roundResult: {
    bidWinner: string;
    bid: Bid;
    bidAchieved: boolean;
    playerResults: Record<string, { won: boolean; oldStatus: PlayerStatus; newStatus: PlayerStatus; trickPoints: number; roem: number }>;
  } | null;
  playerStatuses: Record<string, PlayerStatus>;

  // Rematch state
  rematchRequests: string[];

  // Error handling
  error: string | null;
  clearError: () => void;

  // Chat
  chatMessages: ChatMessage[];
  unreadCount: number;
  chatOpen: boolean;
  toggleChat: () => void;
  sendChat: (text: string) => void;

  // Actions
  createGame: (settings: GameSettings) => void;
  joinGame: (gameId: string) => void;
  updateSettings: (settings: GameSettings) => void;
  startGame: () => void;
  leaveGame: () => void;
  placeBid: (type: BidType, amount: number) => void;
  passBid: () => void;
  swapCards: (discardCardIds: string[]) => void;
  selectTrump: (suit: Suit) => void;
  declareRoem: (declarations: RoemDeclaration[]) => void;
  playCard: (cardId: string) => void;
  requestRematch: () => void;
}

const defaultSettings: GameSettings = {
  maxPlayers: 4,
  gameName: '',
  turnTimerSeconds: null
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected, emit, on } = useSocket();

  // Player state
  const [nickname, setNicknameState] = useState(() =>
    localStorage.getItem('bonaken-nickname') || ''
  );
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Game Browser
  const [availableGames, setAvailableGames] = useState<AvailableGame[]>([]);

  // Game state
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameName, setGameName] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<GameState['phase'] | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [hand, setHand] = useState<Card[]>([]);
  const [trump, setTrump] = useState<Suit | null>(null);
  const [tableCards, setTableCards] = useState<TableCard[]>([]);

  // Bidding state
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [bidWinner, setBidWinner] = useState<string | null>(null);
  const [biddingOrder, setBiddingOrder] = useState<string[]>([]);

  // Playing state
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [currentTrick, setCurrentTrick] = useState<PlayedCard[]>([]);
  const [validCardIds, setValidCardIds] = useState<string[]>([]);
  const [trickWinner, setTrickWinner] = useState<string | null>(null);
  const [turnDeadline, setTurnDeadline] = useState<number | null>(null);

  // Roem
  const [roemDeclarations, setRoemDeclarations] = useState<RoemDeclaration[]>([]);

  // Round/Game results
  const [roundResult, setRoundResult] = useState<GameContextType['roundResult']>(null);
  const [playerStatuses, setPlayerStatuses] = useState<Record<string, PlayerStatus>>({});

  // Rematch state
  const [rematchRequests, setRematchRequests] = useState<string[]>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const chatOpenRef = useRef(false);

  // Disconnect state
  const [isDisconnected, setIsDisconnected] = useState(false);

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
      // Game Browser
      on('game-list', ({ games }) => {
        setAvailableGames(games);
      }),

      // Lobby
      on('game-created', ({ id, name }) => {
        setGameId(id);
        setGameName(name);
        setGamePhase('lobby');
        localStorage.setItem('bonaken-gameId', id);
      }),

      on('game-state', (state) => {
        setGameId(state.id);
        setGameName(state.name);
        setGamePhase(state.phase);
        setPlayers(state.players);
        setSettings(state.settings);
        setTableCards(state.tableCards);
        if (state.currentBid) setCurrentBid(state.currentBid);
        if (state.bidWinner) setBidWinner(state.bidWinner);
        if (state.biddingOrder.length > 0) setBiddingOrder(state.biddingOrder);
        if (state.currentTurn) setCurrentTurn(state.currentTurn);
        if (state.trump) setTrump(state.trump);
        if (state.currentTrick) setCurrentTrick(state.currentTrick);
        setTurnDeadline(state.turnDeadline);
        setIsDisconnected(false);
        localStorage.setItem('bonaken-gameId', state.id);
      }),

      on('lobby-updated', ({ players: newPlayers, settings: newSettings }) => {
        setPlayers(newPlayers);
        setSettings(newSettings);
      }),

      on('player-joined', ({ player }) => {
        setPlayers(prev => [...prev.filter(p => p.id !== player.id), player]);
      }),

      on('player-disconnected', ({ playerId: disconnectedId }) => {
        setPlayers(prev => prev.map(p =>
          p.id === disconnectedId ? { ...p, isConnected: false } : p
        ));
      }),

      on('player-reconnected', ({ playerId: reconnectedId, nickname: reconnectedNickname }) => {
        setPlayers(prev => {
          const exists = prev.some(p => p.id === reconnectedId);
          if (exists) {
            return prev.map(p => p.id === reconnectedId ? { ...p, isConnected: true } : p);
          }
          // Player might have a new socket ID - find by nickname
          return prev.map(p => p.nickname === reconnectedNickname ? { ...p, id: reconnectedId, isConnected: true } : p);
        });
      }),

      on('game-starting', () => {
        setGamePhase('dealing');
      }),

      // Dealing
      on('cards-dealt', ({ hand: dealtHand, tableCards: dealtTableCards }) => {
        setHand(dealtHand);
        setTableCards(dealtTableCards);
      }),

      // Bidding
      on('bidding-start', ({ biddingOrder: order, firstBidder }) => {
        setGamePhase('bidding');
        setBiddingOrder(order);
        setCurrentTurn(firstBidder);
        setCurrentBid(null);
        setBidWinner(null);
        // Reset player round stats for new bidding round
        setPlayers(prev => prev.map(p => ({
          ...p,
          hasPassed: false,
          tricksWon: 0,
          trickPoints: 0,
          declaredRoem: 0
        })));
      }),

      on('bid-placed', ({ playerId: bidderId, bid }) => {
        setCurrentBid(bid);
        setPlayers(prev => prev.map(p =>
          p.id === bidderId ? { ...p, hasPassed: false } : p
        ));
      }),

      on('bid-passed', ({ playerId: passedId }) => {
        setPlayers(prev => prev.map(p =>
          p.id === passedId ? { ...p, hasPassed: true } : p
        ));
      }),

      on('bidding-complete', ({ winner, bid }) => {
        setBidWinner(winner);
        setCurrentBid(bid);
      }),

      on('all-passed', () => {
        // Iedereen gepast, wordt opnieuw gedeeld
        setCurrentBid(null);
        setBidWinner(null);
        setGamePhase('dealing');
      }),

      // Card Swap
      on('card-swap-start', ({ playerId: swapperId, tableCards: cards }) => {
        setGamePhase('card-swap');
        setCurrentTurn(swapperId);
        setTableCards(cards);
      }),

      on('cards-swapped', ({ discardCount }) => {
        console.log(`${discardCount} kaarten afgelegd`);
      }),

      // Trump
      on('trump-selection-start', ({ selectorId }) => {
        setGamePhase('trump-selection');
        setCurrentTurn(selectorId);
      }),

      on('trump-selected', ({ trump: selectedTrump }) => {
        setTrump(selectedTrump);
      }),

      // Roem
      on('roem-declared', ({ declarations }) => {
        setRoemDeclarations(declarations);
      }),

      on('false-roem', ({ playerId: falserId }) => {
        console.log(`Vals roemen door ${falserId}!`);
      }),

      // Gameplay
      on('playing-start', () => {
        setGamePhase('playing');
      }),

      on('turn-start', ({ playerId: turnPlayerId, validCardIds: validIds, deadline }) => {
        setCurrentTurn(turnPlayerId);
        setValidCardIds(validIds);
        setTrickWinner(null);
        setTurnDeadline(deadline);
      }),

      on('card-played', ({ playerId: cardPlayerId, card }) => {
        setCurrentTrick(prev => [...prev, { playerId: cardPlayerId, card }]);
        if (cardPlayerId === socket?.id) {
          setHand(prev => prev.filter(c => c.id !== card.id));
        }
      }),

      on('trick-complete', ({ winnerId, trickPoints: points, tricksWon, playerTrickPoints }) => {
        setTrickWinner(winnerId);
        setCurrentTurn(null);
        setPlayers(prev => prev.map(p => ({
          ...p,
          tricksWon: tricksWon[p.id] ?? p.tricksWon,
          trickPoints: playerTrickPoints?.[p.id] ?? p.trickPoints
        })));
      }),

      on('trick-cleared', () => {
        setCurrentTrick([]);
        setTrickWinner(null);
      }),

      // Scoring
      on('round-result', (result) => {
        setRoundResult(result);
        setGamePhase('round-end');
        // Update player statuses from round result
        setPlayers(prev => prev.map(p => {
          const playerResult = result.playerResults[p.id];
          if (playerResult) {
            return { ...p, status: playerResult.newStatus };
          }
          return p;
        }));
      }),

      on('game-ended', ({ playerStatuses: statuses }) => {
        setGamePhase('game-end');
        setPlayerStatuses(statuses);
        setRematchRequests([]);
      }),

      // Timer
      on('timer-update', ({ deadline }) => {
        setTurnDeadline(deadline);
      }),

      on('timer-expired', ({ playerId: expiredId, autoAction }) => {
        console.log(`Timer verlopen voor ${expiredId}: ${autoAction}`);
      }),

      // Connection
      on('rematch-requested', ({ playerId: requesterId }) => {
        setRematchRequests(prev =>
          prev.includes(requesterId) ? prev : [...prev, requesterId]
        );
      }),

      on('rematch-started', () => {
        setRematchRequests([]);
        setRoundResult(null);
        setCurrentBid(null);
        setBidWinner(null);
        setTrump(null);
        setCurrentTrick([]);
        setTrickWinner(null);
        setRoemDeclarations([]);
        setPlayerStatuses({});
      }),

      // Chat
      on('chat-message', ({ message }) => {
        setChatMessages(prev => [...prev, message]);
        if (!chatOpenRef.current) {
          setUnreadCount(prev => prev + 1);
        }
      }),

      on('chat-history', ({ messages }) => {
        setChatMessages(messages);
      }),

      on('error', ({ message }) => {
        // Clear stale game data when reconnect fails (e.g. after server restart)
        if (message === 'Kan niet opnieuw verbinden') {
          localStorage.removeItem('bonaken-gameId');
          setIsDisconnected(false);
          return;
        }
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

  // Reconnect to game after socket (re)connects
  useEffect(() => {
    if (!socket || !isConnected) return;

    const storedGameId = localStorage.getItem('bonaken-gameId');
    const storedNickname = localStorage.getItem('bonaken-nickname');

    if (storedGameId && storedNickname) {
      console.log(`Reconnecting to game ${storedGameId} as ${storedNickname}`);
      socket.emit('reconnect-to-game', { gameId: storedGameId, nickname: storedNickname });
    }
  }, [socket, isConnected]);

  // Detect disconnect while in a game
  useEffect(() => {
    if (gameId && !isConnected) {
      setIsDisconnected(true);
    }
    if (isConnected && isDisconnected) {
      // Socket reconnected, reconnect-to-game will fire from the effect above
    }
  }, [isConnected, gameId, isDisconnected]);

  // Actions
  const createGame = useCallback((gameSettings: GameSettings) => {
    if (!nickname.trim()) {
      setError('Voer eerst een bijnaam in');
      return;
    }
    emit('create-game', { nickname: nickname.trim(), settings: gameSettings });
  }, [emit, nickname]);

  const joinGame = useCallback((id: string) => {
    if (!nickname.trim()) {
      setError('Voer eerst een bijnaam in');
      return;
    }
    emit('join-game', { gameId: id, nickname: nickname.trim() });
  }, [emit, nickname]);

  const listGames = useCallback(() => {
    emit('list-games');
  }, [emit]);

  const updateSettings = useCallback((newSettings: GameSettings) => {
    emit('update-settings', { settings: newSettings });
  }, [emit]);

  const startGame = useCallback(() => {
    emit('start-game');
  }, [emit]);

  const leaveGame = useCallback(() => {
    localStorage.removeItem('bonaken-gameId');
    setGameId(null);
    setGameName(null);
    setGamePhase(null);
    setPlayers([]);
    setSettings(defaultSettings);
    setChatMessages([]);
    setUnreadCount(0);
    setChatOpen(false);
    chatOpenRef.current = false;
    setIsDisconnected(false);
    window.location.reload();
  }, []);

  const placeBid = useCallback((type: BidType, amount: number) => {
    emit('place-bid', { type, amount });
  }, [emit]);

  const passBid = useCallback(() => {
    emit('pass-bid');
  }, [emit]);

  const swapCards = useCallback((discardCardIds: string[]) => {
    emit('swap-cards', { discardCardIds });
  }, [emit]);

  const selectTrump = useCallback((suit: Suit) => {
    emit('select-trump', { suit });
  }, [emit]);

  const declareRoem = useCallback((declarations: RoemDeclaration[]) => {
    emit('declare-roem', { declarations });
  }, [emit]);

  const playCard = useCallback((cardId: string) => {
    emit('play-card', { cardId });
  }, [emit]);

  const requestRematch = useCallback(() => {
    emit('request-rematch');
  }, [emit]);

  const toggleChat = useCallback(() => {
    setChatOpen(prev => {
      const next = !prev;
      chatOpenRef.current = next;
      if (next) setUnreadCount(0);
      return next;
    });
  }, []);

  const sendChat = useCallback((text: string) => {
    emit('send-chat', { text });
  }, [emit]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <GameContext.Provider value={{
      isConnected,
      isDisconnected,
      nickname,
      setNickname,
      playerId,
      isHost,
      availableGames,
      listGames,
      gameId,
      gameName,
      gamePhase,
      players,
      settings,
      hand,
      trump,
      tableCards,
      currentBid,
      bidWinner,
      biddingOrder,
      currentTurn,
      currentTrick,
      validCardIds,
      trickWinner,
      turnDeadline,
      roemDeclarations,
      roundResult,
      playerStatuses,
      rematchRequests,
      chatMessages,
      unreadCount,
      chatOpen,
      toggleChat,
      sendChat,
      error,
      clearError,
      createGame,
      joinGame,
      updateSettings,
      startGame,
      leaveGame,
      placeBid,
      passBid,
      swapCards,
      selectTrump,
      declareRoem,
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
