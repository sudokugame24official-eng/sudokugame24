const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.create({
    data: {
      email: 'test1@test.com'
    }
  });
  console.log('Seeded testuser1');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
