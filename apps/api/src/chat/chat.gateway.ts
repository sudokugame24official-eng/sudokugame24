import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { WsThrottlerGuard } from '../auth/ws-throttler.guard';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';

/**
 * P1-M: multi-instance chat.
 *
 * NO in-memory user maps: delivery targets the Redis-adapter-backed room
 * `user_{userId}`, so a message reaches its recipient on ANY API instance.
 * Offline recipients get the message through DB persistence in
 * ChatService.sendMessage (fetched on next conversation load).
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
@UseGuards(WsJwtGuard, WsThrottlerGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
  ) {}

  handleConnection(client: Socket) {
    // Authentication happens on the first guarded message ('authenticate').
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.id;
    if (userId) {
      this.server.to(`user_${userId}`).emit('user_offline', { userId }); // room-scoped, cluster-wide via adapter
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(@ConnectedSocket() client: Socket) {
    const user = client.data?.user;
    if (!user) return;
    // Join the cluster-wide personal room (Redis adapter broadcasts joins).
    await client.join(`user_${user.id}`);
    this.server.to(`user_${user.id}`).emit('user_online', { userId: user.id });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data?.user;
    if (!user) return;

    try {
      // Persist first (source of truth) — offline users get it on next load.
      const message = await this.chatService.sendMessage(
        user.id,
        data.receiverId,
        data.content,
      );

      // Deliver to the recipient's personal room: works across instances.
      this.server
        .to(`user_${data.receiverId}`)
        .emit('receive_message', message);

      // Confirm to the sender.
      client.emit('message_sent', message);
    } catch (error) {
      client.emit('chat_error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data?.user;
    if (!user) return;
    this.server.to(`user_${data.receiverId}`).emit('typing', {
      userId: user.id,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { conversationWith: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data?.user;
    if (!user) return;
    try {
      await this.chatService.markConversationRead(
        user.id,
        data.conversationWith,
      );
      this.server
        .to(`user_${data.conversationWith}`)
        .emit('messages_read', { byUserId: user.id });
    } catch (e) {
      this.logger.warn(`mark_read failed: ${(e as Error).message}`);
    }
  }
}
