import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { prisma, Difficulty, GameStatus, SpectatorMode } from '@repo/database';
import { Server, Socket } from 'socket.io';
import { SudokuGenerator } from '@repo/sudoku-engine';
import glicko2 from 'glicko2';
import { RedisService } from '../redis/redis.service';
import { trackEvent } from '../analytics/track-event';
import { ProgressionService } from '../progression/progression.service';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';
import { CoinTransactionType } from '@repo/database';

// Bot difficulty configuration
export type BotDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const BOT_CONFIGS: Record<BotDifficulty, {
  baseDelay: number;
  variance: number;
  mistakeChance: number;
  names: string[];
  eloRange: [number, number];
  label: string;
}> = {
  EASY:   { baseDelay: 5000, variance: 2000, mistakeChance: 0.35, names: ['NoviceBot', 'BegBot_77', 'SlowPoke', 'LearnerBot', 'PuzzleNewbie'], eloRange: [800,  1100], label: 'Facile' },
  MEDIUM: { baseDelay: 2800, variance: 1200, mistakeChance: 0.15, names: ['Alex_99', 'SudokuKing', 'MasterMind', 'LogicBeast', 'PuzzleSolver'], eloRange: [1200, 1500], label: 'Moyen' },
  HARD:   { baseDelay: 1400, variance: 600,  mistakeChance: 0.04, names: ['ProGamerX', 'Brainiac_22', 'GrandMaster', 'NeuralSolver', 'UltraBot'],  eloRange: [1600, 1900], label: 'Difficile' },
};

export interface QueuedPlayer {
  socketId: string;
  userId: string;
  username: string;
  difficulty: Difficulty;
  betAmount: number;
  rating: number;
  joinedAt: number;
  botOfferSent?: boolean;
  botOfferTime?: number;
}

export interface DuelLobby {
  id: string;
  creatorId: string;
  creatorUsername: string;
  player1: QueuedPlayer;
  player2: QueuedPlayer | null;
  spectators: QueuedPlayer[];
  settings: {
    difficulty: Difficulty;
    betAmount: number;
    hasTimer: boolean;
    timeLimitSec: number | null;
    allowSpectators: boolean;
    allowSpectatorChat: boolean;
  };
  createdAt: number;
}

export interface ActiveDuel {
  id: string;
  player1Id: string;
  player2Id: string;
  scoreP1: number;
  scoreP2: number;
  difficulty: Difficulty;
  betAmount: number;
  initialBoard: number[][];
  solvedBoard: number[][];
  currentBoard: number[][];
  isBotMatch: boolean;
  botDifficulty?: BotDifficulty;
  botUsername?: string;
  botElo?: number;
  startTime: number;
  spectatorMode: SpectatorMode;
  mutedSpectators: string[];
  lastMoveTimeP1: number;
  lastMoveTimeP2: number;
  riskScoreP1: number;
  riskScoreP2: number;
  ownersBoard: (string | null)[][];
  comboP1: number;
  comboP2: number;
  settings?: {
    hasTimer: boolean;
    timeLimitSec: number | null;
    allowSpectators: boolean;
    allowSpectatorChat: boolean;
  };
}

@Injectable()
export class DuelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DuelService.name);
  private server: Server;
  private matchmakingInterval: NodeJS.Timeout;
  private lobbyStateInterval: NodeJS.Timeout;

  constructor(
    private readonly redisService: RedisService,
    private readonly progressionService: ProgressionService,
    private readonly coinLedger: CoinLedgerService,
  ) {}

  onModuleInit() {
    // We will start intervals only when server is set
  }

  onModuleDestroy() {
    if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
    if (this.lobbyStateInterval) clearInterval(this.lobbyStateInterval);
  }

  setServer(server: Server) {
    this.server = server;
    this.matchmakingInterval = setInterval(() => {
      void this.matchmakingLoop();
    }, 2000);
    this.lobbyStateInterval = setInterval(
      () => this.broadcastLobbyState(),
      5000,
    );
  }

  // --- REDIS HELPERS ---

  private async getQueue(): Promise<QueuedPlayer[]> {
    const redis = this.redisService.getClient();
    const playersStr = await redis.hgetall('duel:queue');
    return Object.values(playersStr).map((p) => JSON.parse(p));
  }

  private async saveToQueue(player: QueuedPlayer) {
    const redis = this.redisService.getClient();
    await redis.hset('duel:queue', player.userId, JSON.stringify(player));
  }

  private async removeFromQueue(userId: string) {
    const redis = this.redisService.getClient();
    await redis.hdel('duel:queue', userId);
  }

  private async getActiveDuel(matchId: string): Promise<ActiveDuel | null> {
    const redis = this.redisService.getClient();
    const data = await redis.get(`duel:active:${matchId}`);
    return data ? JSON.parse(data) : null;
  }

  private async saveActiveDuel(matchId: string, duel: ActiveDuel) {
    const redis = this.redisService.getClient();
    await redis.set(`duel:active:${matchId}`, JSON.stringify(duel), 'EX', 3600); // 1 hour TTL
  }

  private async removeActiveDuel(matchId: string) {
    const redis = this.redisService.getClient();
    await redis.del(`duel:active:${matchId}`);
  }

  private async getLobby(lobbyId: string): Promise<DuelLobby | null> {
    const redis = this.redisService.getClient();
    const data = await redis.get(`duel:lobby:${lobbyId}`);
    return data ? JSON.parse(data) : null;
  }

  private async saveLobby(lobby: DuelLobby) {
    const redis = this.redisService.getClient();
    await redis.set(`duel:lobby:${lobby.id}`, JSON.stringify(lobby), 'EX', 3600);
    await redis.sadd('duel:lobby_ids', lobby.id);
  }

  private async deleteLobby(lobbyId: string) {
    const redis = this.redisService.getClient();
    await redis.del(`duel:lobby:${lobbyId}`);
    await redis.srem('duel:lobby_ids', lobbyId);
  }

  private async setUserSocket(userId: string, socketId: string) {
    const redis = this.redisService.getClient();
    await redis.set(`duel:user_socket:${userId}`, socketId, 'EX', 86400); // 1 day TTL
  }

  private async getUserSocket(userId: string): Promise<string | null> {
    const redis = this.redisService.getClient();
    return redis.get(`duel:user_socket:${userId}`);
  }

  private async removeUserSocket(userId: string) {
    const redis = this.redisService.getClient();
    await redis.del(`duel:user_socket:${userId}`);
  }

  // --- LOBBY & QUEUE ---

  async joinQueue(
    socket: Socket,
    userId: string,
    username: string,
    difficulty: Difficulty,
    betAmount: number,
    rating: number,
  ) {
    if (betAmount > 0) {
      try {
        await this.coinLedger.debit(
          userId,
          betAmount,
          CoinTransactionType.DUEL_WAGER,
          'DuelQueue',
          userId,
        );
      } catch (err) {
        socket.emit('chat_error', {
          message: 'Fonds insuffisants pour cette mise.',
        });
        return;
      }
    }

    await this.saveToQueue({
      socketId: socket.id,
      userId,
      username,
      difficulty,
      betAmount,
      rating,
      joinedAt: Date.now(),
      botOfferSent: false,
    });
    await this.setUserSocket(userId, socket.id);

    // Join a personal room for targeted events across instances
    void socket.join(`user_${userId}`);

    this.logger.log(
      `User ${userId} joined queue (Diff: ${difficulty}, Bet: ${betAmount})`,
    );
    this.broadcastLobbyState();
  }

  async leaveQueue(userId: string) {
    const queue = await this.getQueue();
    const player = queue.find((p) => p.userId === userId);
    if (player && player.betAmount > 0) {
      await this.coinLedger.credit(
        userId,
        player.betAmount,
        CoinTransactionType.DUEL_WAGER,
        'DuelQueueRefund',
        userId,
      );
    }
    await this.removeFromQueue(userId);
    this.broadcastLobbyState();
  }

  async handleDisconnect(socketId: string) {
    const queue = await this.getQueue();
    let disconnectedPlayer: QueuedPlayer | null = null;
    let disconnectedUserId: string | null = null;
    for (const p of queue) {
      if (p.socketId === socketId) {
        disconnectedPlayer = p;
        disconnectedUserId = p.userId;
        await this.removeFromQueue(p.userId);
      }
    }

    if (disconnectedPlayer && disconnectedPlayer.betAmount > 0) {
      await this.coinLedger.credit(
        disconnectedPlayer.userId,
        disconnectedPlayer.betAmount,
        CoinTransactionType.DUEL_WAGER,
        'DuelQueueRefund',
        disconnectedPlayer.userId,
      );
    }

    if (!disconnectedUserId) {
      // Not in queue, maybe in active duel? We need a reverse map.
      // For MVP, we let client handle disconnect timeouts.
    }
  }

  async broadcastLobbyState() {
    if (!this.server) return;
    const queue = await this.getQueue();

    const waitingPlayers = queue.map((p) => ({
      userId: p.userId,
      username: p.username,
      difficulty: p.difficulty,
      betAmount: p.betAmount,
      rating: p.rating,
    }));

    // Active matches fetching is heavy if scanning Redis keys.
    // Optimization: Maintain a Set of active match IDs in Redis.
    const redis = this.redisService.getClient();
    const matchIds = await redis.smembers('duel:active_ids');
    const ongoingMatches: any[] = [];

    for (const matchId of matchIds) {
      const match = await this.getActiveDuel(matchId);
      if (match) {
        ongoingMatches.push({
          id: match.id,
          difficulty: match.difficulty,
          betAmount: match.betAmount,
          isBotMatch: match.isBotMatch,
        });
      }
    }

    const lobbyIds = await redis.smembers('duel:lobby_ids');
    const createdTables: any[] = [];

    for (const lobbyId of lobbyIds) {
      const lobby = await this.getLobby(lobbyId);
      if (lobby) {
        createdTables.push({
          id: lobby.id,
          creatorId: lobby.creatorId,
          creatorUsername: lobby.creatorUsername,
          player1: lobby.player1,
          player2: lobby.player2,
          spectatorsCount: lobby.spectators.length,
          settings: lobby.settings,
          createdAt: lobby.createdAt,
        });
      } else {
        await redis.srem('duel:lobby_ids', lobbyId);
      }
    }

    this.server.emit('lobby_state', {
      waitingPlayers,
      ongoingMatches,
      createdTables,
    });
  }

  async acceptBot(userId: string, botDifficulty: BotDifficulty = 'MEDIUM') {
    const queue = await this.getQueue();
    const player = queue.find((p) => p.userId === userId);
    if (!player) return;

    await this.removeFromQueue(userId);
    const botProfile = this.pickBotProfile(botDifficulty);
    void this.startDuel(
      player,
      {
        socketId: 'BOT',
        userId: 'BOT',
        username: botProfile.username,
        difficulty: player.difficulty,
        betAmount: player.betAmount,
        rating: botProfile.elo,
        joinedAt: Date.now(),
      },
      true,
      undefined,
      botDifficulty,
    );
  }

  /**
   * Skip the queue — start a bot match immediately for a player.
   * Called by the new `play_vs_bot` WebSocket event.
   */
  async playAgainstBot(
    socket: Socket,
    userId: string,
    username: string,
    difficulty: Difficulty,
    betAmount: number,
    botDifficulty: BotDifficulty = 'MEDIUM',
  ) {
    if (betAmount > 0) {
      try {
        await this.coinLedger.debit(userId, betAmount, CoinTransactionType.DUEL_WAGER, 'DuelBotWager', userId);
      } catch {
        socket.emit('chat_error', { message: 'Fonds insuffisants pour cette mise.' });
        return;
      }
    }

    await this.setUserSocket(userId, socket.id);
    void socket.join(`user_${userId}`);

    const botProfile = this.pickBotProfile(botDifficulty);
    const botPlayer: QueuedPlayer = {
      socketId: 'BOT',
      userId: 'BOT',
      username: botProfile.username,
      difficulty,
      betAmount,
      rating: botProfile.elo,
      joinedAt: Date.now(),
    };
    const humanPlayer: QueuedPlayer = {
      socketId: socket.id,
      userId,
      username,
      difficulty,
      betAmount,
      rating: 1500,
      joinedAt: Date.now(),
    };

    void this.startDuel(humanPlayer, botPlayer, true, undefined, botDifficulty);
  }

  /** Pick a random bot username & elo for the given difficulty level. */
  private pickBotProfile(level: BotDifficulty): { username: string; elo: number } {
    const cfg = BOT_CONFIGS[level];
    const username = cfg.names[Math.floor(Math.random() * cfg.names.length)];
    const elo = Math.floor(cfg.eloRange[0] + Math.random() * (cfg.eloRange[1] - cfg.eloRange[0]));
    return { username, elo };
  }

  async sendInvite(socket: Socket, senderId: string, senderUsername: string, targetUsername: string, difficulty: Difficulty, betAmount: number) {
    const targetProfile = await prisma.profile.findFirst({ where: { username: { equals: targetUsername, mode: 'insensitive' } } });
    if (!targetProfile) {
      socket.emit('chat_error', { message: 'Utilisateur introuvable.' });
      return;
    }

    if (betAmount > 0) {
      try {
        await this.coinLedger.debit(senderId, betAmount, CoinTransactionType.DUEL_WAGER, 'DuelInvite', senderId);
      } catch (err) {
        socket.emit('chat_error', { message: 'Fonds insuffisants.' });
        return;
      }
    }

    const inviteId = Math.random().toString(36).substring(7);
    const invite = {
      inviteId,
      senderId,
      senderUsername,
      targetId: targetProfile.userId,
      difficulty,
      betAmount,
      rating: 1500,
      joinedAt: Date.now(),
    };

    const redis = this.redisService.getClient();
    await redis.set(`duel:invite:${inviteId}`, JSON.stringify(invite), 'EX', 120);

    // Join room for this user so we can track if they disconnect before the duel starts
    void socket.join(`user_${senderId}`);
    await this.setUserSocket(senderId, socket.id);

    this.server.to(`user_${targetProfile.userId}`).emit('duel_invite_received', invite);
    socket.emit('chat_success', { message: 'Invitation envoyée !' });
  }

  async acceptInvite(socket: Socket, targetId: string, targetUsername: string, inviteId: string) {
    const redis = this.redisService.getClient();
    const inviteStr = await redis.get(`duel:invite:${inviteId}`);
    if (!inviteStr) {
      socket.emit('chat_error', { message: 'Invitation expirée ou invalide.' });
      return;
    }

    const invite = JSON.parse(inviteStr);
    
    if (invite.betAmount > 0) {
      try {
        await this.coinLedger.debit(targetId, invite.betAmount, CoinTransactionType.DUEL_WAGER, 'DuelJoin', targetId);
      } catch (err) {
        socket.emit('chat_error', { message: 'Fonds insuffisants pour accepter.' });
        return;
      }
    }

    await redis.del(`duel:invite:${inviteId}`);

    const p1: QueuedPlayer = {
      socketId: 'unknown_socket',
      userId: invite.senderId,
      username: invite.senderUsername,
      difficulty: invite.difficulty,
      betAmount: invite.betAmount,
      rating: invite.rating,
      joinedAt: invite.joinedAt,
    };

    const p2: QueuedPlayer = {
      socketId: socket.id,
      userId: targetId,
      username: targetUsername,
      difficulty: invite.difficulty,
      betAmount: invite.betAmount,
      rating: 1500,
      joinedAt: Date.now(),
    };

    void socket.join(`user_${targetId}`);
    await this.setUserSocket(targetId, socket.id);

    await this.startDuel(p1, p2, false);
  }

  async joinTable(
    p2Socket: Socket,
    p2UserId: string,
    p2Username: string,
    targetUserId: string,
  ) {
    const queue = await this.getQueue();
    const targetPlayerIndex = queue.findIndex((p) => p.userId === targetUserId);
    if (targetPlayerIndex === -1) return; // Player no longer in queue

    const p1 = queue[targetPlayerIndex];

    if (p1.betAmount > 0) {
      try {
        await this.coinLedger.debit(
          p2UserId,
          p1.betAmount,
          CoinTransactionType.DUEL_WAGER,
          'DuelJoin',
          p2UserId,
        );
      } catch (err) {
        p2Socket.emit('chat_error', {
          message: 'Fonds insuffisants pour rejoindre cette table.',
        });
        return;
      }
    }

    const p2: QueuedPlayer = {
      socketId: p2Socket.id,
      userId: p2UserId,
      username: p2Username,
      difficulty: p1.difficulty,
      betAmount: p1.betAmount,
      rating: 1500,
      joinedAt: Date.now(),
    };

    await this.setUserSocket(p2UserId, p2Socket.id);
    void p2Socket.join(`user_${p2UserId}`);

    await this.removeFromQueue(p1.userId);
    await this.removeFromQueue(p2UserId);

    await this.startDuel(p1, p2, false);
    this.broadcastLobbyState();
  }

  // --- LOBBY SYSTEM ---

  async createLobby(
    socket: Socket,
    userId: string,
    username: string,
    settings: {
      difficulty: Difficulty;
      betAmount: number;
      hasTimer: boolean;
      timeLimitSec: number | null;
      allowSpectators: boolean;
      allowSpectatorChat: boolean;
    },
    rating: number
  ) {
    if (settings.betAmount > 0) {
      try {
        await this.coinLedger.debit(userId, settings.betAmount, CoinTransactionType.DUEL_WAGER, 'DuelLobbyCreate', userId);
      } catch (err) {
        socket.emit('chat_error', { message: 'Fonds insuffisants.' });
        return;
      }
    }

    const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const lobby: DuelLobby = {
      id: lobbyId,
      creatorId: userId,
      creatorUsername: username,
      player1: {
        socketId: socket.id,
        userId,
        username,
        difficulty: settings.difficulty,
        betAmount: settings.betAmount,
        rating,
        joinedAt: Date.now(),
      },
      player2: null,
      spectators: [],
      settings,
      createdAt: Date.now(),
    };

    await this.saveLobby(lobby);
    await this.setUserSocket(userId, socket.id);
    void socket.join(`user_${userId}`);
    void socket.join(`lobby_${lobbyId}`);

    socket.emit('lobby_created', { lobbyId });
    this.server.to(`lobby_${lobbyId}`).emit('lobby_update', lobby);
    this.broadcastLobbyState();
  }

  async requestLobbyState(socket: Socket, lobbyId: string) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) {
      socket.emit('chat_error', { message: 'Lobby introuvable ou expiré.' });
      return;
    }

    void socket.join(`lobby_${lobbyId}`);
    socket.emit('lobby_update', lobby);
  }

  async updateLobbySettings(
    socket: Socket,
    userId: string,
    lobbyId: string,
    settings: Partial<DuelLobby['settings']>,
  ) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) {
      socket.emit('chat_error', { message: 'Lobby introuvable ou expiré.' });
      return;
    }

    if (lobby.creatorId !== userId) {
      socket.emit('chat_error', {
        message: 'Seul le créateur peut modifier les paramètres.',
      });
      return;
    }

    if (lobby.player2) {
      socket.emit('chat_error', {
        message: 'Les paramètres sont verrouillés après l’arrivée du joueur 2.',
      });
      return;
    }

    const nextSettings = {
      ...lobby.settings,
      ...settings,
    };

    if (!nextSettings.hasTimer) {
      nextSettings.timeLimitSec = null;
    }

    if (!nextSettings.allowSpectators) {
      nextSettings.allowSpectatorChat = false;
      lobby.spectators = [];
    }

    lobby.settings = nextSettings;
    lobby.player1.difficulty = nextSettings.difficulty;
    lobby.player1.betAmount = nextSettings.betAmount;

    await this.saveLobby(lobby);
    this.server.to(`lobby_${lobbyId}`).emit('lobby_update', lobby);
    this.broadcastLobbyState();
  }

  async joinLobby(
    socket: Socket,
    userId: string,
    username: string,
    lobbyId: string,
    asSpectator: boolean
  ) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) {
      socket.emit('chat_error', { message: 'Lobby introuvable ou expiré.' });
      return;
    }

    if (!asSpectator && lobby.player2) {
      socket.emit('chat_error', { message: 'Table complète.' });
      return;
    }

    if (asSpectator && !lobby.settings.allowSpectators) {
      socket.emit('chat_error', { message: 'Les spectateurs ne sont pas autorisés sur cette table.' });
      return;
    }

    if (!asSpectator && lobby.settings.betAmount > 0) {
      try {
        await this.coinLedger.debit(userId, lobby.settings.betAmount, CoinTransactionType.DUEL_WAGER, 'DuelLobbyJoin', userId);
      } catch (err) {
        socket.emit('chat_error', { message: 'Fonds insuffisants pour rejoindre.' });
        return;
      }
    }

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const rating = profile?.rating || 1500;

    const newPlayer: QueuedPlayer = {
      socketId: socket.id,
      userId,
      username,
      difficulty: lobby.settings.difficulty,
      betAmount: lobby.settings.betAmount,
      rating,
      joinedAt: Date.now(),
    };

    if (asSpectator) {
      lobby.spectators.push(newPlayer);
    } else {
      lobby.player2 = newPlayer;
    }

    await this.saveLobby(lobby);
    await this.setUserSocket(userId, socket.id);
    void socket.join(`user_${userId}`);
    void socket.join(`lobby_${lobbyId}`);

    socket.emit('lobby_joined', { lobbyId, asSpectator });
    this.server.to(`lobby_${lobbyId}`).emit('lobby_update', lobby);
    this.broadcastLobbyState();
  }

  async leaveLobby(socket: Socket, userId: string, lobbyId: string) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) return;

    if (lobby.creatorId === userId) {
      if (lobby.settings.betAmount > 0) {
        await this.coinLedger.credit(
          userId,
          lobby.settings.betAmount,
          CoinTransactionType.DUEL_WAGER,
          'DuelLobbyRefund',
          lobbyId,
        );
      }
      if (lobby.player2 && lobby.settings.betAmount > 0) {
        await this.coinLedger.credit(
          lobby.player2.userId,
          lobby.settings.betAmount,
          CoinTransactionType.DUEL_WAGER,
          'DuelLobbyRefund',
          lobbyId,
        );
      }
      await this.deleteLobby(lobbyId);
      this.server.to(`lobby_${lobbyId}`).emit('lobby_closed', { lobbyId });
      this.broadcastLobbyState();
      return;
    }

    if (lobby.player2?.userId === userId) {
      if (lobby.settings.betAmount > 0) {
        await this.coinLedger.credit(
          userId,
          lobby.settings.betAmount,
          CoinTransactionType.DUEL_WAGER,
          'DuelLobbyRefund',
          lobbyId,
        );
      }
      lobby.player2 = null;
    }

    lobby.spectators = lobby.spectators.filter((s) => s.userId !== userId);
    await this.saveLobby(lobby);
    void socket.leave(`lobby_${lobbyId}`);
    this.server.to(`lobby_${lobbyId}`).emit('lobby_update', lobby);
    this.broadcastLobbyState();
  }

  async handleLobbyChat(lobbyId: string, userId: string, message: string) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) return;

    const isPlayer =
      lobby.player1.userId === userId || lobby.player2?.userId === userId;
    const spectator = lobby.spectators.find((s) => s.userId === userId);
    if (!isPlayer && !spectator) return;
    if (!isPlayer && !lobby.settings.allowSpectatorChat) return;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    this.server.to(`lobby_${lobbyId}`).emit('lobby_chat', {
      userId,
      username: profile?.username || 'Player',
      level: profile?.level || 1,
      role: isPlayer ? 'PLAYER' : 'SPECTATOR',
      message: message.slice(0, 500),
      timestamp: Date.now(),
    });
  }

  async startLobbyMatch(socket: Socket, userId: string, lobbyId: string) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) return;

    if (lobby.creatorId !== userId) {
      socket.emit('chat_error', { message: "Seul le créateur peut démarrer la partie." });
      return;
    }

    if (!lobby.player2) {
      socket.emit('chat_error', { message: "En attente d'un adversaire." });
      return;
    }

    // Start match
    await this.startDuel(lobby.player1, lobby.player2, false, lobby);
    await this.deleteLobby(lobbyId);
    this.broadcastLobbyState();
  }

  private async matchmakingLoop() {
    const redis = this.redisService.getClient();
    // ATOMICITY: Use Redis SETNX to create a distributed lock
    const lockToken = Math.random().toString(36).substring(2, 15);
    const lock = await redis.set(
      'duel:matchmaking_lock',
      lockToken,
      'PX',
      1500,
      'NX',
    );
    if (!lock) return; // Another instance is currently matchmaking

    try {
      let queue = await this.getQueue();
      const now = Date.now();

      // --- BOT OFFER FLOW ---
      // After 10s waiting: emit bot_offer (player has 15s to choose a level)
      // After 25s waiting (no choice): auto-accept MEDIUM bot
      for (const player of queue) {
        const waited = now - player.joinedAt;

        // Auto-accept after 25s of no response
        if (waited > 25000) {
          await this.removeFromQueue(player.userId);
          const botProfile = this.pickBotProfile('MEDIUM');
          void this.startDuel(
            player,
            {
              socketId: 'BOT',
              userId: 'BOT',
              username: botProfile.username,
              difficulty: player.difficulty,
              betAmount: player.betAmount,
              rating: botProfile.elo,
              joinedAt: Date.now(),
            },
            true,
            undefined,
            'MEDIUM',
          );
          continue;
        }

        // Offer the bot after 10s (only once)
        if (waited > 10000 && !player.botOfferSent) {
          player.botOfferSent = true;
          player.botOfferTime = now;
          await this.saveToQueue(player); // persist the flag

          // Emit bot_offer with available bot levels and a 15s countdown
          this.server.to(`user_${player.userId}`).emit('bot_offer', {
            message: 'Aucun adversaire trouvé. Voulez-vous jouer contre un bot ?',
            timeoutMs: 15000,
            levels: [
              { key: 'EASY',   label: BOT_CONFIGS.EASY.label,   eloRange: BOT_CONFIGS.EASY.eloRange },
              { key: 'MEDIUM', label: BOT_CONFIGS.MEDIUM.label, eloRange: BOT_CONFIGS.MEDIUM.eloRange },
              { key: 'HARD',   label: BOT_CONFIGS.HARD.label,   eloRange: BOT_CONFIGS.HARD.eloRange },
            ],
          });
        }
      }

      queue = await this.getQueue(); // Refresh in case it changed

      // --- HUMAN MATCHMAKING ---
      let matched = false;
      for (let i = 0; i < queue.length; i++) {
        for (let j = i + 1; j < queue.length; j++) {
          const p1 = queue[i];
          const p2 = queue[j];
          if (
            p1.difficulty === p2.difficulty &&
            p1.betAmount === p2.betAmount &&
            Math.abs(p1.rating - p2.rating) <= 300
          ) {
            await this.removeFromQueue(p1.userId);
            await this.removeFromQueue(p2.userId);
            await this.startDuel(p1, p2, false);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }

      if (matched) {
        this.broadcastLobbyState();
      }
    } finally {
      // Safe Release with Lua Script to prevent deleting another instance's lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
      `;
      await redis.eval(script, 1, 'duel:matchmaking_lock', lockToken);
    }
  }

  /**
   * P1-N: friend duel — creates a real match for two friends.
   * Called by the presence gateway when a Redis-TTL'd challenge is ACCEPTED.
   */
  async createFriendMatch(
    p1: { userId: string; username: string; rating: number },
    p2: { userId: string; username: string; rating: number },
    difficulty: string,
    betAmount: number,
  ) {
    // Both players must have enough coins for the wager (if any)
    if (betAmount > 0) {
      const [w1, w2] = await Promise.all([
        prisma.profile.findUnique({ where: { userId: p1.userId }, select: { coins: true } }),
        prisma.profile.findUnique({ where: { userId: p2.userId }, select: { coins: true } }),
      ]);
      if ((w1?.coins ?? 0) < betAmount || (w2?.coins ?? 0) < betAmount) {
        throw new Error('Un des joueurs n’a pas assez de coins pour ce pari.');
      }
    }

    return this.startDuel(
      { socketId: 'friend-match', userId: p1.userId, username: p1.username, difficulty: difficulty as any, betAmount, rating: p1.rating, joinedAt: Date.now() },
      { socketId: 'friend-match', userId: p2.userId, username: p2.username, difficulty: difficulty as any, betAmount, rating: p2.rating, joinedAt: Date.now() },
      false,
    );
  }

  // --- GAMEPLAY ---

  private async startDuel(
    p1: QueuedPlayer,
    p2: QueuedPlayer,
    isBotMatch: boolean,
    lobby?: DuelLobby,
    botDifficulty?: BotDifficulty,
  ) {
    this.logger.log(`Starting duel between ${p1.userId} and ${p2.userId}`);

    const puzzleData = SudokuGenerator.generate(p1.difficulty as any);
    const mockBoard = puzzleData.initialBoard as number[][];
    const mockSolved = puzzleData.solvedBoard as number[][];

    const match = await prisma.duelMatch.create({
      data: {
        difficulty: p1.difficulty,
        betAmount: p1.betAmount,
        player1Id: p1.userId,
        player2Id: isBotMatch ? null : p2.userId,
        status: GameStatus.IN_PROGRESS,
        startTime: new Date(Date.now() + 3000), // +3 seconds for 3,2,1,Go!
        spectatorMode: lobby?.settings.allowSpectators ? SpectatorMode.ALL : SpectatorMode.NONE,
        hasTimer: lobby?.settings.hasTimer ?? true,
        timeLimitSec: lobby?.settings.timeLimitSec ?? null,
        allowSpectators: lobby?.settings.allowSpectators ?? true,
        allowSpectatorChat: lobby?.settings.allowSpectatorChat ?? true,
      },
    });

    const botProfile = isBotMatch ? this.pickBotProfile(botDifficulty ?? 'MEDIUM') : null;
    const botUsername = isBotMatch ? p2.username : undefined;
    const botElo      = isBotMatch ? p2.rating    : undefined;

    const activeDuel: ActiveDuel = {
      id: match.id,
      player1Id: p1.userId,
      player2Id: p2.userId,
      scoreP1: 0,
      scoreP2: 0,
      difficulty: p1.difficulty,
      betAmount: p1.betAmount,
      initialBoard: mockBoard,
      solvedBoard: mockSolved,
      currentBoard: mockBoard.map((row) => [...row]),
      isBotMatch,
      botDifficulty: isBotMatch ? (botDifficulty ?? 'MEDIUM') : undefined,
      botUsername,
      botElo,
      startTime: Date.now() + 3000, // +3 seconds for animation
      spectatorMode: lobby?.settings.allowSpectators ? SpectatorMode.ALL : SpectatorMode.NONE,
      mutedSpectators: [],
      lastMoveTimeP1: 0,
      lastMoveTimeP2: 0,
      riskScoreP1: 0,
      riskScoreP2: 0,
      ownersBoard: Array(9).fill(null).map(() => Array(9).fill(null)),
      comboP1: 0,
      comboP2: 0,
      settings: lobby?.settings,
    };

    await this.saveActiveDuel(match.id, activeDuel);
    const redis = this.redisService.getClient();
    await redis.sadd('duel:active_ids', match.id);

    const payload = {
      matchId: match.id,
      board: activeDuel.initialBoard,
      ownersBoard: activeDuel.ownersBoard,
      player1: { id: p1.userId, username: p1.username, score: 0 },
      player2: {
        id: p2.userId,
        username: p2.username,
        score: 0,
        isBot: isBotMatch,
        botDifficulty: isBotMatch ? (botDifficulty ?? 'MEDIUM') : undefined,
        botElo: isBotMatch ? p2.rating : undefined,
        botLabel: isBotMatch ? BOT_CONFIGS[botDifficulty ?? 'MEDIUM'].label : undefined,
      },
      isBotMatch,
      settings: activeDuel.settings,
    };

    // Instruct instances to make sockets join the room (using Socket.IO Redis adapter feature)
    // We can emit to `user_${id}` to tell the client they are in a match, and the client will emit `join_match_room`
    // For server-side forced joining via adapter, we use server.in('user_id').socketsJoin(`match_${match.id}`)
    this.server.in(`user_${p1.userId}`).socketsJoin(`match_${match.id}`);
    this.server.to(`user_${p1.userId}`).emit('duel_start', payload);
    
    if (!isBotMatch) {
      this.server.in(`user_${p2.userId}`).socketsJoin(`match_${match.id}`);
      this.server.to(`user_${p2.userId}`).emit('duel_start', payload);
    }

    this.server.to(`match_${match.id}`).emit('duel_start', payload);

    if (isBotMatch) this.startBotLoop(match.id, botDifficulty ?? 'MEDIUM');
    return match;
  }

  private startBotLoop(matchId: string, botDifficulty: BotDifficulty = 'MEDIUM') {
    const cfg = BOT_CONFIGS[botDifficulty];

    const scheduleNextMove = async () => {
      const active = await this.getActiveDuel(matchId);
      if (!active) return; // Game over

      // Wait until the match has started (3s countdown)
      const now = Date.now();
      if (now < active.startTime) {
        setTimeout(() => scheduleNextMove(), active.startTime - now + 100);
        return;
      }

      const delay = Math.max(
        300,
        cfg.baseDelay + (Math.random() * cfg.variance * 2 - cfg.variance),
      );

      setTimeout(async () => {
        const duel = await this.getActiveDuel(matchId);
        if (!duel) return;

        // Collect all unfilled cells
        const emptyCells: { r: number; c: number }[] = [];
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (duel.currentBoard[r][c] === 0) emptyCells.push({ r, c });
          }
        }

        if (emptyCells.length > 0) {
          // HARD bots pick the "easiest" cell (first unclaimed); others pick randomly
          let chosenCell: { r: number; c: number };
          if (botDifficulty === 'HARD') {
            // Prefer cells not yet claimed by player1 (opportunistic)
            const unclaimed = emptyCells.filter(({ r, c }) => !duel.ownersBoard[r][c]);
            chosenCell = unclaimed.length > 0
              ? unclaimed[Math.floor(Math.random() * unclaimed.length)]
              : emptyCells[Math.floor(Math.random() * emptyCells.length)];
          } else {
            chosenCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          }

          const { r, c } = chosenCell;
          let valueToPlay = duel.solvedBoard[r][c]; // Correct answer

          // Simulate mistakes at the configured rate
          if (Math.random() < cfg.mistakeChance) {
            // Pick a wrong digit (cycle so it's always wrong)
            valueToPlay = (valueToPlay % 9) + 1;
          }
          await this.handleMove(matchId, 'BOT', r, c, valueToPlay);
        }

        scheduleNextMove(); // recursive loop
      }, delay);
    };

    scheduleNextMove();
  }

  async handleMove(
    matchId: string,
    userId: string,
    row: number,
    col: number,
    value: number,
  ) {
    const now = Date.now();
    try {
      const result = await this.atomicHandleMove(matchId, userId, row, col, value, now);
      if (result.error) return;
      if (result.isSus) this.logger.warn('Suspicious move');
      
      const payload = {
        row,
        col,
        value: result.isCorrect ? value : null,
        isCorrect: result.isCorrect,
        userId,
        scoreP1: result.scoreP1,
        scoreP2: result.scoreP2,
        combo: result.combo,
      };

      this.server.to('match_' + matchId).emit('duel_move', payload);

      if (result.isCorrect) {
        let isFinished = true;
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (result.currentBoard[r][c] === 0) {
              isFinished = false;
              break;
            }
          }
          if (!isFinished) break;
        }

        if (isFinished) {
          const updatedDuel = await this.getActiveDuel(matchId);
          if (updatedDuel) void this.checkWinCondition(updatedDuel);
        }
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  /**
   * Atomically applies a move to the duel state in Redis (P0-E).
   *
   * The previous implementation (plain GET -> JS mutate -> SET, introduced by a
   * regex hot-patch) lost concurrent updates and dropped the 3600s TTL.
   * This version uses a WATCH/MULTI optimistic transaction on a dedicated
   * connection: if another writer (opponent, bot loop, other instance) touched
   * the key between our read and write, EXEC aborts and we retry with fresh
   * state. The original TTL is preserved.
   */
  private async atomicHandleMove(
    matchId: string,
    userId: string,
    r: number,
    c: number,
    val: number,
    now: number,
  ): Promise<any> {
    const redis = this.redisService.getClient();
    const key = 'duel:active:' + matchId;
    const MAX_MOVE_ATTEMPTS = 10;

    for (let attempt = 0; attempt < MAX_MOVE_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        // Jittered backoff: reduce retry storms under contention
        // (2 players + bot loop can conflict on the same key).
        await new Promise((res) => setTimeout(res, Math.floor(Math.random() * 8) + 1));
      }
      // Dedicated connection: WATCH is connection-scoped and must not be
      // shared with other in-flight commands on the pool client.
      const tx = redis.duplicate();
      try {
        await tx.watch(key);
        const duelStr = await tx.get(key);
        if (!duelStr) {
          await tx.unwatch();
          return { error: 'not_found' };
        }
        const duel = JSON.parse(duelStr);

        if (now < duel.startTime) {
          await tx.unwatch();
          return { error: 'match_not_started' };
        }
        if (userId !== duel.player1Id && userId !== duel.player2Id) {
          await tx.unwatch();
          return { error: 'spectator' };
        }
        if (duel.currentBoard[r]?.[c] !== 0 || val === 0) {
          await tx.unwatch();
          return { error: 'invalid_move' };
        }

        let isSus = false;
        if (userId === duel.player1Id) {
          if (duel.lastMoveTimeP1 > 0 && now - duel.lastMoveTimeP1 < 300) {
            duel.riskScoreP1++;
            isSus = true;
          }
          duel.lastMoveTimeP1 = now;
        } else {
          if (duel.lastMoveTimeP2 > 0 && now - duel.lastMoveTimeP2 < 300) {
            duel.riskScoreP2++;
            isSus = true;
          }
          duel.lastMoveTimeP2 = now;
        }

        const isCorrect = duel.solvedBoard[r][c] === val;
        let currentCombo = 0;

        if (isCorrect) {
          duel.currentBoard[r][c] = val;
          duel.ownersBoard[r][c] = userId;
          if (userId === duel.player1Id) {
            duel.scoreP1++;
            duel.comboP1++;
            currentCombo = duel.comboP1;
          } else {
            duel.scoreP2++;
            duel.comboP2++;
            currentCombo = duel.comboP2;
          }
        } else {
          if (userId === duel.player1Id) {
            duel.scoreP1--;
            duel.comboP1 = 0;
          } else {
            duel.scoreP2--;
            duel.comboP2 = 0;
          }
        }

        // Preserve the duel TTL (default 3600s set by saveActiveDuel).
        const ttl = await tx.ttl(key);
        const ttlSec = ttl > 0 ? ttl : 3600;
        const results = await tx
          .multi()
          .set(key, JSON.stringify(duel), 'EX', ttlSec)
          .exec();

        if (!results || results.length === 0) {
          continue; // WATCH aborted: another writer won, retry with fresh state
        }
        return {
          success: true,
          isSus,
          isCorrect,
          currentBoard: duel.currentBoard,
          scoreP1: duel.scoreP1,
          scoreP2: duel.scoreP2,
          combo: currentCombo,
        };
      } finally {
        tx.disconnect();
      }
    }
    return { error: 'conflict' };
  }

  private async checkWinCondition(duel: ActiveDuel) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (duel.currentBoard[r][c] === 0) return;
      }
    }

    // P0-G: atomically CLAIM the right to finalize this duel.
    // DEL returns 1 only for the first caller — concurrent finishers
    // (last two moves, timeout + move, multi-instance) cannot double-pay.
    const redis = this.redisService.getClient();
    const claim = await redis.del('duel:active:' + duel.id);
    if (claim === 0) return; // someone else already finalized this duel
    await redis.srem('duel:active_ids', duel.id);

    const winnerId =
      duel.scoreP1 > duel.scoreP2
        ? duel.player1Id
        : duel.scoreP2 > duel.scoreP1
          ? duel.player2Id
          : null;

    if (!duel.isBotMatch && duel.player2Id) {
      try {
        const progression =
          await this.progressionService.processDuelProgression(
            duel.id,
            duel.difficulty,
            duel.player1Id,
            duel.player2Id,
            winnerId,
            duel.isBotMatch,
          );
        (duel as any).p1Result = progression.p1Result;
        (duel as any).p2Result = progression.p2Result;

        const p1Profile = await prisma.profile.findUnique({
          where: { userId: duel.player1Id },
        });
        const p2Profile = await prisma.profile.findUnique({
          where: { userId: duel.player2Id },
        });

        if (p1Profile && p2Profile) {
          const settings = { tau: 0.5, rating: 1500, rd: 350, vol: 0.06 };
          const ranking = new glicko2.Glicko2(settings);

          const player1 = ranking.makePlayer(
            p1Profile.rating,
            p1Profile.ratingDeviation,
            p1Profile.ratingVolatility,
          );
          const player2 = ranking.makePlayer(
            p2Profile.rating,
            p2Profile.ratingDeviation,
            p2Profile.ratingVolatility,
          );

          let p1Score = 0.5;
          let p2Score = 0.5;
          if (winnerId === duel.player1Id) {
            p1Score = 1;
            p2Score = 0;
          } else if (winnerId === duel.player2Id) {
            p1Score = 0;
            p2Score = 1;
          }

          ranking.updateRatings([[player1, player2, p1Score]]);

          const p1XpGained = p1Score === 1 ? 50 : p1Score === 0 ? 10 : 25;
          const p2XpGained = p2Score === 1 ? 50 : p2Score === 0 ? 10 : 25;
          (duel as any).p1XpGained = p1XpGained;
          (duel as any).p2XpGained = p2XpGained;

          await prisma.$transaction([
            prisma.profile.update({
              where: { userId: duel.player1Id },
              data: {
                rating: player1.getRating(),
                ratingDeviation: player1.getRd(),
                ratingVolatility: player1.getVol(),
                gamesPlayed: { increment: 1 },
                gamesWon:
                  winnerId === duel.player1Id ? { increment: 1 } : undefined,
                experience: { increment: p1XpGained },
              },
            }),
            prisma.profile.update({
              where: { userId: duel.player2Id },
              data: {
                rating: player2.getRating(),
                ratingDeviation: player2.getRd(),
                ratingVolatility: player2.getVol(),
                gamesPlayed: { increment: 1 },
                gamesWon:
                  winnerId === duel.player2Id ? { increment: 1 } : undefined,
                experience: { increment: p2XpGained },
              },
            }),
          ]);
        }
      } catch (err) {
        this.logger.error('Failed to update Glicko-2 ratings', err);
      }
    } // end progression/ratings block (real matches only)

    // P0-G: Award bets — moved OUT of the !isBotMatch block (bot matches
    // previously never paid anything: a human beating the bot still lost their stake).
    // Economy rules:
    //  - Real match: winner receives BOTH stakes (betAmount * 2) — zero-sum transfer.
    //  - Draw: both stakes refunded.
    //  - Bot match: the bot paid no real stake, so the house NEVER mints betAmount*2.
    //    Human win or draw = stake refunded exactly; bot win = stake lost to the
    //    house (coin sink). Every payout carries a stable idempotency key so a
    //    replayed finish event can never double-credit.
    if (duel.betAmount > 0) {
      try {
        if (duel.isBotMatch) {
          if (winnerId === duel.player1Id || !winnerId) {
            await this.coinLedger.credit(
              duel.player1Id,
              duel.betAmount,
              CoinTransactionType.DUEL_WAGER,
              duel.isBotMatch && winnerId ? 'DuelBotRefund' : 'DuelBotDraw',
              duel.id,
              `duel_bot_stake_${duel.id}`,
            );
          }
          // winnerId === 'BOT' (or opponent id of a bot): stake is lost to the house.
        } else if (duel.player2Id) {
          if (winnerId === duel.player1Id) {
            await this.coinLedger.credit(
              duel.player1Id,
              duel.betAmount * 2,
              CoinTransactionType.DUEL_WAGER,
              'DuelWin',
              duel.id,
              `duel_win_${duel.id}_p1`,
            );
          } else if (winnerId === duel.player2Id) {
            await this.coinLedger.credit(
              duel.player2Id,
              duel.betAmount * 2,
              CoinTransactionType.DUEL_WAGER,
              'DuelWin',
              duel.id,
              `duel_win_${duel.id}_p2`,
            );
          } else {
            await this.coinLedger.credit(
              duel.player1Id,
              duel.betAmount,
              CoinTransactionType.DUEL_WAGER,
              'DuelDraw',
              duel.id,
              `duel_draw_${duel.id}_p1`,
            );
            await this.coinLedger.credit(
              duel.player2Id,
              duel.betAmount,
              CoinTransactionType.DUEL_WAGER,
              'DuelDraw',
              duel.id,
              `duel_draw_${duel.id}_p2`,
            );
          }
        }
      } catch (err) {
        this.logger.error('Failed to award duel bets', err);
      }
    }

    void trackEvent({ name: 'duel_complete', userId: winnerId && winnerId !== 'BOT' ? winnerId : duel.player1Id, metadata: { matchId: duel.id, isBot: winnerId === 'BOT' } });
    await prisma.duelMatch.update({
      where: { id: duel.id },
      data: {
        status: GameStatus.COMPLETED,
        endTime: new Date(),
        scoreP1: duel.scoreP1,
        scoreP2: duel.scoreP2,
        winnerId: winnerId === 'BOT' ? null : winnerId,
      },
    });

    const payload = {
      winnerId,
      scoreP1: duel.scoreP1,
      scoreP2: duel.scoreP2,
      message: 'Partie terminée !',
      p1Progression: (duel as any).p1Result,
      p2Progression: (duel as any).p2Result,
      p1XpGained: (duel as any).p1XpGained,
      p2XpGained: (duel as any).p2XpGained,
    };
    this.server.to(`match_${duel.id}`).emit('duel_end', payload);
    this.broadcastLobbyState();
  }

  async joinMatch(socket: Socket, matchId: string, userId: string) {
    const duel = await this.getActiveDuel(matchId);
    if (!duel) return;

    void socket.join(`match_${matchId}`);

    const [p1Profile, p2Profile] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: duel.player1Id } }),
      duel.player2Id ? prisma.profile.findUnique({ where: { userId: duel.player2Id } }) : null,
    ]);

    socket.emit('duel_start', {
      matchId: duel.id,
      board: duel.currentBoard,
      ownersBoard: duel.ownersBoard,
      player1: { id: duel.player1Id, username: p1Profile?.username || 'Player 1', score: duel.scoreP1 },
      player2: {
        id: duel.player2Id || 'BOT',
        username: duel.isBotMatch ? (duel.botUsername || 'Sudoku Bot') : (p2Profile?.username || 'Player 2'),
        score: duel.scoreP2,
        isBot: duel.isBotMatch,
        botDifficulty: duel.botDifficulty,
        botElo: duel.botElo,
      },
      isBotMatch: duel.isBotMatch,
      settings: duel.settings,
    });
  }

  async spectateMatch(socket: Socket, matchId: string, userId: string) {
    const duel = await this.getActiveDuel(matchId);
    if (!duel || duel.spectatorMode === SpectatorMode.PRIVATE) return;
    if (duel.spectatorMode === SpectatorMode.NONE) return;

    void socket.join(`match_${matchId}`);

    socket.emit('spectator_joined', {
      board: duel.currentBoard,
      ownersBoard: duel.ownersBoard,
      scoreP1: duel.scoreP1,
      scoreP2: duel.scoreP2,
      settings: duel.settings,
    });
  }

  async handleChat(matchId: string, userId: string, message: string) {
    const duel = await this.getActiveDuel(matchId);
    if (!duel) return;

    const isPlayer = userId === duel.player1Id || userId === duel.player2Id;

    if (!isPlayer) {
      if (duel.spectatorMode === SpectatorMode.NO_CHAT) return;
      if (duel.settings?.allowSpectatorChat === false) return;
      if (duel.mutedSpectators.includes(userId)) return;
    }

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const payload = {
      userId,
      username: profile?.username || 'Player',
      level: profile?.level || 1,
      role: isPlayer ? 'PLAYER' : 'SPECTATOR',
      message: message.slice(0, 500),
      isSpectator: !isPlayer,
      timestamp: Date.now(),
    };

    this.server.to(`match_${matchId}`).emit('receive_chat', payload);
    this.server.to(`match_${matchId}`).emit('duel_chat', payload);
  }

  async moderateSpectator(
    matchId: string,
    authorId: string,
    targetId: string,
    action: 'mute' | 'disable_all_chat',
  ) {
    const duel = await this.getActiveDuel(matchId);
    if (!duel) return;

    if (authorId !== duel.player1Id && authorId !== duel.player2Id) return;

    if (action === 'mute' && targetId) {
      duel.mutedSpectators.push(targetId);
      await this.saveActiveDuel(matchId, duel);
      this.server
        .to(`match_${matchId}`)
        .emit('system_message', { message: `Un spectateur a été rendu muet.` });
    } else if (action === 'disable_all_chat') {
      duel.spectatorMode = SpectatorMode.NO_CHAT;
      await this.saveActiveDuel(matchId, duel);
      this.server.to(`match_${matchId}`).emit('system_message', {
        message: `Le chat des spectateurs a été désactivé par les joueurs.`,
      });
    }
  }
}
