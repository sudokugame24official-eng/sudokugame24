import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DuelService } from './duel.service';
import { Logger, UseGuards } from '@nestjs/common';
import { Difficulty, prisma } from '@repo/database';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { WsThrottlerGuard } from '../auth/ws-throttler.guard';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/duel',
})
@UseGuards(WsJwtGuard, WsThrottlerGuard)
export class DuelGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('DuelGateway');

  constructor(private readonly duelService: DuelService) {}

  // Rate limiting map for sockets (simple anti-spam)
  private lastMoveTimes: Map<string, number> = new Map();

  afterInit(server: Server) {
    this.logger.log('DuelGateway initialized');
    this.duelService.setServer(server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Optionally send immediate lobby state
    this.duelService.broadcastLobbyState();
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.lastMoveTimes.delete(client.id);
    this.duelService.handleDisconnect(client.id);
  }

  @SubscribeMessage('join_queue')
  async handleJoinQueue(
    @MessageBody()
    data: {
      difficulty: Difficulty;
      betAmount: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) return;

    // Securely fetch authoritative username and rating
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return;

    this.duelService.joinQueue(
      client,
      userId,
      profile.username,
      data.difficulty,
      data.betAmount,
      profile.rating,
    );
  }

  @SubscribeMessage('send_invite')
  async handleSendInvite(
    @MessageBody() data: { targetUsername: string; difficulty: Difficulty; betAmount: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) return;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return;

    this.duelService.sendInvite(client, userId, profile.username, data.targetUsername, data.difficulty, data.betAmount);
  }

  @SubscribeMessage('accept_invite')
  async handleAcceptInvite(
    @MessageBody() data: { inviteId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) return;
    
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return;
    
    this.duelService.acceptInvite(client, userId, profile.username, data.inviteId);
  }

  @SubscribeMessage('leave_queue')
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    const userId = client.data?.user?.id;
    if (userId) this.duelService.leaveQueue(userId);
  }

  @SubscribeMessage('join_table')
  async handleJoinTable(
    @MessageBody()
    data: { targetUserId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) return;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return;

    await this.duelService.joinTable(
      client,
      userId,
      profile.username,
      data.targetUserId,
    );
  }

  @SubscribeMessage('accept_bot')
  handleAcceptBot(@ConnectedSocket() client: Socket) {
    const userId = client.data?.user?.id;
    if (userId) this.duelService.acceptBot(userId);
  }

  // --- LOBBY SYSTEM ---

  @SubscribeMessage('create_lobby')
  async handleCreateLobby(
    @MessageBody()
    data: {
      difficulty: Difficulty;
      betAmount: number;
      hasTimer: boolean;
      timeLimitSec: number | null;
      allowSpectators: boolean;
      allowSpectatorChat: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) return;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return;

    await this.duelService.createLobby(
      client,
      userId,
      profile.username,
      data,
      profile.rating,
    );
  }

  @SubscribeMessage('join_lobby')
  async handleJoinLobby(
    @MessageBody()
    data: { lobbyId: string; asSpectator: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) return;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return;

    await this.duelService.joinLobby(
      client,
      userId,
      profile.username,
      data.lobbyId,
      data.asSpectator,
    );
  }

  @SubscribeMessage('start_lobby_match')
  async handleStartLobbyMatch(
    @MessageBody() data: { lobbyId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) return;

    await this.duelService.startLobbyMatch(client, userId, data.lobbyId);
  }

  @SubscribeMessage('spectate_match')
  handleSpectateMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (userId) this.duelService.spectateMatch(client, data.matchId, userId);
  }

  @SubscribeMessage('make_move')
  handleMakeMove(
    @MessageBody()
    data: {
      matchId: string;
      row: number;
      col: number;
      value: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) return;

    // Rate limiting: max 1 move per 100ms
    const now = Date.now();
    const lastMove = this.lastMoveTimes.get(client.id) || 0;
    if (now - lastMove < 100) {
      return; // Block rapid-fire spam
    }
    this.lastMoveTimes.set(client.id, now);

    this.duelService.handleMove(
      data.matchId,
      userId,
      data.row,
      data.col,
      data.value,
    );
  }

  @SubscribeMessage('send_chat')
  handleChat(
    @MessageBody() data: { matchId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (userId) this.duelService.handleChat(data.matchId, userId, data.message);
  }

  @SubscribeMessage('moderate_spectator')
  handleModerateSpectator(
    @MessageBody()
    data: {
      matchId: string;
      targetId: string;
      action: 'mute' | 'disable_all_chat';
    },
    @ConnectedSocket() client: Socket,
  ) {
    const authorId = client.data?.user?.id;
    if (authorId) {
      this.duelService.moderateSpectator(
        data.matchId,
        authorId,
        data.targetId,
        data.action,
      );
    }
  }
}
