import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  prisma,
  Role,
  TicketStatus,
  CoinTransactionType,
} from '@repo/database';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly coinLedger: CoinLedgerService,
    private readonly emailService: EmailService,
  ) {}

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
  /**
   * Search + filter + paginate users (P1-D). Replaces the unbounded take:100.
   */
  async getUsers(params: {
    search?: string;
    role?: string;
    banned?: boolean;
    isBot?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 20));

    const where: any = {};
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (params.role) where.role = params.role;
    if (params.banned !== undefined) where.isBanned = params.banned;
    if (params.isBot !== undefined) where.isBot = params.isBot;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          isBanned: true,
          banReason: true,
          isBot: true,
          createdAt: true,
          profile: {
            select: {
              username: true,
              level: true,
              xp: true,
              coins: true,
              rating: true,
              currentStreak: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  /**
   * Full owner-facing user detail (P1-D): profile, aggregates, purchases,
   * recent activity. Read-only; every mutation goes through audited endpoints.
   */
  async getUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        _count: {
          select: {
            gameSessions: true,
            forumPosts: true,
            forumComments: true,
            sentMessages: true,
            purchases: true,
            reportsMade: true,
            coinTransactions: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [purchases, recentTransactions, recentReports, auditTrail] =
      await Promise.all([
        prisma.purchase.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            currency: true,
            coinsGranted: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.coinTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            amount: true,
            balanceAfter: true,
            createdAt: true,
          },
        }),
        prisma.report.findMany({
          where: { reporter: { id: userId } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.auditLog.findMany({
          where: { OR: [{ actorId: userId }, { target: userId }] },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    const { passwordHash, ...safeUser } = user as any;
    return {
      user: safeUser,
      purchases,
      recentTransactions,
      recentReports,
      auditTrail,
      aggregates: user._count,
    };
  }

  async updateUserRole(
    admin: { id: string; role: Role },
    targetUserId: string,
    newRole: Role,
  ) {
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

  async banUser(
    admin: { id: string; role: Role },
    targetUserId: string,
    reason: string,
  ) {
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, email: true, profile: { select: { username: true } } } },
      },
    });

    await prisma.supportTicket.updateMany({
      where: { id: ticketId, status: TicketStatus.OPEN },
      data: { status: TicketStatus.IN_PROGRESS },
    });

    // 1. If Registered User -> Send In-App Notification / Message
    if (ticket?.userId) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: 'SYSTEM',
          title: `Réponse du Support : ${ticket.title}`,
          content: `L'équipe de support a répondu à votre ticket : "${content.slice(0, 100)}..."`,
          link: '/contact',
        },
      });
      this.logger.log(`In-app notification created for user ${ticket.userId} for ticket ${ticketId}`);
    }

    // 2. If Guest (or registered email delivery) -> Send direct Email
    const targetEmail = ticket?.user?.email || ticket?.guestEmail;
    const targetName = ticket?.user?.profile?.username || ticket?.guestName || 'Joueur';

    if (targetEmail) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #020F24; color: #ffffff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #FFCC00; margin-top: 0;">Réponse de l'Équipe Support Sudoku</h2>
          <p>Bonjour <strong>${targetName}</strong>,</p>
          <p>Notre équipe d'assistance a répondu à votre demande :</p>
          <blockquote style="background: rgba(255,255,255,0.05); border-left: 4px solid #FF4500; padding: 12px; margin: 16px 0; color: #f0f0f0;">
            ${content}
          </blockquote>
          <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">
            Ticket #${ticketId.slice(-6).toUpperCase()} — ${ticket?.title}
          </p>
        </div>
      `;

      await this.emailService.sendRawEmail(
        targetEmail,
        `[Support Sudoku] Réponse à votre ticket : ${ticket?.title}`,
        emailHtml,
      );
      this.logger.log(`Support response email dispatched to ${targetEmail}`);
    }

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
        reporter: {
          select: { email: true, profile: { select: { username: true } } },
        },
        reported: {
          select: { email: true, profile: { select: { username: true } } },
        },
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
        profile: { lastPlayedDate: { gte: recentActivityLimit } },
      },
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
  async grantCoins(
    adminId: string,
    userId: string,
    amount: number,
    reason: string,
  ) {
    // We assume the caller already checked permissions (economy.adjust)
    try {
      await this.coinLedger.credit(
        userId,
        amount,
        CoinTransactionType.ADMIN_GRANT,
        'Admin',
        adminId,
        `admin_grant_${adminId}_${userId}_${Date.now()}`,
      );

      // We don't need to manually create an audit log here if the controller uses @AuditAction,
      // but creating a secondary audit log inside the service is safer for financial transactions.
      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'GRANT_COINS',
          target: userId,
          newValue: JSON.stringify({ amount, reason }),
        },
      });

      return {
        success: true,
        message: `Successfully granted ${amount} coins to ${userId}`,
      };
    } catch (e) {
      this.logger.error(`Failed to grant coins to ${userId}`, e);
      throw new ForbiddenException('Failed to grant coins.');
    }
  }

  async verifyFinancialIntegrity() {
    const users = await prisma.user.findMany({ select: { id: true } });
    let totalMismatches = 0;

    for (const user of users) {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });
      const transactions = await prisma.coinTransaction.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
      });

      const calculatedBalance = transactions._sum.amount || 0;
      if (profile && profile.coins !== calculatedBalance) {
        totalMismatches++;
        this.logger.warn(
          `User ${user.id} balance mismatch: Ledger=${calculatedBalance}, Profile=${profile.coins}`,
        );
      }
    }

    if (totalMismatches > 0) {
      return {
        success: false,
        message: `Reconciliation failed: ${totalMismatches} mismatches found.`,
      };
    }
    return {
      success: true,
      message: 'Reconciliation passed. All ledgers match profile balances.',
    };
  }

  // --- AD MANAGEMENT ---
  // Forbidden placements list to enforce Google AdSense policies & prevent gameplay disruption
  private static readonly FORBIDDEN_PLACEMENTS = [
    'grid',
    'sudoku_grid',
    'numpad',
    'keypad',
    'timer',
    'pause_button',
    'mistake_counter',
    'hint_button',
    'duel_battle_bar',
    'duel_controls',
    'countdown',
    'auth_form',
    'checkout',
    'payment_confirmation',
    'chat_input',
    'primary_navigation',
    'language_selector',
  ];

  async getAdSlots() {
    return prisma.adSlotConfig.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  async updateAdSlot(slotName: string, data: any, adminId?: string) {
    // 1. Safety Check: Verify placement is not forbidden
    if (data.placement) {
      const normalizedPlacement = data.placement.toLowerCase().trim();
      if (AdminService.FORBIDDEN_PLACEMENTS.includes(normalizedPlacement)) {
        throw new BadRequestException(
          `Forbidden ad placement: '${data.placement}'. Ads cannot be placed over game controls, timer, numpad, grid, or critical actions.`,
        );
      }
    }

    const previous = await prisma.adSlotConfig.findUnique({
      where: { slotName },
    });

    const updated = await prisma.adSlotConfig.upsert({
      where: { slotName },
      update: {
        ...data,
      },
      create: {
        slotName,
        provider: data.provider || 'GoogleAdSense',
        enabled: data.enabled || false,
        ...data,
      },
    });

    // Record audit log for rollback support
    if (adminId) {
      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ads.update_slot',
          target: slotName,
          oldValue: previous ? (previous as any) : null,
          newValue: updated as any,
        },
      });
    }

    return updated;
  }

  async disableAllAds(adminId: string) {
    // Turn off all ad feature flags while preserving slot configs
    await Promise.all([
      prisma.featureFlag.upsert({
        where: { key: 'ENABLE_ADS' },
        update: { enabled: false },
        create: { key: 'ENABLE_ADS', enabled: false },
      }),
      prisma.featureFlag.upsert({
        where: { key: 'ADS_ENABLED' },
        update: { enabled: false },
        create: { key: 'ADS_ENABLED', enabled: false },
      }),
      prisma.featureFlag.upsert({
        where: { key: 'ENABLE_REWARDED_ADS' },
        update: { enabled: false },
        create: { key: 'ENABLE_REWARDED_ADS', enabled: false },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ads.disable_all',
        target: 'GLOBAL_ADS',
        newValue: { enabled: false, timestamp: new Date().toISOString() },
      },
    });

    this.logger.warn(`All advertisements disabled globally by admin ${adminId}`);
    return {
      success: true,
      message: 'Toutes les publicités ont été désactivées avec succès.',
    };
  }

  async getAdAuditHistory(limit = 50) {
    return prisma.auditLog.findMany({
      where: {
        action: {
          in: ['ads.update_slot', 'ads.disable_all', 'ads.rollback', 'settings.update'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async rollbackAdConfig(adminId: string, auditLogId: string) {
    const log = await prisma.auditLog.findUnique({
      where: { id: auditLogId },
    });

    if (!log || !log.oldValue) {
      throw new NotFoundException('Audit log entry not found or contains no previous state.');
    }

    const previousState = log.oldValue as any;

    if (log.action === 'ads.update_slot' && log.target) {
      await prisma.adSlotConfig.update({
        where: { slotName: log.target },
        data: previousState,
      });

      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ads.rollback',
          target: log.target,
          newValue: previousState,
          referenceId: auditLogId,
        },
      });

      return {
        success: true,
        message: `Emplacement ${log.target} restauré à son état précédent.`,
        restoredConfig: previousState,
      };
    }

    throw new BadRequestException('Unsupported rollback action');
  }

  // --- EMAIL TEMPLATES ---
  async getEmailTemplates() {
    let templates = await prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    if (templates.length === 0) {
      await prisma.emailTemplate.createMany({
        data: [
          {
            name: 'WELCOME_EMAIL',
            subject: 'Welcome to {{siteName}}, {{username}}!',
            htmlContent: `<h2>Welcome to {{siteName}}!</h2><p>Hello <strong>{{username}}</strong>,</p><p>Your account has been successfully created. Join thousands of players online to solve daily challenges, learn new solving techniques, and participate in competitive duels.</p><p><a href="http://localhost:3000" style="background-color:#FF4500;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Play Sudoku Now</a></p><p>See you soon on {{siteName}}!</p><p>Need help? Contact us at {{supportEmail}}.</p>`,
          },
          {
            name: 'EMAIL_VERIFICATION',
            subject: 'Verify your email address - {{siteName}}',
            htmlContent: `<h2>Verify your email address</h2><p>Hello <strong>{{username}}</strong>,</p><p>Thank you for registering on {{siteName}}. Please verify your email address to unlock full member features and save your global ranking:</p><p><a href="{{verificationLink}}" style="background-color:#FF4500;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Verify My Account</a></p><p>If the button above does not work, copy and paste this link into your browser:<br>{{verificationLink}}</p><p>This verification link will expire in 24 hours.</p><p>Best regards,<br>The {{siteName}} Team</p>`,
          },
          {
            name: 'PASSWORD_RESET',
            subject: 'Reset your password - {{siteName}}',
            htmlContent: `<h2>Password Reset Request</h2><p>Hello <strong>{{username}}</strong>,</p><p>We received a request to reset your password on {{siteName}}.</p><p><a href="{{resetLink}}" style="background-color:#FF4500;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Reset Password</a></p><p>If you did not request this password reset, please ignore this email or contact {{supportEmail}} immediately.</p><p>This link expires in 1 hour.</p><p>The {{siteName}} Team</p>`,
          },
          {
            name: 'DUEL_INVITATION',
            subject: 'Sudoku 1v1 Duel Challenge from {{username}}',
            htmlContent: `<h2>You have been challenged to a duel!</h2><p><strong>{{username}}</strong> (Elo: {{elo}}) invites you to a live Sudoku duel match.</p><p><a href="http://localhost:3000/duel" style="background-color:#FFCC00;color:#020F24;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Join the Duel</a></p><p>See you on the leaderboard!</p>`,
          },
        ],
      });
      templates = await prisma.emailTemplate.findMany({
        orderBy: { name: 'asc' },
      });
    }
    return templates;
  }

  async updateEmailTemplate(
    id: string,
    data: { subject: string; htmlContent: string },
  ) {
    return prisma.emailTemplate.update({
      where: { id },
      data: {
        subject: data.subject,
        htmlContent: data.htmlContent,
      },
    });
  }

  async testEmailTemplate(id: string, adminId: string) {
    const template = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    this.logger.log(
      `Test email triggered for template ${template.name} by admin ${adminId}`,
    );
    return {
      success: true,
      message: `Email de test simulé pour ${template.name}`,
    };
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
