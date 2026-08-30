import { PresenceGateway } from './presence.gateway';
import { JwtService } from '@nestjs/jwt';

jest.mock('@repo/database', () => ({
  prisma: {
    block: { findFirst: jest.fn() },
    profile: { findUnique: jest.fn() },
    privateMessage: { updateMany: jest.fn() },
    friendship: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

const { prisma } = require('@repo/database');

function makeRedis() {
  const store = new Map<string, string>();
  return {
    store,
    zadd: jest.fn(),
    sadd: jest.fn(),
    zscore: jest.fn().mockResolvedValue(null),
    zrem: jest.fn(),
    srem: jest.fn(),
    get: jest.fn(async (k: string) => store.get(k) ?? null),
    set: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
      return 'OK';
    }),
    del: jest.fn(async (k: string) => (store.delete(k) ? 1 : 0)),
  };
}

function makeGateway(redis: any, duelService: any, friends: any[]) {
  const server = {
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    use: jest.fn(),
  };
  const g = new PresenceGateway(
    { getClient: () => redis } as any,
    { getFriends: jest.fn().mockResolvedValue(friends) } as any,
    new JwtService({ secret: 't' }),
    duelService,
  );
  (g as any).server = server;
  return { g, server };
}

describe('P1-N: friend challenge lifecycle (TTL invitation)', () => {
  let redis: any;
  let duelService: { createFriendMatch: jest.Mock };
  let server: any;
  let gateway: PresenceGateway;

  const challenger = {
    id: 'user-A',
    data: { user: { id: 'user-A', username: 'alice' } },
  };
  const friend = {
    id: 'user-B',
    data: { user: { id: 'user-B', username: 'bob' } },
  };

  beforeEach(() => {
    redis = makeRedis();
    duelService = {
      createFriendMatch: jest.fn().mockResolvedValue({ id: 'match-1' }),
    };
    ({ g: gateway, server } = makeGateway(redis, duelService, [
      { id: 'user-B' },
    ]));
    (prisma.block.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      username: 'x',
      rating: 1200,
    });
  });

  it('challenge creates a Redis invitation WITH TTL and notifies the friend room', async () => {
    const res = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-B',
      difficulty: 'HARD',
      betAmount: 50,
    });

    expect(res.success).toBe(true);
    expect(res.expiresIn).toBe(60);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^fchallenge:fc_/),
      expect.any(String),
      'EX',
      60,
    );
    expect(server.to).toHaveBeenCalledWith('user_user-B');
    const event = server.emit.mock.calls[0];
    expect(event[0]).toBe('duel_challenge_received');
    expect(event[1].challengeId).toBe(res.challengeId);
    expect(event[1].expiresIn).toBe(60);
  });

  it('NOT friends -> refused', async () => {
    ({ g: gateway, server } = makeGateway(redis, duelService, [
      { id: 'someone-else' },
    ]));
    const res = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-B',
      difficulty: 'EASY',
    });
    expect(res.error).toBe('Not friends');
  });

  it('BLOCKED in either direction -> the challenge cannot be sent', async () => {
    (prisma.block.findFirst as jest.Mock).mockResolvedValue({ id: 'b1' });
    const res = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-B',
      difficulty: 'EASY',
    });
    expect(res.error).toBe('Not available');
  });

  it('self-challenge refused', async () => {
    const res = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-A',
      difficulty: 'EASY',
    });
    expect(res.error).toBe('Cannot challenge yourself');
  });

  it('ACCEPT consumes the invitation ONCE and creates the match', async () => {
    const { success, challengeId } = await (gateway as any).handleChallenge(
      challenger,
      {
        friendId: 'user-B',
        difficulty: 'HARD',
        betAmount: 20,
      },
    );
    expect(success).toBe(true);

    const res = await (gateway as any).handleChallengeRespond(friend, {
      challengeId,
      accept: true,
    });
    expect(res).toMatchObject({
      success: true,
      status: 'accepted',
      matchId: 'match-1',
    });
    expect(duelService.createFriendMatch).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-A', username: 'x' }),
      expect.objectContaining({ userId: 'user-B' }),
      'HARD',
      20,
    );

    // second response: already consumed
    const res2 = await (gateway as any).handleChallengeRespond(friend, {
      challengeId,
      accept: true,
    });
    expect(res2.error).toBe('expired');
  });

  it('DECLINE notifies the challenger and consumes the invitation', async () => {
    const { challengeId } = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-B',
      difficulty: 'EASY',
    });
    const res = await (gateway as any).handleChallengeRespond(friend, {
      challengeId,
      accept: false,
    });

    expect(res.status).toBe('declined');
    expect(duelService.createFriendMatch).not.toHaveBeenCalled();
    const declineEvent = server.emit.mock.calls.find(
      (c) => c[0] === 'challenge_declined',
    );
    expect(declineEvent).toBeDefined();
    expect(declineEvent[1].byUserId).toBe('user-B');
  });

  it('only the INVITED user can respond', async () => {
    const { challengeId } = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-B',
      difficulty: 'EASY',
    });
    const intruder = { data: { user: { id: 'user-C' } } };
    const res = await (gateway as any).handleChallengeRespond(intruder, {
      challengeId,
      accept: true,
    });
    expect(res.error).toBe('not_your_challenge');
    expect(duelService.createFriendMatch).not.toHaveBeenCalled();
  });

  it('EXPIRED invitations (Redis TTL elapsed) answer "expired"', async () => {
    const res = await (gateway as any).handleChallengeRespond(friend, {
      challengeId: 'fc_gone',
      accept: true,
    });
    expect(res.error).toBe('expired');
  });

  it('CANCEL by the challenger notifies the friend and clears the key', async () => {
    const { challengeId } = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-B',
      difficulty: 'EASY',
    });
    const res = await (gateway as any).handleChallengeCancel(challenger, {
      challengeId,
    });
    expect(res.status).toBe('cancelled');

    const cancelledEvent = server.emit.mock.calls.find(
      (c) => c[0] === 'challenge_cancelled',
    );
    expect(cancelledEvent).toBeDefined();
  });

  it('someone ELSE cannot cancel the challenge', async () => {
    const { challengeId } = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-B',
      difficulty: 'EASY',
    });
    const res = await (gateway as any).handleChallengeCancel(friend, {
      challengeId,
    });
    expect(res.error).toBe('not_your_challenge');
  });

  it('insufficient coins for the wager -> challenge_error to the challenger', async () => {
    duelService.createFriendMatch.mockRejectedValue(
      new Error('assez de coins'),
    );
    const { challengeId } = await (gateway as any).handleChallenge(challenger, {
      friendId: 'user-B',
      difficulty: 'HARD',
      betAmount: 9999,
    });
    const res = await (gateway as any).handleChallengeRespond(friend, {
      challengeId,
      accept: true,
    });
    expect(res.error).toContain('coins');
    const errEvent = server.emit.mock.calls.find(
      (c) => c[0] === 'challenge_error',
    );
    expect(errEvent).toBeDefined();
  });
});
