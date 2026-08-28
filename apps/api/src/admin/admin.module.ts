import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CoinLedgerModule } from '../coin-ledger/coin-ledger.module';

@Module({
  imports: [CoinLedgerModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

