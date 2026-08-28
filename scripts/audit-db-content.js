const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [
    users,
    profiles,
    forumCats,
    forumPosts,
    forumComments,
    questions,
    answers,
    articles,
    techniques,
    shopProducts,
    dailyChallenges,
    gameSessions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count(),
    prisma.forumCategory.count(),
    prisma.forumPost.count(),
    prisma.forumComment.count(),
    prisma.question.count(),
    prisma.answer.count(),
    prisma.contentArticle.count(),
    prisma.sudokuTechnique.count(),
    prisma.shopProduct.count(),
    prisma.dailyChallenge.count(),
    prisma.gameSession.count(),
  ]);

  console.log('=== DATABASE CONTENT AUDIT ===');
  console.log(`Users:               ${users}`);
  console.log(`Profiles:            ${profiles}`);
  console.log(`Forum Categories:    ${forumCats}`);
  console.log(`Forum Posts:         ${forumPosts}`);
  console.log(`Forum Comments:      ${forumComments}`);
  console.log(`Questions (Q&A):     ${questions}`);
  console.log(`Answers (Q&A):       ${answers}`);
  console.log(`Articles (CMS):      ${articles}`);
  console.log(`Techniques (Academy):${techniques}`);
  console.log(`Shop Products:       ${shopProducts}`);
  console.log(`Daily Challenges:    ${dailyChallenges}`);
  console.log(`Game Sessions:       ${gameSessions}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
