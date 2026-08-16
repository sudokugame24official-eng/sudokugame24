import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { prisma } from '@repo/database';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck(): any {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async readyCheck(@Res() res: Response) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({ status: 'ready', database: 'connected' });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ status: 'not_ready', database: 'disconnected', error: error.message });
    }
  }
}
