import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { prisma } from '@repo/database';

@Controller('support')
export class SupportPublicController {
  @Post('tickets')
  async createTicket(
    @Request() req: any,
    @Body()
    body: {
      title: string;
      description: string;
      topic?: string;
      email?: string;
      name?: string;
    },
  ) {
    if (!body.title?.trim() || !body.description?.trim()) {
      throw new BadRequestException('Title and description are required.');
    }

    // Check if authenticated via cookie
    const userId = req.user?.id;
    const guestEmail = body.email?.trim();
    const guestName = body.name?.trim();

    if (!userId && !guestEmail) {
      throw new BadRequestException(
        'An email is required for non-authenticated support tickets.',
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId || null,
        guestEmail: !userId ? guestEmail : null,
        guestName: !userId ? guestName : null,
        title: body.title.trim(),
        description: body.description.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { username: true } },
          },
        },
      },
    });

    return ticket;
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  async getMyTickets(@Request() req: any) {
    return prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                role: true,
                profile: { select: { username: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
