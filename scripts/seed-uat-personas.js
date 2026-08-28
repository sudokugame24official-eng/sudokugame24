/**
 * HUMAN ACCEPTANCE TEST — SEED SCRIPT
 * Creates 4 dedicated UAT accounts for the human owner acceptance phase.
 *
 * RUN: node scripts/seed-uat-personas.js
 *
 * Role enum values (from schema.prisma):
 *   GUEST | MEMBER | PREMIUM_MEMBER | SUPPORT_AGENT |
 *   CONTENT_MANAGER | ANALYST | MODERATOR | ADMIN | SUPER_ADMIN
 *
 * PERSONAS:
 *   USER_A     — test_usera@sudoku.local   | TestPass_A1!     | MEMBER
 *   USER_B     — test_userb@sudoku.local   | TestPass_B2!     | MEMBER
 *   MODERATOR  — test_mod@sudoku.local     | TestPass_M3!     | MODERATOR
 *   SUPER_ADMIN— admin@sudoku.com          | Admin@Sudoku2026!| SUPER_ADMIN
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const personas = [
  {
    email: 'test_usera@sudoku.local',
    password: 'TestPass_A1!',
    username: 'PlayerAlpha',
    role: 'MEMBER',
    isEmailVerified: true,
    coins: 750,
    xp: 3200,
    level: 8,
    gamesPlayed: 42,
    gamesWon: 28,
    currentStreak: 3,
    longestStreak: 7,
    rating: 1350,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=PlayerAlpha',
  },
  {
    email: 'test_userb@sudoku.local',
    password: 'TestPass_B2!',
    username: 'PlayerBeta',
    role: 'MEMBER',
    isEmailVerified: true,
    coins: 200,
    xp: 900,
    level: 3,
    gamesPlayed: 12,
    gamesWon: 5,
    currentStreak: 1,
    longestStreak: 3,
    rating: 1050,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=PlayerBeta',
  },
  {
    email: 'test_mod@sudoku.local',
    password: 'TestPass_M3!',
    username: 'ModeratorMax',
    role: 'MODERATOR',
    isEmailVerified: true,
    coins: 1500,
    xp: 9000,
    level: 20,
    gamesPlayed: 150,
    gamesWon: 110,
    currentStreak: 5,
    longestStreak: 14,
    rating: 1600,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ModeratorMax',
  },
  {
    email: 'admin@sudoku.com',
    password: 'Admin@Sudoku2026!',
    username: 'SudokuAdmin',
    role: 'SUPER_ADMIN',
    isEmailVerified: true,
    coins: 10000,
    xp: 99999,
    level: 100,
    gamesPlayed: 999,
    gamesWon: 900,
    currentStreak: 30,
    longestStreak: 60,
    rating: 2000,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
  },
];

async function upsertPersona(p) {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(p.password, salt);

  const existing = await prisma.user.findUnique({
    where: { email: p.email },
    include: { profile: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { email: p.email },
      data: {
        passwordHash,
        role: p.role,
        isEmailVerified: p.isEmailVerified,
      },
    });
    if (existing.profile) {
      await prisma.profile.update({
        where: { userId: existing.id },
        data: {
          coins: p.coins,
          xp: p.xp,
          level: p.level,
          gamesPlayed: p.gamesPlayed,
          gamesWon: p.gamesWon,
          currentStreak: p.currentStreak,
          longestStreak: p.longestStreak,
          rating: p.rating,
          avatarUrl: p.avatarUrl,
        },
      });
    }
    console.log(`  ✓ UPDATED  ${p.role.padEnd(15)} ${p.email}`);
    return;
  }

  await prisma.user.create({
    data: {
      email: p.email,
      passwordHash,
      role: p.role,
      isEmailVerified: p.isEmailVerified,
      profile: {
        create: {
          username: p.username,
          avatarUrl: p.avatarUrl,
          coins: p.coins,
          xp: p.xp,
          level: p.level,
          gamesPlayed: p.gamesPlayed,
          gamesWon: p.gamesWon,
          currentStreak: p.currentStreak,
          longestStreak: p.longestStreak,
          rating: p.rating,
        },
      },
    },
  });
  console.log(`  ✓ CREATED  ${p.role.padEnd(15)} ${p.email}`);
}

async function main() {
  console.log('\n=== UAT PERSONA SEED ===\n');
  for (const p of personas) {
    await upsertPersona(p);
  }

  console.log('\n╔════════════════════╦══════════════════════════════╦══════════════════════╦══════╦═════╗');
  console.log('║ Role               ║ Email                        ║ Password             ║Coins ║ Lv  ║');
  console.log('╠════════════════════╬══════════════════════════════╬══════════════════════╬══════╬═════╣');
  console.log('║ USER_A (MEMBER)    ║ test_usera@sudoku.local      ║ TestPass_A1!         ║  750 ║   8 ║');
  console.log('║ USER_B (MEMBER)    ║ test_userb@sudoku.local      ║ TestPass_B2!         ║  200 ║   3 ║');
  console.log('║ MODERATOR          ║ test_mod@sudoku.local        ║ TestPass_M3!         ║ 1500 ║  20 ║');
  console.log('║ SUPER_ADMIN        ║ admin@sudoku.com             ║ Admin@Sudoku2026!    ║10000 ║ 100 ║');
  console.log('╚════════════════════╩══════════════════════════════╩══════════════════════╩══════╩═════╝');
  console.log('\n✓ All accounts have isEmailVerified = true');
  console.log('  To test UNVERIFIED state: register a fresh account at http://localhost:3000/en/auth\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
