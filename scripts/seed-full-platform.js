const { PrismaClient, Difficulty, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING FULL PLATFORM CONTENT POPULATION ===');

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Player@Sudoku2026!', salt);

  // 1. CREATE DIVERSE REALISTIC COMMUNITY USERS
  console.log('1. Creating community users and profiles...');
  const communityMembers = [
    { email: 'alex.logic@example.com', username: 'Alex_Logic', level: 42, elo: 1850, coins: 3400 },
    { email: 'sophie.master@example.com', username: 'Sophie_Master', level: 68, elo: 2120, coins: 8900 },
    { email: 'kenji.tokyo@example.com', username: 'Kenji_Sudoku', level: 75, elo: 2240, coins: 12500 },
    { email: 'elena.r@example.com', username: 'Elena_Grid', level: 29, elo: 1620, coins: 1800 },
    { email: 'maxspeed99@example.com', username: 'MaxSpeed_99', level: 53, elo: 1980, coins: 5200 },
    { email: 'lucas.tactics@example.com', username: 'Lucas_Tactics', level: 36, elo: 1740, coins: 2600 },
    { email: 'sarah.mind@example.com', username: 'Sarah_Mind', level: 18, elo: 1490, coins: 950 },
    { email: 'david.challenger@example.com', username: 'David_Duel', level: 47, elo: 1890, coins: 4100 },
    { email: 'emma.zen@example.com', username: 'Emma_Zen', level: 22, elo: 1550, coins: 1400 },
    { email: 'marc.expert@example.com', username: 'Marc_Expert', level: 61, elo: 2050, coins: 7600 },
  ];

  const userMap = {};

  // Ensure Admin User
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@sudoku.com' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@sudoku.com',
        passwordHash: await bcrypt.hash('Admin@Sudoku2026!', salt),
        role: Role.SUPER_ADMIN,
        profile: {
          create: {
            username: 'SudokuAdmin',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
            level: 100,
            xp: 999999,
            coins: 50000,
            rating: 2500,
          },
        },
      },
    });
  }
  userMap['Admin'] = adminUser.id;

  for (const m of communityMembers) {
    let u = await prisma.user.findUnique({ where: { email: m.email } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          email: m.email,
          passwordHash: defaultPasswordHash,
          isEmailVerified: true,
          role: Role.MEMBER,
          profile: {
            create: {
              username: m.username,
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`,
              level: m.level,
              xp: m.level * 1000 + 450,
              coins: m.coins,
              rating: m.elo,
              gamesPlayed: m.level * 8 + 15,
              gamesWon: Math.floor(m.level * 5.5),
              currentStreak: (m.level % 14) + 1,
              longestStreak: m.level + 5,
            },
          },
        },
      });
    }
    userMap[m.username] = u.id;
  }

  // 2. FORUM CATEGORIES
  console.log('2. Ensuring rich Forum Categories...');
  const categories = [
    { name: 'Stratégies & Techniques', description: 'Du niveau Débutant à Expert : X-Wing, Swordfish, Paires cachées et astuces de scan.' },
    { name: 'Duels & Multijoueur 1v1', description: 'Discussions autour du mode Duel classé, conseils de vitesse et recherche d\'adversaires.' },
    { name: 'Défi Quotidien (Daily)', description: 'Partagez vos temps et réflexions sur la grille quotidienne du jour sans spoilers.' },
    { name: 'Débutants & Entraide', description: 'Posez vos questions sur les règles, la logique et les premiers pas en Sudoku.' },
    { name: 'Variantes & Casse-têtes', description: 'Killer Sudoku, Samouraï, Diagonales et puzzles de logique avancés.' },
    { name: 'Général & Communauté', description: 'Discussions libres, mémoire, bienfaits cognitifs et actualités de la plateforme.' },
  ];

  const catMap = {};
  for (const c of categories) {
    const row = await prisma.forumCategory.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: { name: c.name, description: c.description },
    });
    catMap[c.name] = row.id;
  }

  // 3. RICH SEO-OPTIMIZED FORUM POSTS WITH REALISTIC COMMENTS
  console.log('3. Seeding rich organic SEO forum posts and comments...');
  const forumTopics = [
    {
      title: 'Technique X-Wing Sudoku : Le guide complet 2026 avec exemples pas à pas',
      slug: 'technique-x-wing-sudoku-guide-complet-2026-exemples',
      category: 'Stratégies & Techniques',
      author: 'Sophie_Master',
      views: 342,
      content: `La technique du **X-Wing** est l'un des schémas de résolution avancés les plus célèbres et les plus puissants du Sudoku. Elle intervient lorsque les techniques basiques (candidats uniques, paires nues) ne suffisent plus sur les grilles de niveau *Difficile* ou *Expert*.

### Qu'est-ce qu'un X-Wing ?
Un X-Wing se produit lorsqu'un même chiffre candidat n'apparaît que **deux fois par ligne** dans **deux lignes distinctes**, et que ces apparitions se situent dans **les deux mêmes colonnes**.
Ces quatre cases forment les sommets d'un rectangle (ou d'un trapèze). Comme le chiffre doit obligatoirement figurer soit dans la diagonale A-D, soit dans la diagonale B-C, on a la certitude qu'aucun autre chiffre identique ne peut se trouver dans le reste de ces deux colonnes !

### Comment l'appliquer ?
1. Filtrez la grille sur un chiffre candidat (par exemple le chiffre 7).
2. Repérez deux lignes où le 7 ne peut aller que dans la colonne 2 et la colonne 8.
3. Éliminez tous les autres candidats 7 situés dans les colonnes 2 et 8 en dehors de ces 4 cases pivots.
4. Débloquez instantanément de nouvelles cases nues !

Quelles sont vos astuces pour repérer un X-Wing rapidement en moins de 30 secondes ?`,
      comments: [
        { author: 'Alex_Logic', content: 'Superbe synthèse ! Pour ma part, je colorie mentalement les colonnes dès que je vois seulement deux options dans une ligne. Ça permet de repérer le X-Wing en un coup d\'œil.' },
        { author: 'Kenji_Sudoku', content: 'Excellente explication. C\'est exactement le type de pattern qui m\'a permis de franchir la barre des 2000 Elo en duel. Le Swordfish en est la suite logique à 3 lignes/colonnes.' },
        { author: 'Elena_Grid', content: 'Merci beaucoup Sophie ! J\'étais bloquée sur la grille Expert d\'hier, et c\'est pile ce qu\'il me fallait pour comprendre pourquoi le 4 était éliminé en colonne 7.' },
      ]
    },
    {
      title: 'Comment passer sous la barre des 3 minutes en Sudoku Moyen ?',
      slug: 'comment-passer-sous-la-barre-des-3-minutes-sudoku-moyen',
      category: 'Duels & Multijoueur 1v1',
      author: 'MaxSpeed_99',
      views: 289,
      content: `En duel 1v1, la vitesse d'exécution est capitale. Beaucoup de joueurs connaissent la logique mais perdent 15 à 30 secondes en hésitations. Voici mon protocole d'entraînement pour briser le plateau des 3 minutes :

1. **Le balayage en croix (Cross-Hatching)** : Ne sautez pas d'un chiffre à l'autre au hasard. Balayez toujours dans l'ordre de 1 à 9 par blocs de 3x3.
2. **Prendre des notes minimalistes (Snyder Notation)** : N'écrivez des candidats que s'il n'y a que DEUX emplacements possibles dans un bloc 3x3. Si vous notez 4 ou 5 candidats partout, votre cerveau s'essouffle.
3. **Raccourcis clavier** : Utilisez impérativement le pavé numérique et les touches directionnelles ou la souris rapide.

Avez-vous testé la notation de Snyder ? Quel est votre record actuel sur une grille Moyenne ?`,
      comments: [
        { author: 'David_Duel', content: 'La notation de Snyder m\'a fait gagner plus de 45 secondes en moyenne. Avant, je sur-notais tout et je perdais du temps à effacer.' },
        { author: 'Lucas_Tactics', content: 'Record à 2m14s sur Sudoku Moyen grâce à cette méthode ! En duel, poser les chiffres évidents dès les 15 premières secondes met une pression énorme sur l\'adversaire.' },
        { author: 'Sarah_Mind', content: 'Je viens d\'essayer sur 3 parties : mon temps est passé de 5m30s à 3m45s dès le premier jour !' },
      ]
    },
    {
      title: 'Pourquoi le Sudoku améliore la plasticité cérébrale et la concentration',
      slug: 'pourquoi-le-sudoku-ameliore-la-plasticite-cerebrale-concentration',
      category: 'Général & Communauté',
      author: 'Marc_Expert',
      views: 512,
      content: `De nombreuses études en neurosciences cognitives ont démontré les vertus des jeux de logique structurés comme le Sudoku sur le cerveau humain.

### Les 4 bénéfices cérébraux majeurs :
- **Mémoire de travail** : Mémoriser temporairement des combinaisons de chiffres sans surcharge mentale.
- **Pensée déductive et logique formelle** : Entraîner le cortex préfrontal à éliminer les hypothèses fausses par déduction rigoureuse.
- **Réduction du stress et état de Flow** : Se concentrer sur une grille de 81 cases induit un état de pleine conscience relaxant, idéal pour déconnecter des écrans passifs.
- **Maintien de la réserve cognitive** : Stimuler régulièrement les réseaux neuronaux aide à prévenir le vieillissement cognitif précoce.

Combien de grilles faites-vous par semaine ? Ressentez-vous cet effet apaisant après une session ?`,
      comments: [
        { author: 'Emma_Zen', content: 'C\'est devenu mon rituel du matin avec le café. 15 minutes de Sudoku réveillent mon esprit bien mieux que les réseaux sociaux.' },
        { author: 'Alex_Logic', content: 'Totalement d\'accord avec l\'effet de "Flow". Quand on est immergé dans une grille difficile, le reste du monde disparaît pendant 10 minutes.' },
        { author: 'Sophie_Master', content: 'Étude très intéressante. J\'ai remarqué une nette amélioration de ma capacité de focus au travail depuis que je fais le Défi Quotidien chaque midi.' },
      ]
    },
    {
      title: 'Swordfish et XY-Wing : Explications détaillées pour le niveau Diabolique / Master',
      slug: 'swordfish-et-xy-wing-explications-niveau-diabolique-master',
      category: 'Stratégies & Techniques',
      author: 'Kenji_Sudoku',
      views: 478,
      content: `Lorsque le X-Wing ne suffit plus, le **Swordfish** et le **XY-Wing** deviennent vos deux meilleures armes pour dénouer les grilles Master à plus de 2000 Elo.

### Le Swordfish (3x3)
Le Swordfish est l'extension tridimensionnelle du X-Wing sur 3 lignes et 3 colonnes. Si un chiffre apparaît au maximum 2 ou 3 fois dans 3 lignes distinctes et que toutes ces apparitions tombent dans les 3 mêmes colonnes, alors ce chiffre peut être retiré de toutes les autres cases de ces trois colonnes.

### Le XY-Wing (Pivot & Pinces)
Le XY-Wing repose sur 3 cases contenant chacune exactement 2 candidats (bivaluées) :
- Une case **Pivot** avec les candidats (X, Y).
- Une première case **Pince 1** qui voit le pivot, avec les candidats (X, Z).
- Une seconde case **Pince 2** qui voit le pivot, avec les candidats (Y, Z).
Conclusion : Toute case qui voit simultanément la Pince 1 ET la Pince 2 ne peut JAMAIS contenir le chiffre Z !

Avez-vous déjà repéré un XY-Wing naturel sur une grille de tournoi ?`,
      comments: [
        { author: 'Sophie_Master', content: 'Le XY-Wing est mon schéma favori ! Il est souvent plus facile à visualiser qu\'un Swordfish car on cherche simplement 3 cases à 2 chiffres.' },
        { author: 'Marc_Expert', content: 'Parfaitement résumé. Une fois qu\'on a le réflexe de repérer les cases bivaluées (2 chiffres), le XY-Wing saute aux yeux.' },
      ]
    },
    {
      title: 'Défi Quotidien d\'aujourd\'hui : Vos impressions et astuces ?',
      slug: 'defi-quotidien-aujourd-hui-impressions-astuces',
      category: 'Défi Quotidien (Daily)',
      author: 'Elena_Grid',
      views: 215,
      content: `La grille quotidienne du jour était particulièrement élégante ! Beaucoup de symétrie dans les indices de départ, et un déblocage très satisfaisant vers le milieu en colonne 4.

Temps réalisé : 4m12s pour 175 coins gagnés.
Quelle a été votre étape clé pour débloquer le bloc central ? (Attention : pas de coordonnées directes pour ne pas spoiler ceux qui jouent encore).`,
      comments: [
        { author: 'David_Duel', content: 'Bouclé en 3m05s ! Une paire nue 3-8 en ligne 6 a tout déverrouillé.' },
        { author: 'MaxSpeed_99', content: '2m48s sans aucune erreur. La série de 14 jours continue !' },
        { author: 'Sarah_Mind', content: 'J\'ai pris mon temps (6 minutes) mais 100% de précision. J\'adore ce rendez-vous quotidien.' },
      ]
    }
  ];

  for (const postData of forumTopics) {
    const catId = catMap[postData.category];
    if (!catId) continue;

    const existing = await prisma.forumPost.findFirst({ where: { slug: postData.slug } });
    if (!existing) {
      const authorId = userMap[postData.author] || userMap['Admin'];
      await prisma.forumPost.create({
        data: {
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          views: postData.views,
          categoryId: catId,
          authorId: authorId,
          comments: {
            create: postData.comments.map(c => ({
              authorId: userMap[c.author] || userMap['Admin'],
              content: c.content,
            })),
          },
        },
      });
      console.log(`  -> Forum Post created: ${postData.title.slice(0, 40)}...`);
    }
  }

  // 4. Q&A COMMUNITY QUESTIONS & ANSWERS
  console.log('4. Seeding Q&A Questions and Answers...');
  const questionsData = [
    {
      title: 'Quelle est la différence fondamentale entre une Paire Nue et une Paire Cachée ?',
      slug: 'difference-paire-nue-et-paire-cachee-sudoku',
      body: `Je débute dans les techniques intermédiaires et je confonds souvent les **Paires Nues (Naked Pairs)** et les **Paires Cachées (Hidden Pairs)**. 

Pouvez-vous m'expliquer clairement avec un exemple comment les distinguer visuellement dans une ligne ou un bloc ?`,
      tags: ['debutant', 'paires', 'strategie', 'tutoriel'],
      author: 'Sarah_Mind',
      score: 18,
      views: 420,
      answers: [
        {
          author: 'Sophie_Master',
          isAccepted: true,
          score: 24,
          body: `C'est une excellente question et l'une des étapes les plus importantes pour progresser !

### 1. La Paire Nue (Naked Pair)
- **Définition** : Exactement deux cases dans une même unité (ligne, colonne ou bloc) ne contiennent QUE les deux mêmes chiffres candidats (par exemple \`[3, 7]\` et \`[3, 7]\`).
- **Action** : Comme le 3 et le 7 iront forcément dans ces deux cases, vous pouvez **éliminer le 3 et le 7 de toutes les autres cases** de cette unité.

### 2. La Paire Cachée (Hidden Pair)
- **Définition** : Deux chiffres (par exemple 4 et 9) n'apparaissent que dans deux cases précises d'une unité, mais ces deux cases contiennent *aussi* d'autres candidats parasites (par exemple \`[1, 4, 6, 9]\` et \`[4, 5, 9]\`).
- **Action** : Comme le 4 et le 9 ne peuvent aller nulle part ailleurs, vous **supprimez tous les autres candidats parasites** de ces deux cases pour ne garder que \`[4, 9]\`.

En résumé :
- **Paire Nue** : On élimine les chiffres de la paire dans le *reste* de la ligne.
- **Paire Cachée** : On élimine les *autres* chiffres dans les deux cases concernées.`
        },
        {
          author: 'Kenji_Sudoku',
          isAccepted: false,
          score: 8,
          body: `Une astuce mnémotechnique simple :
- "Nue" = La paire est visible seule (aucune autre note dans la case).
- "Cachée" = La paire est noyée parmi d'autres notes, il faut chercher la rareté des chiffres dans l'unité.`
        }
      ]
    },
    {
      title: 'Comment fonctionne le calcul du classement Elo (Glicko-2) dans les Duels 1v1 ?',
      slug: 'calcul-classement-elo-glicko2-duels-sudoku',
      body: `J'aimerais comprendre comment sont attribués les points après un match en duel 1v1. Combien de points gagne-t-on contre un adversaire plus fort ou plus faible ?`,
      tags: ['duel', 'classement', 'elo', 'multijoueur'],
      author: 'David_Duel',
      score: 12,
      views: 310,
      answers: [
        {
          author: 'Alex_Logic',
          isAccepted: true,
          score: 15,
          body: `La plateforme utilise l'algorithme officiel **Glicko-2**, une évolution moderne du système Elo d'échecs.

### Les 3 paramètres pris en compte :
1. **Le Rating (Elo)** : Votre niveau estimé (base 1500).
2. **L'Écart de Fiabilité (RD - Rating Deviation)** : Plus vous jouez souvent, plus votre RD est bas (votre score est stable). Si vous êtes nouveau, votre RD est élevé (vous gagnez/perdez plus de points par match).
3. **La Volatilité** : Mesure la régularité de vos performances.

### Exemple de gain :
- Victoire contre un joueur à +200 Elo : Gain d'environ **+22 à +30 points**.
- Victoire contre un joueur à -200 Elo : Gain d'environ **+4 à +8 points**.
- Les pièces (coins) misées sont transférées instantanément via le registre zéro-sum.`
        }
      ]
    },
    {
      title: 'Qu\'est-ce que la technique BUG+1 et quand faut-il l\'utiliser ?',
      slug: 'technique-bug-plus-1-sudoku-definition-utilisation',
      body: `J'ai vu mentionner "BUG+1" (Bivalue Universal Grave) dans une analyse de partie difficile. Que signifie cet acronyme et comment l'appliquer en situation réelle ?`,
      tags: ['expert', 'bug-plus-1', 'technique-avancee'],
      author: 'Lucas_Tactics',
      score: 9,
      views: 260,
      answers: [
        {
          author: 'Kenji_Sudoku',
          isAccepted: true,
          score: 19,
          body: `**BUG** signifie *Bivalue Universal Grave* (Cimetière Universel Bivalué).

C'est une technique basée sur l'unicité de la solution d'une grille de Sudoku standard :
1. Si toutes les cases non résolues de la grille ne contenaient que **exactement 2 candidats**, la grille aurait soit 2 solutions valides, soit 0 (ce qui est interdit dans un Sudoku officiel).
2. La situation **BUG+1** arrive quand TOUTE la grille est bivaluée sauf **UNE SEULE CASE** qui contient 3 candidats.
3. Pour éviter l'impasse des multi-solutions, le chiffre de cette case tri-valuée est obligatoirement **celui qui apparaît 3 fois** dans sa ligne, sa colonne et son bloc !

Vous pouvez donc poser ce chiffre immédiatement sans aucun calcul supplémentaire.`
        }
      ]
    }
  ];

  for (const q of questionsData) {
    const existing = await prisma.question.findUnique({ where: { slug: q.slug } });
    if (!existing) {
      const createdQ = await prisma.question.create({
        data: {
          title: q.title,
          slug: q.slug,
          body: q.body,
          tags: q.tags,
          score: q.score,
          views: q.views,
          answerCount: q.answers.length,
          hasAccepted: q.answers.some(a => a.isAccepted),
          authorId: userMap[q.author] || userMap['Admin'],
          answers: {
            create: q.answers.map(a => ({
              body: a.body,
              score: a.score,
              isAccepted: a.isAccepted,
              authorId: userMap[a.author] || userMap['Admin'],
            })),
          },
        },
      });
      console.log(`  -> Q&A created: ${q.title.slice(0, 40)}...`);
    }
  }

  // 5. SUDOKU TECHNIQUES (ACADEMY)
  console.log('5. Seeding interactive Sudoku Techniques (Academy)...');
  const techniquesList = [
    {
      title: 'Candidat Unique (Naked Single)',
      slug: 'candidat-unique-naked-single',
      difficulty: Difficulty.EASY,
      description: 'La technique la plus élémentaire : lorsqu\'une case ne peut contenir qu\'un seul chiffre possible après élimination de tous les chiffres présents dans sa ligne, sa colonne et son bloc.',
      metaTitle: 'Candidat Unique Sudoku | Technique de Base',
      metaDescription: 'Apprenez à repérer les candidats uniques en Sudoku pour démarrer efficacement chaque grille.',
      status: 'PUBLISHED',
    },
    {
      title: 'Chiffre Caché (Hidden Single)',
      slug: 'chiffre-cache-hidden-single',
      difficulty: Difficulty.EASY,
      description: 'Un chiffre ne peut aller qu\'à un seul endroit dans une ligne, une colonne ou un bloc 3x3, même si la case en question possède d\'autres notes candidates.',
      metaTitle: 'Chiffre Caché Sudoku | Tutoriel Débutant',
      metaDescription: 'Maîtrisez le balayage visuel pour trouver les chiffres cachés dans les blocs 3x3.',
      status: 'PUBLISHED',
    },
    {
      title: 'Paires Nues (Naked Pairs)',
      slug: 'paires-nues-naked-pairs',
      difficulty: Difficulty.MEDIUM,
      description: 'Deux cases d\'une même unité ne contiennent que les deux mêmes candidats. Ces deux chiffres peuvent être éliminés de tout le reste de l\'unité.',
      metaTitle: 'Paires Nues Sudoku | Technique Intermédiaire',
      metaDescription: 'Comment identifier et exploiter les paires nues pour débloquer les grilles moyennes.',
      status: 'PUBLISHED',
    },
    {
      title: 'Candidats Verrouillés (Pointing Pairs)',
      slug: 'candidats-verrouilles-pointing-pairs',
      difficulty: Difficulty.MEDIUM,
      description: 'Quand tous les candidats d\'un chiffre dans un bloc 3x3 sont alignés sur une seule ligne ou colonne, ce chiffre est exclu du reste de cette ligne ou colonne.',
      metaTitle: 'Pointing Pairs Sudoku | Stratégie Intermédiaire',
      metaDescription: 'Réduisez les candidats extérieurs grâce aux paires pointées dans un bloc 3x3.',
      status: 'PUBLISHED',
    },
    {
      title: 'Technique X-Wing',
      slug: 'technique-x-wing-expert',
      difficulty: Difficulty.HARD,
      description: 'Pattern de 4 cases formant un rectangle sur 2 lignes et 2 colonnes, éliminant tous les autres candidats de ces deux colonnes.',
      metaTitle: 'Technique X-Wing Sudoku | Niveau Difficile & Expert',
      metaDescription: 'Guide complet pour comprendre et appliquer le X-Wing pas à pas avec schémas interactifs.',
      status: 'PUBLISHED',
    },
    {
      title: 'Technique Swordfish (3x3)',
      slug: 'technique-swordfish-master',
      difficulty: Difficulty.EXPERT,
      description: 'Extension du X-Wing sur 3 lignes et 3 colonnes. Essentiel pour franchir les blocages des grilles diaboliques.',
      metaTitle: 'Technique Swordfish Sudoku | Niveau Expert & Diabolique',
      metaDescription: 'Maîtrisez le Swordfish à trois lignes et trois colonnes pour résoudre les grilles les plus complexes.',
      status: 'PUBLISHED',
    },
    {
      title: 'Technique XY-Wing',
      slug: 'technique-xy-wing',
      difficulty: Difficulty.HARD,
      description: 'Combinaison de 3 cases bivaluées (Pivot et 2 Pinces) forçant l\'élimination d\'un candidat dans toutes les cases partagées.',
      metaTitle: 'Technique XY-Wing Sudoku | Explications et Exemples',
      metaDescription: 'Comprenez la relation Pivot-Pinces du XY-Wing pour débloquer les grilles de compétition.',
      status: 'PUBLISHED',
    },
  ];

  for (const t of techniquesList) {
    const existing = await prisma.sudokuTechnique.findUnique({ where: { slug: t.slug } });
    if (!existing) {
      await prisma.sudokuTechnique.create({
        data: {
          title: t.title,
          slug: t.slug,
          difficulty: t.difficulty,
          description: t.description,
          metaTitle: t.metaTitle,
          metaDescription: t.metaDescription,
          status: t.status,
        },
      });
      console.log(`  -> Technique created: ${t.title}`);
    }
  }

  // 6. SHOP PRODUCTS (COIN SHOP & PERKS)
  console.log('6. Seeding Shop Products...');
  const products = [
    {
      name: 'Pack 5 Indices Intelligents',
      description: '5 indices explicatifs pas à pas pour vos parties solo sans impacter votre note de fair-play.',
      priceCoins: 150,
      category: 'utilities',
      type: 'consumable',
      entitlement: 'EXTRA_HINTS',
      quantity: 5,
      isActive: true,
      isFeatured: true,
      stock: 9999,
    },
    {
      name: 'Pack 25 Indices Intelligents (Mega Pack)',
      description: '25 indices avec explications de la technique logique exacte à appliquer.',
      priceCoins: 600,
      category: 'utilities',
      type: 'consumable',
      entitlement: 'EXTRA_HINTS',
      quantity: 25,
      isActive: true,
      isFeatured: false,
      stock: 9999,
    },
    {
      name: 'Badge VIP Chat & Profil Doré',
      description: 'Affichez une couronne VIP et un nom dégradé doré dans le chat mondial, le forum et les duels.',
      priceCoins: 1200,
      category: 'cosmetics',
      type: 'perk',
      entitlement: 'CHAT_VIP',
      durationDays: 30,
      isActive: true,
      isFeatured: true,
      stock: 500,
    },
    {
      name: 'Thème de Grille : Midnight Cyberpunk',
      description: 'Habillez votre plateau de jeu avec un thème sombre néon haute lisibilité OLED.',
      priceCoins: 850,
      category: 'cosmetics',
      type: 'perk',
      entitlement: 'THEME_CYBERPUNK',
      isActive: true,
      isFeatured: false,
      stock: 9999,
    },
    {
      name: 'Sauvegarde de Série (Streak Shield)',
      description: 'Protège automatiquement votre série de victoires quotidiennes si vous manquez un jour.',
      priceCoins: 300,
      category: 'utilities',
      type: 'consumable',
      entitlement: 'STREAK_SHIELD',
      quantity: 1,
      isActive: true,
      isFeatured: false,
      stock: 9999,
    },
    {
      name: 'Pass Zéro Publicité (30 Jours)',
      description: 'Navigation 100% épurée et sans interruption sur toute la plateforme pendant 1 mois.',
      priceCoins: 2000,
      category: 'perks',
      type: 'perk',
      entitlement: 'NO_ADS',
      durationDays: 30,
      isActive: true,
      isFeatured: true,
      stock: 9999,
    }
  ];

  for (const p of products) {
    const existing = await prisma.shopProduct.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.shopProduct.create({ data: p });
      console.log(`  -> Shop Product created: ${p.name}`);
    } else {
      await prisma.shopProduct.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
  }

  // 7. ENSURE DEFAULT MARKETING & THEME SETTINGS
  console.log('7. Ensuring Site Settings & Theme defaults...');
  const defaultTheme = {
    brandName: 'Sudoku Premium',
    primaryColor: '#2563EB',
    accentColor: '#F59E0B',
    bgColor: '#020F24',
    surfaceColor: '#0B1E3B',
    textColor: '#F8FAFC',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  };

  await prisma.siteSettings.upsert({
    where: { key: 'theme_published' },
    update: {},
    create: { key: 'theme_published', value: defaultTheme },
  });

  await prisma.siteSettings.upsert({
    where: { key: 'theme_draft' },
    update: {},
    create: { key: 'theme_draft', value: defaultTheme },
  });

  console.log('=== PLATFORM CONTENT POPULATION COMPLETED SUCCESSFULLY! ===');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
