const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001';
const LOG_FILE = path.join(__dirname, '../test-results/economy-auth-tests.log');

const log = (msg) => {
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
        
        const cookies = loginRes.headers['set-cookie'] || [];
        const tokenCookie = cookies.find(c => c.startsWith('access_token='));
        let token = null;
        if (tokenCookie) {
            token = tokenCookie.split(';')[0].split('=')[1];
        }
        
        if (!token) throw new Error('No token returned');
        
        const reqConfig = {
            headers: { Cookie: `access_token=${token}` }
        };
        log('PASS: Registration & Login\n');

        log('Test 2: Solo Sudoku Exploit Checks');
        const startRes = await axios.post(`${API_URL}/sudoku/start`, { difficulty: 'EASY' }, reqConfig);
        const sessionId = startRes.data.sessionId;
        const solvedBoard = startRes.data.solvedBoard;
        
        // 2a. Submit valid
        log('Waiting 16 seconds for realistic solve time validation...');
        await new Promise(r => setTimeout(r, 16000));
        log('Submitting valid time...');
        const validRes = await axios.post(`${API_URL}/sudoku/${sessionId}/submit`, {
            finalBoard: solvedBoard, 
            timeSec: 300,
            mistakes: 0
        }, reqConfig);
        log(`PASS: Valid submit - Status ${validRes.status}`);

        // 2b. Submit duplicate (should fail)
        try {
            await axios.post(`${API_URL}/sudoku/${sessionId}/submit`, {
                finalBoard: solvedBoard,
                timeSec: 300,
                mistakes: 0
            }, reqConfig);
            log('FAIL: Duplicate submit succeeded');
        } catch (e) {
            log(`PASS: Duplicate submit failed - ${e.response?.status}`);
        }
        // 2c. Submit forged time (e.g., 1 second) (should be rejected/banned if suspicious)
        try {
            const startRes2 = await axios.post(`${API_URL}/sudoku/start`, { difficulty: 'HARD' }, reqConfig);
            const sessionId2 = startRes2.data.sessionId;
            const solvedBoard2 = startRes2.data.solvedBoard;
            
            await axios.post(`${API_URL}/sudoku/${sessionId2}/submit`, {
                finalBoard: solvedBoard2,
                timeSec: 1, // impossible
                mistakes: 0
            }, reqConfig);
            log('FAIL: Forged time (1s for HARD) succeeded!');
        } catch (e) {
            log(`PASS: Forged time rejected - ${e.response?.status}`);
        }

        log('\nTest 3: Concurrency (Race Condition) Check');
        // Let's attempt to buy something concurrently
        const concurrentReqs = Array.from({ length: 50 }).map(() => 
            axios.post(`${API_URL}/shop/buy-perk`, { perkId: 'perk_no_ads' }, reqConfig).catch(e => e.response)
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
                headers: { Cookie: `access_token=${token}123` }
            });
            log('FAIL: Invalid JWT accepted');
        } catch (e) {
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

    } catch (e) {
        log(`ERROR: ${e.message} ${JSON.stringify(e.response?.data || '')}`);
    }
}

runTests();
