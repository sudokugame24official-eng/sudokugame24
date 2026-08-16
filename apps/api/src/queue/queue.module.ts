import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? { url: process.env.REDIS_URL, maxRetriesPerRequest: null }
        : {
            host: '127.0.0.1',
            port: 6379,
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            lazyConnect: true,
            retryStrategy: () => null, // stop retrying — no Redis in dev
          },
    }),
    BullModule.registerQueue({
      name: 'email-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100, // Keep last 100 successful jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    }),
  ],
  providers: [EmailProcessor],
  exports: [BullModule],
})
export class QueueModule {}
