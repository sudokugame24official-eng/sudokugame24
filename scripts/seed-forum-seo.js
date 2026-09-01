const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 15 SEO-optimized forum topics...");

  // Get or create an admin user to author the posts
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@sudokugame24.com",
        passwordHash: "dummyhash",
        role: "ADMIN",
        profile: {
          create: {
            username: "SudokuMaster",
            level: 50
          }
        }
      }
    });
  }

  // Categories mapping to the frontend
  const categoryNames = [
    "Débutants & Entraide", // c1
    "Stratégies & Techniques", // c2
    "Duels & Multijoueur 1v1", // c3
    "Variantes & Casse-têtes"  // c4
  ];
  
  const dbCategories = [];
  for (const name of categoryNames) {
    const cat = await prisma.forumCategory.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    dbCategories.push(cat);
  }

  const posts = [
    // Category 1: Débutants
    {
      title: "Comment résoudre une grille de Sudoku facilement ? (Guide et Astuces pour Débutants)",
      slug: "comment-resoudre-grille-sudoku-facilement-astuces",
      content: "Bonjour à tous les nouveaux joueurs ! Si vous débutez et que vous vous demandez comment jouer au Sudoku, voici les règles de base : vous devez remplir une grille de 9x9 avec des chiffres de 1 à 9 sans jamais répéter le même chiffre dans une ligne, une colonne ou un bloc de 3x3.\nLa meilleure astuce pour commencer est le 'balayage' (scanning) : concentrez-vous sur un chiffre (par exemple le 1) et regardez où il peut aller dans les autres blocs.\nQuelles sont vos meilleures astuces pour ne pas bloquer sur les grilles de Sudoku faciles ? Partagez vos conseils !",
      category: dbCategories[0],
      isPinned: true
    },
    {
      title: "Bloqué sur un Sudoku : Faut-il utiliser les notes (candidats) dès le début ?",
      slug: "faut-il-utiliser-les-notes-candidats",
      content: "J'ai remarqué que beaucoup de joueurs de Sudoku en ligne utilisent la fonction de prise de notes (pencil marks) dès le début de la partie. Personnellement, j'essaie de résoudre les grilles de Sudoku de niveau facile et moyen uniquement de tête. \nÀ partir de quel niveau de difficulté (difficile, diabolique, expert) considérez-vous qu'il est indispensable de noter tous les candidats pour avancer ? Vos avis m'intéressent !",
      category: dbCategories[0]
    },
    {
      title: "Le vocabulaire du Sudoku expliqué (Candidats, Maisons, Cellules)",
      slug: "vocabulaire-du-sudoku-explique",
      content: "Pour progresser au Sudoku et comprendre les tutoriels en ligne, il faut maîtriser le jargon ! \n- **Cellule/Case :** L'un des 81 carrés de la grille.\n- **Maison (House) :** Une ligne, une colonne ou un bloc 3x3. (Une règle de base : chaque maison doit contenir les chiffres 1 à 9).\n- **Candidat :** Un chiffre qui peut potentiellement être placé dans une case vide.\n- **Paire nue / Naked Pair :** Deux cases dans une même maison qui ne peuvent contenir que les deux mêmes candidats.\nAvez-vous d'autres termes techniques à ajouter pour notre lexique SudokuGame24 ?",
      category: dbCategories[0]
    },

    // Category 2: Stratégies
    {
      title: "Maîtriser la technique X-Wing au Sudoku (Tutoriel complet)",
      slug: "maitriser-technique-x-wing-sudoku",
      content: "La technique du X-Wing est indispensable pour résoudre les grilles de Sudoku niveau expert. Elle se base sur l'identification d'un candidat précis qui n'apparaît que dans deux cases sur deux lignes différentes, mais dans les mêmes colonnes. \nEn traçant une ligne imaginaire, on forme un 'X'. Cela permet d'éliminer ce candidat de toutes les autres cases de ces colonnes ! \nAvez-vous des exemples de grilles récentes sur la plateforme où vous avez dû utiliser un X-Wing pour vous débloquer ?",
      category: dbCategories[1],
      isPinned: true
    },
    {
      title: "Swordfish et XY-Wing : Comment repérer ces motifs avancés ?",
      slug: "swordfish-xy-wing-comment-reperer-motifs",
      content: "Quand le X-Wing ne suffit plus, il faut passer aux techniques de Sudoku diabolique : le Swordfish (l'espadon) et le XY-Wing. Le Swordfish est une extension du X-Wing sur 3 lignes/colonnes, tandis que le XY-Wing utilise des intersections de paires.\nJ'ai toujours du mal à repérer visuellement les XY-Wing sans perdre un temps fou. Avez-vous des astuces d'observation ou de balayage pour identifier ces techniques complexes plus rapidement lors de nos parties classées ?",
      category: dbCategories[1]
    },
    {
      title: "Les Paires Cachées et Nues (Hidden & Naked Pairs) : Ne faites plus l'erreur !",
      slug: "paires-cachees-nues-hidden-naked-pairs",
      content: "La recherche de paires nues et de paires cachées est la base de la résolution de Sudoku difficile. Une paire nue est facile à voir : deux cases avec les mêmes deux candidats. Mais la paire cachée est plus subtile : deux chiffres qui sont les seuls candidats possibles pour deux cases, même si ces cases contiennent d'autres notes !\nN'oubliez pas de nettoyer vos brouillons (candidats) après avoir trouvé une paire, cela débloque souvent 80% de la grille.",
      category: dbCategories[1]
    },
    {
      title: "Technique du Skyscraper (Gratte-ciel) : Une alternative puissante",
      slug: "technique-skyscraper-gratte-ciel",
      content: "Avez-vous déjà utilisé la méthode Skyscraper pour résoudre une grille de Sudoku extrême ? C'est une variante des chaînes forcées très utile quand un X-Wing est presque formé, mais qu'une des cases est décalée. Elle permet des éliminations cruciales. \nQuel est votre taux de réussite lorsque vous utilisez cette stratégie en mode compétition chronométrée ?",
      category: dbCategories[1]
    },

    // Category 3: Duels
    {
      title: "Sudoku en ligne multijoueur : Comment améliorer son temps et sa vitesse (Speedcubing)",
      slug: "sudoku-en-ligne-multijoueur-ameliorer-vitesse",
      content: "Sur SudokuGame24, le mode Duel 1v1 ne pardonne pas ! Pour battre votre adversaire, il ne suffit pas de savoir résoudre la grille, il faut être rapide. \nMes astuces pour améliorer sa vitesse (Speed Sudoku) :\n1. Utilisez les raccourcis clavier plutôt que la souris.\n2. Ne remplissez les candidats que lorsque c'est absolument nécessaire.\n3. Entraînez votre vision périphérique pour scanner le plateau de jeu.\nQuels sont vos records de temps sur les grilles Moyennes et Difficiles ?",
      category: dbCategories[2],
      isPinned: true
    },
    {
      title: "Stratégie en mode Duel : Faut-il regarder la progression de l'adversaire ?",
      slug: "strategie-duel-regarder-progression-adversaire",
      content: "Pendant un match de Sudoku multijoueur classé (Ranked), la barre de progression de l'adversaire est visible. Est-ce que cela vous motive ou vous stresse ? \nPersonnellement, quand je vois que mon adversaire prend de l'avance, j'ai tendance à faire des erreurs d'inattention fatales en essayant d'aller trop vite. Quelle est votre psychologie de match pour rester concentré ?",
      category: dbCategories[2]
    },
    {
      title: "Recherche de partenaires pour s'entraîner aux Duels ELO",
      slug: "recherche-partenaires-entrainement-duels-elo",
      content: "Salut la communauté ! Je cherche des joueurs de niveau intermédiaire pour faire des duels amicaux sur SudokuGame24 afin de préparer le classement ELO. Jouer contre des vrais joueurs est le meilleur moyen d'apprendre de nouvelles techniques d'optimisation de temps.\nAjoutez-moi en ami sur la plateforme si vous voulez faire quelques parties de Sudoku en direct ce week-end !",
      category: dbCategories[2]
    },
    {
      title: "L'algorithme de classement ELO de SudokuGame24 : Vos impressions ?",
      slug: "algorithme-classement-elo-impressions",
      content: "Le système de classement mondial permet enfin d'avoir un vrai mode compétitif pour le Sudoku sur navigateur. Comment trouvez-vous l'équilibrage du matchmaking ? Avez-vous réussi à atteindre le rang Diamant ou Maître ?\nDiscutons du système de points et des meilleures stratégies pour grimper dans le Leaderboard mondial de Sudoku !",
      category: dbCategories[2]
    },

    // Category 4: Variantes
    {
      title: "Killer Sudoku (Sudoku Tueur) : Astuces pour bien démarrer",
      slug: "killer-sudoku-tueur-astuces-bien-demarrer",
      content: "Le Killer Sudoku est l'une des variantes les plus populaires ! En plus des règles classiques, il faut respecter des sommes mathématiques dans des cages délimitées par des pointillés, sans aucun chiffre donné au départ.\nLa règle d'or, c'est la règle des 45 : chaque ligne, colonne et bloc doit faire un total de 45. L'utilisez-vous souvent pour trouver des chiffres 'outies' ou 'innies' ? Partagez vos techniques de déduction mathématique !",
      category: dbCategories[3],
      isPinned: true
    },
    {
      title: "Jigsaw Sudoku (Sudoku Irrégulier) : Changer sa façon de penser",
      slug: "jigsaw-sudoku-irregulier-changer-facon-penser",
      content: "Fini les beaux carrés 3x3 bien propres ! Le Jigsaw Sudoku (ou Sudoku Géométrique) utilise des blocs de formes irrégulières. \nLa technique clé ici est la loi de l'intersection et l'observation des goulots d'étranglement géométriques. Je trouve ça parfois plus difficile que le Sudoku Classique niveau expert. Quelle est votre variante préférée ?",
      category: dbCategories[3]
    },
    {
      title: "Le Sudoku Samurai : Le défi ultime des 5 grilles entrelacées",
      slug: "sudoku-samurai-defi-ultime-5-grilles",
      content: "Jouer au Sudoku Samurai demande une patience énorme. Avec ses 5 grilles interconnectées, une erreur dans la grille centrale peut détruire votre partie 45 minutes plus tard.\nComment abordez-vous ces grilles géantes ? Vous commencez par le centre ou par les 4 coins ? Pensez-vous qu'on devrait avoir un classement dédié au Samurai sur la plateforme ?",
      category: dbCategories[3]
    },
    {
      title: "Miracle Sudoku : Quand les règles se multiplient",
      slug: "miracle-sudoku-quand-regles-se-multiplient",
      content: "Si vous suivez la chaîne 'Cracking The Cryptic', vous connaissez le Miracle Sudoku ! Combiner les règles d'échecs (le pas du Cavalier, la touche du Roi) et de non-consécutivité avec seulement 1 ou 2 chiffres de départ... c'est de l'art.\nAimeriez-vous voir l'apparition de règles miracles dans les événements spéciaux de SudokuGame24 ? Quelles règles supplémentaires vous donnent le plus de fil à retordre ?",
      category: dbCategories[3]
    }
  ];

  for (const post of posts) {
    await prisma.forumPost.upsert({
      where: { slug: post.slug },
      update: { content: post.content },
      create: {
        title: post.title,
        slug: post.slug,
        content: post.content,
        isPinned: post.isPinned || false,
        authorId: admin.id,
        categoryId: post.category.id
      }
    });
  }

  console.log("Seeding complete! SEO topics inserted.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
