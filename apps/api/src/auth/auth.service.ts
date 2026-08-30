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

    const { passwordHash: _, ...result } = user;
    return result;
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
