import type { GameState, Player, GameSettings, GamePhase, Card } from '../../../shared/src/index';
import { generateGameCode } from '../utils/codeGenerator';
import { dealCards, getCardDistribution } from './dealing';

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map(); // socketId -> gameCode

  createGame(hostId: string, hostNickname: string, settings: GameSettings): GameState {
    let code = generateGameCode();
    // Zorg dat code uniek is
    while (this.games.has(code)) {
      code = generateGameCode();
    }

    const host: Player = {
      id: hostId,
      nickname: hostNickname,
      isHost: true,
      isConnected: true,
      hand: [],
      score: 0,
      tricksWon: 0
    };

    const game: GameState = {
      code,
      phase: 'lobby',
      players: [host],
      settings,
      currentDealer: hostId,
      currentTurn: null,
      trump: null,
      bonaker: null,
      bonakenChoices: [],
      currentTrick: [],
      roundNumber: 0,
      lastActivity: Date.now(),
      sleepingCards: [],
      rematchRequests: []
    };

    this.games.set(code, game);
    this.playerToGame.set(hostId, code);

    return game;
  }

  getGame(code: string): GameState | undefined {
    return this.games.get(code.toUpperCase());
  }

  getGameByPlayerId(playerId: string): GameState | undefined {
    const code = this.playerToGame.get(playerId);
    if (code) {
      return this.games.get(code);
    }
    return undefined;
  }

  joinGame(code: string, playerId: string, nickname: string): { success: boolean; error?: string; game?: GameState } {
    const game = this.games.get(code.toUpperCase());

    if (!game) {
      return { success: false, error: 'Spel niet gevonden' };
    }

    if (game.phase !== 'lobby') {
      return { success: false, error: 'Spel is al begonnen' };
    }

    if (game.players.length >= game.settings.maxPlayers) {
      return { success: false, error: 'Spel is vol' };
    }

    // Check voor dubbele nickname
    if (game.players.some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) {
      return { success: false, error: 'Deze naam is al in gebruik' };
    }

    const player: Player = {
      id: playerId,
      nickname,
      isHost: false,
      isConnected: true,
      hand: [],
      score: 0,
      tricksWon: 0
    };

    game.players.push(player);
    game.lastActivity = Date.now();
    this.playerToGame.set(playerId, code.toUpperCase());

    return { success: true, game };
  }

  updateSettings(code: string, playerId: string, settings: GameSettings): { success: boolean; error?: string } {
    const game = this.games.get(code);
    if (!game) {
      return { success: false, error: 'Spel niet gevonden' };
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player?.isHost) {
      return { success: false, error: 'Alleen de host kan instellingen wijzigen' };
    }

    game.settings = settings;
    game.lastActivity = Date.now();
    return { success: true };
  }

  canStartGame(code: string, playerId: string): { canStart: boolean; error?: string } {
    const game = this.games.get(code);
    if (!game) {
      return { canStart: false, error: 'Spel niet gevonden' };
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player?.isHost) {
      return { canStart: false, error: 'Alleen de host kan het spel starten' };
    }

    if (game.players.length < game.settings.minPlayers) {
      return { canStart: false, error: `Minimaal ${game.settings.minPlayers} spelers nodig` };
    }

    return { canStart: true };
  }

  startGame(code: string): { game?: GameState; hands?: Map<string, Card[]> } {
    const game = this.games.get(code);
    if (!game) {
      return {};
    }

    // Deal cards to all players
    const { hands, sleepingCards } = dealCards(game.players);

    // Assign hands to players
    for (const player of game.players) {
      const hand = hands.get(player.id);
      if (hand) {
        player.hand = hand;
      }
    }

    // Store sleeping cards
    game.sleepingCards = sleepingCards;

    // Initialize bonaken choices
    game.bonakenChoices = game.players.map(p => ({
      playerId: p.id,
      choice: null
    }));

    // Move to bonaken phase
    game.phase = 'bonaken';
    game.roundNumber = 1;
    game.lastActivity = Date.now();

    return { game, hands };
  }

  removePlayer(playerId: string): { game?: GameState; wasHost: boolean; isEmpty: boolean } {
    const code = this.playerToGame.get(playerId);
    if (!code) {
      return { wasHost: false, isEmpty: false };
    }

    const game = this.games.get(code);
    if (!game) {
      this.playerToGame.delete(playerId);
      return { wasHost: false, isEmpty: false };
    }

    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      this.playerToGame.delete(playerId);
      return { game, wasHost: false, isEmpty: false };
    }

    const wasHost = game.players[playerIndex].isHost;
    game.players.splice(playerIndex, 1);
    this.playerToGame.delete(playerId);

    // Als spel leeg is, verwijder het
    if (game.players.length === 0) {
      this.games.delete(code);
      return { wasHost, isEmpty: true };
    }

    // Als host vertrok, maak eerste speler host
    if (wasHost && game.players.length > 0) {
      game.players[0].isHost = true;
    }

    game.lastActivity = Date.now();
    return { game, wasHost, isEmpty: false };
  }

  setPlayerDisconnected(playerId: string): GameState | undefined {
    const game = this.getGameByPlayerId(playerId);
    if (game) {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.isConnected = false;
        game.lastActivity = Date.now();
      }
    }
    return game;
  }

  // Cleanup inactieve games (ouder dan 5 minuten)
  cleanupInactiveGames(): number {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    let cleaned = 0;

    for (const [code, game] of this.games) {
      if (now - game.lastActivity > fiveMinutes) {
        // Verwijder player mappings
        for (const player of game.players) {
          this.playerToGame.delete(player.id);
        }
        this.games.delete(code);
        cleaned++;
      }
    }

    return cleaned;
  }

  getActiveGamesCount(): number {
    return this.games.size;
  }
}

// Singleton instance
export const gameManager = new GameManager();
