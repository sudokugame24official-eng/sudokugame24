import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/database';
import { EmailService } from '../email/email.service';

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(private emailService: EmailService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async checkInactiveUsers() {
    this.logger.log('Running inactive users check...');

    // In a real app, you would track lastLogin in User model.
    // Here we'll just check users who haven't played a game in 7 days.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Find users whose latest game session is older than 7 days
      // (This is a simplified approach)
      const inactiveUsers = await prisma.user.findMany({
        where: {
          gameSessions: {
            none: {
              startTime: { gte: sevenDaysAgo },
            },
          },
        },
        take: 100, // Process in batches
      });

      for (const user of inactiveUsers) {
        // Send email
        await this.emailService.sendEmail(user.id, 'INACTIVITY_REMINDER');
      }
      this.logger.log(
        `Sent inactivity reminders to ${inactiveUsers.length} users.`,
      );
    } catch (e) {
      this.logger.error('Failed to run inactive users check', e);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyRanking() {
    this.logger.log('Running weekly ranking emails...');
    try {
      const topUsers = await prisma.profile.findMany({
        where: {
          user: {
            isBot: false,
            isBanned: false,
          },
        },
        orderBy: { rating: 'desc' },
        take: 100,
        include: { user: true },
      });

      for (let i = 0; i < topUsers.length; i++) {
        const profile = topUsers[i];
        await this.emailService.sendEmail(profile.userId, 'WEEKLY_RANKING', {
          rank: (i + 1).toString(),
          rating: profile.rating.toString(),
        });
      }
      this.logger.log(
        `Sent weekly ranking emails to top ${topUsers.length} users.`,
      );
    } catch (e) {
      this.logger.error('Failed to run weekly ranking', e);
    }
  }
}
