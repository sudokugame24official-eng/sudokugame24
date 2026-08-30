import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron } from '@nestjs/schedule';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { RedisService } from '../redis/redis.service';
import { FriendsService } from '../friends/friends.service';
import { DuelService } from '../duel/duel.service';

const PRESENCE_KEY = 'presence:online_zset';
const HEARTBEAT_TTL_SEC = 90; // a user is offline after 90s without heartbeat

/**
 * P1-M: cluster-safe presence.
 *
 * - Sockets are authenticated AT CONNECTION TIME via a handshake middleware
 *   (the old code never populated client.data.user on connect, so the
 *   disconnect cleanup was dead code and ghost users stayed "online").
 * - Online state lives in a Redis ZSET scored by last-heartbeat timestamp:
 *   shared by all instances, expiring by score, swept by a distributed-locked
 *   cron (no per-instance in-memory truth).
 */
@UseGuards(WsJwtGuard)
@WebSocketGateway({ namespace: '/presence', cors: { origin: '*' } })
export class PresenceGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('PresenceGateway');

  constructor(
    private redisService: RedisService,
    private friendsService: FriendsService,
    private jwtService: JwtService,
    private duelService: DuelService,
  ) {}

  afterInit(server: Server) {
    // Authenticate the socket at handshake time so connect/disconnect
    // lifecycle hooks have the real userId.
    server.use((socket: Socket, next: (err?: Error) => void) => {
      try {
        let token = socket.handshake.auth?.token;
        if (!token && socket.handshake.headers.cookie) {
          const cookies = socket.handshake.headers.cookie
            .split(';')
            .reduce((res: Record<string, string>, c) => {
              const [key, val] = c.trim().split('=');
              res[key] = decodeURIComponent(val || '');
              return res;
            }, {});
          token = cookies['access_token'];
        }
        if (!token) return next(new Error('unauthorized'));
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET as string,
        });
        socket.data.userId = payload.sub;
        next();
      } catch {
        next(new Error('unauthorized'));
      }
    });
  }

  async handleConnection(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) {
      client.disconnect();
      return;
    }
    await client.join(`user_${userId}`);
    await this.touchHeartbeat(userId);
    await this.broadcastOnlineToFriends(userId);
    this.logger.debug(`presence: ${userId} connected`);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) return;

    // Only mark offline if this was the user's LAST socket. Sockets of the
    // same user on other devices/instances keep them online. Room occupancy
    // is adapter-backed (cluster-wide) via the Redis adapter.
    const roomSockets = await this.server.in(`user_${userId}`).fetchSockets();
    const stillConnected = roomSockets.some((s) => s.id !== client.id);
    if (stillConnected) return;

    await this.markUserOffline(userId);
    this.logger.debug(`presence: ${userId} disconnected`);
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = client.data?.userId;
    if (userId) await this.touchHeartbeat(userId);
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('identify')
  async handleIdentify(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId || client.data?.user?.id;
    if (!userId) return { error: 'unidentified' };
    client.data.userId = userId;
    await client.join(`user_${userId}`);
    await this.touchHeartbeat(userId);

    const friends = await this.friendsService.getFriends(userId);
    const friendIds = friends.map((f) => f.id);
    for (const friendId of friendIds) {
      this.server.to(`user_${friendId}`).emit('friend_online', { userId });
    }

    const onlineStatuses = await Promise.all(
      friendIds.map((fId) => this.isOnline(fId)),
    );
    const onlineFriends = friendIds.filter(
      (_, idx) => onlineStatuses[idx] === true,
    );
    return { status: 'identified', onlineFriends };
  }

  /**
   * P1-N: friend challenge with a real invitation lifecycle.
   * Invitation state lives in Redis with a 60s TTL (shared across instances,
   * self-expiring). Accept creates a genuine private duel via DuelService.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('challenge_friend')
  async handleChallenge(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { friendId: string; difficulty: string; betAmount?: number },
  ) {
    const userId = client.data.user.id;
    const username = client.data.user.username;
    const redis = this.redisService.getClient();

    if (payload.friendId === userId) {
      return { error: 'Cannot challenge yourself' };
    }

    const friends = await this.friendsService.getFriends(userId);
    if (!friends.find((f) => f.id === payload.friendId)) {
      return { error: 'Not friends' };
    }

    // Block enforcement: a blocked user can never reach the target, in either
    // direction — no challenge bypass.
    const block = await this.prisma_block_check(userId, payload.friendId);
    if (block) {
      return { error: 'Not available' };
    }

    const challengeId = `fc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const ttlSec = 60;
    await redis.set(
      `fchallenge:${challengeId}`,
      JSON.stringify({
        fromId: userId,
        fromUsername: username,
        toId: payload.friendId,
        difficulty: payload.difficulty,
        betAmount: payload.betAmount ?? 0,
        createdAt: Date.now(),
      }),
      'EX',
      ttlSec,
    );

    this.server.to(`user_${payload.friendId}`).emit('duel_challenge_received', {
      challengeId,
      challengerId: userId,
      challengerUsername: username,
      difficulty: payload.difficulty,
      betAmount: payload.betAmount ?? 0,
      expiresIn: ttlSec,
    });
    return { success: true, challengeId, expiresIn: ttlSec };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('challenge_respond')
  async handleChallengeRespond(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { challengeId: string; accept: boolean },
  ) {
    const userId = client.data.user.id;
    const redis = this.redisService.getClient();
    const key = `fchallenge:${payload.challengeId}`;

    const raw = await redis.get(key);
    if (!raw) {
      return { error: 'expired' };
    }
    const challenge = JSON.parse(raw);

    if (challenge.toId !== userId) {
      return { error: 'not_your_challenge' };
    }

    // Consume the invitation atomically (first response wins)
    const consumed = await redis.del(key);
    if (consumed === 0) {
      return { error: 'already_answered' };
    }

    if (!payload.accept) {
      this.server.to(`user_${challenge.fromId}`).emit('challenge_declined', {
        byUserId: userId,
      });
      return { success: true, status: 'declined' };
    }

    // Load both profiles for the match
    const [p1, p2] = await Promise.all([
      this.prisma_profile(challenge.fromId),
      this.prisma_profile(userId),
    ]);
    if (!p1 || !p2) {
      this.server.to(`user_${challenge.fromId}`).emit('challenge_error', {
        reason: 'profile_missing',
      });
      return { error: 'profile_missing' };
    }

    try {
      const match = await this.duelService.createFriendMatch(
        {
          userId: challenge.fromId,
          username: p1.username,
          rating: p1.rating ?? 1200,
        },
        { userId, username: p2.username, rating: p2.rating ?? 1200 },
        challenge.difficulty,
        challenge.betAmount,
      );
      return { success: true, status: 'accepted', matchId: match.id };
    } catch (e) {
      this.server.to(`user_${challenge.fromId}`).emit('challenge_error', {
        reason: (e as Error).message,
      });
      return { error: (e as Error).message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('challenge_cancel')
  async handleChallengeCancel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { challengeId: string },
  ) {
    const userId = client.data.user.id;
    const redis = this.redisService.getClient();
    const key = `fchallenge:${payload.challengeId}`;

    const raw = await redis.get(key);
    if (!raw) return { success: true, status: 'already_gone' };
    const challenge = JSON.parse(raw);
    if (challenge.fromId !== userId) return { error: 'not_your_challenge' };

    await redis.del(key);
    this.server.to(`user_${challenge.toId}`).emit('challenge_cancelled', {
      challengeId: payload.challengeId,
    });
    return { success: true, status: 'cancelled' };
  }

  /** Bidirectional block check via the Block table. */
  private async prisma_block_check(a: string, b: string): Promise<boolean> {
    const { prisma } = require('@repo/database');
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });
    return !!block;
  }

  private async prisma_profile(userId: string) {
    const { prisma } = require('@repo/database');
    return prisma.profile.findUnique({
      where: { userId },
      select: { username: true, rating: true },
    });
  }

  // --- Redis presence primitives ---

  private async touchHeartbeat(userId: string) {
    const redis = this.redisService.getClient();
    await redis.zadd(PRESENCE_KEY, Date.now(), userId);
    // migrate legacy plain-set readers if present
    await redis.sadd('presence:online_users', userId);
  }

  private async isOnline(userId: string): Promise<boolean> {
    const redis = this.redisService.getClient();
    const ts = await redis.zscore(PRESENCE_KEY, userId);
    if (ts === null) return false;
    return Date.now() - Number(ts) < HEARTBEAT_TTL_SEC * 1000;
  }

  private async markUserOffline(userId: string) {
    const redis = this.redisService.getClient();
    await redis.zrem(PRESENCE_KEY, userId);
    await redis.srem('presence:online_users', userId);
  }

  private async broadcastOnlineToFriends(userId: string) {
    try {
      const friends = await this.friendsService.getFriends(userId);
      for (const f of friends) {
        this.server.to(`user_${f.id}`).emit('friend_online', { userId });
      }
    } catch (e) {
      this.logger.warn(`friend broadcast failed: ${(e as Error).message}`);
    }
  }

  /**
   * Distributed-locked sweep (every minute, one instance at a time):
   * removes users whose heartbeat is older than the TTL.
   */
  @Cron('* * * * *')
  async sweepStalePresence() {
    const redis = this.redisService.getClient();
    const lockKey = 'presence:sweep_lock';
    const token = Math.random().toString(36).slice(2);
    const acquired = await redis.set(lockKey, token, 'PX', 50000, 'NX');
    if (!acquired) return;
    try {
      const cutoff = Date.now() - HEARTBEAT_TTL_SEC * 1000;
      const removed = await redis.zremrangebyscore(
        PRESENCE_KEY,
        '-inf',
        cutoff,
      );
      if (removed > 0) {
        this.logger.log(`presence sweep: removed ${removed} stale users`);
      }
    } finally {
      const current = await redis.get(lockKey);
      if (current === token) await redis.del(lockKey);
    }
  }
}
