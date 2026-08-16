import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { WsJwtGuard } from './ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

process.env.JWT_SECRET = 'test-secret';

jest.mock('@repo/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

describe('P0-F: ban enforcement', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('JwtStrategy.validate (REST)', () => {
    it('rejects a BANNED user immediately (no waiting for cookie expiry)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'banned@test.com',
        isBanned: true,
        banReason: 'cheating',
        passwordHash: 'x',
      });

      const strategy = new JwtStrategy();
      await expect(strategy.validate({ sub: 'u1' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('still authenticates a healthy user and strips passwordHash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u2',
        email: 'ok@test.com',
        isBanned: false,
        passwordHash: 'secret-hash',
      });

      const strategy = new JwtStrategy();
      const user = await strategy.validate({ sub: 'u2' });
      expect(user.id).toBe('u2');
      expect(user).not.toHaveProperty('passwordHash');
    });
  });

  describe('WsJwtGuard (WebSocket messages)', () => {
    const makeContext = (client: any) => ({
      switchToWs: () => ({ getClient: () => client }),
    });

    it('rejects a BANNED user on every socket message', async () => {
      const jwtService = new JwtService({ secret: 'test-secret' });
      const token = jwtService.sign({ sub: 'u1' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        isBanned: true,
      });

      const guard = new WsJwtGuard(jwtService);
      const client = { handshake: { auth: { token }, headers: {} }, data: {} };
      await expect(guard.canActivate(makeContext(client) as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('accepts a healthy user and populates client.data.user', async () => {
      const jwtService = new JwtService({ secret: 'test-secret' });
      const token = jwtService.sign({ sub: 'u2' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u2',
        isBanned: false,
      });

      const guard = new WsJwtGuard(jwtService);
      const client = { handshake: { auth: { token }, headers: {} }, data: {} };
      await expect(guard.canActivate(makeContext(client) as any)).resolves.toBe(true);
      expect(client.data.user.id).toBe('u2');
    });
  });
});
