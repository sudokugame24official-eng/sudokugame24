import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    if (!process.env.REDIS_URL) {
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'staging'
      ) {
        throw new Error(
          'REDIS_URL is required in production/staging: refusing to silently fall back to ioredis-mock ' +
            '(cross-instance pub/sub, matchmaking locks and duel state would break).',
        );
      }
      const RedisMock = require('ioredis-mock');
      this.client = new RedisMock();
      this.logger.warn(
        'Using ioredis-mock because REDIS_URL is not provided (development only)',
      );
    } else {
      this.client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
    }

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('ready', () => {
      this.logger.log('Connected to Redis');
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }
}
