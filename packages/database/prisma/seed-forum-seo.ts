import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SEO Forum Seeding...');

  const systemUser = await prisma.user.upsert({
    where: { email: 'system@sudoku.com' },
    update: {},
    create: {
      email: 'system@sudoku.com',
      passwordHash: 'dummy',
      role: 'ADMIN',
      isEmailVerified: true,
      profile: {
        create: {
          username: 'SudokuMaster',
          experience: 50000,
        },
      },
    },
  });

  const memberUser1 = await prisma.user.upsert({
    where: { email: 'player1@sudoku.com' },
    update: {},
    create: {
      email: 'player1@sudoku.com',
      passwordHash: 'dummy',
      profile: { create: { username: 'LogicKing', experience: 1500 } },
    },
  });

  const memberUser2 = await prisma.user.upsert({
    where: { email: 'player2@sudoku.com' },
    update: {},
    create: {
      email: 'player2@sudoku.com',
      passwordHash: 'dummy',
      profile: { create: { username: 'PuzzleSolver99', experience: 800 } },
    },
  });

  const authors = [systemUser.id, memberUser1.id, memberUser2.id];
  const getRandomAuthor = () => authors[Math.floor(Math.random() * authors.length)];

  // Create Strategy Category
  const categoryStratFR = await prisma.forumCategory.upsert({
    where: { name: 'Stratégies Avancées' },
    update: {},
    create: {
      name: 'Stratégies Avancées',
      description: 'Discutez des techniques complexes : X-Wing, Swordfish, XY-Wing...',
    }
  });

  const seoPosts = [
    {
      title: "Comment résoudre un Sudoku difficile : La technique du X-Wing expliquée",
      content: "Le X-Wing est une technique avancée indispensable pour résoudre les grilles de Sudoku de niveau expert ou diabolique. Le principe repose sur l'identification d'un candidat présent dans exactement deux cases sur deux lignes (ou colonnes) différentes, formant un rectangle. Une fois ce rectangle repéré, vous pouvez éliminer ce candidat des autres cases des colonnes correspondantes. Cette stratégie vous fera gagner un temps précieux lors de vos Duels sur la plateforme. Avez-vous déjà utilisé cette technique lors d'un challenge quotidien ?",
      categoryId: categoryStratFR.id,
      comments: [
        "Excellente explication ! J'ai longtemps bloqué sur cette technique, mais avec la pratique sur le mode entraînement, c'est devenu automatique.",
        "Le X-Wing m'a sauvé plus d'une fois dans le Daily Challenge. Avez-vous un guide similaire pour le Swordfish ?"
      ]
    },
    {
      title: "Sudoku Swordfish : Guide complet pour les experts",
      content: "Si le X-Wing utilise 2 lignes et 2 colonnes, le Swordfish étend cette logique à 3 lignes et 3 colonnes. C'est l'une des techniques d'élimination les plus puissantes du Sudoku moderne. En compétition et dans nos Duels classés, repérer un Swordfish rapidement fait souvent la différence entre la victoire et la défaite. L'astuce est de scanner la grille chiffre par chiffre (de 1 à 9) et de marquer mentalement ou avec des notes les occurrences limitées à 2 ou 3 par ligne. Qui ici maîtrise parfaitement cette méthode ?",
      categoryId: categoryStratFR.id,
      comments: [
        "Le Swordfish est super difficile à repérer sans les notes (pencil marks). Je conseille à tous d'activer l'option 'Notes automatiques' pour s'entraîner.",
        "Merci pour ce guide. J'ai hâte de tester ça dans mon prochain duel classé !"
      ]
    },
    {
      title: "Quelles sont les meilleures techniques pour le Sudoku Rapide (Speed Solving) ?",
      content: "Le Speed Solving ou la résolution rapide de Sudoku demande une approche différente de la résolution classique. Au lieu de se concentrer sur les techniques complexes dès le début, les champions de Sudoku scannent la grille de manière systématique (cross-hatching) et ciblent les blocs les plus remplis. Sur notre plateforme Sudoku Premium, le mode Chrono vous permet de vous entraîner. Mes conseils : 1) Ne prenez pas de notes au début, 2) Regardez les intersections, 3) Utilisez les raccourcis clavier. Partagez vos records !",
      categoryId: categoryStratFR.id,
      comments: [
        "Mon record sur une grille facile est de 1m12s. Le cross-hatching est vraiment la clé.",
        "Moi je perds trop de temps à cliquer. Vivement que j'apprenne à bien utiliser le pavé numérique."
      ]
    },
    {
      title: "Comprendre le XY-Wing (Y-Wing) : Élimination de candidats",
      content: "Le XY-Wing est une technique de chaîne courte impliquant trois cases qui n'ont chacune que deux candidats. La case pivot (XY) et ses deux 'ailes' (XZ et YZ). Quelle que soit la valeur de la case pivot, l'une des deux ailes contiendra forcément Z. Donc, toute case 'voyant' les deux ailes ne peut pas contenir Z. C'est l'une des armes secrètes pour nettoyer une grille très encombrée. Avez-vous des exemples de grilles où cette technique s'applique ?",
      categoryId: categoryStratFR.id,
      comments: [
        "C'est la technique que j'utilise quand les X-Wings ne donnent rien. Très utile !"
      ]
    }
  ];

  for (const postData of seoPosts) {
    // Check if post exists since there is no unique constraint on title in schema
    let post = await prisma.forumPost.findFirst({ where: { title: postData.title } });
    if (!post) {
      post = await prisma.forumPost.create({
        data: {
          title: postData.title,
          content: postData.content,
          authorId: systemUser.id,
          categoryId: postData.categoryId,
        }
      });

      for (const commentContent of postData.comments) {
        await prisma.forumComment.create({
          data: {
            content: commentContent,
            authorId: getRandomAuthor() as string,
            postId: post.id,
          }
        });
      }
    }
  }

  // Add more SEO categories (English)
  const categoryStratEN = await prisma.forumCategory.upsert({
    where: { name: 'Advanced Sudoku Strategies' },
    update: {},
    create: {
      name: 'Advanced Sudoku Strategies',
      description: 'Master X-Wing, Swordfish, and more.',
    }
  });

  const seoPostsEN = [
    {
      title: "How to solve Hard Sudoku Puzzles: The Ultimate Guide",
      content: "Solving hard Sudoku puzzles requires moving beyond basic scanning and cross-hatching. You need to understand naked pairs, hidden pairs, and pointing pairs. This guide will walk you through the thought process of a Sudoku master. When playing ranked Duels, minimizing mistakes while quickly identifying pairs is crucial for maintaining your ELO rating.",
      categoryId: categoryStratEN.id,
      comments: [
        "Hidden pairs are still tricky for me, any tips?",
        "Great guide! The duel mode has really pushed me to learn these faster."
      ]
    },
    {
      title: "Sudoku ELO Rating System Explained",
      content: "Many players wonder how the matchmaking and ELO rating system works in our Duel mode. Just like in Chess, winning against a higher-rated opponent yields more points than beating a lower-rated one. To climb the leaderboard globally, you need consistency and speed. Our algorithm ensures fair matches by pairing players within a similar ELO bracket.",
      categoryId: categoryStratEN.id,
      comments: [
        "Finally, an explanation! I was wondering why I got +15 points last match.",
        "The leaderboard is super competitive right now. I love it!"
      ]
    }
  ];

  for (const postData of seoPostsEN) {
    let post = await prisma.forumPost.findFirst({ where: { title: postData.title } });
    if (!post) {
      post = await prisma.forumPost.create({
        data: {
          title: postData.title,
          content: postData.content,
          authorId: systemUser.id,
          categoryId: postData.categoryId,
        }
      });

      for (const commentContent of postData.comments) {
        await prisma.forumComment.create({
          data: {
            content: commentContent,
            authorId: getRandomAuthor() as string,
            postId: post.id,
          }
        });
      }
    }
  }

  console.log('✅ SEO Forum seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
