const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@sudoku.com';
  const password = 'Admin@Sudoku2026!';
  const username = 'SudokuAdmin';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    });
    console.log('Admin user updated:', updated.email, 'Role:', updated.role);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
        profile: {
          create: {
            username,
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
            level: 100,
            coins: 10000,
          },
        },
      },
    });
    console.log('Admin user created:', created.email, 'Role:', created.role);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
