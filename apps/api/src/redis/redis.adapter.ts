import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    if (!process.env.REDIS_URL) {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
        throw new Error(
          'REDIS_URL is required in production/staging: refusing to silently fall back to default adapter ' +
          '(WebSocket broadcasts would not propagate across instances).',
        );
      }
      return;
    }

    const pubClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    const subClient = pubClient.duplicate();

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any): any {
    const corsOrigin = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',') 
      : 'http://localhost:3000';
      
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
    });
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
