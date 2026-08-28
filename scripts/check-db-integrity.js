const dotenv = require('dotenv');
dotenv.config({ path: 'packages/database/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('Connecting to database...');
  const migrations = await prisma.$queryRawUnsafe(
    'SELECT id, migration_name, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at ASC;'
  );
  console.log('--- _PRISMA_MIGRATIONS TABLE ---');
  console.table(migrations);

  const columns = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'ContentArticle' ORDER BY ordinal_position;"
  );
  console.log('--- ContentArticle COLUMNS ---');
  console.table(columns);

  const revTable = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'ContentRevision' ORDER BY ordinal_position;"
  );
  console.log('--- ContentRevision COLUMNS ---');
  console.table(revTable);

  const articleCount = await prisma.contentArticle.count();
  const revisionCount = await prisma.contentRevision.count();
  console.log(`ContentArticle rows: ${articleCount}, ContentRevision rows: ${revisionCount}`);

  await prisma.$disconnect();
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
