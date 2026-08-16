import { Module } from '@nestjs/common';
import { SudokuController } from './sudoku.controller';
import { SudokuService } from './sudoku.service';
import { ProgressionModule } from '../progression/progression.module';
import { CoinLedgerModule } from '../coin-ledger/coin-ledger.module';

@Module({
  imports: [ProgressionModule, CoinLedgerModule],
  controllers: [SudokuController],
  providers: [SudokuService],
  exports: [SudokuService],
})
export class SudokuModule {}
