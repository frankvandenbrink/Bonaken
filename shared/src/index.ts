// Bonaken Shared Types - Leimuiden Variant

// Re-export card utilities
export * from './cardUtils';

// Kaart types
export type Suit = 'harten' | 'ruiten' | 'klaveren' | 'schoppen';
export type Rank = '7' | '8' | '9' | '10' | 'B' | 'V' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g., "harten-B"
}

// Speler status (Leimuidens systeem)
export type PlayerStatus = 'suf' | 'krom' | 'recht' | 'wip' | 'erin' | 'eruit';

// Speler types
export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isConnected: boolean;
  hand: Card[];
  status: PlayerStatus;
  tricksWon: number;
  trickPoints: number;
  declaredRoem: number;
  hasPassed: boolean; // Heeft gepast bij bieden
}

// Game fase types
export type GamePhase =
  | 'lobby'
  | 'dealing'
  | 'bidding'
  | 'card-swap'
  | 'trump-selection'
  | 'playing'
  | 'round-end'
  | 'game-end';

// Bied types
export type BidType = 'normal' | 'misere' | 'zwabber' | 'bonaak' | 'bonaak-roem';

export interface Bid {
  playerId: string;
  type: BidType;
  amount: number; // Puntwaarde van het bod
}

// Tafelkaart
export interface TableCard {
  card: Card;
  faceUp: boolean; // open (true) of blind (false)
}

// Roem types
export type RoemType =
  | 'stuk'          // V+K van troef: 20
  | 'driekaart'     // 3 opeenvolgend: 20
  | 'driekaart-stuk'// 3 opeenvolgend met stuk: 40
  | 'vierkaart'     // 4 opeenvolgend: 50
  | 'vijfkaart'     // 5 opeenvolgend: 100
  | 'zeskaart'      // 6 opeenvolgend: 100
  | 'vier-vrouwen'  // 4x V: 100
  | 'vier-heren'    // 4x K: 100
  | 'vier-azen'     // 4x A: 100
  | 'vier-boeren';  // 4x B: 200

export interface RoemDeclaration {
  playerId: string;
  type: RoemType;
  points: number;
  cards: Card[];
}

// Spel instellingen
export interface GameSettings {
  maxPlayers: number; // 2-5
  gameName: string;
  turnTimerSeconds: number | null; // null = geen timer
}

// Gespeelde kaart in een slag
export interface PlayedCard {
  playerId: string;
  card: Card;
}

// Beschikbaar spel in de game browser
export interface AvailableGame {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  hostNickname: string;
}

// Complete spelstatus
export interface GameState {
  id: string;
  name: string;
  phase: GamePhase;
  players: Player[];
  settings: GameSettings;
  currentDealer: string;
  currentTurn: string | null;
  trump: Suit | null;
  currentBid: Bid | null;
  bidWinner: string | null;
  biddingOrder: string[]; // Volgorde van bieders (player IDs)
  tableCards: TableCard[];
  currentTrick: PlayedCard[];
  roundNumber: number;
  lastActivity: number;
  sleepingCards: Card[];
  roemDeclarations: RoemDeclaration[];
  turnDeadline: number | null; // Unix timestamp deadline voor huidige beurt
  rematchRequests: string[];
}

// Socket event types
export interface ServerToClientEvents {
  // Lobby & Game Browser
  'game-created': (data: { id: string; name: string }) => void;
  'game-list': (data: { games: AvailableGame[] }) => void;
  'player-joined': (data: { player: Player }) => void;
  'lobby-updated': (data: { players: Player[]; settings: GameSettings }) => void;
  'game-starting': () => void;
  'game-state': (state: GameState) => void;

  // Dealing
  'cards-dealt': (data: { hand: Card[]; tableCards: TableCard[] }) => void;

  // Bidding
  'bidding-start': (data: { biddingOrder: string[]; firstBidder: string }) => void;
  'bid-placed': (data: { playerId: string; bid: Bid }) => void;
  'bid-passed': (data: { playerId: string }) => void;
  'bidding-complete': (data: { winner: string; bid: Bid }) => void;
  'all-passed': () => void; // Iedereen gepast, opnieuw delen

  // Card Swap
  'card-swap-start': (data: { playerId: string; tableCards: TableCard[] }) => void;
  'cards-swapped': (data: { discardCount: number }) => void;

  // Trump
  'trump-selection-start': (data: { selectorId: string }) => void;
  'trump-selected': (data: { trump: Suit }) => void;

  // Roem
  'roem-declared': (data: { declarations: RoemDeclaration[] }) => void;
  'false-roem': (data: { playerId: string }) => void;

  // Gameplay
  'playing-start': () => void;
  'turn-start': (data: { playerId: string; validCardIds: string[]; deadline: number | null }) => void;
  'card-played': (data: { playerId: string; card: Card }) => void;
  'trick-complete': (data: { winnerId: string; trickPoints: number; tricksWon: Record<string, number>; playerTrickPoints: Record<string, number> }) => void;
  'trick-cleared': () => void;

  // Scoring
  'round-result': (data: {
    bidWinner: string;
    bid: Bid;
    bidAchieved: boolean;
    playerResults: Record<string, { won: boolean; oldStatus: PlayerStatus; newStatus: PlayerStatus; trickPoints: number; roem: number }>;
  }) => void;
  'game-ended': (data: { playerStatuses: Record<string, PlayerStatus> }) => void;

  // Timer
  'timer-update': (data: { deadline: number | null }) => void;
  'timer-expired': (data: { playerId: string; autoAction: string }) => void;

  // Connection
  'rematch-requested': (data: { playerId: string; nickname: string }) => void;
  'rematch-started': () => void;
  'player-disconnected': (data: { playerId: string; nickname: string }) => void;
  'player-reconnected': (data: { playerId: string; nickname: string }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  // Lobby & Game Browser
  'create-game': (data: { nickname: string; settings: GameSettings }) => void;
  'join-game': (data: { gameId: string; nickname: string }) => void;
  'list-games': () => void;
  'update-settings': (data: { settings: GameSettings }) => void;
  'start-game': () => void;

  // Bidding
  'place-bid': (data: { type: BidType; amount: number }) => void;
  'pass-bid': () => void;

  // Card Swap
  'swap-cards': (data: { discardCardIds: string[] }) => void;

  // Trump
  'select-trump': (data: { suit: Suit }) => void;

  // Roem
  'declare-roem': (data: { declarations: RoemDeclaration[] }) => void;

  // Gameplay
  'play-card': (data: { cardId: string }) => void;
  'request-rematch': () => void;

  // Connection
  'reconnect-to-game': (data: { gameId: string; nickname: string }) => void;
}
