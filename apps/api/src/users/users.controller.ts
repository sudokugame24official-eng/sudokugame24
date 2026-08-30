import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { prisma } from '@repo/database';
import { AddFriendByIdDto } from '../friends/dto/friends.dto';
import * as bcrypt from 'bcryptjs';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('friends')
  async getFriends(@Req() req: any) {
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
  async addFriend(@Req() req: any, @Body() body: AddFriendByIdDto) {
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

  @Post('stats/:userId')
  async getUserStatsPost(@Param('userId') userId: string) {
    return this.getUserStats(userId);
  }

  @Post('profile')
  async updateProfileLegacy(
    @Req() req: any,
    @Body() body: { username?: string; avatarUrl?: string },
  ) {
    return this.updateProfile(req, body);
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

  @Get('profile/me')
  async getMyProfile(@Req() req: any) {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { email: true, role: true } } },
    });
    return profile;
  }

  @Post('profile/update')
  async updateProfile(
    @Req() req: any,
    @Body()
    body: {
      username?: string;
      avatarUrl?: string;
      bio?: string;
      country?: string;
      age?: number | string;
      height?: number | string;
      weight?: number | string;
    },
  ) {
    const dataToUpdate: any = {};

    if (body.username && typeof body.username === 'string') {
      const cleanUsername = body.username.trim();
      if (cleanUsername.length < 3 || cleanUsername.length > 25) {
        throw new BadRequestException(
          'Le pseudo doit contenir entre 3 et 25 caractères.',
        );
      }

      // Check if username is already taken by someone else
      const existing = await prisma.profile.findUnique({
        where: { username: cleanUsername },
      });
      if (existing && existing.userId !== req.user.id) {
        throw new BadRequestException('Ce pseudo est déjà utilisé.');
      }
      dataToUpdate.username = cleanUsername;
    }

    if (body.avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : null;
    }

    if (body.bio !== undefined) {
      dataToUpdate.bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 500) : null;
    }

    if (body.country !== undefined) {
      dataToUpdate.country = typeof body.country === 'string' ? body.country.trim().slice(0, 50) : null;
    }

    if (body.age !== undefined && body.age !== null && body.age !== '') {
      const ageNum = parseInt(String(body.age), 10);
      if (!isNaN(ageNum) && ageNum >= 5 && ageNum <= 120) {
        dataToUpdate.age = ageNum;
      }
    } else if (body.age === null || body.age === '') {
      dataToUpdate.age = null;
    }

    if (body.height !== undefined && body.height !== null && body.height !== '') {
      const heightNum = parseFloat(String(body.height));
      if (!isNaN(heightNum) && heightNum >= 50 && heightNum <= 260) {
        dataToUpdate.height = heightNum;
      }
    } else if (body.height === null || body.height === '') {
      dataToUpdate.height = null;
    }

    if (body.weight !== undefined && body.weight !== null && body.weight !== '') {
      const weightNum = parseFloat(String(body.weight));
      if (!isNaN(weightNum) && weightNum >= 20 && weightNum <= 300) {
        dataToUpdate.weight = weightNum;
      }
    } else if (body.weight === null || body.weight === '') {
      dataToUpdate.weight = null;
    }

    const updated = await prisma.profile.update({
      where: { userId: req.user.id },
      data: dataToUpdate,
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    return updated;
  }

  @Post('change-password')
  async changePassword(
    @Req() req: any,
    @Body()
    body: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
  ) {
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit comporter au moins 8 caractères.',
      );
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'La confirmation du mot de passe ne correspond pas.',
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    // If user already has a password, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestException(
          'Veuillez renseigner votre mot de passe actuel.',
        );
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException(
          'Le mot de passe actuel est incorrect.',
        );
      }
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  }
}
