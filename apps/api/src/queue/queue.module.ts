import { Injectable, Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailProcessor } from './email.processor';

@Injectable()
export class QueueLifecycleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueLifecycleService.name);

  constructor(@InjectQueue('email-queue') private readonly queue: Queue) {}

  onModuleInit() {
    this.queue.on('error', (err) => {
      this.logger.debug(`Queue error handled: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    try {
      await this.queue.close();
    } catch {
      // ignore
    }
  }
}

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
  providers: [EmailProcessor, QueueLifecycleService],
  exports: [BullModule],
})
export class QueueModule {}


