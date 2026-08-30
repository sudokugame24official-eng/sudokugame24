import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  SendFriendRequestDto,
  RespondFriendRequestDto,
  BlockByUsernameDto,
} from './dto/friends.dto';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Get('pending')
  async getPendingRequests(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.id);
  }

  @Post('request')
  async sendRequest(@Request() req, @Body() dto: SendFriendRequestDto) {
    return this.friendsService.sendRequest(req.user.id, dto.username);
  }

  @Post('respond')
  async respondToRequest(@Request() req, @Body() dto: RespondFriendRequestDto) {
    return this.friendsService.respondToRequest(
      req.user.id,
      dto.friendId,
      dto.accept,
    );
  }

  @Delete(':friendId')
  async removeFriend(@Request() req, @Param('friendId') friendId: string) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }

  @Post('block')
  async blockUser(@Request() req, @Body() dto: BlockByUsernameDto) {
    return this.friendsService.blockUser(req.user.id, dto.username);
  }
}
