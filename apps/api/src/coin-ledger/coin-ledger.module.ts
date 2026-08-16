import { Module } from '@nestjs/common';
import { CoinLedgerService } from './coin-ledger.service';

@Module({
  providers: [CoinLedgerService],
  exports: [CoinLedgerService],
})
export class CoinLedgerModule {}
