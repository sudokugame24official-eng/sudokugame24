import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/database';
import { FeatureFlagService } from '../config/feature-flag.service';

@Injectable()
export class FriendsService {
  constructor(private featureFlags: FeatureFlagService) {}

  private checkEnabled() {
    if (!this.featureFlags.isFeatureEnabled('FRIENDS_ENABLED')) {
      throw new ForbiddenException('Friends feature is currently disabled.');
    }
  }

  async sendRequest(userId: string, targetUsername: string) {
    this.checkEnabled();

    if (!targetUsername || typeof targetUsername !== 'string') {
      throw new BadRequestException('Username is required');
    }

    const targetUser = await prisma.profile.findUnique({
      where: { username: targetUsername },
      include: { user: true },
    });

    if (!targetUser) throw new NotFoundException('User not found');
    if (targetUser.userId === userId)
      throw new BadRequestException('Cannot add yourself');

    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUser.userId },
          { blockerId: targetUser.userId, blockedId: userId },
        ],
      },
    });

    if (block)
      throw new ForbiddenException('Cannot send friend request to this user');

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: targetUser.userId },
          { userId: targetUser.userId, friendId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED')
        throw new BadRequestException('Already friends');
      throw new BadRequestException('Friend request already pending');
    }

    // Rate limiting / Spam prevention
    const pendingCount = await prisma.friendship.count({
      where: { userId: userId, status: 'PENDING' },
    });

    if (pendingCount >= 50) {
      throw new BadRequestException(
        'Too many pending requests. Please cancel some before sending more.',
      );
    }

    return prisma.friendship.create({
      data: {
        userId,
        friendId: targetUser.userId,
        status: 'PENDING',
      },
    });
  }

  async respondToRequest(userId: string, friendId: string, accept: boolean) {
    this.checkEnabled();

    const request = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId: friendId, // they sent it
          friendId: userId, // we receive it
        },
      },
    });

    if (!request || request.status !== 'PENDING') {
      throw new NotFoundException('Pending request not found');
    }

    if (accept) {
      return prisma.friendship.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' },
      });
    } else {
      return prisma.friendship.delete({
        where: { id: request.id },
      });
    }
  }

  async removeFriend(userId: string, friendId: string) {
    this.checkEnabled();
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId },
        ],
        status: 'ACCEPTED',
      },
    });

    if (!existing) throw new NotFoundException('Friendship not found');

    return prisma.friendship.delete({
      where: { id: existing.id },
    });
  }

  async getFriends(userId: string) {
    this.checkEnabled();
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: userId }, { friendId: userId }],
        status: 'ACCEPTED',
      },
      include: {
        user: { include: { profile: true } },
        friend: { include: { profile: true } },
      },
    });

    return friendships.map((f) => {
      const isInitiator = f.userId === userId;
      const friendData = isInitiator ? f.friend : f.user;
      return {
        id: friendData.id,
        username: friendData.profile?.username,
        avatarUrl: friendData.profile?.avatarUrl,
        level: friendData.profile?.level,
        rating: friendData.profile?.rating,
      };
    });
  }

  async getPendingRequests(userId: string) {
    this.checkEnabled();
    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING',
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    return requests.map((r) => ({
      id: r.user.id,
      username: r.user.profile?.username,
      avatarUrl: r.user.profile?.avatarUrl,
    }));
  }

  async blockUser(userId: string, targetUsername: string) {
    const targetUser = await prisma.profile.findUnique({
      where: { username: targetUsername },
    });
    if (!targetUser) throw new NotFoundException('User not found');
    if (targetUser.userId === userId)
      throw new BadRequestException('Cannot block yourself');

    // Remove any friendship
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: userId, friendId: targetUser.userId },
          { userId: targetUser.userId, friendId: userId },
        ],
      },
    });

    return prisma.block.create({
      data: {
        blockerId: userId,
        blockedId: targetUser.userId,
      },
    });
  }
}
