import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DuelModule } from './duel/duel.module';
import { AdminModule } from './admin/admin.module';
import { DailyModule } from './daily/daily.module';
import { AuthModule } from './auth/auth.module';
import { ForumModule } from './forum/forum.module';
import { SettingsModule } from './settings/settings.module';
import { ChatModule } from './chat/chat.module';
import { ShopModule } from './shop/shop.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email/email.module';
import { MarketingModule } from './marketing/marketing.module';
import { UsersController } from './users/users.controller';
import { MonetizationModule } from './monetization/monetization.module';
import { CoinLedgerModule } from './coin-ledger/coin-ledger.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { ProgressionModule } from './progression/progression.module';
import { ConfigModule } from './config/config.module';
import { FriendsModule } from './friends/friends.module';
import { PresenceModule } from './presence/presence.module';
import { ContentModule } from './content/content.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { SudokuModule } from './sudoku/sudoku.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { MediaModule } from './media/media.module';
import { QuestionsModule } from './questions/questions.module';
import { GameModesModule } from './gamemodes/game-modes.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    RedisModule,
    QueueModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    DuelModule,
    AdminModule,
    DailyModule,
    AuthModule,
    ForumModule,
    SettingsModule,
    ChatModule,
    ShopModule,
    EmailModule,
    MarketingModule,
    MonetizationModule,
    CoinLedgerModule,
    ProgressionModule,
    ConfigModule,
    FriendsModule,
    PresenceModule,
    ContentModule,
    LeaderboardModule,
    SudokuModule,
    KnowledgeModule,
    MediaModule,
    QuestionsModule,
    GameModesModule,
    AnalyticsModule,
  ],
  controllers: [AppController, UsersController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
