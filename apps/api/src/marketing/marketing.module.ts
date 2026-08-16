import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [MarketingService],
})
export class MarketingModule {}
