import { Module } from '@nestjs/common';
import { DuelGateway } from './duel.gateway';
import { DuelService } from './duel.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { ProgressionModule } from '../progression/progression.module';
import { CoinLedgerModule } from '../coin-ledger/coin-ledger.module';

@Module({
  imports: [AuthModule, RedisModule, ProgressionModule, CoinLedgerModule],
  providers: [DuelGateway, DuelService],
  exports: [DuelService],
})
export class DuelModule {}
