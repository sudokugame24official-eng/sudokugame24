import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@repo/database';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';
import { trackEvent } from '../analytics/track-event';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    void trackEvent({
      name: 'login',
      userId: user?.id,
      metadata: { via: 'credentials' },
    });
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(email: string, pass: string, username: string) {
    // analytics fired by caller at the end of register (needs created user id)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (!pass || pass.length < 8) {
      throw new ConflictException(
        'Password must be at least 8 characters long',
      );
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { username },
    });
    if (existingProfile) {
      throw new ConflictException('Username already taken');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(pass, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            username,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Send welcome email asynchronously
    this.emailService.sendEmail(user.id, 'WELCOME_EMAIL').catch((err) => {
      console.error('Failed to send welcome email', err);
    });

    // Generate and send verification email
    await this.generateEmailVerificationToken(user.id);

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async verifyEmail(token: string) {
    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!authToken || authToken.type !== 'EMAIL_VERIFICATION') {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (authToken.expiresAt < new Date()) {
      await prisma.authToken.delete({ where: { id: authToken.id } });
      throw new UnauthorizedException('Invalid or expired token');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: authToken.userId },
        data: { isEmailVerified: true },
      }),
      prisma.authToken.delete({ where: { id: authToken.id } }),
    ]);

    return { success: true };
  }

  async generateEmailVerificationToken(userId: string) {
    const token = randomBytes(32).toString('hex');
    await prisma.authToken.create({
      data: {
        userId,
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });

    const frontUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontUrl}/auth/verify-email?token=${token}`;
    
    this.emailService.sendEmail(userId, 'EMAIL_VERIFICATION', { verifyUrl }).catch((err) => {
      console.error('Failed to send verification email', err);
    });

    return token;
  }

  async generatePasswordResetToken(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null; // Silently return to avoid email enumeration

    const token = randomBytes(32).toString('hex');
    await prisma.authToken.create({
      data: {
        userId: user.id,
        token,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    const frontUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontUrl}/auth/reset-password?token=${token}`;

    this.emailService.sendEmail(user.id, 'PASSWORD_RESET', { resetUrl }).catch((err) => {
      console.error('Failed to send password reset email', err);
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!authToken || authToken.type !== 'PASSWORD_RESET') {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (authToken.expiresAt < new Date()) {
      await prisma.authToken.delete({ where: { id: authToken.id } });
      throw new UnauthorizedException('Invalid or expired token');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: authToken.userId },
        data: { passwordHash },
      }),
      prisma.authToken.deleteMany({
        where: { userId: authToken.userId, type: 'PASSWORD_RESET' },
      }),
    ]);

    return { success: true };
  }

  async googleLogin(req: any) {
    if (!req.user) {
      return null;
    }

    const { email, firstName, lastName, picture, id: googleId } = req.user;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          profile: {
            create: {
              username:
                `${firstName}${lastName ? ' ' + lastName : ''}`.trim() ||
                `User_${Math.random().toString(36).slice(2, 7)}`,
              avatarUrl: picture,
            },
          },
        },
        include: { profile: true } as any,
      });

      // Send welcome email asynchronously for Google signup
      this.emailService.sendEmail(user.id, 'WELCOME_EMAIL').catch((err) => {
        console.error('Failed to send welcome email', err);
      });

      // For OAuth, we can auto-verify the email since Google already verified it
      await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
      user.isEmailVerified = true;
    } else if (!user.googleId) {
      // Link google account to existing email
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
        include: { profile: true } as any,
      });
    }

    void trackEvent({ name: 'registration', userId: user.id });
    return this.login(user);
  }
}
