import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { AuthModule } from '../auth/auth.module';
import { CoinLedgerModule } from '../coin-ledger/coin-ledger.module';

@Module({
  imports: [AuthModule, CoinLedgerModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
