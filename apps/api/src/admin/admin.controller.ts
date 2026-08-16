import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Role } from '@repo/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { AuditAction } from '../auth/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../auth/interceptors/audit-log.interceptor';
import {
  UpdateFeatureFlagDto,
  GrantCoinsDto,
  ReplyTicketDto,
  UpdateMarketingSettingsDto,
  CreateArticleDto,
  UpdateAdSlotDto,
  BanUserDto,
  UpdateUserRoleDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- USERS ---
  @Get('users')
  @RequirePermission('users.view')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('banned') banned?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getUsers({
      search,
      role,
      banned: banned === undefined ? undefined : banned === 'true',
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  @Get('users/:id')
  @RequirePermission('users.view')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Get('audit')
  @RequirePermission('system.view')
  async getAuditLogs(@Query('limit') limit?: string) {
    const n = parseInt(limit || '200', 10);
    return this.adminService.getAuditLogs(Number.isFinite(n) ? n : 200);
  }

  @Patch('users/:id/role')
  @RequirePermission('users.manage_roles')
  @AuditAction('users.update_role')
  async updateUserRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    const admin = { id: req.user.id, role: req.user.role };
    return this.adminService.updateUserRole(admin, id, body.role as Role);
  }

  @Patch('users/:id/ban')
  @RequirePermission('users.ban')
  @AuditAction('users.ban')
  async banUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: BanUserDto,
  ) {
    const admin = { id: req.user.id, role: req.user.role };
    return this.adminService.banUser(admin, id, body.reason);
  }

  @Patch('users/:id/unban')
  @RequirePermission('users.ban')
  @AuditAction('users.unban')
  async unbanUser(@Request() req: any, @Param('id') id: string) {
    const admin = { id: req.user.id, role: req.user.role };
    return this.adminService.unbanUser(admin, id);
  }

  @Delete('users/:id')
  @RequirePermission('users.delete')
  @AuditAction('users.delete')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    const adminRole = req.user.role;
    return this.adminService.deleteUser(adminRole, id);
  }

  // --- TICKETS ---
  @Get('tickets')
  @RequirePermission('support.view')
  async getTickets() {
    return this.adminService.getTickets();
  }

  @Get('tickets/:id')
  @RequirePermission('support.view')
  async getTicketDetails(@Param('id') id: string) {
    return this.adminService.getTicketDetails(id);
  }

  @Post('tickets/:id/reply')
  @RequirePermission('support.reply')
  @AuditAction('support.reply')
  async replyToTicket(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: ReplyTicketDto,
  ) {
    const adminId = req.user.id;
    return this.adminService.replyToTicket(adminId, id, body.content);
  }

  @Patch('tickets/:id/close')
  @RequirePermission('support.manage')
  @AuditAction('support.close_ticket')
  async closeTicket(@Param('id') id: string) {
    return this.adminService.closeTicket(id);
  }

  // --- FORUM MODERATION & REPORTS ---
  @Get('reports')
  @RequirePermission('forum.moderate') // Or reports.view if exists
  async getReports() {
    return this.adminService.getReports();
  }

  @Delete('forum/posts/:id')
  @RequirePermission('forum.moderate')
  @AuditAction('forum.delete_post')
  async deletePost(@Request() req: any, @Param('id') id: string) {
    const adminRole = req.user.role;
    return this.adminService.deleteForumPost(adminRole, id);
  }

  // --- CONTENT CMS ---
  @Get('content')
  @RequirePermission('cms.view')
  async getArticles() {
    return this.adminService.getArticles();
  }

  @Post('content')
  @RequirePermission('cms.edit')
  @AuditAction('cms.create_article')
  async createArticle(@Request() req: any, @Body() data: CreateArticleDto) {
    const adminId = req.user.id;
    return this.adminService.createArticle(adminId, data as any);
  }

  // --- ANALYTICS ---
  @Get('analytics/overview')
  @RequirePermission('analytics.view')
  async getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('analytics/chart')
  @RequirePermission('analytics.view')
  async getAnalyticsChart(@Query('period') period: string) {
    return this.adminService.getAnalyticsChart(period || '7d');
  }

  // --- FEATURE FLAGS ---
  @Get('features')
  @RequirePermission('features.view')
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Patch('features/:key')
  @RequirePermission('features.manage')
  @AuditAction('features.update')
  async updateFeatureFlag(
    @Request() req: any,
    @Param('key') key: string,
    @Body() body: UpdateFeatureFlagDto,
  ) {
    const admin = { id: req.user.id, role: req.user.role };
    return this.adminService.updateFeatureFlag(
      admin,
      key,
      body.enabled,
      body.description,
    );
  }

  // --- SETTINGS, MONETIZATION, APPEARANCE ---
  @Get('marketing-settings')
  @RequirePermission('settings.view')
  async getMarketingSettings() {
    return this.adminService.getMarketingSettings();
  }

  @Put('marketing-settings')
  @RequirePermission('settings.manage')
  @AuditAction('settings.update')
  async updateMarketingSettings(@Body() data: UpdateMarketingSettingsDto) {
    return this.adminService.updateMarketingSettings(data.settings as any);
  }

  // --- ECONOMY ---
  @Post('economy/grant')
  @RequirePermission('economy.adjust')
  @AuditAction('economy.grant_coins')
  async grantCoins(
    @Request() req: any,
    @Body() body: GrantCoinsDto,
  ) {
    const adminId = req.user.id;
    return this.adminService.grantCoins(adminId, body.userId, body.amount, body.reason);
  }

  @Get('economy/reconciliation')
  @RequirePermission('economy.audit')
  async runReconciliation() {
    return this.adminService.verifyFinancialIntegrity();
  }

  // --- AD MANAGEMENT ---
  @Get('ads')
  @RequirePermission('ads.view')
  async getAdSlots() {
    return this.adminService.getAdSlots();
  }

  @Put('ads/:slotName')
  @RequirePermission('ads.manage')
  @AuditAction('ads.update_slot')
  async updateAdSlot(
    @Param('slotName') slotName: string,
    @Body() data: UpdateAdSlotDto,
  ) {
    return this.adminService.updateAdSlot(slotName, data as any);
  }

  // --- SYSTEM HEALTH ---
  @Get('system/health')
  @RequirePermission('system.view')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
