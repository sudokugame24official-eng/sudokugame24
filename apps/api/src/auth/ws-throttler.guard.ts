import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WsThrottlerGuard implements CanActivate {
  // Configurable limits (e.g. 50 messages per 5 seconds to allow fast sudoku moves)
  private readonly LIMIT = parseInt(process.env.WS_RATE_LIMIT || '50', 10);
  private readonly TTL = parseInt(process.env.WS_RATE_TTL || '5', 10);

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    // We expect WsJwtGuard to have run before this, setting client.data.user
    const user = client.data?.user;
    if (!user) {
      // If no user is attached, we can fallback to socket.id or just block.
      // We block unauthenticated messages from being rate-limited.
      return true;
    }

    const redis = this.redisService.getClient();
    const key = `ratelimit:ws:${user.id}`;

    // Atomic INCR and EXPIRE using a Lua script to ensure exact TTL behavior
    // or just INCR + EXPIRE via pipeline
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, this.TTL);
    }

    if (count > this.LIMIT) {
      client.emit('chat_error', {
        message: 'Rate limit exceeded. Please wait.',
      });
      return false; // Deny execution
    }

    return true;
  }
}
