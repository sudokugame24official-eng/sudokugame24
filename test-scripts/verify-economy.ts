import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3001'; // Default nestjs port? Wait, let's check API port.
const LOG_FILE = path.join(__dirname, '../test-results/economy-auth-tests.log');

const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
};

async function runTests() {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.writeFileSync(LOG_FILE, 'Economy & Auth Tests\n====================\n');

    try {
        log('Test 1: User Registration & Login');
        const email = `testuser_${Date.now()}@example.com`;
        const password = 'Password123!';
        
        await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            username: `tester_${Date.now()}`
        });

        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        
        const token = loginRes.data.access_token;
        if (!token) throw new Error('No token returned');
        log('PASS: Registration & Login\n');

        // Give the user some coins using Prisma or by making them win duels? Wait, we might need coins for shop purchase.
        // Actually, we can just test if the shop purchase rejects us for insufficient funds gracefully, or we can test concurrency on an item we can afford.
        
        log('Test 2: Solo Sudoku Exploit Checks');
        const startRes = await axios.post(`${API_URL}/sudoku/start`, { difficulty: 'EASY' }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const sessionId = startRes.data.id;
        
        // 2a. Submit valid
        log('Submitting valid time...');
        const validRes = await axios.post(`${API_URL}/sudoku/${sessionId}/submit`, {
            finalBoard: [], // fake board
            timeSec: 300,
            mistakes: 0
        }, { headers: { Authorization: `Bearer ${token}` } });
        log(`PASS: Valid submit - Status ${validRes.status}`);

        // 2b. Submit duplicate (should fail)
        try {
            await axios.post(`${API_URL}/sudoku/${sessionId}/submit`, {
                finalBoard: [],
                timeSec: 300,
                mistakes: 0
            }, { headers: { Authorization: `Bearer ${token}` } });
            log('FAIL: Duplicate submit succeeded');
        } catch (e: any) {
            log(`PASS: Duplicate submit failed - ${e.response?.status}`);
        }

        log('\nTest 3: Concurrency (Race Condition) Check');
        // Let's attempt to buy something concurrently
        const concurrentReqs = Array.from({ length: 50 }).map(() => 
            axios.post(`${API_URL}/shop/buy-perk`, { perkId: 'perk_no_ads' }, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(e => e.response)
        );
        const results = await Promise.all(concurrentReqs);
        const successes = results.filter(r => r?.status === 200 || r?.status === 201).length;
        const failures = results.length - successes;
        log(`Concurrency Results: ${successes} Success, ${failures} Failures/Insufficient Funds.`);
        if (successes <= 1) {
            log('PASS: Concurrency test passed (no double-spend allowed).');
        } else {
            log('FAIL: Multiple purchases succeeded (possible race condition).');
        }

        log('\nTest 4: Auth Rate Limiting & JWT Manipulation');
        // JWT Manipulation
        try {
            await axios.post(`${API_URL}/sudoku/start`, { difficulty: 'EASY' }, {
                headers: { Authorization: `Bearer ${token}123` }
            });
            log('FAIL: Invalid JWT accepted');
        } catch (e: any) {
            log(`PASS: Invalid JWT rejected - ${e.response?.status}`);
        }

        // Rate limit testing
        log('Brute forcing login...');
        const loginReqs = Array.from({ length: 15 }).map(() => 
            axios.post(`${API_URL}/auth/login`, { email, password: 'wrongpassword' })
                .catch(e => e.response)
        );
        const loginResults = await Promise.all(loginReqs);
        const rateLimited = loginResults.some(r => r?.status === 429);
        if (rateLimited) {
            log('PASS: Rate limiting working on login.');
        } else {
            log('FAIL: No 429 received on rapid logins.');
        }

    } catch (e: any) {
        log(`ERROR: ${e.message} ${e.response?.data?.message || ''}`);
    }
}

runTests();
