import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('@repo/database', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    authToken: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

const { prisma } = require('@repo/database');

describe('AuthService - Email Verification & Password Reset', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let emailService: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService = new JwtService({ secret: 'test' });
    emailService = { sendEmail: jest.fn().mockResolvedValue(true) } as any;
    authService = new AuthService(jwtService, emailService);
  });

  describe('generateEmailVerificationToken', () => {
    it('creates a token and sends an email', async () => {
      prisma.authToken.create.mockResolvedValue({});
      const token = await authService.generateEmailVerificationToken('u1');
      expect(token).toBeDefined();
      expect(prisma.authToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u1',
            type: 'EMAIL_VERIFICATION',
          }),
        }),
      );
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'u1',
        'EMAIL_VERIFICATION',
        expect.objectContaining({ verifyUrl: expect.stringContaining(token) })
      );
    });
  });

  describe('verifyEmail', () => {
    it('throws UnauthorizedException if token is invalid', async () => {
      prisma.authToken.findUnique.mockResolvedValue(null);
      await expect(authService.verifyEmail('invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('verifies the user if token is valid', async () => {
      const mockToken = {
        id: 't1',
        userId: 'u1',
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 10000),
      };
      prisma.authToken.findUnique.mockResolvedValue(mockToken);

      await authService.verifyEmail('valid_token');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isEmailVerified: true },
      });
      expect(prisma.authToken.delete).toHaveBeenCalledWith({
        where: { id: 't1' },
      });
    });
  });

  describe('generatePasswordResetToken', () => {
    it('silently returns null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const res = await authService.generatePasswordResetToken('non@existent.com');
      expect(res).toBeNull();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('creates token and sends email for valid user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      prisma.authToken.create.mockResolvedValue({});

      const token = await authService.generatePasswordResetToken('valid@user.com');
      expect(token).toBeDefined();
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'u2',
        'PASSWORD_RESET',
        expect.objectContaining({ resetUrl: expect.stringContaining(token!) })
      );
    });
  });

  describe('resetPassword', () => {
    it('updates password and clears tokens on success', async () => {
      const mockToken = {
        id: 't2',
        userId: 'u2',
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 10000),
      };
      prisma.authToken.findUnique.mockResolvedValue(mockToken);
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHash');

      await authService.resetPassword('reset_token', 'new_pass');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u2' },
        data: { passwordHash: 'newHash' },
      });
      expect(prisma.authToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u2', type: 'PASSWORD_RESET' },
      });
    });
  });
});
