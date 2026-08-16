import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { prisma, Role, TicketStatus, CoinTransactionType } from '@repo/database';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly coinLedger: CoinLedgerService) {}

  // --- AUDIT LOGS ---
  /**
   * Real audit trail: merges AdminActionLog (interceptor) and AuditLog
   * (explicit writes), newest first. Replaces the fake data previously
   * hardcoded in the frontend audit page.
   */
  async getAuditLogs(limit = 200) {
    const [actionLogs, auditLogs] = await Promise.all([
      prisma.adminActionLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 500),
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 500),
      }),
    ]);

    const merged = [
      ...actionLogs.map((l) => ({
        id: l.id,
        source: 'action' as const,
        actorId: l.adminId,
        action: l.action,
        target: null,
        details: l.details,
        createdAt: l.createdAt,
      })),
      ...auditLogs.map((l) => ({
        id: l.id,
        source: 'audit' as const,
        actorId: l.actorId,
        action: l.action,
        target: l.target,
        details: { oldValue: l.oldValue, newValue: l.newValue },
        createdAt: l.createdAt,
      })),
    ];
    merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return merged.slice(0, Math.min(limit, 500));
  }

  // --- USERS MANAGEMENT ---
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
        profile: {
          select: {
            username: true,
            level: true,
            xp: true,
            coins: true,
            currentStreak: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // MVP limit
    });
  }

  async updateUserRole(admin: { id: string; role: Role }, targetUserId: string, newRole: Role) {
    const adminRole = admin.role;
    if (adminRole !== Role.SUPER_ADMIN && adminRole !== Role.ADMIN) {
      throw new ForbiddenException();
    }
    // Only SUPER_ADMIN can make someone OWNER/ADMIN
    if (newRole === Role.SUPER_ADMIN || newRole === Role.ADMIN) {
      if (adminRole !== Role.SUPER_ADMIN)
        throw new ForbiddenException(
          'Only SUPER_ADMIN can assign ADMIN roles.',
        );
    }

    // Protect SUPER_ADMIN from being downgraded
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (target?.role === Role.SUPER_ADMIN && adminRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot modify SUPER_ADMIN.');
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });
    return prisma.auditLog.create({
      data: {
        actorId: admin.id, // the acting admin's user id, not their role string
        action: 'UPDATE_ROLE',
        target: targetUserId,
        newValue: newRole,
      },
    });
  }

  async banUser(admin: { id: string; role: Role }, targetUserId: string, reason: string) {
    const adminRole = admin.role;
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('User not found');

    if (
      adminRole === Role.MODERATOR &&
      (target.role === Role.ADMIN || target.role === Role.SUPER_ADMIN)
    ) {
      throw new ForbiddenException('Moderators cannot ban Admins.');
    }
    if (target.role === Role.SUPER_ADMIN)
      throw new ForbiddenException('Cannot ban SUPER_ADMIN');

    await prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: true, banReason: reason },
    });
    return prisma.auditLog.create({
      data: {
        actorId: admin.id, // the acting admin's user id, not their role string
        action: 'BAN_USER',
        target: targetUserId,
        newValue: reason,
      },
    });
  }

  async unbanUser(admin: { id: string; role: Role }, targetUserId: string) {
    const result = await prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: false, banReason: null },
    });
    // P0-F: unban actions must be traceable too (was not audited at all).
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'UNBAN_USER',
        target: targetUserId,
        newValue: 'unbanned',
      },
    });
    return result;
  }

  async deleteUser(adminRole: Role, targetUserId: string) {
    if (adminRole !== Role.SUPER_ADMIN)
      throw new ForbiddenException('Only SUPER_ADMIN can delete accounts.');
    return prisma.user.delete({ where: { id: targetUserId } });
  }

  // --- TICKETS ---
  async getTickets() {
    return prisma.supportTicket.findMany({
      include: {
        user: {
          select: { email: true, profile: { select: { username: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicketDetails(ticketId: string) {
    return prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { email: true } },
        messages: {
          include: {
            author: {
              select: { role: true, profile: { select: { username: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async replyToTicket(adminId: string, ticketId: string, content: string) {
    const message = await prisma.ticketMessage.create({
      data: { content, ticketId, authorId: adminId },
    });
    await prisma.supportTicket.updateMany({
      where: { id: ticketId, status: TicketStatus.OPEN },
      data: { status: TicketStatus.IN_PROGRESS },
    });
    return message;
  }

  async closeTicket(ticketId: string) {
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.CLOSED },
    });
  }

  // --- FORUM & REPORTS MODERATION ---
  async deleteForumPost(adminRole: Role, postId: string) {
    return prisma.forumPost.delete({ where: { id: postId } });
  }

  async getReports() {
    return prisma.report.findMany({
      include: {
        reporter: { select: { email: true, profile: { select: { username: true } } } },
        reported: { select: { email: true, profile: { select: { username: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- CMS ---
  async getArticles() {
    return prisma.contentArticle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createArticle(adminId: string, data: any) {
    return prisma.contentArticle.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        category: data.category,
        authorId: adminId,
        status: data.status || 'DRAFT',
      },
    });
  }

  // --- ANALYTICS ---
  async getAnalyticsOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeGames = await prisma.gameSession.count({
      where: { status: 'IN_PROGRESS' },
    });
    const activeDuels = await prisma.duelMatch.count({
      where: { status: 'IN_PROGRESS' },
    });

    // Real online user count based on active sessions
    const recentActivityLimit = new Date(Date.now() - 15 * 60 * 1000); // 15 mins active
    const onlineUsers = await prisma.user.count({
      where: {
        profile: { lastPlayedDate: { gte: recentActivityLimit } }
      }
    });
    
    // We can't perfectly track forum viewers without Redis, so we estimate based on recent forum posts/activity, 
    // but to avoid mocks we just return a 0 if we don't have accurate tracking.
    const usersInForum = 0;

    const [newUsers, activeSessions, revenue, totalUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.gameSession.count({ where: { startTime: { gte: today } } }),
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: today }, status: 'COMPLETED' },
      }),
      prisma.user.count(),
    ]);

    return {
      onlineUsers,
      activeGames,
      activeDuels,
      usersInForum,
      newUsersToday: newUsers,
      totalUsers,
      activeSessionsToday: activeSessions,
      revenueToday: revenue._sum.amount || 0,
    };
  }

  async getAnalyticsChart(period: string) {
    const data: Array<{
      date: string;
      users: number;
      revenue: number;
      games: number;
    }> = [];
    let days = 7;
    if (period === '30d') days = 30;
    else if (period === '1y') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fast generation for chart structure
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      data.push({ date: ds, users: 0, revenue: 0, games: 0 });
    }

    const [usersData, gamesData] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.gameSession.findMany({
        where: { startTime: { gte: startDate } },
        select: { startTime: true },
      }),
    ]);

    usersData.forEach((u) => {
      const ds = u.createdAt.toISOString().split('T')[0];
      const point = data.find((p) => p.date === ds);
      if (point) point.users++;
    });

    gamesData.forEach((g) => {
      const ds = g.startTime.toISOString().split('T')[0];
      const point = data.find((p) => p.date === ds);
      if (point) point.games++;
    });

    return data;
  }

  // --- SETTINGS & MARKETING ---
  async getMarketingSettings() {
    const settings = await prisma.siteSettings.findMany();
    const result: Record<string, any> = {};
    settings.forEach((s) => {
      try {
        result[s.key] = JSON.parse(s.value as string);
      } catch {
        result[s.key] = s.value;
      }
    });
    return result;
  }

  async updateMarketingSettings(data: any) {
    for (const key of Object.keys(data)) {
      const value = JSON.stringify(data[key]);
      await prisma.siteSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return { success: true };
  }

  // --- FEATURE FLAGS ---
  async getFeatureFlags() {
    return prisma.featureFlag.findMany();
  }

  async updateFeatureFlag(
    admin: { id: string; role: Role },
    key: string,
    enabled: boolean,
    description?: string,
  ) {
    if (admin.role !== Role.SUPER_ADMIN && admin.role !== Role.ADMIN)
      throw new ForbiddenException();
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: {
        enabled,
        ...(description !== undefined ? { description } : {}),
      },
      create: {
        key,
        enabled,
        description,
        percentage: 100,
        targetRoles: [],
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: admin.id, // the acting admin's user id, not their role string
        action: 'UPDATE_FEATURE_FLAG',
        target: key,
        newValue: String(enabled),
      },
    });
    return flag;
  }

  // --- FINANCIAL RECONCILIATION & MANAGEMENT ---
  async grantCoins(adminId: string, userId: string, amount: number, reason: string) {
    // We assume the caller already checked permissions (economy.adjust)
    try {
      await this.coinLedger.credit(
        userId,
        amount,
        CoinTransactionType.ADMIN_GRANT,
        'Admin',
        adminId,
        `admin_grant_${adminId}_${userId}_${Date.now()}`
      );
      
      // We don't need to manually create an audit log here if the controller uses @AuditAction,
      // but creating a secondary audit log inside the service is safer for financial transactions.
      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'GRANT_COINS',
          target: userId,
          newValue: JSON.stringify({ amount, reason })
        }
      });
      
      return { success: true, message: `Successfully granted ${amount} coins to ${userId}` };
    } catch (e) {
      this.logger.error(`Failed to grant coins to ${userId}`, e);
      throw new ForbiddenException('Failed to grant coins.');
    }
  }

  async verifyFinancialIntegrity() {
    const users = await prisma.user.findMany({ select: { id: true } });
    let totalMismatches = 0;
    
    for (const user of users) {
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
      const transactions = await prisma.coinTransaction.aggregate({
        where: { userId: user.id },
        _sum: { amount: true }
      });
      
      const calculatedBalance = transactions._sum.amount || 0;
      if (profile && profile.coins !== calculatedBalance) {
        totalMismatches++;
        this.logger.warn(`User ${user.id} balance mismatch: Ledger=${calculatedBalance}, Profile=${profile.coins}`);
      }
    }

    if (totalMismatches > 0) {
      return { success: false, message: `Reconciliation failed: ${totalMismatches} mismatches found.` };
    }
    return { success: true, message: 'Reconciliation passed. All ledgers match profile balances.' };
  }

  // --- AD MANAGEMENT ---
  async getAdSlots() {
    return prisma.adSlotConfig.findMany();
  }

  async updateAdSlot(slotName: string, data: any) {
    return prisma.adSlotConfig.upsert({
      where: { slotName },
      update: {
        provider: data.provider,
        enabled: data.enabled,
        publisherId: data.publisherId,
        adSlotId: data.adSlotId,
        deviceTarget: data.deviceTarget,
        pageTarget: data.pageTarget,
      },
      create: {
        slotName,
        provider: data.provider || 'GoogleAdSense',
        enabled: data.enabled || false,
        publisherId: data.publisherId,
        adSlotId: data.adSlotId,
        deviceTarget: data.deviceTarget || 'ALL',
        pageTarget: data.pageTarget,
      },
    });
  }

  // --- SYSTEM HEALTH ---
  async getSystemHealth() {
    // Basic node.js metrics
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    return {
      status: 'UP',
      uptime,
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
      },
      activeUsers: await prisma.user.count(),
      activeDuels: 0, // Temporary until Redis is injected
    };
  }
}
