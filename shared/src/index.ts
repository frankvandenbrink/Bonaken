// Bonaken Shared Types

// Kaart types
export type Suit = 'harten' | 'ruiten' | 'klaveren' | 'schoppen';
export type Rank = '7' | '8' | '9' | '10' | 'B' | 'V' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g., "harten-B"
}

// Speler types
export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isConnected: boolean;
  hand: Card[];
  score: number;
  tricksWon: number;
}

// Game fase types
export type GamePhase =
  | 'lobby'
  | 'dealing'
  | 'bonaken'
  | 'trump-selection'
  | 'playing'
  | 'round-end'
  | 'game-end';

// Spel instellingen
export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
}

// Gespeelde kaart in een slag
export interface PlayedCard {
  playerId: string;
  card: Card;
}

// Bonaken keuze
export interface BonakChoice {
  playerId: string;
  choice: 'bonaken' | 'passen' | null;
}

// Complete spelstatus
export interface GameState {
  code: string;
  phase: GamePhase;
  players: Player[];
  settings: GameSettings;
  currentDealer: string;
  currentTurn: string | null;
  trump: Suit | null;
  bonaker: string | null;
  bonakenChoices: BonakChoice[];
  currentTrick: PlayedCard[];
  roundNumber: number;
  lastActivity: number;
}

// Socket event types
export interface ServerToClientEvents {
  'game-created': (data: { code: string }) => void;
  'player-joined': (data: { player: Player }) => void;
  'lobby-updated': (data: { players: Player[]; settings: GameSettings }) => void;
  'game-starting': () => void;
  'game-state': (state: GameState) => void;
  'cards-dealt': (data: { hand: Card[] }) => void;
  'bonaken-phase-start': () => void;
  'player-chose': (data: { playerId: string }) => void;
  'bonaken-revealed': (data: { choices: BonakChoice[]; bonaker: string | null }) => void;
  'trump-selection-start': (data: { selectorId: string }) => void;
  'trump-selected': (data: { trump: Suit }) => void;
  'turn-start': (data: { playerId: string; validCardIds: string[] }) => void;
  'card-played': (data: { playerId: string; card: Card }) => void;
  'trick-complete': (data: { winnerId: string }) => void;
  'trick-cleared': () => void;
  'round-scores': (data: { scores: Record<string, number>; bonakenSucceeded: boolean | null }) => void;
  'game-scores': (data: { scores: Record<string, number> }) => void;
  'game-ended': (data: { loserId: string; finalScores: Record<string, number> }) => void;
  'player-disconnected': (data: { playerId: string; nickname: string }) => void;
  'player-reconnected': (data: { playerId: string; nickname: string }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'create-game': (data: { nickname: string; settings: GameSettings }) => void;
  'join-game': (data: { code: string; nickname: string }) => void;
  'update-settings': (data: { settings: GameSettings }) => void;
  'start-game': () => void;
  'bonaken-choice': (data: { choice: 'bonaken' | 'passen' }) => void;
  'select-trump': (data: { suit: Suit }) => void;
  'play-card': (data: { cardId: string }) => void;
  'request-rematch': () => void;
  'reconnect-to-game': (data: { code: string; nickname: string }) => void;
}
