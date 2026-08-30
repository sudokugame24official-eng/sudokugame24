import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { DailyService } from './daily.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { AuditAction } from '../auth/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../auth/interceptors/audit-log.interceptor';
import { SubmitChallengeDto } from './dto/submit-challenge.dto';

@Controller('daily')
export class DailyController {
  constructor(private readonly dailyService: DailyService) {}

  @Get('today')
  async getTodaysChallenge() {
    return this.dailyService.getTodaysChallenge();
  }

  // --- ADMIN ENDPOINTS ---
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('settings.manage')
  @Get('admin/config')
  async getDailyConfig() {
    return this.dailyService.getDailyConfig();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('settings.manage')
  @AuditAction('daily.update_config')
  @Put('admin/config')
  async updateDailyConfig(@Body() body: any) {
    return this.dailyService.updateDailyConfig(body);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('settings.manage')
  @AuditAction('daily.publish_today')
  @Post('admin/publish-today')
  async publishToday(@Body() body: { difficulty?: string }) {
    return this.dailyService.publishToday(body?.difficulty);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('settings.manage')
  @Get('admin/preview-tomorrow')
  async previewTomorrow() {
    return this.dailyService.previewTomorrow();
  }

  // --- USER GAMEPLAY ENDPOINTS ---
  @UseGuards(JwtAuthGuard)
  @Post(':challengeId/start')
  async startChallenge(
    @Param('challengeId') challengeId: string,
    @Request() req: any,
  ) {
    return this.dailyService.startChallenge(req.user.id, challengeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':challengeId/submit')
  async submitEntry(
    @Param('challengeId') challengeId: string,
    @Body() dto: SubmitChallengeDto,
    @Request() req: any,
  ) {
    return this.dailyService.submitEntry(
      req.user.id,
      challengeId,
      dto.finalBoard,
    );
  }

  @Get(':challengeId/leaderboard')
  async getLeaderboard(@Param('challengeId') challengeId: string) {
    return this.dailyService.getLeaderboard(challengeId);
  }
}
