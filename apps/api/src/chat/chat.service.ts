import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class ChatService {
  async getConversations(userId: string) {
    // A simplified query to get users with whom we have exchanged messages
    const messages = await prisma.privateMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { include: { profile: true, perks: true } },
        receiver: { include: { profile: true, perks: true } },
      },
    });

    // Extract unique conversants and their latest message
    const conversationsMap = new Map<string, any>();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: {
            id: otherUser.id,
            name: otherUser.profile?.username || 'Inconnu',
            avatar: otherUser.profile?.avatarUrl,
            level: otherUser.profile?.level || 1,
            isOnline: false, // We will handle real-time online status via Gateway later
            perks: otherUser.perks || [],
          },
          lastMessage: msg.content,
          time: msg.createdAt,
          unread: msg.receiverId === userId && !msg.read,
        });
      }
    }

    return Array.from(conversationsMap.values());
  }

  async getMessagesBetween(userId: string, otherUserId: string) {
    // Check if they are friends
    const isFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: otherUserId },
          { userId: otherUserId, friendId: userId },
        ],
        status: 'ACCEPTED',
      },
    });

    if (!isFriend) {
      throw new ForbiddenException('You can only message friends.');
    }

    const messages = await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 50, // limit to last 50 for MVP
    });

    // Mark as read
    await prisma.privateMessage.updateMany({
      where: { senderId: otherUserId, receiverId: userId, read: false },
      data: { read: true },
    });

    return messages;
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    if (content.length > 2000) {
      throw new BadRequestException(
        'Message is too long (max 2000 characters).',
      );
    }

    // Basic XSS sanitization
    const sanitizedContent = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Check if they are friends
    const isFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
        status: 'ACCEPTED',
      },
    });

    if (!isFriend) {
      throw new ForbiddenException('You can only message friends.');
    }

    // Check if blocked
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: receiverId, blockedId: senderId },
          { blockerId: senderId, blockedId: receiverId },
        ],
      },
    });

    if (block) {
      if (block.blockerId === receiverId) {
        throw new BadRequestException('Cet utilisateur vous a bloqué.');
      } else {
        throw new BadRequestException('Vous avez bloqué cet utilisateur.');
      }
    }

    const message = await prisma.privateMessage.create({
      data: {
        senderId,
        receiverId,
        content: sanitizedContent,
      },
      include: {
        sender: {
          select: { id: true, profile: { select: { username: true } } },
        },
      },
    });

    return message;
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException(
        'Vous ne pouvez pas vous bloquer vous-même.',
      );
    }

    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (existing) {
      // Unblock
      await prisma.block.delete({
        where: { id: existing.id },
      });
      return { status: 'unblocked' };
    } else {
      // Block
      await prisma.block.create({
        data: { blockerId, blockedId },
      });
      return { status: 'blocked' };
    }
  }
}
