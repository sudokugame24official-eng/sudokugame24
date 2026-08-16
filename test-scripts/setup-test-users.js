const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config({ path: '../../packages/database/.env' });
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('DATABASE_URL and JWT_SECRET must be provided via environment (packages/database/.env).');
  process.exit(1);
}


const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

async function setup() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const res = await client.query('SELECT id FROM "User" LIMIT 2');
  if (res.rows.length < 2) {
    console.error("Not enough users in DB");
    process.exit(1);
  }

  const u1_id = res.rows[0].id;
  const u2_id = res.rows[1].id;

  // give 1000 coins just in case
  await client.query(
    'INSERT INTO "CoinTransaction" (id, "userId", amount, "balanceBefore", "balanceAfter", type, "referenceId") VALUES ($1, $2, 1000, 0, 1000, $3, $4)',
    [crypto.randomUUID(), u1_id, 'DAILY_REWARD', 'test_topup_' + Date.now() + '_' + u1_id]
  );
  await client.query(
    'INSERT INTO "CoinTransaction" (id, "userId", amount, "balanceBefore", "balanceAfter", type, "referenceId") VALUES ($1, $2, 1000, 0, 1000, $3, $4)',
    [crypto.randomUUID(), u2_id, 'DAILY_REWARD', 'test_topup_' + Date.now() + '_' + u2_id]
  );
  
  // Also we need to make sure they have a Profile otherwise joining fails!
  try {
     await client.query('INSERT INTO "Profile" ("userId", username, rating, coins) VALUES ($1, $2, 1500, 1000)', [u1_id, 'user_' + u1_id]);
     await client.query('INSERT INTO "Profile" ("userId", username, rating, coins) VALUES ($1, $2, 1500, 1000)', [u2_id, 'user_' + u2_id]);
  } catch(e) {
     // Ignore, they probably already have profiles
     await client.query('UPDATE "Profile" SET coins = 1000 WHERE "userId" IN ($1, $2)', [u1_id, u2_id]);
  }

  const token1 = jwt.sign({ sub: u1_id }, jwtSecret);
  const token2 = jwt.sign({ sub: u2_id }, jwtSecret);

  console.log(JSON.stringify({ token1, token2 }));
  await client.end();
}

setup().catch(console.error);
