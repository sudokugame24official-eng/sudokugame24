const process = require('process');

const env = process.env.NODE_ENV || 'development';
const command = process.argv[2];

if (command === 'push' || command === 'db:push') {
  if (env === 'production' || env === 'staging') {
    console.error(`\x1b[31m[ERROR] FATAL: Running Prisma db push is strictly forbidden in ${env} environment!\x1b[0m`);
    console.error(`\x1b[31m[ERROR] You must use 'prisma migrate deploy' to apply migrations in non-development environments.\x1b[0m`);
    process.exit(1);
  }
}

console.log(`\x1b[32m[INFO] Prisma guard passed. Environment: ${env}\x1b[0m`);
process.exit(0);
