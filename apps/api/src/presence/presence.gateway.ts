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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('challenge_friend')
  async handleChallenge(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { friendId: string; difficulty: string },
  ) {
    const userId = client.data.user.id;
    const username = client.data.user.username;

    const friends = await this.friendsService.getFriends(userId);
    if (!friends.find((f) => f.id === payload.friendId)) {
      return { error: 'Not friends' };
    }

    this.server.to(`user_${payload.friendId}`).emit('duel_challenge_received', {
      challengerId: userId,
      challengerUsername: username,
      difficulty: payload.difficulty,
    });
    return { success: true };
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
      const removed = await redis.zremrangebyscore(PRESENCE_KEY, '-inf', cutoff);
      if (removed > 0) {
        this.logger.log(`presence sweep: removed ${removed} stale users`);
      }
    } finally {
      const current = await redis.get(lockKey);
      if (current === token) await redis.del(lockKey);
    }
  }
}
