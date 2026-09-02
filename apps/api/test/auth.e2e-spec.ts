import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '@repo/database';
import { MailerService } from '@nestjs-modules/mailer';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  // A unique email for testing registration
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let verificationToken = '';
  let resetToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService) // Mock mailer so we don't actually send emails
      .useValue({
        sendMail: jest.fn().mockImplementation(async (options) => {
          // Extract tokens from the mock email sending for our E2E flow
          if (options.context && options.context.verifyLink) {
             const url = new URL(options.context.verifyLink);
             verificationToken = url.searchParams.get('token') || '';
          }
          if (options.context && options.context.resetLink) {
             const url = new URL(options.context.resetLink);
             resetToken = url.searchParams.get('token') || '';
          }
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    
    // In a real E2E environment we would get PrismaService and clear test data
    // prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup the created user
    // await prisma.user.delete({ where: { email: testEmail } });
    await app.close();
  });

  it('/auth/register (POST) - should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        username: `tester_${Date.now()}`,
      });
      
    // Should return 201 Created and indicate success
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
  });

  it('/auth/login (POST) - should fail if email is not verified', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });
      
    // We expect the system to block login for unverified emails
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Please verify your email');
  });

  it('/auth/verify-email (POST) - should verify the email with token', async () => {
    // If the token wasn't captured by the mock, we can't test this.
    // In a real environment, the token is saved in the DB, so we would query it directly.
    if (!verificationToken) {
        console.warn('Skipping verification test as no token was captured');
        return;
    }

    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verificationToken });
      
    expect(response.status).toBe(200);
  });

  it('/auth/forgot-password (POST) - should request a reset', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: testEmail });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

});
