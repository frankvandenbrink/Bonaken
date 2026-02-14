import type { GameState, Player, GameSettings, Card, AvailableGame, TableCard } from 'shared';
import { dealCards } from './dealing';
import { randomUUID } from 'crypto';

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map(); // socketId -> gameId
  private disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map(); // playerId -> timeout

  createGame(hostId: string, hostNickname: string, settings: GameSettings): GameState {
    const id = randomUUID().slice(0, 8);

    const host: Player = {
      id: hostId,
      nickname: hostNickname,
      isHost: true,
      isConnected: true,
      hand: [],
      status: 'suf',
      tricksWon: 0,
      trickPoints: 0,
      declaredRoem: 0,
      hasPassed: false
    };

    const game: GameState = {
      id,
      name: settings.gameName,
      phase: 'lobby',
      players: [host],
      settings,
      currentDealer: hostId,
      currentTurn: null,
      trump: null,
      currentBid: null,
      bidWinner: null,
      biddingOrder: [],
      tableCards: [],
      currentTrick: [],
      roundNumber: 0,
      lastActivity: Date.now(),
      sleepingCards: [],
      roemDeclarations: [],
      turnDeadline: null,
      rematchRequests: []
    };

    this.games.set(id, game);
    this.playerToGame.set(hostId, id);

    return game;
  }

  getGame(id: string): GameState | undefined {
    return this.games.get(id);
  }

  getGameByPlayerId(playerId: string): GameState | undefined {
    const id = this.playerToGame.get(playerId);
    if (id) {
      return this.games.get(id);
    }
    return undefined;
  }

  getAvailableGames(): AvailableGame[] {
    const available: AvailableGame[] = [];
    for (const game of this.games.values()) {
      if (game.phase === 'lobby' && game.players.length < game.settings.maxPlayers) {
        const host = game.players.find(p => p.isHost);
        available.push({
          id: game.id,
          name: game.name,
          playerCount: game.players.length,
          maxPlayers: game.settings.maxPlayers,
          hostNickname: host?.nickname ?? 'Onbekend'
        });
      }
    }
    return available;
  }

  joinGame(gameId: string, playerId: string, nickname: string): { success: boolean; error?: string; game?: GameState } {
    const game = this.games.get(gameId);

    if (!game) {
      return { success: false, error: 'Spel niet gevonden' };
    }

    if (game.phase !== 'lobby') {
      return { success: false, error: 'Spel is al begonnen' };
    }

    if (game.players.length >= game.settings.maxPlayers) {
      return { success: false, error: 'Spel is vol' };
    }

    if (game.players.some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) {
      return { success: false, error: 'Deze naam is al in gebruik' };
    }

    const player: Player = {
      id: playerId,
      nickname,
      isHost: false,
      isConnected: true,
      hand: [],
      status: 'suf',
      tricksWon: 0,
      trickPoints: 0,
      declaredRoem: 0,
      hasPassed: false
    };

    game.players.push(player);
    game.lastActivity = Date.now();
    this.playerToGame.set(playerId, gameId);

    return { success: true, game };
  }

  updateSettings(gameId: string, playerId: string, settings: GameSettings): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Spel niet gevonden' };
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player?.isHost) {
      return { success: false, error: 'Alleen de host kan instellingen wijzigen' };
    }

    game.settings = settings;
    game.name = settings.gameName;
    game.lastActivity = Date.now();
    return { success: true };
  }

  canStartGame(gameId: string, playerId: string): { canStart: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { canStart: false, error: 'Spel niet gevonden' };
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player?.isHost) {
      return { canStart: false, error: 'Alleen de host kan het spel starten' };
    }

    if (game.players.length < 2) {
      return { canStart: false, error: 'Minimaal 2 spelers nodig' };
    }

    return { canStart: true };
  }

  startGame(gameId: string): { game?: GameState; hands?: Map<string, Card[]>; tableCards?: TableCard[] } {
    const game = this.games.get(gameId);
    if (!game) {
      return {};
    }

    const { hands, tableCards, sleepingCards } = dealCards(game.players);

    for (const player of game.players) {
      const hand = hands.get(player.id);
      if (hand) {
        player.hand = hand;
      }
    }

    game.tableCards = tableCards;
    game.sleepingCards = sleepingCards;
    game.phase = 'bidding';
    game.roundNumber = 1;
    game.lastActivity = Date.now();

    return { game, hands, tableCards };
  }

  removePlayer(playerId: string): { game?: GameState; wasHost: boolean; isEmpty: boolean } {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) {
      return { wasHost: false, isEmpty: false };
    }

    const game = this.games.get(gameId);
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

    if (game.players.length === 0) {
      this.games.delete(gameId);
      return { wasHost, isEmpty: true };
    }

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

  setDisconnectTimeout(playerId: string, timeout: NodeJS.Timeout): void {
    this.disconnectTimeouts.set(playerId, timeout);
  }

  clearDisconnectTimeout(playerId: string): void {
    const timeout = this.disconnectTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.disconnectTimeouts.delete(playerId);
    }
  }

  reconnectPlayer(gameId: string, nickname: string, newSocketId: string): { success: boolean; game?: GameState; player?: Player; oldSocketId?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false };
    }

    const player = game.players.find(p => p.nickname === nickname && !p.isConnected);
    if (!player) {
      return { success: false };
    }

    const oldSocketId = player.id;

    // Update playerToGame map
    this.playerToGame.delete(oldSocketId);
    this.playerToGame.set(newSocketId, gameId);

    // Swap socket ID in all game state references
    player.id = newSocketId;
    player.isConnected = true;

    if (game.currentDealer === oldSocketId) game.currentDealer = newSocketId;
    if (game.currentTurn === oldSocketId) game.currentTurn = newSocketId;
    if (game.bidWinner === oldSocketId) game.bidWinner = newSocketId;

    game.biddingOrder = game.biddingOrder.map(id => id === oldSocketId ? newSocketId : id);
    game.currentTrick = game.currentTrick.map(pc =>
      pc.playerId === oldSocketId ? { ...pc, playerId: newSocketId } : pc
    );
    game.roemDeclarations = game.roemDeclarations.map(rd =>
      rd.playerId === oldSocketId ? { ...rd, playerId: newSocketId } : rd
    );
    if (game.currentBid && game.currentBid.playerId === oldSocketId) {
      game.currentBid = { ...game.currentBid, playerId: newSocketId };
    }
    game.rematchRequests = game.rematchRequests.map(id => id === oldSocketId ? newSocketId : id);

    game.lastActivity = Date.now();

    return { success: true, game, player, oldSocketId };
  }

  cleanupInactiveGames(onCleanup?: (gameId: string) => void): number {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    let cleaned = 0;

    for (const [id, game] of this.games) {
      if (now - game.lastActivity > fiveMinutes) {
        for (const player of game.players) {
          this.playerToGame.delete(player.id);
        }
        this.games.delete(id);
        onCleanup?.(id);
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
