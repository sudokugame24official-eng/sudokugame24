import { ForensicLogger } from './runner';
import { PrismaClient } from '@prisma/client';
import { io, Socket } from 'socket.io-client';

const prisma = new PrismaClient();
const logger = new ForensicLogger('03-duel.log');
const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function connectSocket(token: string): Promise<Socket> {
  return new Promise((resolve) => {
    const socket = io(WS_URL, {
      extraHeaders: {
        Cookie: `${token}` // Send the auth cookie
      },
      transports: ['websocket'],
    });
    socket.on('connect', () => resolve(socket));
  });
}

async function run() {
  logger.logTestStart('Duel Matchmaking, Synchronization & Payout');
  try {
    const userA = { email: `duela_${Date.now()}@test.com`, password: 'Password123!', username: `DuelA_${Date.now()}` };
    const userB = { email: `duelb_${Date.now()}@test.com`, password: 'Password123!', username: `DuelB_${Date.now()}` };

    const regA = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0];
    const dbUserA = await prisma.user.findUnique({ where: { email: userA.email } });

    const regB = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userB) });
    const cookieB = regB.headers.get('set-cookie')?.split(';')[0];
    const dbUserB = await prisma.user.findUnique({ where: { email: userB.email } });

    // Grant 1000 coins to both for wagers
    await prisma.profile.updateMany({
      where: { userId: { in: [dbUserA!.id, dbUserB!.id] } },
      data: { coins: 1000 }
    });

    const initialCoinsA = 1000;
    const initialCoinsB = 1000;

    logger.log(`User A (${dbUserA!.id}) and User B (${dbUserB!.id}) ready with 1000 coins.`);

    logger.logRequest('WS', 'Connecting sockets...');
    const socketA = await connectSocket(cookieA!);
    const socketB = await connectSocket(cookieB!);
    
    // Prepare listeners
    let matchId = '';
    const matchFoundPromise = Promise.all([
      new Promise<any>(res => socketA.once('match_found', res)),
      new Promise<any>(res => socketB.once('match_found', res))
    ]);

    logger.logRequest('WS EMIT', 'join_queue { difficulty: "EASY", betAmount: 50 }');
    socketA.emit('join_queue', { difficulty: 'EASY', betAmount: 50 });
    socketB.emit('join_queue', { difficulty: 'EASY', betAmount: 50 });

    const [matchDataA, matchDataB] = await matchFoundPromise;
    logger.logResponse(200, { matchDataA, matchDataB });
    matchId = matchDataA.matchId;

    logger.logDBAssertion('Socket', 'Both received match_found', matchDataA.matchId === matchDataB.matchId);
    
    // Verify Wager deduction mathematically
    const profA = await prisma.profile.findUnique({ where: { userId: dbUserA!.id } });
    const profB = await prisma.profile.findUnique({ where: { userId: dbUserB!.id } });
    
    logger.logDBAssertion('Profile', `User A wager deducted (${profA?.coins} === 950)`, profA?.coins === 950);
    logger.logDBAssertion('Profile', `User B wager deducted (${profB?.coins} === 950)`, profB?.coins === 950);

    // Make a move
    logger.logRequest('WS EMIT', `make_move (User A, correct move)`);
    
    const movePromiseA = new Promise<any>(res => socketA.once('duel_move', res));
    const movePromiseB = new Promise<any>(res => socketB.once('duel_move', res));

    // To submit a correct move, we need the solved board. The DB should have a puzzle for this match.
    // Wait, the match might be in Redis. Let's find the puzzle from DuelMatch DB model if it's there.
    // Or we can just guess a value. But if we guess wrong, we get -1. That's also good to test!
    
    socketA.emit('make_move', { matchId, row: 0, col: 0, value: 5 }); // 5 is arbitrary
    
    const moveA = await movePromiseA;
    const moveB = await movePromiseB;
    
    logger.logResponse(200, moveA);
    logger.logDBAssertion('Socket', 'Both received duel_move state sync', moveA.scoreP1 === moveB.scoreP1 && moveA.scoreP2 === moveB.scoreP2);
    
    if (moveA.isCorrect) {
      logger.logDBAssertion('Duel Logic', 'Correct move yielded +1 score', moveA.scoreP1 === 1 || moveA.scoreP2 === 1);
    } else {
      logger.logDBAssertion('Duel Logic', 'Incorrect move yielded -1 score', moveA.scoreP1 === -1 || moveA.scoreP2 === -1);
    }

    // Try a malicious move: out of bounds or negative score (server ignores payload score, calculates it)
    logger.logRequest('WS EMIT', 'make_move (Malicious value attempts)');
    socketB.emit('make_move', { matchId, row: 99, col: 99, value: 999 }); 
    // This should fail silently or not emit due to error
    await delay(500);

    // Test disconnection
    logger.logRequest('WS', 'Disconnecting Socket B');
    socketB.disconnect();

    const endPromise = new Promise<any>(res => socketA.once('duel_ended', res));
    const endResult = await endPromise;
    logger.logResponse(200, endResult);
    
    logger.logDBAssertion('Duel Logic', 'Match ended due to opponent disconnect', endResult.reason === 'opponent_disconnected');
    
    // Check if User A received the wager
    const profAFinal = await prisma.profile.findUnique({ where: { userId: dbUserA!.id } });
    logger.logDBAssertion('Profile', `User A rewarded pot (1000) (${profAFinal?.coins} === 1050)`, profAFinal?.coins === 1050);

    socketA.disconnect();
    
    logger.logResult('Duel E2E', true);
  } catch (error: any) {
    logger.logResult('Duel E2E', false);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
