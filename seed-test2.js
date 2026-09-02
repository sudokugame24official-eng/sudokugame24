const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.create({
    data: {
      email: 'test1@test.com',
      gameSessions: {
        create: {
          difficulty: 'EASY',
          status: 'COMPLETED',
          timeElapsed: 120,
          grid: JSON.stringify([1,2,3]),
          solution: JSON.stringify([1,2,3])
        }
      }
    }
  });
  console.log('Seeded testuser1 with game session');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
