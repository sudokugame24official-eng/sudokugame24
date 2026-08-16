import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { prisma } from '@repo/database';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    try {
      let token = client.handshake.auth?.token;

      if (!token && client.handshake.headers.cookie) {
        // Basic manual parsing to avoid external dependencies like 'cookie'
        const cookies = client.handshake.headers.cookie
          .split(';')
          .reduce((res, c) => {
            const [key, val] = c.trim().split('=');
            try {
              res[key] = decodeURIComponent(val);
            } catch (e) {
              res[key] = val;
            }
            return res;
          }, {});
        token = cookies['access_token'];
      }

      if (!token) {
        throw new UnauthorizedException('Missing token');
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET as string,
      });

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // P0-F: banned users are rejected on every WebSocket message.
      if (user.isBanned) {
        throw new UnauthorizedException('Account suspended');
      }

      // Store user on client for easy access
      client.data.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
