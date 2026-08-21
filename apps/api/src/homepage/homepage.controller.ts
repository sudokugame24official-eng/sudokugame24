import { Controller, Get, Put, Post, Body, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { HomepageService } from './homepage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { AuditAction } from '../auth/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../auth/interceptors/audit-log.interceptor';

@Controller('config/homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  /** Public: enabled sections in order (the homepage renders these). */
  @Get()
  async published() {
    const sections = await this.homepageService.getPublished();
    return sections.filter((s) => s.enabled);
  }

  @Get('draft')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.view')
  async draft() {
    return this.homepageService.getDraft();
  }

  @Get('defaults')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.view')
  async defaults() {
    return this.homepageService.getDefaults();
  }

  @Put('draft')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.edit')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('homepage.save_draft')
  async saveDraft(@Body() body: { sections?: unknown }) {
    try {
      return await this.homepageService.saveDraft(body?.sections);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  @Post('publish')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.publish')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('homepage.publish')
  async publish() {
    return this.homepageService.publish();
  }
}
