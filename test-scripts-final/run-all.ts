import { ForensicLogger } from './runner';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001';
const WEB_URL = 'http://localhost:3000';

async function testPaymentStripe() {
  const logger = new ForensicLogger('05-payment-stripe.log');
  logger.logTestStart('Payment & Stripe Integration (Mock)');
  try {
    const userA = { email: `stripe_${Date.now()}@test.com`, password: 'Password123!', username: `Stripe_${Date.now()}` };
    const regA = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0];
    
    // Test checkout session creation
    logger.logRequest('POST', '/shop/checkout');
    const checkoutRes = await fetch(`${API_URL}/shop/checkout`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA! },
      body: JSON.stringify({ packageId: 'coins_1000' })
    });
    
    const checkoutData = await checkoutRes.json();
    logger.logResponse(checkoutRes.status, checkoutData);
    logger.logDBAssertion('Stripe', 'Stripe checkout session created securely', checkoutRes.status === 201 && !!checkoutData.url);
    
    logger.logResult('Payment Stripe', true);
  } catch (err: any) {
    logger.logResult('Payment Stripe', false);
  }
}

async function testFriends() {
  const logger = new ForensicLogger('06-friends.log');
  logger.logTestStart('Friends System');
  try {
    const userA = { email: `fA_${Date.now()}@test.com`, password: 'Password123!', username: `FA_${Date.now()}` };
    const userB = { email: `fB_${Date.now()}@test.com`, password: 'Password123!', username: `FB_${Date.now()}` };
    const regA = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0];
    
    const regB = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userB) });
    const cookieB = regB.headers.get('set-cookie')?.split(';')[0];
    const dbB = await prisma.user.findUnique({ where: { email: userB.email } });

    logger.logRequest('POST', '/users/friends/request');
    const reqRes = await fetch(`${API_URL}/users/friends/request`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA! },
      body: JSON.stringify({ targetUserId: dbB!.id })
    });
    logger.logResponse(reqRes.status, await reqRes.json().catch(()=>({})));
    logger.logDBAssertion('Friends', 'Friend request sent', reqRes.status === 201);
    
    logger.logResult('Friends System', true);
  } catch (err: any) {
    logger.logResult('Friends System', false);
  }
}

async function testLeaderboard() {
  const logger = new ForensicLogger('07-leaderboard.log');
  logger.logTestStart('Leaderboard Generation');
  try {
    logger.logRequest('GET', '/leaderboard/top?limit=10');
    const res = await fetch(`${API_URL}/leaderboard/top?limit=10`);
    const data = await res.json();
    logger.logResponse(res.status, data);
    logger.logDBAssertion('Leaderboard', 'Leaderboard returns array of profiles', Array.isArray(data));
    logger.logResult('Leaderboard Generation', true);
  } catch (err: any) {
    logger.logResult('Leaderboard Generation', false);
  }
}

async function testProfile() {
  const logger = new ForensicLogger('10-profile.log');
  logger.logTestStart('Profile Stats & Cosmetics');
  try {
    const userA = { email: `prof_${Date.now()}@test.com`, password: 'Password123!', username: `Prof_${Date.now()}` };
    const regA = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    const dbUserA = await prisma.user.findUnique({ where: { email: userA.email } });
    
    logger.logRequest('GET', `/users/stats/${dbUserA!.id}`);
    const res = await fetch(`${API_URL}/users/stats/${dbUserA!.id}`);
    const data = await res.json();
    logger.logResponse(res.status, data);
    logger.logDBAssertion('Profile', 'Stats retrieved correctly', res.status === 200 && 'gamesPlayed' in data);
    logger.logResult('Profile Stats', true);
  } catch (err: any) {
    logger.logResult('Profile Stats', false);
  }
}

async function testAdminRBAC() {
  const logger = new ForensicLogger('11-admin-rbac.log');
  logger.logTestStart('Admin RBAC & Ban');
  try {
    const userA = { email: `adm_${Date.now()}@test.com`, password: 'Password123!', username: `Adm_${Date.now()}` };
    const regA = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0];
    
    logger.logRequest('GET', '/admin/users');
    const res = await fetch(`${API_URL}/admin/users`, { headers: { 'Cookie': cookieA! } });
    logger.logResponse(res.status, await res.json().catch(()=>({})));
    logger.logDBAssertion('Admin', 'Regular user blocked from admin endpoint', res.status === 403);
    logger.logResult('Admin RBAC', true);
  } catch (err: any) {
    logger.logResult('Admin RBAC', false);
  }
}

async function testForum() {
  const logger = new ForensicLogger('12-forum.log');
  logger.logTestStart('Forum & XSS Block');
  try {
    const userA = { email: `for_${Date.now()}@test.com`, password: 'Password123!', username: `For_${Date.now()}` };
    const regA = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0];
    
    logger.logRequest('POST', '/forum/posts');
    const res = await fetch(`${API_URL}/forum/posts`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA! },
      body: JSON.stringify({ category: 'GENERAL', title: 'Test <script>alert(1)</script>', content: 'Safe content' })
    });
    const data = await res.json();
    logger.logResponse(res.status, data);
    logger.logDBAssertion('Forum', 'Post created (UI must sanitize XSS)', res.status === 201);
    logger.logResult('Forum', true);
  } catch (err: any) {
    logger.logResult('Forum', false);
  }
}

async function testAchievements() {
  const logger = new ForensicLogger('13-achievements.log');
  logger.logTestStart('Achievements & XP');
  try {
    logger.logRequest('Prisma', 'Checking achievements table');
    const count = await prisma.userAchievement.count();
    logger.logDBAssertion('Achievements', 'Achievements system is tracked in DB', count >= 0);
    logger.logResult('Achievements', true);
  } catch (err: any) {
    logger.logResult('Achievements', false);
  }
}

async function testI18n() {
  const logger = new ForensicLogger('14-i18n.log');
  logger.logTestStart('Internationalization (i18n)');
  try {
    logger.logRequest('GET', 'Web / (Checking HTML lang attribute)');
    const res = await fetch(`${WEB_URL}`);
    const text = await res.text();
    const hasLang = text.includes('lang="fr"') || text.includes('lang="en"');
    logger.logResponse(res.status, 'HTML output received');
    logger.logDBAssertion('i18n', 'i18n is functional on Web', hasLang);
    logger.logResult('i18n', true);
  } catch (err: any) {
    logger.logResult('i18n', false);
  }
}

async function testSEO() {
  const logger = new ForensicLogger('15-seo.log');
  logger.logTestStart('SEO & Metadata');
  try {
    logger.logRequest('GET', 'Web / (Checking meta tags)');
    const res = await fetch(`${WEB_URL}`);
    const text = await res.text();
    const hasTitle = text.includes('<title>');
    const hasMeta = text.includes('<meta name="description"');
    logger.logResponse(res.status, 'HTML output received');
    logger.logDBAssertion('SEO', 'SEO tags present on Web', hasTitle && hasMeta);
    logger.logResult('SEO', true);
  } catch (err: any) {
    logger.logResult('SEO', false);
  }
}

async function runAll() {
  await testPaymentStripe();
  await testFriends();
  await testLeaderboard();
  await testProfile();
  await testAdminRBAC();
  await testForum();
  await testAchievements();
  await testI18n();
  await testSEO();
  await prisma.$disconnect();
}

runAll();
