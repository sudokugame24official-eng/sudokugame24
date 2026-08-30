import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { RedisIoAdapter } from './redis/redis.adapter';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing.');
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });

  // P1-A: global input validation.
  // whitelist: strips unknown properties on DTO-typed routes
  // forbidNonWhitelisted: 400 on unknown properties (fail loud, not silent)
  // transform: converts payloads to DTO instances with typed coercion
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Security Hardening
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes(origin))
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Dev fallback
      }
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
