import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { prisma } from '@repo/database';
import { AddFriendByIdDto } from '../friends/dto/friends.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('friends')
  async getFriends(@Req() req) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: req.user.id }, { friendId: req.user.id }],
        status: 'ACCEPTED',
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                rating: true,
                level: true,
              },
            },
          },
        },
        friend: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                rating: true,
                level: true,
              },
            },
          },
        },
      },
    });

    // Format to return just a list of friend profiles
    return friendships.map((f) =>
      f.userId === req.user.id ? f.friend : f.user,
    );
  }

  @Post('friends/request')
  async addFriend(@Req() req, @Body() body: AddFriendByIdDto) {
    // Check if already friends or requested
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: req.user.id, friendId: body.targetUserId },
          { userId: body.targetUserId, friendId: req.user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'PENDING' && existing.friendId === req.user.id) {
        // Accept the incoming request
        return prisma.friendship.update({
          where: { id: existing.id },
          data: { status: 'ACCEPTED' },
        });
      }
      return existing; // Already pending or accepted
    }

    // Create new request
    return prisma.friendship.create({
      data: {
        userId: req.user.id,
        friendId: body.targetUserId,
        status: 'PENDING',
      },
    });
  }

  @Get('stats/:userId')
  async getUserStats(@Param('userId') userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        gamesPlayed: true,
        gamesWon: true,
        rating: true,
        averageTimeSec: true,
        bestTimeSec: true,
      },
    });

    if (!profile) return null;

    return {
      ...profile,
      winRate:
        profile.gamesPlayed > 0
          ? (profile.gamesWon / profile.gamesPlayed) * 100
          : 0,
    };
  }
}
