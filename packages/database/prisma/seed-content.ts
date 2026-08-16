import { PrismaClient, Difficulty, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting massive content seeding for Phase 5...");

  // 1. Ensure Official Accounts
  const accounts = [
    {
      email: "owner@sudokupremium.com",
      username: "Platform Owner",
      role: Role.SUPER_ADMIN,
    },
    {
      email: "community@sudokupremium.com",
      username: "Sudoku Community Team",
      role: Role.ADMIN,
    },
    {
      email: "academy@sudokupremium.com",
      username: "Sudoku Academy",
      role: Role.CONTENT_MANAGER,
    },
    {
      email: "mod@sudokupremium.com",
      username: "Official Moderator",
      role: Role.MODERATOR,
    },
    {
      email: "support@sudokupremium.com",
      username: "Support Team",
      role: Role.SUPPORT_AGENT,
    },
  ];

  const userIds: Record<string, string> = {};

  for (const acc of accounts) {
    let user = await prisma.user.findUnique({ where: { email: acc.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: acc.email,
          isEmailVerified: true,
          role: acc.role,
          profile: {
            create: {
              username: acc.username,
              level: 100,
              xp: 999999,
              coins: 10000,
            },
          },
        },
      });
    }
    userIds[acc.username] = user.id;
  }

  // 2. Default Feature Flags
  const flags = [
    {
      key: "SHOP_ENABLED",
      enabled: true,
      description: "Enable Coin Shop and Perks",
      targetRoles: [],
    },
    {
      key: "ADS_ENABLED",
      enabled: false,
      description: "Enable Google Ads Monetization",
      targetRoles: [],
    },
    {
      key: "PAYMENTS_ENABLED",
      enabled: false,
      description: "Enable Stripe Payments",
      targetRoles: [],
    },
    {
      key: "MAINTENANCE_MODE",
      enabled: false,
      description: "Put the platform into lockdown",
      targetRoles: [],
    },
    {
      key: "SOLO_MODE_ENABLED",
      enabled: true,
      description: "Enable Solo Play",
      targetRoles: [],
    },
    {
      key: "MULTIPLAYER_ENABLED",
      enabled: true,
      description: "Enable Duel Play",
      targetRoles: [],
    },
    {
      key: "DUEL_ENABLED",
      enabled: true,
      description: "Enable realtime 1v1 duel arena",
      targetRoles: [],
    },
    {
      key: "FRIENDS_ENABLED",
      enabled: true,
      description: "Enable friend requests and social graph",
      targetRoles: [],
    },
    {
      key: "PRIVATE_MESSAGES_ENABLED",
      enabled: true,
      description: "Enable private chat and conversations",
      targetRoles: [],
    },
    {
      key: "SPECTATOR_MODE_ENABLED",
      enabled: true,
      description: "Enable live match spectators",
      targetRoles: [],
    },
    {
      key: "TOURNAMENTS_ENABLED",
      enabled: false,
      description: "Enable tournament pages and events",
      targetRoles: [],
    },
  ];
  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: {},
      create: f,
    });
  }

  // 2b. Role permissions for a non-technical admin panel.
  const rolePermissions: Array<{ role: Role; permission: string }> = [
    { role: Role.SUPER_ADMIN, permission: "*" },
    { role: Role.ADMIN, permission: "users.view" },
    { role: Role.ADMIN, permission: "users.manage_roles" },
    { role: Role.ADMIN, permission: "users.ban" },
    { role: Role.ADMIN, permission: "support.view" },
    { role: Role.ADMIN, permission: "support.reply" },
    { role: Role.ADMIN, permission: "support.manage" },
    { role: Role.ADMIN, permission: "forum.moderate" },
    { role: Role.ADMIN, permission: "cms.view" },
    { role: Role.ADMIN, permission: "cms.edit" },
    { role: Role.ADMIN, permission: "analytics.view" },
    { role: Role.ADMIN, permission: "features.view" },
    { role: Role.ADMIN, permission: "features.manage" },
    { role: Role.ADMIN, permission: "settings.view" },
    { role: Role.ADMIN, permission: "settings.manage" },
    { role: Role.ADMIN, permission: "economy.adjust" },
    { role: Role.ADMIN, permission: "economy.audit" },
    { role: Role.ADMIN, permission: "ads.view" },
    { role: Role.ADMIN, permission: "ads.manage" },
    { role: Role.ADMIN, permission: "system.view" },
    { role: Role.ADMIN, permission: "shop.view" },
    { role: Role.ADMIN, permission: "shop.manage" },
    { role: Role.MODERATOR, permission: "users.view" },
    { role: Role.MODERATOR, permission: "users.ban" },
    { role: Role.MODERATOR, permission: "forum.moderate" },
    { role: Role.SUPPORT_AGENT, permission: "support.view" },
    { role: Role.SUPPORT_AGENT, permission: "support.reply" },
    { role: Role.CONTENT_MANAGER, permission: "cms.view" },
    { role: Role.CONTENT_MANAGER, permission: "cms.edit" },
    { role: Role.ANALYST, permission: "analytics.view" },
  ];

  for (const permission of rolePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permission: {
          role: permission.role,
          permission: permission.permission,
        },
      },
      update: {},
      create: permission,
    });
  }

  // 2c. Shop products managed from the admin panel.
  const shopProducts = [
    {
      name: "VIP Chat Color",
      description:
        "Display your username with a premium colored style in chat and forum.",
      iconUrl: "crown",
      priceCoins: 1200,
      category: "cosmetics",
      type: "perk",
      entitlement: "CHAT_VIP",
      durationDays: 30,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Special Profile Badge",
      description:
        "Add a visible supporter badge next to your username across the community.",
      iconUrl: "star",
      priceCoins: 1800,
      category: "cosmetics",
      type: "perk",
      entitlement: "CUSTOM_BADGE",
      durationDays: 30,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "No Ads Pass",
      description:
        "Remove display ads from the platform while the pass is active.",
      iconUrl: "shield",
      priceCoins: 2500,
      category: "comfort",
      type: "perk",
      entitlement: "NO_ADS",
      durationDays: 30,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Hint Refill x5",
      description:
        "Add five extra hints to your account for solo and daily practice.",
      iconUrl: "lightbulb",
      priceCoins: 450,
      category: "boosters",
      type: "consumable",
      entitlement: "EXTRA_HINTS",
      quantity: 5,
      isActive: true,
      isFeatured: false,
    },
    {
      name: "Duel Entry Booster",
      description:
        "A budget coin pack for players who want to enter more competitive tables.",
      iconUrl: "zap",
      priceCoins: 700,
      category: "competitive",
      type: "consumable",
      entitlement: "EXTRA_HINTS",
      quantity: 2,
      isActive: true,
      isFeatured: false,
    },
  ];

  for (const product of shopProducts) {
    const existing = await prisma.shopProduct.findFirst({
      where: { name: product.name },
    });
    if (existing) {
      await prisma.shopProduct.update({
        where: { id: existing.id },
        data: product,
      });
    } else {
      await prisma.shopProduct.create({ data: product });
    }
  }

  // 3. Site Settings (Theme, Navigation)
  const settings = [
    { key: "THEME_PRIMARY_COLOR", value: "#FF4500" },
    { key: "THEME_SECONDARY_COLOR", value: "#133A7C" },
    { key: "THEME_MODE", value: "dark" },
    { key: "SITE_NAME", value: "Sudoku Premium" },
    {
      key: "HOMEPAGE_CONFIG",
      value: JSON.stringify({
        showHero: true,
        showFeatures: true,
        showCommunity: true,
      }),
    },
  ];
  for (const s of settings) {
    await prisma.siteSettings.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: JSON.stringify(s.value) },
    });
  }

  // 4. Achievements
  const achievements = [
    {
      name: "First Solve",
      description: "Solve your very first Sudoku puzzle.",
      xpReward: 100,
      iconUrl: "star",
    },
    {
      name: "10 Puzzles Solved",
      description: "Solve 10 Sudoku puzzles.",
      xpReward: 500,
      iconUrl: "star",
    },
    {
      name: "100 Puzzles Solved",
      description: "Solve 100 Sudoku puzzles. You are a dedicated player!",
      xpReward: 2500,
      iconUrl: "crown",
    },
    {
      name: "First Duel",
      description: "Participate in a Multiplayer Duel.",
      xpReward: 150,
      iconUrl: "shield",
    },
    {
      name: "First Duel Win",
      description: "Win your first Multiplayer Duel.",
      xpReward: 300,
      iconUrl: "medal",
    },
    {
      name: "10 Duel Wins",
      description: "Win 10 Multiplayer Duels.",
      xpReward: 1000,
      iconUrl: "medal",
    },
    {
      name: "50 Duel Wins",
      description: "Win 50 Multiplayer Duels. A true competitor.",
      xpReward: 5000,
      iconUrl: "trophy",
    },
    {
      name: "7 Day Streak",
      description: "Play Sudoku for 7 consecutive days.",
      xpReward: 1000,
      iconUrl: "flame",
    },
    {
      name: "30 Day Streak",
      description:
        "Play Sudoku for 30 consecutive days. Incredible dedication!",
      xpReward: 5000,
      iconUrl: "flame",
    },
    {
      name: "100 Day Streak",
      description: "Play Sudoku for 100 consecutive days. Unstoppable logic!",
      xpReward: 15000,
      iconUrl: "flame",
    },
    {
      name: "Speed Solver",
      description: "Solve a Hard puzzle in under 5 minutes.",
      xpReward: 5000,
      iconUrl: "zap",
    },
    {
      name: "Sudoku Master",
      description: "Reach Master League in Multiplayer Duels.",
      xpReward: 10000,
      iconUrl: "crown",
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement
      .upsert({
        where: { id: ach.name.replace(/\s+/g, "-").toLowerCase() }, // Fake ID if no unique name, but we can't do that easily if name isn't unique in schema.
        // Wait, achievement has no unique name field in schema? Let's assume we look it up.
        update: ach,
        create: { ...ach, id: ach.name.replace(/\s+/g, "-").toLowerCase() },
      })
      .catch(async () => {
        // If no unique constraint, just findFirst
        const existing = await prisma.achievement.findFirst({
          where: { name: ach.name },
        });
        if (!existing) await prisma.achievement.create({ data: ach });
      });
  }

  // 5. Sudoku Academy Articles (CMS)
  const academyAuthor = userIds["Sudoku Academy"] || "";
  const articles = [
    {
      title: "What Is Sudoku?",
      slug: "what-is-sudoku",
      category: "Beginner",
      content: `<h2>The History and Rules of Sudoku</h2><p>Sudoku is a logic-based, combinatorial number-placement puzzle. The objective is to fill a 9×9 grid with digits so that each column, each row, and each of the nine 3×3 subgrids that compose the grid contain all of the digits from 1 to 9.</p><h3>Why is it so popular?</h3><p>Because it requires no math skills, only logic!</p>`,
    },
    {
      title: "How to Play Sudoku",
      slug: "how-to-play-sudoku",
      category: "Beginner",
      content: `<h2>Step-by-Step Guide for Beginners</h2><ol><li><strong>Understand the Grid:</strong> You have 9 rows, 9 columns, and 9 3x3 blocks.</li><li><strong>Scan for easy numbers:</strong> Look for rows or columns that already have 7 or 8 numbers filled in.</li><li><strong>Use Pencil Marks:</strong> When you aren't sure, write down the possible candidates in the corner of the cell.</li><li><strong>Never Guess:</strong> Sudoku is purely logical. If you guess, you will likely make a mistake that ruins the board.</li></ol>`,
    },
    {
      title: "Naked Singles",
      slug: "naked-singles",
      category: "Intermediate",
      content: `<h2>Spotting Naked Singles</h2><p>A Naked Single is the easiest pattern to spot when you are using pencil marks (candidates). It occurs when a cell has only <strong>one possible digit</strong> left that can be placed in it, because all other digits (1-9) already exist in its row, column, or 3x3 block.</p><h3>How to find them</h3><p>Simply scan the board. If a cell sees 8 unique numbers, the 9th number must go there.</p>`,
    },
    {
      title: "X-Wing Sudoku",
      slug: "x-wing-sudoku",
      category: "Advanced",
      content: `<h2>Mastering the X-Wing Technique</h2><p>The X-Wing is an advanced pattern used to eliminate candidates. It requires looking at a single number.</p><h3>How it works:</h3><p>If you find a number (e.g., 4) that can only go in exactly <strong>two cells</strong> in Row 2, and exactly <strong>two cells</strong> in Row 7, AND those cells align perfectly in the exact same columns, you have found an X-Wing.</p><p>Because the 4 MUST be in one of those corners for both rows, it is impossible for the 4 to appear anywhere else in those two columns.</p><h3>The Result</h3><p>You can safely erase 4 as a candidate from any other cell in those two columns!</p>`,
    },
  ];

  // Procedurally generate the rest
  const otherTitles = [
    "Sudoku Rules",
    "Common Sudoku Mistakes",
    "Hidden Singles",
    "Naked Pairs",
    "Hidden Pairs",
    "Locked Candidates",
    "Pointing Pairs",
    "Swordfish Sudoku",
    "Jellyfish",
    "XY-Wing",
    "XYZ-Wing",
    "How to Solve Sudoku Faster",
    "Sudoku Rating System Explained",
  ];

  for (const title of otherTitles) {
    articles.push({
      title: title,
      slug: title.toLowerCase().replace(/ /g, "-"),
      category:
        title.includes("Sudoku Rules") || title.includes("Mistakes")
          ? "Beginner"
          : title.includes("Wing") || title.includes("fish")
            ? "Advanced"
            : "Intermediate",
      content: `<h2>Mastering ${title}</h2><p>This is the official step-by-step guide provided by the Sudoku Academy to help you learn ${title}. Always remember to use candidates effectively.</p>`,
    });
  }

  for (const article of articles) {
    await prisma.contentArticle.upsert({
      where: { slug: article.slug },
      update: { content: article.content },
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: `Learn everything about ${article.title} in this comprehensive guide.`,
        content: article.content,
        metaTitle: `${article.title} - Ultimate Guide | Sudoku Premium`,
        metaDescription: `Discover how to master ${article.title} and improve your logic puzzle solving skills.`,
        category: article.category,
        authorId: academyAuthor,
        status: "PUBLISHED",
        indexable: true,
        publishedAt: new Date(),
      },
    });
  }

  // 5b. Interactive knowledge base techniques for the Academy.
  const techniques = [
    {
      slug: "naked-single",
      title: "Naked Single",
      description:
        "A cell has only one possible value because every other digit is already blocked by its row, column, or box.",
      difficulty: Difficulty.EASY,
      metaTitle: "Naked Single Sudoku Technique",
      metaDescription:
        "Learn the Naked Single Sudoku technique with a simple explanation for beginners.",
      status: "PUBLISHED",
    },
    {
      slug: "hidden-single",
      title: "Hidden Single",
      description:
        "A digit can appear in only one cell inside a row, column, or box, even if that cell has several candidates.",
      difficulty: Difficulty.EASY,
      metaTitle: "Hidden Single Sudoku Technique",
      metaDescription:
        "Understand Hidden Singles and improve your beginner Sudoku solving speed.",
      status: "PUBLISHED",
    },
    {
      slug: "naked-pair",
      title: "Naked Pair",
      description:
        "Two cells in the same unit share the exact same two candidates, so those candidates can be removed from other cells in the unit.",
      difficulty: Difficulty.MEDIUM,
      metaTitle: "Naked Pair Sudoku Strategy",
      metaDescription:
        "Master Naked Pairs to solve medium and hard Sudoku puzzles more reliably.",
      status: "PUBLISHED",
    },
    {
      slug: "locked-candidates",
      title: "Locked Candidates",
      description:
        "A candidate is restricted to one row or column inside a box, allowing eliminations outside that box.",
      difficulty: Difficulty.MEDIUM,
      metaTitle: "Locked Candidates Sudoku Strategy",
      metaDescription:
        "Learn how locked candidates connect boxes, rows, and columns in Sudoku.",
      status: "PUBLISHED",
    },
    {
      slug: "x-wing",
      title: "X-Wing",
      description:
        "A candidate appears in exactly two aligned cells across two rows or columns, forming a rectangle that enables eliminations.",
      difficulty: Difficulty.HARD,
      metaTitle: "X-Wing Sudoku Technique Explained",
      metaDescription:
        "A clear guide to the X-Wing Sudoku pattern for advanced puzzle solving.",
      status: "PUBLISHED",
    },
    {
      slug: "swordfish",
      title: "Swordfish",
      description:
        "A three-row or three-column extension of X-Wing used to eliminate candidates in advanced grids.",
      difficulty: Difficulty.EXPERT,
      metaTitle: "Swordfish Sudoku Technique",
      metaDescription:
        "Learn the Swordfish technique for expert Sudoku puzzles and candidate elimination.",
      status: "PUBLISHED",
    },
  ];

  for (const technique of techniques) {
    await prisma.sudokuTechnique.upsert({
      where: { slug: technique.slug },
      update: technique,
      create: technique,
    });
  }

  // 6. Forum Categories
  const forumCategories = [
    {
      name: "General Sudoku",
      description: "General discussions about Sudoku.",
    },
    { name: "Beginners", description: "Ask questions and learn the basics." },
    { name: "Sudoku Strategies", description: "Discuss advanced techniques." },
    {
      name: "Daily Challenge",
      description: "Discuss today's worldwide challenge.",
    },
    {
      name: "Competitive & Duels",
      description: "Tournaments, Duels, and Leaderboard.",
    },
    { name: "Community", description: "Introduce yourself and socialize." },
    { name: "Suggestions", description: "Feature requests and feedback." },
    {
      name: "Help & Support",
      description: "Get help with your account or bugs.",
    },
    { name: "Announcements", description: "Official updates." },
  ];

  for (const cat of forumCategories) {
    await prisma.forumCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // 7a. Realistic public players so the platform feels alive locally.
  const communityMembers = [
    {
      email: "logicrunner@example.com",
      username: "LogicRunner",
      level: 14,
      xp: 9200,
      rating: 1285,
      coins: 1450,
      gamesPlayed: 42,
      gamesWon: 24,
    },
    {
      email: "fastgrid@example.com",
      username: "FastGrid",
      level: 31,
      xp: 86000,
      rating: 1740,
      coins: 3200,
      gamesPlayed: 188,
      gamesWon: 111,
    },
    {
      email: "dailyqueen@example.com",
      username: "DailyQueen",
      level: 27,
      xp: 54000,
      rating: 1615,
      coins: 2750,
      gamesPlayed: 124,
      gamesWon: 79,
    },
    {
      email: "xwinghunter@example.com",
      username: "XWingHunter",
      level: 48,
      xp: 190000,
      rating: 2140,
      coins: 6100,
      gamesPlayed: 390,
      gamesWon: 251,
    },
    {
      email: "quietsolver@example.com",
      username: "QuietSolver",
      level: 9,
      xp: 3600,
      rating: 1110,
      coins: 900,
      gamesPlayed: 17,
      gamesWon: 8,
    },
    {
      email: "mastercandidate@example.com",
      username: "MasterCandidate",
      level: 63,
      xp: 430000,
      rating: 2385,
      coins: 9400,
      gamesPlayed: 712,
      gamesWon: 508,
      vip: true,
    },
  ];

  const communityUserIds: Record<string, string> = {};
  for (const member of communityMembers) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: { isEmailVerified: true, role: Role.MEMBER },
      create: {
        email: member.email,
        isEmailVerified: true,
        role: Role.MEMBER,
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        username: member.username,
        level: member.level,
        xp: member.xp,
        rating: member.rating,
        coins: member.coins,
        gamesPlayed: member.gamesPlayed,
        gamesWon: member.gamesWon,
        currentStreak: Math.min(member.level, 21),
        longestStreak: Math.min(member.level + 4, 45),
      },
      create: {
        userId: user.id,
        username: member.username,
        level: member.level,
        xp: member.xp,
        rating: member.rating,
        coins: member.coins,
        gamesPlayed: member.gamesPlayed,
        gamesWon: member.gamesWon,
        currentStreak: Math.min(member.level, 21),
        longestStreak: Math.min(member.level + 4, 45),
      },
    });

    if (member.vip) {
      await prisma.userPerk.upsert({
        where: {
          userId_perkType: { userId: user.id, perkType: "CHAT_VIP" },
        },
        update: { expiresAt: null },
        create: { userId: user.id, perkType: "CHAT_VIP" },
      });
    }

    communityUserIds[member.username] = user.id;
  }

  // 7. Official Forum Topics
  const communityTeam = userIds["Sudoku Community Team"] || "";
  const moderator = userIds["Official Moderator"] || "";

  const starterTopics = [
    {
      title: "Welcome to the Sudoku Community!",
      content:
        "Hello and welcome to the official Sudoku Community! Here you can discuss strategies, find opponents for Duels, and participate in Daily Challenges. Please be respectful and enjoy the logic!",
      categoryName: "Announcements",
      authorId: communityTeam,
    },
    {
      title: "How did you discover Sudoku?",
      content:
        "Was it in a newspaper? A friend taught you? Let us know your story below!",
      categoryName: "Community",
      authorId: moderator,
    },
    {
      title: "What is your favorite Sudoku difficulty?",
      content:
        "Do you prefer to relax with Easy puzzles, or do you crave the extreme challenge of Master difficulty grids?",
      categoryName: "General Sudoku",
      authorId: communityTeam,
    },
    {
      title: "Beginner Questions & Answers",
      content:
        "If you are new to Sudoku, ask your questions here! The community and Academy are happy to help.",
      categoryName: "Beginners",
      authorId: academyAuthor,
    },
    {
      title: "Daily Challenge Discussion - Keep it Spoiler Free!",
      content:
        "Discuss today's challenge here. Please use spoiler tags when discussing specific cell placements to avoid ruining the challenge for others.",
      categoryName: "Daily Challenge",
      authorId: moderator,
    },
    {
      title: "How to improve your solving speed",
      content:
        "In multiplayer Duels, speed is everything. Turn off hints and trust your instinct. What are your best tips for dropping your average time below 2 minutes?",
      categoryName: "Competitive & Duels",
      authorId: academyAuthor,
    },
  ];

  for (const topic of starterTopics) {
    const cat = await prisma.forumCategory.findUnique({
      where: { name: topic.categoryName },
    });
    if (cat) {
      const existing = await prisma.forumPost.findFirst({
        where: { title: topic.title },
      });
      if (!existing) {
        await prisma.forumPost.create({
          data: {
            title: topic.title,
            content: topic.content,
            categoryId: cat.id,
            authorId: topic.authorId,
          },
        });
      }
    }
  }

  const livelyTopics = [
    {
      title: "Best routine to improve at Sudoku in 15 minutes per day",
      content:
        "I want a daily training plan that is realistic. Should I play one hard puzzle, several easy puzzles, or focus only on techniques?",
      categoryName: "Sudoku Strategies",
      authorId: communityUserIds["LogicRunner"],
      comments: [
        {
          authorId: communityUserIds["DailyQueen"],
          content:
            "What worked for me: one Daily Challenge, then replay mistakes slowly. Speed came later.",
        },
        {
          authorId: academyAuthor,
          content:
            "A strong 15 minute routine is: 5 minutes scanning rows and boxes, 5 minutes candidates, 5 minutes reviewing one technique. Consistency beats marathon sessions.",
        },
      ],
    },
    {
      title: "Why I stopped guessing and finally reached Gold league",
      content:
        "I used to guess whenever I felt stuck. After switching to notes and hidden singles, my duel rating went from 980 to 1280.",
      categoryName: "Competitive & Duels",
      authorId: communityUserIds["FastGrid"],
      comments: [
        {
          authorId: communityUserIds["QuietSolver"],
          content:
            "Same here. Guessing feels fast, but one wrong move destroys the whole run.",
        },
        {
          authorId: communityTeam,
          content:
            "This is exactly why our scoring rewards precision. In duels, a calm correct move is stronger than a rushed wrong one.",
        },
      ],
    },
    {
      title: "Daily Challenge thread: how many coins did you earn today?",
      content:
        "No spoilers please. Share your score, time, and what technique saved your run.",
      categoryName: "Daily Challenge",
      authorId: communityUserIds["DailyQueen"],
      comments: [
        {
          authorId: communityUserIds["XWingHunter"],
          content:
            "I earned 165 coins today. The middle box opened after a hidden single in column 6.",
        },
        {
          authorId: communityUserIds["MasterCandidate"],
          content:
            "Full clear. I lost time because I overused notes early, but the grid was fair.",
        },
      ],
    },
    {
      title: "X-Wing vs Swordfish: when should I learn advanced techniques?",
      content:
        "I can solve medium puzzles, but hard puzzles stop me. Should I learn X-Wing now or keep practicing basics?",
      categoryName: "Advanced Techniques",
      authorId: communityUserIds["QuietSolver"],
      comments: [
        {
          authorId: communityUserIds["XWingHunter"],
          content:
            "Learn X-Wing first. Swordfish is useful, but X-Wing appears more often and teaches the same candidate logic.",
        },
        {
          authorId: academyAuthor,
          content:
            "Our recommendation: Hidden Singles, Naked Pairs, Locked Candidates, then X-Wing. That order builds pattern recognition naturally.",
        },
      ],
    },
    {
      title: "What premium perks would you actually buy with coins?",
      content:
        "Colored names are fun, but I would also like seasonal badges and an ad-free pass. What would make the shop worth using?",
      categoryName: "Suggestions",
      authorId: communityUserIds["MasterCandidate"],
      comments: [
        {
          authorId: communityUserIds["FastGrid"],
          content:
            "I would spend coins on duel table themes and custom victory effects, as long as gameplay stays fair.",
        },
        {
          authorId: communityTeam,
          content:
            "Great direction. We want purchases to feel expressive, not pay-to-win. Cosmetics, comfort perks, and community identity are the focus.",
        },
      ],
    },
  ];

  for (const topic of livelyTopics) {
    const cat = await prisma.forumCategory.findUnique({
      where: { name: topic.categoryName },
    });
    const existing = await prisma.forumPost.findFirst({
      where: { title: topic.title },
    });
    if (cat && !existing) {
      await prisma.forumPost.create({
        data: {
          title: topic.title,
          content: topic.content,
          categoryId: cat.id,
          authorId: topic.authorId,
          comments: {
            create: topic.comments.map((comment) => ({
              authorId: comment.authorId,
              content: comment.content,
            })),
          },
        },
      });
    }
  }

  console.log("Massive content seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
