import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';
import { PresenceGateway } from '../presence/presence.gateway';
import { FriendsService } from '../friends/friends.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('@repo/database', () => ({
  prisma: {
    privateMessage: { findMany: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
    friendship: { findFirst: jest.fn() },
    profile: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

function makeServer() {
  const to = jest.fn().mockReturnThis();
  const inFn = jest.fn().mockReturnThis();
  return {
    to,
    in: inFn,
    emit: jest.fn(),
    fetchSockets: jest.fn().mockResolvedValue([]),
    use: jest.fn(),
  };
}

describe('P1-M: multi-instance chat delivery', () => {
  let gateway: ChatGateway;
  let chatService: { sendMessage: jest.Mock; markConversationRead: jest.Mock };
  let server: any;
  let client: any;

  beforeEach(() => {
    chatService = {
      sendMessage: jest.fn().mockResolvedValue({ id: 'm1', content: 'hi' }),
      markConversationRead: jest.fn().mockResolvedValue({}),
    };
    gateway = new ChatGateway(chatService as any, { getClient: () => ({}) } as any);
    server = makeServer();
    (gateway as any).server = server;
    client = {
      id: 'socket-A',
      data: { user: { id: 'user-A' } },
      emit: jest.fn(),
      join: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('authenticate joins the personal Redis room user_{id}', async () => {
    await gateway.handleAuthenticate(client);
    expect(client.join).toHaveBeenCalledWith('user_user-A');
    expect(server.to).toHaveBeenCalledWith('user_user-A');
  });

  it('send_message delivers to the RECIPIENT ROOM, not a local socket map', async () => {
    await gateway.handleSendMessage({ receiverId: 'user-B', content: 'hello' }, client);

    expect(chatService.sendMessage).toHaveBeenCalledWith('user-A', 'user-B', 'hello');
    // THE multi-instance assertion: delivery targets the room, which the
    // Redis adapter resolves on ANY instance (the old code looked up a local
    // Map and silently dropped cross-instance messages).
    expect(server.to).toHaveBeenCalledWith('user_user-B');
    expect(client.emit).toHaveBeenCalledWith('message_sent', expect.anything());
  });

  it('typing and mark_read are room-scoped too', async () => {
    await gateway.handleTyping({ receiverId: 'user-B' }, client);
    expect(server.to).toHaveBeenCalledWith('user_user-B');

    await gateway.handleMarkRead({ conversationWith: 'user-B' }, client);
    expect(chatService.markConversationRead).toHaveBeenCalledWith('user-A', 'user-B');
  });

  it('unauthenticated sockets cannot send messages', async () => {
    const anon = { id: 'anon', data: {}, emit: jest.fn() };
    await gateway.handleSendMessage({ receiverId: 'x', content: 'y' }, anon as any);
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });
});

describe('P1-M: presence gateway (ZSET + handshake auth)', () => {
  let presence: PresenceGateway;
  let redis: any;
  let server: any;
  const friendsService = { getFriends: jest.fn().mockResolvedValue([]) };
  const jwtService = new JwtService({ secret: 't' });

  beforeEach(() => {
    const zadd = jest.fn().mockResolvedValue(1);
    const sadd = jest.fn().mockResolvedValue(1);
    const zscore = jest.fn().mockResolvedValue(String(Date.now()));
    redis = { zadd, sadd, zscore, zrem: jest.fn(), srem: jest.fn() };
    presence = new PresenceGateway(
      { getClient: () => redis } as any,
      friendsService as any,
      jwtService,
    );
    server = makeServer();
    (presence as any).server = server;
  });

  it('registers a handshake middleware that verifies the JWT', () => {
    presence.afterInit(server as any);
    expect(server.use).toHaveBeenCalled();
    const middleware = server.use.mock.calls[0][0];
    const next = jest.fn();
    const token = jwtService.sign({ sub: 'user-1' });
    const socket = { handshake: { auth: { token }, headers: {} }, data: {} as any };
    middleware(socket, next);
    expect(socket.data.userId).toBe('user-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects handshakes without a token', () => {
    presence.afterInit(server as any);
    const middleware = server.use.mock.calls[0][0];
    const next = jest.fn();
    middleware({ handshake: { auth: {}, headers: {} }, data: {} }, next);
    expect(next).toHaveBeenCalledWith(new Error('unauthorized'));
  });

  it('connection joins room + touches the ZSET heartbeat', async () => {
    const client = {
      id: 's1',
      data: { userId: 'user-1' },
      join: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
    };
    await presence.handleConnection(client as any);
    expect(client.join).toHaveBeenCalledWith('user_user-1');
    expect(redis.zadd).toHaveBeenCalledWith('presence:online_zset', expect.any(Number), 'user-1');
  });

  it('disconnect marks offline ONLY when it was the last socket', async () => {
    const client = { id: 's1', data: { userId: 'user-1' } };
    server.in.mockReturnValue({ fetchSockets: jest.fn().mockResolvedValue([{ id: 's2' }]) });
    await presence.handleDisconnect(client as any);
    expect(redis.zrem).not.toHaveBeenCalled(); // another device still connected

    server.in.mockReturnValue({ fetchSockets: jest.fn().mockResolvedValue([]) });
    await presence.handleDisconnect(client as any);
    expect(redis.zrem).toHaveBeenCalledWith('presence:online_zset', 'user-1');
  });

  it('isOnline uses the heartbeat TTL', async () => {
    redis.zscore.mockResolvedValue(String(Date.now() - 1000));
    expect(await (presence as any).isOnline('u')).toBe(true);

    redis.zscore.mockResolvedValue(String(Date.now() - 10 * 60 * 1000));
    expect(await (presence as any).isOnline('u')).toBe(false);

    redis.zscore.mockResolvedValue(null);
    expect(await (presence as any).isOnline('u')).toBe(false);
  });
});
