import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RewardedAdsService, RewardedAdConfig } from './rewarded-ads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsArray,
  IsIn,
} from 'class-validator';

export class ClaimRewardedAdDto {
  @IsString()
  rewardToken!: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class UpdateRewardedAdConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  rewardAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  dailyCap?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  cooldownSeconds?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligiblePages?: string[];

  @IsOptional()
  @IsIn(['MockRewarded', 'GoogleRewarded', 'UnityAds'])
  provider?: 'MockRewarded' | 'GoogleRewarded' | 'UnityAds';
}

@Controller('rewarded-ads')
export class RewardedAdsController {
  constructor(private readonly rewardedAdsService: RewardedAdsService) {}

  // --- Public / Authenticated Player Endpoints ---

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Request() req: any) {
    return this.rewardedAdsService.getUserStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  async initiate(@Request() req: any) {
    return this.rewardedAdsService.initiateSession(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim')
  async claim(@Request() req: any, @Body() body: ClaimRewardedAdDto) {
    return this.rewardedAdsService.claimReward(
      req.user.id,
      body.rewardToken,
      body.idempotencyKey,
    );
  }

  // --- Admin Endpoints ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/config')
  async getAdminConfig() {
    return this.rewardedAdsService.getConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put('admin/config')
  async updateAdminConfig(
    @Request() req: any,
    @Body() body: UpdateRewardedAdConfigDto,
  ) {
    return this.rewardedAdsService.updateConfig(body, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/stats')
  async getAdminStats() {
    return this.rewardedAdsService.getAnalytics();
  }
}
