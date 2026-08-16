import { Module } from '@nestjs/common';
import { PresenceGateway } from './presence.gateway';
import { FriendsModule } from '../friends/friends.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FriendsModule, RedisModule, AuthModule],
  providers: [PresenceGateway],
})
export class PresenceModule {}
