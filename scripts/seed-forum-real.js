const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding real forum topics...");

  // Get or create an admin user
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@sudokugame24.com",
        passwordHash: "dummyhash",
        role: "ADMIN",
        profile: {
          create: {
            username: "SudokuAdmin",
          }
        }
      }
    });
  }

  // Categories
  const categories = ["General Discussion", "Strategies & Techniques", "Feedback & Bug Reports"];
  const dbCategories = [];
  for (const name of categories) {
    const cat = await prisma.forumCategory.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    dbCategories.push(cat);
  }

  // Posts
  const posts = [
    {
      title: "Welcome to SudokuGame24!",
      slug: "welcome-to-sudokugame24",
      content: "Welcome everyone! This is the official forum for SudokuGame24. Feel free to discuss anything related to the game, ask questions, or share your strategies. Enjoy the duels!",
      category: dbCategories[0],
      isPinned: true
    },
    {
      title: "Best techniques for X-Wing",
      slug: "best-techniques-x-wing",
      content: "I've been struggling to spot X-Wings quickly. Does anyone have tips or patterns to look out for during the mid-game?",
      category: dbCategories[1],
      isPinned: false
    },
    {
      title: "How does the Elo rating work?",
      slug: "how-does-elo-work",
      content: "Can an admin explain how the rating system calculates points after a duel? I noticed I lose more points against lower rated players.",
      category: dbCategories[0],
      isPinned: false
    },
    {
      title: "Feature Request: Custom Board Themes",
      slug: "feature-request-custom-themes",
      content: "It would be amazing to have dark mode or different color themes for the sudoku grid. What do you guys think?",
      category: dbCategories[2],
      isPinned: false
    }
  ];

  for (const post of posts) {
    await prisma.forumPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        content: post.content,
        isPinned: post.isPinned,
        authorId: admin.id,
        categoryId: post.category.id
      }
    });
  }

  console.log("Seeding complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
