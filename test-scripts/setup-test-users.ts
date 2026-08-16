import { Client } from 'pg';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../packages/database/.env' });
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('DATABASE_URL and JWT_SECRET must be provided via environment (packages/database/.env).');
  process.exit(1);
}


const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

async function setup() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const user1Email = 'testuser1@sudoku.com';
  const user2Email = 'testuser2@sudoku.com';

  async function getOrCreateUser(email: string, username: string) {
    let res = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
    let userId;
    if (res.rows.length === 0) {
      const insertRes = await client.query(
        'INSERT INTO "User" (email, password) VALUES ($1, $2) RETURNING id',
        [email, 'dummy_password']
      );
      userId = insertRes.rows[0].id;
      
      await client.query(
        'INSERT INTO "Profile" ("userId", username, rating) VALUES ($1, $2, 1500)',
        [userId, username]
      );
      
      await client.query(
        'INSERT INTO "CoinLedger" ("userId", amount, type, referenceId) VALUES ($1, 1000, $2, $3)',
        [userId, 'DAILY_REWARD', 'initial_setup']
      );
    } else {
      userId = res.rows[0].id;
    }
    
    // give 1000 coins just in case
    await client.query(
      'INSERT INTO "CoinLedger" ("userId", amount, type, referenceId) VALUES ($1, 1000, $2, $3)',
      [userId, 'DAILY_REWARD', 'test_topup_' + Date.now()]
    );
    
    const token = jwt.sign({ sub: userId }, jwtSecret);
    return { userId, token };
  }

  const u1 = await getOrCreateUser(user1Email, 'TestUser1');
  const u2 = await getOrCreateUser(user2Email, 'TestUser2');

  console.log(JSON.stringify({ u1, u2 }));
  await client.end();
}

setup().catch(console.error);
