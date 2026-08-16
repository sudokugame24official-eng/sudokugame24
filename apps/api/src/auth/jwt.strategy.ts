import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { prisma } from '@repo/database';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const data = request?.cookies?.['access_token'];
          if (!data) {
            return null;
          }
          return data;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: any) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // P0-F: a banned user must immediately lose all authenticated access,
    // not keep it until the JWT cookie expires.
    if (user.isBanned) {
      throw new UnauthorizedException('Account suspended');
    }

    const { passwordHash, ...result } = user;
    return result;
  }
}
