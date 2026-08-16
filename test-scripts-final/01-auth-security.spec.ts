import { ForensicLogger } from './runner';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new ForensicLogger('01-auth-security.log');
const API_URL = 'http://localhost:3001';

async function run() {
  logger.logTestStart('Auth, IDOR & Security Boundaries');
  try {
    const userA = { email: `userA_${Date.now()}@test.com`, password: 'Password123!', username: `UserA_${Date.now()}` };
    const userB = { email: `userB_${Date.now()}@test.com`, password: 'Password123!', username: `UserB_${Date.now()}` };

    // Register User A
    const regA = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0];
    
    // Register User B
    const regB = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userB) });
    const cookieB = regB.headers.get('set-cookie')?.split(';')[0];

    const dbUserB = await prisma.user.findUnique({ where: { email: userB.email } });

    // 1. JWT Missing Test
    logger.logRequest('GET', '/auth/me (NO COOKIE)');
    const noAuthRes = await fetch(`${API_URL}/auth/me`);
    logger.logResponse(noAuthRes.status, await noAuthRes.json().catch(() => {}));
    logger.logDBAssertion('Auth', 'Missing JWT is rejected', noAuthRes.status === 401);

    // 2. IDOR Profile Edit Test (User A edits User B's profile)
    logger.logRequest('PUT', `/users/profile (User A attempts to edit User B)`);
    // Wait, the endpoint is PUT /users/profile and relies on req.user.id. So User A can only edit their own profile.
    // If they try to pass a userId in the body, does the backend ignore it?
    const idorRes = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA! },
      body: JSON.stringify({ userId: dbUserB!.id, bio: 'HACKED BIO' })
    });
    
    const dbUserBAfter = await prisma.profile.findUnique({ where: { userId: dbUserB!.id } });
    logger.logDBAssertion('Security', 'Mass assignment / IDOR on profile ignored', dbUserBAfter?.bio !== 'HACKED BIO');

    // 3. Privilege Escalation (User A tries to become ADMIN during registration/edit)
    logger.logRequest('PUT', `/users/profile (User A attempts role escalation)`);
    await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA! },
      body: JSON.stringify({ role: 'ADMIN' })
    });
    const dbUserAAfter = await prisma.user.findUnique({ where: { email: userA.email } });
    logger.logDBAssertion('Security', 'Role mass assignment blocked', dbUserAAfter?.role === 'MEMBER');

    // 4. Brute Force Login / Invalid password
    logger.logRequest('POST', `/auth/login (Invalid Password)`);
    const badLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA.email, password: 'WrongPassword' })
    });
    logger.logResponse(badLoginRes.status, await badLoginRes.json().catch(() => {}));
    logger.logDBAssertion('Security', 'Invalid password rejected (401)', badLoginRes.status === 401);

    logger.logResult('Auth & Security', true);
  } catch (error: any) {
    logger.logResult('Auth & Security', false);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
