import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { prisma } from '@repo/database';
import { EmailService } from './../src/email/email.service';

/**
 * Security-focused E2E suite.
 * Keeps the REAL ThrottlerGuard active (no override) so we can prove
 * that brute-force / rate-limiting protections actually work on /auth/login.
 */
describe('Authentication Security (e2e)', () => {
  let app: INestApplication;

  const email = `secuser_${Date.now()}@example.com`;
  const password = 'Password123!';
  let verificationToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendEmail: jest.fn().mockImplementation(
          async (_userId: string, templateName: string, data: Record<string, string>) => {
            if (data && data.verifyUrl) {
              verificationToken =
                new URL(data.verifyUrl).searchParams.get('token') || '';
            }
            if (data && data.resetUrl) {
              // capture nothing; not used here
            }
            return true;
          },
        ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    try {
      await prisma.authToken.deleteMany({ where: { user: { email: { startsWith: 'secuser_' } } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: 'secuser_' } } });
    } catch {
      // ignore
    }
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

  it('registers + verifies a user to enable login tests', async () => {
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, username: `sec_${Date.now()}` });
    expect(reg.status).toBe(201);

    if (!verificationToken) {
      const dbToken = await prisma.authToken.findFirst({
        where: { user: { email }, type: 'EMAIL_VERIFICATION' },
        orderBy: { createdAt: 'desc' },
      });
      if (dbToken) verificationToken = dbToken.token;
    }
    const ver = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verificationToken });
    expect(ver.status).toBe(201);
  });

  it('/auth/login (POST) - rate limits brute-force attempts (429 after limit)', async () => {
    // login is throttled at 5 requests / 60s. Fire 6 attempts and expect
    // the 6th to be rejected with 429 Too Many Requests.
    let lastStatus = 0;
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'TotallyWrongPass123!' });
      statuses.push(res.status);
      lastStatus = res.status;
    }
    // At least the first requests return 401 (wrong password)
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    // Once the 5/min budget is exhausted, the server must reply 429.
    expect(lastStatus).toBe(429);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });
});
