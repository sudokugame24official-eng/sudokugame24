const process = require('process');
const fs = require('fs');
const path = require('path');

/**
 * Guards destructive Prisma commands.
 *
 * Blocks `db push` when EITHER:
 *  - NODE_ENV is production/staging, OR
 *  - the effective DATABASE_URL points at a non-development database
 *    (anything that is not localhost/127.0.0.1/docker-internal hosts).
 *
 * The URL check matters because NODE_ENV alone can be forgotten while the
 * connection string still targets staging/prod (e.g. Neon).
 */

const env = process.env.NODE_ENV || 'development';
const command = process.argv[2];

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // packages/database/.env is where local dev credentials live
  try {
    const envPath = path.join(__dirname, '..', 'packages', 'database', '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function isDevelopmentDatabase(url) {
  if (!url) return false; // no URL resolvable -> cannot certify dev, be safe
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === 'postgres' || // local docker-compose service
    host === 'db' || // local docker-compose service
    host === 'db-test' ||
    host.endsWith('.local')
  );
}

if (command === 'push' || command === 'db:push') {
  const url = resolveDatabaseUrl();
  const envBlocked = env === 'production' || env === 'staging';
  const urlBlocked = !isDevelopmentDatabase(url);

  if (envBlocked || urlBlocked) {
    if (envBlocked) {
      console.error(`\x1b[31m[ERROR] FATAL: 'prisma db push' is forbidden when NODE_ENV=${env}.\x1b[0m`);
    } else {
      console.error(
        `\x1b[31m[ERROR] FATAL: 'prisma db push' targets a NON-DEVELOPMENT database (host is not localhost/docker).\x1b[0m`,
      );
    }
    console.error(`\x1b[31m[ERROR] Use 'prisma migrate deploy' (migrations in packages/database/prisma/migrations).\x1b[0m`);
    console.error(`\x1b[31m[ERROR] To override a truly local DB: set NODE_ENV=development AND point DATABASE_URL at localhost.\x1b[0m`);
    process.exit(1);
  }
}

console.log(`\x1b[32m[INFO] Prisma guard passed. Environment: ${env}\x1b[0m`);
process.exit(0);
