import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { SiteSettingsService } from './site-settings.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('config')
export class ConfigController {
  constructor(
    private readonly featureFlagService: FeatureFlagService,
    private readonly siteSettingsService: SiteSettingsService,
  ) {}

  @Get('features')
  @UseGuards(OptionalJwtAuthGuard)
  async getFeatureFlags(@Req() req: any) {
    const user = req.user
      ? { id: req.user.id, role: req.user.role }
      : undefined;

    // Expose only non-sensitive flags to the frontend
    const keys = [
      'SHOP_ENABLED',
      'PAYMENTS_ENABLED',
      'ADS_ENABLED',
      'FRIENDS_ENABLED',
      'PRIVATE_MESSAGES_ENABLED',
      'TOURNAMENTS_ENABLED',
      'SPECTATOR_MODE_ENABLED',
      'DUEL_ENABLED',
    ];

    const results: Record<string, boolean> = {};
    for (const key of keys) {
      results[key] = await this.featureFlagService.isFeatureEnabled(key, user);
    }

    return results;
  }

  @Get('theme')
  async getThemeConfig() {
    return this.siteSettingsService.getSetting('THEME_CONFIG', {
      mode: 'light',
      primaryColor: '#3b82f6',
    });
  }
}
