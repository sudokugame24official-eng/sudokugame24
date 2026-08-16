import { Module } from '@nestjs/common';
import { PresenceGateway } from './presence.gateway';
import { FriendsModule } from '../friends/friends.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { DuelModule } from '../duel/duel.module';

@Module({
  imports: [FriendsModule, RedisModule, AuthModule, DuelModule],
  providers: [PresenceGateway],
})
export class PresenceModule {}
