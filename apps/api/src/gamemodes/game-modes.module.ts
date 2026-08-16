import { Module } from '@nestjs/common';
import { GameModesController } from './game-modes.controller';
import { GameModesService } from './game-modes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GameModesController],
  providers: [GameModesService],
  exports: [GameModesService],
})
export class GameModesModule {}
