import { Module, Global } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { SiteSettingsService } from './site-settings.service';
import { ConfigController } from './config.controller';

@Global()
@Module({
  providers: [FeatureFlagService, SiteSettingsService],
  controllers: [ConfigController],
  exports: [FeatureFlagService, SiteSettingsService],
})
export class ConfigModule {}
