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

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
@UseGuards(WsJwtGuard, WsThrottlerGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  // Store userId -> SocketId
  private activeUsers = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    // Connection will be validated by WsJwtGuard on specific events,
    // but typically guards don't run on handleConnection automatically unless explicitly checked.
    // In our case, we will extract userId on the first authenticated message or we can parse token here.
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.activeUsers.entries()].find(
      ([_, sid]) => sid === client.id,
    )?.[0];
    if (userId) {
      this.activeUsers.delete(userId);
      this.server.emit('user_offline', { userId });
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket) {
    const user = client.data?.user;
    if (user) {
      this.activeUsers.set(user.id, client.id);
      this.server.emit('user_online', { userId: user.id });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data?.user;
    if (!user) return;

    try {
      const message = await this.chatService.sendMessage(
        user.id,
        data.receiverId,
        data.content,
      );

      // Emit to receiver if online
      const receiverSocketId = this.activeUsers.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('receive_message', message);
      }

      // Emit back to sender (for confirmation/UI update)
      client.emit('message_sent', message);
    } catch (error) {
      // Send error specifically to sender (e.g. "User blocked you")
      client.emit('chat_error', { message: error.message });
    }
  }
}
