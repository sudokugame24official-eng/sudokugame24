import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('messages/:userId')
  async getMessages(@Request() req, @Param('userId') otherUserId: string) {
    return this.chatService.getMessagesBetween(req.user.id, otherUserId);
  }

  @Post('block/:userId')
  async blockUser(@Request() req, @Param('userId') blockedId: string) {
    return this.chatService.blockUser(req.user.id, blockedId);
  }
}
