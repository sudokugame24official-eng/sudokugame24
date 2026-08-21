import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding forum categories and SEO topics...");

  // 1. Create a dummy author if not exists
  let author = await prisma.user.findUnique({
    where: { email: "admin@sudoku.com" },
  });
  if (!author) {
    author = await prisma.user.create({
      data: {
        email: "admin@sudoku.com",
        role: "SUPER_ADMIN",
        profile: {
          create: {
            username: "SudokuGod99",
            avatarUrl: "S",
            level: 50,
          },
        },
      },
    });
  }

  // 2. Create categories
  const catGeneral = await prisma.forumCategory.upsert({
    where: { name: "Général" },
    update: {},
    create: {
      name: "Général",
      description: "Discussions générales sur le Sudoku.",
    },
  });

  const catStrategies = await prisma.forumCategory.upsert({
    where: { name: "Stratégies & Techniques" },
    update: {},
    create: {
      name: "Stratégies & Techniques",
      description: "Partagez et apprenez des techniques avancées.",
    },
  });

  const catMultiplayer = await prisma.forumCategory.upsert({
    where: { name: "Multijoueur" },
    update: {},
    create: {
      name: "Multijoueur",
      description: "Cherchez des adversaires et discutez du mode multijoueur.",
    },
  });

  // 3. Create SEO posts
  const posts = [
    {
      title:
        "Technique X-Wing Sudoku : Le guide ultime 2026 pour le niveau Expert",
      slug: "technique-x-wing-sudoku-guide-ultime-2026-expert",
      content:
        "La technique X-Wing est indispensable pour résoudre les grilles de niveau Expert et Diabolique. Voici comment l'identifier facilement...",
      categoryId: catStrategies.id,
      authorId: author.id,
    },
    {
      title:
        "Sudoku en ligne multijoueur : Comment gagner rapidement en duel ?",
      slug: "sudoku-en-ligne-multijoueur-comment-gagner-rapidement-en-duel",
      content:
        "Pour dominer l'arène multijoueur sur Sudoku Premium, la vitesse de balayage visuel est plus importante que la logique pure...",
      categoryId: catMultiplayer.id,
      authorId: author.id,
    },
    {
      title:
        "Quel est le temps moyen pour résoudre une grille de Sudoku Difficile ?",
      slug: "quel-est-le-temps-moyen-pour-resoudre-une-grille-de-sudoku-difficile",
      content:
        "D'après nos statistiques sur plus de 10 000 parties, un joueur moyen résout une grille difficile en environ 12 minutes...",
      categoryId: catGeneral.id,
      authorId: author.id,
    },
    {
      title:
        "Les meilleures techniques pour le Sudoku Diabolique (Niveau Master)",
      slug: "les-meilleures-techniques-pour-le-sudoku-diabolique-niveau-master",
      content:
        "Swordfish, XY-Wing, et Forcing Chains. Plongée dans les techniques de ceux qui ont plus de 2000 Elo.",
      categoryId: catStrategies.id,
      authorId: author.id,
    },
    {
      title:
        "Jeu de logique gratuit : Pourquoi le Sudoku améliore la mémoire ?",
      slug: "jeu-de-logique-gratuit-pourquoi-le-sudoku-ameliore-la-memoire",
      content:
        "Des études récentes montrent que la pratique quotidienne du Sudoku stimule les connexions neuronales...",
      categoryId: catGeneral.id,
      authorId: author.id,
    },
  ];

  for (const postData of posts) {
    // Avoid exact duplicates
    const existing = await prisma.forumPost.findFirst({
      where: { title: postData.title },
    });
    if (!existing) {
      await prisma.forumPost.create({ data: postData });
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
