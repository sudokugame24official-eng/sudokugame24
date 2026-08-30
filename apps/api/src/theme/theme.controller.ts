import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ThemeService } from './theme.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { AuditAction } from '../auth/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../auth/interceptors/audit-log.interceptor';

export class ThemeColorsDto {
  @IsOptional() @IsString() @MaxLength(60) primary?: string;
  @IsOptional() @IsString() @MaxLength(60) primaryForeground?: string;
  @IsOptional() @IsString() @MaxLength(60) background?: string;
  @IsOptional() @IsString() @MaxLength(60) surface?: string;
  @IsOptional() @IsString() @MaxLength(60) text?: string;
  @IsOptional() @IsString() @MaxLength(60) border?: string;
  @IsOptional() @IsString() @MaxLength(60) accent?: string;
}

export class SaveThemeDto {
  @IsOptional() @IsString() @MaxLength(60) brandName?: string;
  @IsOptional() @IsString() @MaxLength(500) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) faviconUrl?: string;
  @IsOptional() colors?: ThemeColorsDto;
  @IsOptional() @IsString() @MaxLength(12) radius?: string;
  @IsOptional() @IsString() @MaxLength(120) shadow?: string;
  @IsOptional() @IsIn(['dark', 'light']) mode?: 'dark' | 'light';
}

@Controller('config/theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  /** Public: the live theme (used by the web layout for CSS variables). */
  @Get()
  async published() {
    return this.themeService.getPublished();
  }

  @Get('draft')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('theme.manage')
  async draft() {
    return this.themeService.getDraft();
  }

  @Put('draft')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('theme.manage')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('theme.save_draft')
  async saveDraft(@Body() dto: SaveThemeDto) {
    return this.themeService.saveDraft(dto as any);
  }

  @Post('publish')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('theme.manage')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('theme.publish')
  async publish() {
    return this.themeService.publish();
  }

  @Post('rollback')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('theme.manage')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('theme.rollback')
  async rollback() {
    try {
      return await this.themeService.rollback();
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }
}
