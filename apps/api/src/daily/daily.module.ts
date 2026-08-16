import { Module } from '@nestjs/common';
import { DailyController } from './daily.controller';
import { DailyService } from './daily.service';
import { CoinLedgerModule } from '../coin-ledger/coin-ledger.module';

@Module({
  imports: [CoinLedgerModule],
  controllers: [DailyController],
  providers: [DailyService],
})
export class DailyModule {}
