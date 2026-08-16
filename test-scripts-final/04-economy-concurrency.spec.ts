import { ForensicLogger } from './runner';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new ForensicLogger('04-economy-concurrency.log');
const API_URL = 'http://localhost:3001';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  logger.logTestStart('Economy Concurrency & Double-Spend Attacks');
  try {
    const email = `econtest_${Date.now()}@test.com`;
    const password = 'Password123!';
    
    // Register
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username: `EconUser_${Date.now()}` })
    });
    const authCookie = regRes.headers.get('set-cookie')?.split(';')[0];
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user) throw new Error('User not found');
    const userId = user.id;

    // Grant exact amount of coins for ONE purchase
    // e.g. 500 coins. Shop perk costs 500.
    await prisma.profile.update({
      where: { userId },
      data: { coins: 500 }
    });

    const currentCoins = 500;
    const itemCost = 500; // Assuming perk costs 500 (or we will see what it costs)
    
    // We will buy a profile banner perk
    const perks = await fetch(`${API_URL}/shop/perks`).then(r => r.json());
    if (!perks || perks.length === 0) throw new Error('No perks available in shop');
    
    const targetPerk = perks[0];
    logger.log(`Target Perk: ${targetPerk.id}, Price: ${targetPerk.price}`);
    
    // Adjust user balance to exactly match ONE purchase
    await prisma.profile.update({
      where: { userId },
      data: { coins: targetPerk.costCoins }
    });

    logger.log(`Adjusted user balance to exactly ${targetPerk.costCoins} coins.`);
    
    logger.log('Launching 50 concurrent purchase requests...');
    const requests = [];
    for (let i = 0; i < 50; i++) {
      requests.push(fetch(`${API_URL}/shop/buy-perk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': authCookie! },
        body: JSON.stringify({ perkId: targetPerk.id })
      }));
    }

    const responses = await Promise.all(requests);
    let successCount = 0;
    let failCount = 0;

    for (const res of responses) {
      if (res.status === 201 || res.status === 200) successCount++;
      else failCount++;
    }

    logger.log(`Concurrent results: ${successCount} Success, ${failCount} Failures`);

    // Verify final DB state mathematically
    const finalProfile = await prisma.profile.findUnique({ where: { userId } });
    const userPerks = await prisma.userPerk.count({ where: { userId, perkType: targetPerk.type } });
    const ledgerTx = await prisma.coinTransaction.findMany({ where: { userId } });

    logger.log(`Mathematical Verification:`);
    logger.log(`Initial Balance: ${targetPerk.costCoins}`);
    logger.log(`Final Balance: ${finalProfile?.coins}`);
    logger.log(`Perks Owned: ${userPerks}`);
    
    const debits = ledgerTx.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
    logger.log(`Total legitimate debits in ledger: ${debits}`);

    logger.logDBAssertion('Profile', `Only 1 successful purchase (${successCount} === 1)`, successCount === 1);
    logger.logDBAssertion('Profile', `Final balance is 0 (${finalProfile?.coins} === 0)`, finalProfile?.coins === 0);
    logger.logDBAssertion('UserPerk', `Perk owned exactly once (${userPerks} === 1)`, userPerks === 1);
    logger.logDBAssertion('CoinTransaction', `Ledger records exactly 1 deduction of ${targetPerk.costCoins} (${debits} === ${targetPerk.costCoins})`, debits === targetPerk.costCoins);
    
    logger.logResult('Economy Concurrency', true);
  } catch (error: any) {
    logger.logResult('Economy Concurrency', false);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
