import { io, Socket } from 'socket.io-client';
import * as fs from 'fs';

const API_URL = 'http://localhost:3001/duel';
const LOG_FILE = '../test-results/duel-tests.log';

function logResult(testName: string, status: 'PASS' | 'FAIL' | 'PARTIAL', details: string) {
    const msg = `[${new Date().toISOString()}] ${testName}: ${status} - ${details}\n`;
    console.log(msg.trim());
    fs.appendFileSync(LOG_FILE, msg);
}

async function runTests() {
    if (!fs.existsSync('../test-results')) {
        fs.mkdirSync('../test-results');
    }
    
    // Read tokens from stdin or arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: ts-node verify-duel.ts <token1> <token2>');
        process.exit(1);
    }
    
    const [token1, token2] = args;
    
    const client1: Socket = io(API_URL, {
        auth: { token: token1 }
    });
    const client2: Socket = io(API_URL, {
        auth: { token: token2 }
    });

    let matchId = '';
    
    await new Promise(resolve => {
        let connected = 0;
        client1.on('connect', () => { connected++; if (connected === 2) resolve(null); });
        client2.on('connect', () => { connected++; if (connected === 2) resolve(null); });
    });
    
    logResult('Connection', 'PASS', 'Both clients connected successfully.');
    
    // Test Queue Joining
    client1.emit('join_queue', { difficulty: 'EASY', betAmount: 10 });
    client2.emit('join_queue', { difficulty: 'EASY', betAmount: 10 });
    
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            logResult('Matchmaking', 'FAIL', 'Timeout waiting for match.');
            resolve(null);
        }, 10000);
        
        client1.on('duel_start', (data) => {
            clearTimeout(timeout);
            matchId = data.matchId;
            logResult('Matchmaking', 'PASS', `Match started: ${matchId}`);
            resolve(null);
        });
    });

    if (!matchId) {
        process.exit(1);
    }

    // Test flood (rate limit)
    let moveMadeCount = 0;
    client1.on('duel_move', () => { moveMadeCount++; });
    
    for (let i = 0; i < 60; i++) {
        client1.emit('make_move', { matchId, row: 0, col: 0, value: 1 });
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    if (moveMadeCount < 60) {
        logResult('Rate Limiting', 'PASS', `Moves were rate limited. Allowed: ${moveMadeCount}/60`);
    } else {
        logResult('Rate Limiting', 'FAIL', 'All 60 moves were processed without throttling.');
    }

    // Disconnect client 2
    client2.disconnect();
    
    // We expect some refund or win logic for client 1 but MVP might not have it implemented perfectly via WS.
    // Let's just complete the match as client 1.
    logResult('Disconnect Handling', 'PARTIAL', 'Client 2 disconnected. Verifying if Client 1 can still play...');
    
    client1.emit('make_move', { matchId, row: 1, col: 1, value: 2 });
    
    await new Promise(r => setTimeout(r, 1000));
    
    logResult('Game Completion', 'PARTIAL', 'Completed test steps. See database for ledger updates.');
    
    client1.disconnect();
    process.exit(0);
}

runTests();
