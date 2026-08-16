import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';

@Controller('monetization')
export class MonetizationController {
  constructor(private readonly monetizationService: MonetizationService) {}

  // --- Public / Client Endpoints ---

  @Get('ad-config')
  async getAdConfig(@Query('slotName') slotName: string) {
    if (!slotName) return { globalAdsEnabled: false };
    return this.monetizationService.getAdConfig(slotName);
  }

  @Get('ad-config/all')
  async getAllAdConfigs() {
    return this.monetizationService.getAllAdConfigs();
  }

  // --- Admin Endpoints ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('flags')
  async getFlags() {
    return this.monetizationService.getFeatureFlags();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('flags')
  async updateFlag(
    @Body() body: { key: string; enabled: boolean; description?: string },
  ) {
    return this.monetizationService.updateFeatureFlag(
      body.key,
      body.enabled,
      body.description,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('ad-config')
  async updateAdConfig(
    @Body()
    body: {
      slotName: string;
      provider: string;
      enabled: boolean;
      publisherId?: string;
    },
  ) {
    return this.monetizationService.updateAdConfig(
      body.slotName,
      body.provider,
      body.enabled,
      body.publisherId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('stats')
  async getStats() {
    return this.monetizationService.getRevenueStats();
  }
}
