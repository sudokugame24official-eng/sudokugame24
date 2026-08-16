import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/auth.dto';
import { StartSessionDto, SubmitSessionDto } from '../sudoku/dto/sudoku.dto';
import { CreateForumPostDto } from '../forum/dto/forum.dto';
import { GrantCoinsDto, BanUserDto } from '../admin/dto/admin.dto';
import { BuyProductDto, CreateProductDto } from '../shop/dto/shop.dto';
import { SendFriendRequestDto } from '../friends/dto/friends.dto';

/**
 * P1-A regression: exercises the EXACT global ValidationPipe configured in
 * main.ts (same options) against every DTO family. Each case must throw
 * BadRequestException (HTTP 400 at the framework level).
 */
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  forbidUnknownValues: true,
});

const transform = async (metatype: any, value: any) =>
  pipe.transform(value, { type: 'body', metatype } as any);

const expect400 = async (metatype: any, value: any) => {
  try {
    await transform(metatype, value);
  } catch (e) {
    expect(e).toBeInstanceOf(BadRequestException);
    return;
  }
  throw new Error(`Expected BadRequestException for ${JSON.stringify(value).slice(0, 80)}`);
};

const validBoard = () => Array.from({ length: 9 }, () => Array(9).fill(0));

describe('P1-A: global input validation (400 on bad payloads)', () => {
  it('rejects malformed payloads', async () => {
    await expect400(RegisterDto, null);
    await expect400(RegisterDto, 'not-an-object');
    await expect400(RegisterDto, []);
  });

  it('rejects unknown fields (forbidNonWhitelisted)', async () => {
    await expect400(RegisterDto, {
      email: 'a@b.com',
      password: 'password123',
      username: 'alice',
      isAdmin: true, // privilege escalation attempt via mass assignment
    });
  });

  it('rejects invalid enums', async () => {
    await expect400(StartSessionDto, { difficulty: 'IMPOSSIBLE' });
    await expect400(StartSessionDto, { difficulty: 42 });
  });

  it('rejects invalid email formats', async () => {
    await expect400(RegisterDto, { email: 'not-an-email', password: 'password123', username: 'alice' });
  });

  it('rejects short passwords and bad usernames', async () => {
    await expect400(RegisterDto, { email: 'a@b.com', password: 'short', username: 'alice' });
    await expect400(RegisterDto, { email: 'a@b.com', password: 'password123', username: 'bad name!' });
  });

  it('rejects negative and non-integer coin grant amounts', async () => {
    await expect400(GrantCoinsDto, { userId: 'u1', amount: -500, reason: 'nope' });
    await expect400(GrantCoinsDto, { userId: 'u1', amount: 12.5, reason: 'nope' });
    await expect400(GrantCoinsDto, { userId: 'u1', amount: 'lots', reason: 'nope' });
  });

  it('rejects malformed sudoku boards (10x10, floats, out-of-range)', async () => {
    const tenRows = Array.from({ length: 10 }, () => Array(9).fill(0));
    await expect400(SubmitSessionDto, { finalBoard: tenRows, timeSec: 60, mistakes: 0 });

    const floatBoard = validBoard();
    floatBoard[0][0] = 1.5;
    await expect400(SubmitSessionDto, { finalBoard: floatBoard, timeSec: 60, mistakes: 0 });

    const bigBoard = validBoard();
    bigBoard[3][3] = 42;
    await expect400(SubmitSessionDto, { finalBoard: bigBoard, timeSec: 60, mistakes: 0 });
  });

  it('rejects negative/oversized time and oversized text', async () => {
    await expect400(SubmitSessionDto, { finalBoard: validBoard(), timeSec: -5, mistakes: 0 });
    await expect400(SubmitSessionDto, { finalBoard: validBoard(), timeSec: 999999999, mistakes: 0 });
    await expect400(CreateForumPostDto, {
      title: 'ok title',
      content: 'x'.repeat(20001),
      categoryId: 'b0e6f2c1-9d1e-4b2a-9c3d-6e5f7a8b9c0d',
    });
  });

  it('rejects non-UUID category ids', async () => {
    await expect400(CreateForumPostDto, { title: 'ok', content: 'ok', categoryId: 'not-a-uuid' });
  });

  it('rejects invalid product prices and types', async () => {
    await expect400(CreateProductDto, { name: 'Item', priceCoins: -10, type: 'perk' });
    await expect400(CreateProductDto, { name: 'Item', priceCoins: 100, type: 'weird' });
    await expect400(CreateProductDto, { name: 'Item', priceCoins: 100, type: 'perk', entitlement: 'GOD_MODE' });
  });

  it('rejects empty ban reasons and bad friend usernames', async () => {
    await expect400(BanUserDto, { reason: '' });
    await expect400(BanUserDto, { reason: 'x'.repeat(501) });
    await expect400(SendFriendRequestDto, { username: 'no' });
    await expect400(SendFriendRequestDto, { username: '../etc/passwd' });
  });

  it('rejects non-string product ids', async () => {
    await expect400(BuyProductDto, { productId: { $ne: null } });
    await expect400(BuyProductDto, {});
  });

  it('ACCEPTS valid payloads (no false positives) and transforms them', async () => {
    const out = await transform(StartSessionDto, { difficulty: 'HARD' });
    expect(out).toBeInstanceOf(StartSessionDto);
    expect(out.difficulty).toBe('HARD');

    const reg = await transform(RegisterDto, {
      email: 'player@example.com',
      password: 'password123',
      username: 'player_1',
    });
    expect(reg.username).toBe('player_1');

    const board = validBoard();
    board[0][0] = 5;
    const sub = await transform(SubmitSessionDto, { finalBoard: board, timeSec: 120, mistakes: 1 });
    expect(sub.timeSec).toBe(120);
    expect(sub.finalBoard[0][0]).toBe(5);
  });
});
