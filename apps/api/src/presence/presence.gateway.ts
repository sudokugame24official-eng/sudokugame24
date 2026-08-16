import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { RedisService } from '../redis/redis.service';
import { FriendsService } from '../friends/friends.service';

@UseGuards(WsJwtGuard)
@WebSocketGateway({ namespace: '/presence', cors: { origin: '*' } })
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('PresenceGateway');

  constructor(
    private redisService: RedisService,
    private friendsService: FriendsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // WsJwtGuard populates client.data.user (assuming it runs on connect or via middleware)
      // Actually, guards don't run on connection lifecycle hooks automatically in NestJS.
      // We must authenticate the socket manually on connect if we need user data immediately.
      // Let's assume the client sends token in handshake.auth.token and we verified it.
      // For now, we will rely on a dedicated "identify" event to mark as online.
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.id;
    if (userId) {
      this.markUserOffline(userId);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('identify')
  async handleIdentify(client: Socket) {
    const userId = client.data.user.id;
    client.join(`user_${userId}`);
    await this.markUserOnline(userId);

    // Notify friends
    const friends = await this.friendsService.getFriends(userId);
    const friendIds = friends.map((f) => f.id);

    // Broadcast only to friends who are online (they are in their own rooms)
    for (const friendId of friendIds) {
      this.server.to(`user_${friendId}`).emit('friend_online', { userId });
    }

    // Get currently online friends to return to the client
    const redis = this.redisService.getClient();
    const onlineStatuses = await Promise.all(
      friendIds.map((fId) => redis.sismember('presence:online_users', fId)),
    );

    const onlineFriends = friendIds.filter(
      (_, idx) => onlineStatuses[idx] === 1,
    );

    return { status: 'identified', onlineFriends };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('challenge_friend')
  async handleChallenge(
    client: Socket,
    payload: { friendId: string; difficulty: string },
  ) {
    const userId = client.data.user.id;
    const username = client.data.user.username;

    // Verify they are actually friends
    const friends = await this.friendsService.getFriends(userId);
    if (!friends.find((f) => f.id === payload.friendId)) {
      return { error: 'Not friends' };
    }

    // Emit challenge to friend's room
    this.server.to(`user_${payload.friendId}`).emit('duel_challenge_received', {
      challengerId: userId,
      challengerUsername: username,
      difficulty: payload.difficulty,
    });

    return { success: true };
  }

  private async markUserOnline(userId: string) {
    const redis = this.redisService.getClient();
    await redis.sadd('presence:online_users', userId);
  }

  private async markUserOffline(userId: string) {
    const redis = this.redisService.getClient();
    await redis.srem('presence:online_users', userId);

    // We could notify friends here too, but to avoid O(N) DB calls on every disconnect,
    // we could rely on clients polling or only broadcasting if we cached the friend list.
    // For now, simple SREM is fine.
  }
}
