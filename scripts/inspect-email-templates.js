const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.emailTemplate.findMany();
  console.log(`Found ${templates.length} email templates:`);
  for (const t of templates) {
    console.log(`\n--- Template: ${t.name} (ID: ${t.id}) ---`);
    console.log(`Subject: ${t.subject}`);
    console.log(`Preview HTML: ${t.htmlContent.substring(0, 150)}...`);
  }
}

main().finally(() => prisma.$disconnect());
