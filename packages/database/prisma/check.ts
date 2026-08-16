import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const categories = await prisma.forumCategory.count();
  const posts = await prisma.forumPost.count();
  const comments = await prisma.forumComment.count();
  const articles = await prisma.contentArticle.count();

  console.log(
    JSON.stringify({ users, categories, posts, comments, articles }, null, 2),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
