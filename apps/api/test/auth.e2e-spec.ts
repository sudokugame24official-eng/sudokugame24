import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { APP_GUARD } from '@nestjs/core';
import { AppModule } from './../src/app.module';
import { prisma } from '@repo/database';
import { EmailService } from './../src/email/email.service';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;

  // Unique emails for isolated test users
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let verificationToken = '';
  let resetToken = '';
  let accessToken = '';

  const capturedUrls: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Disable the global throttler for the main flow suite so ordered tests
      // are deterministic regardless of how many auth requests they issue.
      // Rate limiting itself is verified in auth-security.e2e-spec.ts which
      // keeps the real ThrottlerGuard active.
      .overrideProvider(APP_GUARD)
      .useValue({ canActivate: () => true })
      .overrideProvider(EmailService) // Mock the real email queue so nothing is actually sent
      .useValue({
        sendEmail: jest.fn().mockImplementation(
          async (_userId: string, templateName: string, data: Record<string, string>) => {
            // Intercept the verification/reset URLs which carry the tokens.
            if (data && data.verifyUrl) {
              const url = new URL(data.verifyUrl);
              verificationToken = url.searchParams.get('token') || '';
              capturedUrls.push(data.verifyUrl);
            }
            if (data && data.resetUrl) {
              const url = new URL(data.resetUrl);
              resetToken = url.searchParams.get('token') || '';
              capturedUrls.push(data.resetUrl);
            }
            return true;
          },
        ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser()); // as in main.ts, so JWT-from-cookie works in /auth/me
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    // Cleanup all test users created during the suite (isolated test DB)
    try {
      await prisma.authToken.deleteMany({
        where: { user: { email: { startsWith: 'testuser_' } } },
      });
      await prisma.user.deleteMany({ where: { email: { startsWith: 'testuser_' } } });
    } catch {
      // Ignore if not found
    }

    // Close the app and disconnect prisma
    try {
      await app.close();
    } catch {
      // ignore close errors
    }
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  });

  // ================= REGISTRATION =================

  it('/auth/register (POST) - registers a valid new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword, username: `tester_${Date.now()}` });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
  });

  it('/auth/register (POST) - rejects duplicate email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword, username: `tester2_${Date.now()}` });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('Email already exists');
  });

  it('/auth/register (POST) - rejects invalid DTO (bad email, short password, bad username)', async () => {
    const bad = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short', username: 'bad username!' });
    // ValidationPipe with whitelist/forbidNonWhitelisted => 400
    expect(bad.status).toBe(400);
  });

  it('/auth/register (POST) - user row actually created with isEmailVerified=false', async () => {
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(dbUser).not.toBeNull();
    expect(dbUser.isEmailVerified).toBe(false);
  });

  // ================= EMAIL VERIFICATION =================

  it('/auth/verify-email (POST) - rejects an invalid/expired verification token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: 'totally_invalid_token' });

    expect(response.status).toBe(401);
  });

  it('verification token is random 64-char hex (256 bits)', () => {
    expect(verificationToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('/auth/verify-email (POST) - verifies the email with a valid token', async () => {
    // If the token wasn't captured by the mock, query DB directly
    if (!verificationToken) {
      const dbToken = await prisma.authToken.findFirst({
        where: { user: { email: testEmail }, type: 'EMAIL_VERIFICATION' },
        orderBy: { createdAt: 'desc' },
      });
      if (dbToken) verificationToken = dbToken.token;
    }

    if (!verificationToken) {
      console.warn('Skipping verification test as no token was captured');
      return;
    }

    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verificationToken });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
  });

  it('account marked verified after token use', async () => {
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(dbUser?.isEmailVerified).toBe(true);
  });

  it('/auth/verify-email (POST) - second usage of same token is refused (consumed)', async () => {
    if (!verificationToken) {
      console.warn('Skipping re-use test as no token was captured');
      return;
    }
    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verificationToken });

    expect(response.status).toBe(401);
  });

  // ================= LOGIN =================

  it('/auth/login (POST) - fails for unverified email', async () => {
    const otherEmail = `testuser_unver_${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: otherEmail, password: testPassword, username: `testeru_${Date.now()}` });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: otherEmail, password: testPassword });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('verify your email');
  });

  it('/auth/login (POST) - succeeds after verification with valid JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    accessToken = response.body.accessToken;
    // JWT has 3 segments (header.payload.signature)
    expect(accessToken.split('.')).toHaveLength(3);
  });

  it('/auth/me (GET) - returns current user with a valid JWT', async () => {
    if (!accessToken) {
      console.warn('Skipping /auth/me as no access token');
      return;
    }
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `access_token=${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(testEmail);
  });

  // ================= FORGOT PASSWORD =================

  it('/auth/forgot-password (POST) - requests a reset for existing email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: testEmail });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('reset token captured is random 64-char hex (256 bits)', () => {
    expect(resetToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('/auth/forgot-password (POST) - does not reveal whether email exists', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: `nobody_${Date.now()}@example.com` });

    // Always 200 + success:true to prevent email enumeration
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('/auth/forgot-password (POST) - does not create a token for unknown email', async () => {
    const before = await prisma.authToken.count({ where: { type: 'PASSWORD_RESET' } });
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: `nobody2_${Date.now()}@example.com` });
    const after = await prisma.authToken.count({ where: { type: 'PASSWORD_RESET' } });
    expect(after).toBe(before);
  });

  // ================= RESET PASSWORD =================

  it('/auth/reset-password (POST) - resets password with a valid token', async () => {
    // If the token wasn't captured by the mock, query DB directly
    if (!resetToken) {
      const dbToken = await prisma.authToken.findFirst({
        where: { user: { email: testEmail }, type: 'PASSWORD_RESET' },
        orderBy: { createdAt: 'desc' },
      });
      if (dbToken) resetToken = dbToken.token;
    }

    if (!resetToken) {
      console.warn('Skipping reset-password test as no token was captured');
      return;
    }

    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: resetToken, newPassword: 'NewPassword456!' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
  });

  it('old password is refused after reset; new password accepted', async () => {
    const oldLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'NewPassword456!' });
    expect(newLogin.status).toBe(200);
  });

  it('/auth/reset-password (POST) - rejects an invalid token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'not_a_real_token', newPassword: 'AnotherPass123!' });

    expect(response.status).toBe(401);
  });

  it('/auth/reset-password (POST) - second usage of same reset token refused', async () => {
    if (!resetToken) {
      console.warn('Skipping reset re-use test as no token was captured');
      return;
    }
    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: resetToken, newPassword: 'YetAnotherPass123!' });

    expect(response.status).toBe(401);
  });

  // ================= EXPIRED TOKENS (DB-injected) =================

  it('/auth/verify-email (POST) - rejects an expired verification token', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    await prisma.authToken.create({
      data: {
        userId: user!.id,
        token: `expired_verify_${Date.now()}`,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const expireTok = await prisma.authToken.findFirst({
      where: { type: 'EMAIL_VERIFICATION', token: { startsWith: `expired_verify_` } },
      orderBy: { createdAt: 'desc' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: expireTok!.token });

    expect(response.status).toBe(401);
  });

  it('/auth/reset-password (POST) - rejects an expired reset token', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    await prisma.authToken.create({
      data: {
        userId: user!.id,
        token: `expired_reset_${Date.now()}`,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const expireTok = await prisma.authToken.findFirst({
      where: { type: 'PASSWORD_RESET', token: { startsWith: `expired_reset_` } },
      orderBy: { createdAt: 'desc' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: expireTok!.token, newPassword: 'ExpiredPass123!' });

    expect(response.status).toBe(401);
  });

  // ================= BANNED USER =================

  it('/auth/me (GET) - banned user loses access immediately', async () => {
    if (!accessToken) {
      console.warn('Skipping ban test as no access token');
      return;
    }
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    await prisma.user.update({ where: { id: user!.id }, data: { isBanned: true } });

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `access_token=${accessToken}`);
    expect(me.status).toBe(401);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'NewPassword456!' });
    expect(login.status).toBe(403);
    expect(login.body.message).toContain('suspended');

    // restore so cleanup / later assertions are unaffected
    await prisma.user.update({ where: { id: user!.id }, data: { isBanned: false } });
  });
});
