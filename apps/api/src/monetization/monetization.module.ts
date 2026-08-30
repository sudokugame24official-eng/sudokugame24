import { Module } from '@nestjs/common';
import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';
import { RewardedAdsController } from './rewarded-ads.controller';
import { RewardedAdsService } from './rewarded-ads.service';
import { AuthModule } from '../auth/auth.module';
import { CoinLedgerModule } from '../coin-ledger/coin-ledger.module';

@Module({
  imports: [AuthModule, CoinLedgerModule],
  controllers: [MonetizationController, RewardedAdsController],
  providers: [MonetizationService, RewardedAdsService],
  exports: [MonetizationService, RewardedAdsService],
})
export class MonetizationModule {}
