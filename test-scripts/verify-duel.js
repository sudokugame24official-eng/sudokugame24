const { io } = require('socket.io-client');
const fs = require('fs');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../packages/database/.env' });
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('DATABASE_URL and JWT_SECRET must be provided via environment (packages/database/.env).');
  process.exit(1);
}


const API_URL = 'http://localhost:3001/duel';
const LOG_FILE = '../test-results/duel-tests.log';
const dbUrl = process.env.DATABASE_URL;

function logResult(testName, status, details) {
    const msg = `[${new Date().toISOString()}] ${testName}: ${status} - ${details}\n`;
    console.log(msg.trim());
    fs.appendFileSync(LOG_FILE, msg);
}

async function runTests() {
    if (!fs.existsSync('../test-results')) {
        fs.mkdirSync('../test-results');
    }
    fs.writeFileSync(LOG_FILE, '');
    
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node verify-duel.js <token1> <token2>');
        process.exit(1);
    }
    
    const [token1, token2] = args;
    const u1_id = jwt.decode(token1).sub;
    const u2_id = jwt.decode(token2).sub;

    const pgClient = new Client({ connectionString: dbUrl });
    await pgClient.connect();

    async function getCoins(userId) {
        const res = await pgClient.query('SELECT coins FROM "Profile" WHERE "userId" = $1', [userId]);
        return res.rows[0].coins;
    }

    const startCoins1 = await getCoins(u1_id);
    const startCoins2 = await getCoins(u2_id);

    console.log(`Starting balances: Player 1 = ${startCoins1}, Player 2 = ${startCoins2}`);
    
    // --- Test 1: Queue Disconnect Refund ---
    let client1 = io(API_URL, { auth: { token: token1 } });
    await new Promise(r => client1.on('connect', r));

    client1.emit('join_queue', { difficulty: 'EASY', betAmount: 10 });
    await new Promise(r => setTimeout(r, 1000)); // wait for join

    client1.disconnect();
    await new Promise(r => setTimeout(r, 1000)); // wait for refund

    const refundCoins1 = await getCoins(u1_id);
    if (refundCoins1 === startCoins1) {
        logResult('Disconnect Refund', 'PASS', `Queue refund processed. Balance: ${refundCoins1}`);
    } else {
        logResult('Disconnect Refund', 'FAIL', `Queue refund failed. Expected ${startCoins1}, got ${refundCoins1}`);
    }

    // --- Reconnect Client 1 ---
    client1 = io(API_URL, { auth: { token: token1 } });
    const client2 = io(API_URL, { auth: { token: token2 } });

    await new Promise(resolve => {
        let connected = 0;
        client1.on('connect', () => { connected++; if (connected === 2) resolve(null); });
        client2.on('connect', () => { connected++; if (connected === 2) resolve(null); });
    });
    
    logResult('Connection', 'PASS', 'Both clients connected successfully.');
    
    let matchId = '';
    let startData = null;

    // --- Test 2: Matchmaking and Escrow ---
    client1.emit('join_queue', { difficulty: 'EASY', betAmount: 10 });
    client2.emit('join_queue', { difficulty: 'EASY', betAmount: 10 });
    
    await new Promise((resolve) => {
        const timeout = setTimeout(() => {
            logResult('Matchmaking', 'FAIL', 'Timeout waiting for match.');
            resolve(null);
        }, 5000); 
        
        client1.on('duel_start', (data) => {
            clearTimeout(timeout);
            matchId = data.matchId;
            startData = data;
            logResult('Matchmaking', 'PASS', `Match started: ${matchId}`);
            resolve(null);
        });
    });

    if (!matchId || !startData) {
        process.exit(1);
    }

    await new Promise(r => setTimeout(r, 1000));

    const postMatchCoins1 = await getCoins(u1_id);
    const postMatchCoins2 = await getCoins(u2_id);
    
    if (postMatchCoins1 === refundCoins1 - 10 && postMatchCoins2 === startCoins2 - 10) {
        logResult('Bet Escrow', 'PASS', `Coins deducted correctly. New balances: ${postMatchCoins1}, ${postMatchCoins2}`);
    } else {
        logResult('Bet Escrow', 'FAIL', `Balances incorrect. Expected ${refundCoins1 - 10}, got ${postMatchCoins1}`);
    }

    // --- Test 3: Rate Limiting ---
    let moveMadeCount = 0;
    client2.on('duel_move', () => { moveMadeCount++; });
    
    for (let i = 0; i < 60; i++) {
        client2.emit('make_move', { matchId, row: 0, col: 0, value: 1 });
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    if (moveMadeCount < 60) {
        logResult('Rate Limiting', 'PASS', `Moves were rate limited. Allowed: ${moveMadeCount}/60`);
    } else {
        logResult('Rate Limiting', 'FAIL', 'All 60 moves were processed without throttling.');
    }

    // --- Test 4: Game Completion ---
    let isGameOver = false;
    client1.on('exception', err => console.log('C1 Exception:', err));
    client1.on('chat_error', err => console.log('C1 Chat Error:', err));
    
    client1.on('duel_end', (data) => {
        isGameOver = true;
        logResult('Game Completion', 'PASS', `Duel ended organically. Winner: ${data.winnerId}`);
    });

    // Auto-play the board as Client 1 to win
    const board = startData.board;
    const solved = startData.solvedBoard;
    
    console.log("Solving board...");
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                client1.emit('make_move', { matchId, row: r, col: c, value: solved[r][c] });
                // wait 200ms to be safe
                await new Promise(res => setTimeout(res, 200));
            }
        }
    }

    let checks = 0;
    while (!isGameOver && checks < 50) {
        await new Promise(r => setTimeout(r, 500));
        checks++;
    }

    if (!isGameOver) {
        logResult('Game Completion', 'FAIL', 'Duel did not end after board was completed.');
    }

    const finalCoins1 = await getCoins(u1_id);
    const finalCoins2 = await getCoins(u2_id);

    if (finalCoins1 >= postMatchCoins1 + 20) {
        logResult('Payout', 'PASS', `Payout received correctly. P1 balance: ${finalCoins1}`);
    } else {
        logResult('Payout', 'FAIL', `Payout incorrect. Expected >= ${postMatchCoins1 + 20}, got ${finalCoins1}`);
    }
    
    client1.disconnect();
    client2.disconnect();
    await pgClient.end();
    process.exit(0);
}

runTests();
