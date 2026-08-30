import { Module } from '@nestjs/common';
import { SupportPublicController } from './support-public.controller';

@Module({
  controllers: [SupportPublicController],
})
export class SupportModule {}
