const { PrismaClient, Difficulty } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== SEEDING MASS COMMUNITY TOPICS & Q&A FOR SEO ===');

  const users = await prisma.user.findMany({
    include: { profile: true },
  });
  const userMap = {};
  for (const u of users) {
    if (u.profile?.username) {
      userMap[u.profile.username] = u.id;
    }
  }
  const defaultUserIds = users.map(u => u.id);
  const getRandomUserId = () => defaultUserIds[Math.floor(Math.random() * defaultUserIds.length)];

  const categories = await prisma.forumCategory.findMany();
  const catMap = {};
  for (const c of categories) {
    catMap[c.name] = c.id;
  }
  const getCatId = (name) => catMap[name] || categories[0]?.id;

  // Mass Forum Topics
  const extraTopics = [
    {
      title: 'Top 5 des erreurs fatales commises par les débutants en Sudoku',
      slug: 'top-5-erreurs-fatales-debutants-sudoku',
      category: 'Débutants & Entraide',
      content: `Quand on commence le Sudoku, certaines mauvaises habitudes ralentissent la progression et provoquent des erreurs frustrantes. Voici les 5 pièges les plus fréquents et comment les éviter :

1. **Deviner au hasard (Guessing)** : Le Sudoku est un jeu de pure déduction. Si vous posez un chiffre "au pif", une erreur invisible ruinera toute votre grille 10 minutes plus tard.
2. **Oublier de vérifier les 3 dimensions** : Avant de poser un chiffre, vérifiez TOUJOURS sa ligne, sa colonne ET son bloc 3x3.
3. **Surcharger la grille de notes** : Noter 5 ou 6 candidats par case rend la grille illisible. Utilisez la notation de Snyder (maximum 2 candidats par bloc).
4. **Rester bloqué sur la même zone** : Si un bloc ne donne rien, changez d'angle et scannez les chiffres déjà très présents (ex: les 1 ou les 9).
5. **Négliger les lignes et colonnes presque pleines** : Une ligne avec 7 chiffres posés ne laisse que 2 options faciles à déduire.

Quelle a été l'erreur la plus difficile à corriger dans votre jeu ?`,
      comments: [
        'Le guessing ! C\'était mon plus grand défaut. Depuis que j\'ai arrêté, je termine 100% de mes grilles sans jamais effacer.',
        'La notation de Snyder a complètement révolutionné ma vitesse. Merci pour ce rappel essentiel.',
        'Très bon guide pour les nouveaux joueurs, à épingler en haut de section !',
      ]
    },
    {
      title: 'Killer Sudoku vs Sudoku Classique : Règles, sommes clés et stratégies',
      slug: 'killer-sudoku-vs-sudoku-classique-regles-sommes-cles',
      category: 'Variantes & Casse-têtes',
      content: `Le **Killer Sudoku** combine les règles du Sudoku classique avec des cages en pointillés dont la somme totale est indiquée en haut à gauche.

### Les règles d'or du Killer Sudoku :
1. Aucun chiffre ne peut se répéter à l'intérieur d'une même cage.
2. La règle du 45 : La somme des chiffres 1 à 9 d'une ligne, colonne ou bloc fait TOUJOURS **45**.
3. Les combinaisons uniques indispensables à mémoriser :
   - Cage de 2 cases faisant 3 = obligatoirement \`[1, 2]\`
   - Cage de 2 cases faisant 4 = obligatoirement \`[1, 3]\`
   - Cage de 2 cases faisant 17 = obligatoirement \`[8, 9]\`
   - Cage de 3 cases faisant 6 = obligatoirement \`[1, 2, 3]\`
   - Cage de 3 cases faisant 24 = obligatoirement \`[7, 8, 9]\`

Aimeriez-vous voir un mode Killer Sudoku ajouté aux duels multijoueurs ?`,
      comments: [
        'La règle du 45 est magique ! Elle permet de déduire la case qui dépasse d\'un bloc en un calcul mental de 2 secondes.',
        'Oui à 100% pour un mode Killer Sudoku en duel ! Ça apporterait une dimension calcul mental passionnante.',
        'Les sommes uniques comme 17=[8,9] ou 16=[7,9] deviennent des réflexes automatiques après une semaine.',
      ]
    },
    {
      title: 'Guide du Skyscraper (Gratte-ciel) : Une alternative élégante au X-Wing',
      slug: 'guide-technique-skyscraper-gratte-ciel-sudoku',
      category: 'Stratégies & Techniques',
      content: `Le **Skyscraper** (Gratte-ciel) est une variation asymétrique du X-Wing.

### Structure du Skyscraper :
- Vous avez deux lignes (ou colonnes) contenant chacune un candidat apparaissant exactement deux fois.
- Ces deux lignes partagent une base alignée dans la même colonne (le "rez-de-chaussée").
- Mais les deux autres sommets (les "toits") sont décalés dans des colonnes différentes.

### Règle d'élimination :
Comme l'un des deux toits contient obligatoirement le chiffre recherché, toute case qui a une vue directe sur **les deux toits à la fois** ne peut jamais contenir ce chiffre !

C'est une technique redoutable pour éliminer les derniers candidats récalcitrants sur les grilles Diaboliques.`,
      comments: [
        'C\'est l\'un des patterns les plus élégants du jeu. Quand on le trouve, la grille se débloque instantanément.',
        'Merci pour l\'explication claire ! J\'avais du mal à comprendre pourquoi les deux toits ne devaient pas être alignés.',
      ]
    },
    {
      title: 'Comment gérer la pression du chronomètre dans les tournois de Sudoku ?',
      slug: 'comment-gerer-pression-chronometre-tournois-sudoku',
      category: 'Duels & Multijoueur 1v1',
      content: `Lorsqu'on joue en tournoi ou en duel classé contre un adversaire à haut Elo, la barre de progression ennemie et le compte à rebours peuvent créer un stress paralysant.

Voici quelques conseils de champions pour garder la tête froide :
- **Masquer la progression adverse** si elle vous déconcentre.
- **Respirer calmement** : 3 secondes de respiration profonde évitent 30 secondes de clics paniqués.
- **Privilégier la régularité** : Une grille résolue à allure constante bat presque toujours un joueur qui sprinte puis fait une erreur critique.

Quel est votre rituel avant de lancer un duel classé ?`,
      comments: [
        'Je désactive toujours le son du compte à rebours. Le tic-tac me stressait trop.',
        'Tellement vrai ! En duel, 80% des victoires se jouent sur l\'absence d\'erreurs plutôt que sur la vitesse brute.',
        'Mon rituel : toujours faire une grille facile d\'échauffement avant de partir en ranked.',
      ]
    },
    {
      title: 'Sudoku sur mobile vs Sudoku sur grand écran : Quelles différences de performance ?',
      slug: 'sudoku-mobile-vs-grand-ecran-performance',
      category: 'Général & Communauté',
      content: `Avez-vous remarqué une différence de confort ou de vitesse selon que vous jouez sur smartphone, tablette ou ordinateur de bureau ?

- Sur mobile : Idéal dans les transports, mais les petites cases augmentent les miss-clicks.
- Sur ordinateur : Pavé numérique ultra rapide et vue d'ensemble instantanée sur les 81 cases.
- Sur tablette avec stylet : Le compromis parfait entre sensation papier et fonctionnalités modernes.

Quelle est votre plateforme préférée pour jouer au quotidien ?`,
      comments: [
        'Sur PC avec le pavé numérique mécanique, je gagne au moins 45 secondes par rapport à mon téléphone.',
        'Sur tablette en mode sombre avec le café le matin, impossible de faire mieux !',
        'L\'interface de ce site est très bien adaptée sur mobile, les boutons chiffres tombent pile sous le pouce.',
      ]
    },
    {
      title: 'Technique 2-String Kite : Comment la repérer facilement ?',
      slug: 'technique-2-string-kite-sudoku-tutoriel',
      category: 'Stratégies & Techniques',
      content: `Le **2-String Kite** (Cerf-volant à deux ficelles) est une technique basée sur les liens forts (strong links) entre une ligne et une colonne qui se croisent dans un même bloc 3x3.

Si un chiffre n'a que 2 positions dans une ligne et 2 positions dans une colonne, et qu'une position de chaque se trouve dans le même bloc :
Les deux extrémités libres forment la pointe du cerf-volant. La case d'intersection de ces deux extrémités ne peut jamais contenir ce chiffre.

Très utile quand le X-Wing classique n'est pas présent !`,
      comments: [
        'Cette technique m\'a sauvé plus d\'une fois sur les grilles Master. Très bien expliquée !',
        'Le nom "cerf-volant" est très imagé et aide vraiment à visualiser le croisement ligne/colonne.',
      ]
    },
  ];

  for (const t of extraTopics) {
    const existing = await prisma.forumPost.findFirst({ where: { slug: t.slug } });
    if (!existing) {
      await prisma.forumPost.create({
        data: {
          title: t.title,
          slug: t.slug,
          content: t.content,
          views: Math.floor(Math.random() * 300) + 120,
          categoryId: getCatId(t.category),
          authorId: getRandomUserId(),
          comments: {
            create: t.comments.map(c => ({
              authorId: getRandomUserId(),
              content: c,
            })),
          },
        },
      });
      console.log(`  -> Mass Forum Post: ${t.title}`);
    }
  }

  // Extra Q&A Questions
  const extraQuestions = [
    {
      title: 'Comment débloquer une grille de Sudoku sans faire d\'hypothèse (sans guessing) ?',
      slug: 'comment-debloquer-grille-sudoku-sans-guessing',
      body: `Je suis souvent bloqué sur les grilles de niveau Difficile où plus aucun chiffre direct n'apparaît. Existe-t-il une méthode systématique pour trouver le prochain coup logique sans essayer des chiffres au hasard ?`,
      tags: ['methode', 'debutant', 'logique', 'astuce'],
      score: 15,
      views: 380,
      answers: [
        {
          isAccepted: true,
          score: 21,
          body: `Oui ! Suivez cette checklist méthodique dans l'ordre strict :

1. **Re-scanner les chiffres majoritaires** (chiffres déjà posés 6, 7 ou 8 fois).
2. **Chercher les Paires Pointées (Pointing Pairs)** dans les blocs 3x3.
3. **Chercher les Paires Nues (Naked Pairs)** dans les lignes/colonnes avec beaucoup de notes.
4. **Vérifier les Paires Cachées** en comptant la fréquence de chaque chiffre dans une ligne.
5. **Chercher un X-Wing** sur les chiffres apparaissant 2 fois dans plusieurs lignes.

99% des grilles difficiles se débloquent à l'une de ces 5 étapes sans jamais avoir recours au hasard.`
        }
      ]
    },
    {
      title: 'Combien existe-t-il de grilles de Sudoku valides différentes dans le monde ?',
      slug: 'combien-existe-t-il-de-grilles-de-sudoku-valides',
      body: `Je me demandais d'un point de vue mathématique combien de grilles de Sudoku 9x9 complètes et valides existent. Le nombre est-il infini ou fini ?`,
      tags: ['mathematiques', 'curiosite', 'theorie'],
      score: 28,
      views: 650,
      answers: [
        {
          isAccepted: true,
          score: 34,
          body: `Le nombre de grilles de Sudoku 9x9 valides a été calculé avec exactitude par les mathématiciens Bertram Felgenhauer et Frazer Jarvis en 2005 :

Il y a exactement **6 670 903 752 021 072 936 960** grilles valides possibles (soit environ **6,67 × 10²¹**, ou plus de 6 sextillions de grilles !).

En retirant les symétries géométriques (rotations, réflexions et permutations de chiffres), il reste encore **5 472 730 538** grilles fondamentalement uniques.

Vous pouvez donc jouer toute votre vie sans jamais revoir la même grille !`
        }
      ]
    },
    {
      title: 'Quel est le nombre minimum d\'indices pour qu\'une grille de Sudoku ait une solution unique ?',
      slug: 'nombre-minimum-indices-sudoku-solution-unique',
      body: `Est-il possible de créer une grille valide avec seulement 16 indices de départ ? Quel est le record mathématique prouvé ?`,
      tags: ['mathematiques', 'record', 'indices'],
      score: 22,
      views: 510,
      answers: [
        {
          isAccepted: true,
          score: 29,
          body: `La réponse mathématique prouvée par Gary McGuire (University College Dublin) en 2012 après des millions d'heures de calcul informatique est : **17 indices**.

- Avec **16 indices ou moins**, il est mathématiquement impossible d'avoir une solution unique (il y aura toujours au moins 2 solutions possibles).
- Avec **17 indices**, il existe des dizaines de milliers de grilles parfaitement valides avec solution unique.`
        }
      ]
    }
  ];

  for (const q of extraQuestions) {
    const existing = await prisma.question.findUnique({ where: { slug: q.slug } });
    if (!existing) {
      await prisma.question.create({
        data: {
          title: q.title,
          slug: q.slug,
          body: q.body,
          tags: q.tags,
          score: q.score,
          views: q.views,
          answerCount: q.answers.length,
          hasAccepted: q.answers.some(a => a.isAccepted),
          authorId: getRandomUserId(),
          answers: {
            create: q.answers.map(a => ({
              body: a.body,
              score: a.score,
              isAccepted: a.isAccepted,
              authorId: getRandomUserId(),
            })),
          },
        },
      });
      console.log(`  -> Mass Q&A: ${q.title}`);
    }
  }

  console.log('=== MASS COMMUNITY SEEDING COMPLETED! ===');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
