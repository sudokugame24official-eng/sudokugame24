import { Module } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [SimulationService],
})
export class SimulationModule {}
