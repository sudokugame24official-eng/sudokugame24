/**
 * Purges data created by the removed SimulationService (fake activity).
 *
 * The service broadcast fake global chat messages (never persisted) and created:
 *  - User rows with email ending in @bot.com and passwordHash 'bot_password'
 *  - ForumPost rows authored by those users
 *
 * DRY-RUN by default. Run with EXECUTE=1 to actually delete.
 * Target: staging/dev databases ONLY. Requires explicit DATABASE_URL.
 *
 * Usage:
 *   DATABASE_URL=<url> npx ts-node tools/migrations/purge-simulation-data.ts          # dry run
 *   DATABASE_URL=<url> EXECUTE=1 npx ts-node tools/migrations/purge-simulation-data.ts # delete
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const execute = process.env.EXECUTE === '1';

  const botUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@bot.com' } },
    select: { id: true, email: true },
  });
  const botIds = botUsers.map((u) => u.id);

  const posts = await prisma.forumPost.count({ where: { authorId: { in: botIds } } });
  const profiles = await prisma.profile.count({ where: { userId: { in: botIds } } });

  console.log(`Bot users found: ${botUsers.length}`);
  console.log(`Fake forum posts: ${posts}`);
  console.log(`Bot profiles: ${profiles}`);

  if (!execute) {
    console.log('DRY RUN — nothing deleted. Re-run with EXECUTE=1 to delete.');
    return;
  }

  // ForumPost/Profile cascade from User deletion in current schema.
  const deleted = await prisma.user.deleteMany({ where: { id: { in: botIds } } });
  console.log(`Deleted users (cascade): ${deleted.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
