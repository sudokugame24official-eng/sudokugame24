import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Phase 6.7.5 Forum Content (SEO Optimized EN/FR/DE)...");

  // 1. Official Accounts
  const teamProfile = await prisma.user.upsert({
    where: { email: "team@sudokupremium.com" },
    update: {},
    create: {
      email: "team@sudokupremium.com",
      passwordHash: "$2b$10$xyz", // Dummy
      role: "SUPER_ADMIN",
      profile: {
        create: {
          username: "Sudoku Team",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=team",
          level: 100,
          rating: 3000,
        },
      },
      perks: {
        create: [{ perkType: "CHAT_VIP" }, { perkType: "CUSTOM_BADGE" }],
      },
    },
  });

  const academyProfile = await prisma.user.upsert({
    where: { email: "academy@sudokupremium.com" },
    update: {},
    create: {
      email: "academy@sudokupremium.com",
      passwordHash: "$2b$10$xyz",
      role: "ADMIN",
      profile: {
        create: {
          username: "Sudoku Academy",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=academy",
          level: 99,
          rating: 2900,
        },
      },
      perks: { create: [{ perkType: "CUSTOM_BADGE" }] },
    },
  });

  const supportProfile = await prisma.user.upsert({
    where: { email: "support@sudokupremium.com" },
    update: {},
    create: {
      email: "support@sudokupremium.com",
      passwordHash: "$2b$10$xyz",
      role: "ADMIN",
      profile: {
        create: {
          username: "Sudoku Support",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=support",
          level: 50,
          rating: 1500,
        },
      },
    },
  });

  // Create real-feeling test users
  const userEN = await prisma.user.upsert({
    where: { email: "rookie@example.com" },
    update: {},
    create: {
      email: "rookie@example.com",
      passwordHash: "xyz",
      role: "MEMBER",
      profile: { create: { username: "RookieSolver", level: 5, rating: 900 } },
    },
  });
  const userFR = await prisma.user.upsert({
    where: { email: "expert_fr@example.com" },
    update: {},
    create: {
      email: "expert_fr@example.com",
      passwordHash: "xyz",
      role: "MEMBER",
      profile: {
        create: { username: "MaitreSudoku", level: 42, rating: 2100 },
      },
    },
  });
  const userDE = await prisma.user.upsert({
    where: { email: "speed_de@example.com" },
    update: {},
    create: {
      email: "speed_de@example.com",
      passwordHash: "xyz",
      role: "MEMBER",
      profile: { create: { username: "BlitzLöser", level: 78, rating: 2600 } },
    },
  });

  // 2. Categories (Shared globally, mapped logically)
  const categoryStructure = [
    {
      name: "General Sudoku",
      description: "General discussions about the game.",
    },
    {
      name: "Beginner Help",
      description: "New to Sudoku? Ask your questions here.",
    },
    {
      name: "Sudoku Strategies",
      description: "Intermediate techniques and patterns.",
    },
    {
      name: "Advanced Techniques",
      description: "Deep dive into complex chains and extreme logic.",
    },
    {
      name: "Daily Challenge",
      description: "Discussions about the global daily puzzles.",
    },
    {
      name: "Sudoku Duel",
      description: "Talk about 1v1 matches, matchmaking, and meta.",
    },
    {
      name: "Leaderboards",
      description: "Weekly and all-time global rankings.",
    },
    {
      name: "Tournaments",
      description: "Official and community-run tournaments.",
    },
    {
      name: "Introductions",
      description: "Introduce yourself to the community!",
    },
    {
      name: "General Discussion",
      description: "Talk about anything related to the platform.",
    },
    {
      name: "Suggestions",
      description: "Help us improve by sharing your ideas.",
    },
    { name: "Feature Requests", description: "What should we build next?" },
    {
      name: "Technical Support",
      description: "Get help with your account or connection.",
    },
    { name: "Bug Reports", description: "Found an issue? Let us know here." },
  ];

  const categories = new Map();
  for (const cat of categoryStructure) {
    const c = await prisma.forumCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
    categories.set(cat.name, c.id);
  }

  // 3. High-Quality Seed Topics (EN / FR / DE)
  const seedTopics = [
    // --- ENGLISH CONTENT ---
    {
      title: "How to Solve Sudoku Faster: Top 3 Habits",
      content:
        "I've been playing for a few months, but I can't seem to break the 3-minute mark on Medium difficulty. What are the habits that speed-solvers use?",
      cat: "Sudoku Strategies",
      authorId: userEN.id,
      replies: [
        {
          content:
            "Speed solving comes down to visual scanning. First, don't use pencil marks right away. Second, scan by numbers (all 1s, then 2s). Third, look for 'crosshatching' opportunities. We have a great guide on this here: [Speed Solving Techniques](/en/learn/speed-solving).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "Naked Singles vs Hidden Singles - Simple Explanation?",
      content: "I always confuse these two terms. When do I use which?",
      cat: "Beginner Help",
      authorId: userEN.id,
      replies: [
        {
          content:
            "A **Naked Single** is a cell that has only 1 possible number because the other 8 are already in its row, column, and box. A **Hidden Single** might have multiple candidates, but it's the *only* cell in its block that can take a specific number. Read more: [Naked Singles](/en/learn/naked-singles).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "X-Wing Sudoku Strategy Explained",
      content:
        "I'm totally stuck on Hard puzzles. The hint keeps telling me to look for an X-Wing. Can someone explain it like I'm 5?",
      cat: "Advanced Techniques",
      authorId: userEN.id,
      replies: [
        {
          content:
            "Imagine a rectangle. If a number (like 7) can only go in exactly two spots in Row 2, and exactly two spots in Row 8, and those spots line up perfectly in the same columns, you found an X-Wing! You can now eliminate '7' from the rest of those two columns. Check our interactive tutorial: [X-Wing](/en/learn/x-wing).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "How does Sudoku Elo Rating Work?",
      content:
        "I just won a Duel but only got +8 points, while yesterday I got +24. Why?",
      cat: "Leaderboards",
      authorId: userEN.id,
      replies: [
        {
          content:
            "We use a Glicko-2 rating system. If you beat someone with a much higher Elo than you, the reward is massive. If you beat someone lower-rated, you get fewer points. It ensures the [Leaderboard](/en/leaderboard) stays balanced and competitive.",
          authorId: supportProfile.id,
        },
      ],
    },

    // --- FRENCH CONTENT ---
    {
      title: "Comment résoudre un Sudoku pour débutant ? Mes astuces.",
      content:
        "Je viens de découvrir le jeu. Je connais les règles de base (1 à 9), mais je finis toujours par deviner et je me bloque. Par où commencer ?",
      cat: "Beginner Help",
      authorId: userFR.id,
      replies: [
        {
          content:
            "Bienvenue ! Règle d'or : ne devinez jamais. Cherchez d'abord les « Candidats uniques » (Naked Singles). Ce sont des cases où un seul chiffre est mathématiquement possible. Consultez notre guide complet : [Comment jouer au Sudoku](/fr/learn/how-to-play).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "Qu'est-ce qu'un candidat caché au Sudoku ?",
      content:
        "J'ai lu un article sur les 'Hidden Singles' ou candidats cachés, mais je ne comprends pas comment les repérer visuellement.",
      cat: "Beginner Help",
      authorId: userFR.id,
      replies: [
        {
          content:
            "Un candidat caché, c'est lorsqu'un chiffre donné ne peut aller que dans une seule case d'un bloc 3x3, même si cette case semble pouvoir accueillir d'autres chiffres. Regardez cette leçon pour vous entraîner : [Candidats Cachés](/fr/learn/hidden-singles).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "Comment utiliser la technique X-Wing (L'aile de X) ?",
      content:
        "Je bloque sur les grilles Diaboliques. La technique X-Wing est indispensable mais je n'arrive pas à l'appliquer en vrai.",
      cat: "Advanced Techniques",
      authorId: userFR.id,
      replies: [
        {
          content:
            "Le X-Wing se base sur l'alignement strict. Si le chiffre '4' n'a que 2 positions possibles dans la Ligne 2 et la Ligne 6, et qu'elles forment un rectangle parfait, alors le 4 occupera forcément deux coins opposés. Vous pouvez éliminer tous les autres '4' dans ces colonnes. Exemples ici : [Technique X-Wing](/fr/learn/x-wing).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "Stratégies pour gagner un Duel Sudoku",
      content:
        "Je perds souvent mes matchs en Duel parce que je fais des erreurs sous la pression. Quels sont vos conseils ?",
      cat: "Sudoku Duel",
      authorId: userFR.id,
      replies: [
        {
          content:
            "En Duel, une erreur vous coûte -1 point. La précision prime sur la vitesse pure. Ne mettez des chiffres que si vous êtes sûr à 100%. Gardez un oeil sur la jauge de combat en haut ! Entraînez-vous d'abord sur la page [Play](/fr/play).",
          authorId: teamProfile.id,
        },
      ],
    },

    // --- GERMAN CONTENT ---
    {
      title: "Wie löst man Sudoku als Anfänger?",
      content:
        "Ich habe gerade erst angefangen. Gibt es eine systematische Methode, oder sucht man einfach zufällig nach leeren Feldern?",
      cat: "Beginner Help",
      authorId: userDE.id,
      replies: [
        {
          content:
            "Willkommen! Es gibt definitiv Systematiken. Beginne mit dem 'Crosshatching' (Kreuzweise Scannen), um die einfachen Zahlen zu finden. Niemals raten! Schau dir unsere Einsteiger-Akademie an: [Wie man Sudoku spielt](/de/learn/how-to-play).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "Was sind Naked Singles beim Sudoku?",
      content:
        "Ich höre oft von 'Nackten Einern', bin mir aber nicht sicher, was genau das bedeutet. Kann das jemand erklären?",
      cat: "Beginner Help",
      authorId: userDE.id,
      replies: [
        {
          content:
            "Ein 'Naked Single' ist ein Feld, für das nur noch eine einzige Zahl möglich ist, da alle anderen 8 Zahlen bereits in derselben Zeile, Spalte oder im Block vorkommen. Weitere Details findest du hier: [Naked Singles erklärt](/de/learn/naked-singles).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "Wie funktioniert die X-Wing-Technik?",
      content:
        "Ich komme bei den Experten-Rätseln nicht weiter. Wie wendet man einen X-Wing richtig an?",
      cat: "Advanced Techniques",
      authorId: userDE.id,
      replies: [
        {
          content:
            "Ein X-Wing entsteht, wenn ein Kandidat in genau zwei Zeilen auf exakt dieselben zwei Spalten beschränkt ist. Dadurch bilden die vier möglichen Felder ein Rechteck (ein X). Du kannst dann diesen Kandidaten aus dem Rest der beiden Spalten sicher löschen. [Lerne X-Wing hier](/de/learn/x-wing).",
          authorId: academyProfile.id,
        },
      ],
    },
    {
      title: "Wie kann man seine Sudoku-Geschwindigkeit verbessern?",
      content:
        "Ich brauche für mittlere Rätsel immer noch 10 Minuten. Wie werden die Top-Spieler so schnell?",
      cat: "Sudoku Strategies",
      authorId: userDE.id,
      replies: [
        {
          content:
            "Gute Spieler verzichten lange auf Notizen (Pencil Marks). Sie nutzen stattdessen visuelles Gedächtnis und scannen das Brett sehr methodisch. Trainiere dies im [Daily Challenge](/de/daily), um jeden Tag ein bisschen schneller zu werden!",
          authorId: teamProfile.id,
        },
      ],
    },
  ];

  // Idempotent insertion
  let count = 0;
  for (const t of seedTopics) {
    const existingTopic = await prisma.forumPost.findFirst({
      where: { title: t.title },
    });

    if (!existingTopic) {
      await prisma.forumPost.create({
        data: {
          title: t.title,
          content: t.content,
          categoryId: categories.get(t.cat),
          authorId: t.authorId,
          comments: {
            create: t.replies.map((r) => ({
              content: r.content,
              authorId: r.authorId,
            })),
          },
        },
      });
      count++;
    }
  }

  console.log(
    `Seeding complete. Inserted ${count} new SEO topics across EN, FR, DE.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
