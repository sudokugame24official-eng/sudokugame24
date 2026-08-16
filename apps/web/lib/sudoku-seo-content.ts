/**
 * P1-S: substantial, UNIQUE content per difficulty landing page.
 * Each level has its own sections — not a thin shared template.
 */

export interface DifficultyContent {
  slug: string;
  h1: { en: string; fr: string };
  intro: { en: string; fr: string };
  whatIs: { en: string[]; fr: string[] };
  who: { en: string[]; fr: string[] };
  difficultyExplained: { en: string; fr: string };
  howToSolve: { en: string[]; fr: string[] };
  techniques: { name: string; desc: { en: string; fr: string } }[];
  mistakes: { en: string[]; fr: string[] };
  tips: { en: string[]; fr: string[] };
  faq: { q: { en: string; fr: string }, a: { en: string; fr: string } }[];
  metaTitle: { en: string; fr: string };
  metaDescription: { en: string; fr: string };
}

export const DIFFICULTIES: DifficultyContent[] = [
  {
    slug: "easy",
    h1: { en: "Easy Sudoku — Free Puzzles for Beginners", fr: "Sudoku Facile — Grilles gratuites pour débutants" },
    intro: {
      en: "Easy sudoku puzzles have 40 to 50 given clues and can be solved with simple scanning — no advanced technique required. They are the fastest way to internalize the rules and build confidence before moving to medium.",
      fr: "Les grilles faciles contiennent 40 à 50 chiffres donnés et se résolvent par simple balayage — aucune technique avancée n'est nécessaire. C'est le meilleur moyen d'intégrer les règles et de prendre confiance avant de passer au niveau moyen.",
    },
    whatIs: {
      en: [
        "An easy sudoku is a 9×9 grid where roughly half the cells are already filled. Each row, column and 3×3 box must contain the digits 1 through 9 exactly once.",
        "With this many clues, nearly every step has an obvious deduction: a cell where only one candidate remains. You rarely need to write pencil marks at all.",
      ],
      fr: [
        "Un sudoku facile est une grille 9×9 dont environ la moitié des cases sont déjà remplies. Chaque ligne, colonne et bloc 3×3 doit contenir les chiffres 1 à 9 exactement une fois.",
        "Avec autant d'indices, presque chaque étape comporte une déduction évidente : une case où un seul candidat subsiste. Le crayonnage est rarement utile.",
      ],
    },
    who: {
      en: [
        "Complete beginners learning the rules",
        "Casual players who solve to relax, not to compete",
        "Children and seniors looking for a gentle daily brain exercise",
        "Players warming up before a timed medium or hard grid",
      ],
      fr: [
        "Les grands débutants qui apprennent les règles",
        "Les joueurs occasionnels qui se détendent sans compétition",
        "Enfants et séniors cherchant un exercice cérébral doux et quotidien",
        "Les joueurs qui s'échauffent avant une grille moyenne ou difficile chronométrée",
      ],
    },
    difficultyExplained: {
      en: "On standard scales easy grids rate around 200–500 rating points: a scan of rows, columns and boxes is always enough. Average solve time for a first-timer is 10–20 minutes; an experienced player finishes in 3–5 minutes.",
      fr: "Sur les échelles classiques, les grilles faciles valent environ 200 à 500 points : un balayage des lignes, colonnes et blocs suffit toujours. Temps moyen : 10–20 minutes pour un débutant, 3–5 minutes pour un joueur expérimenté.",
    },
    howToSolve: {
      en: [
        "Scan each 3×3 box for a digit that can only fit in one cell.",
        "Scan each row and column the same way — look for a digit missing from a row and check which column it can occupy.",
        "When a digit is placed, immediately re-check its row, column and box: easy grids often cascade from a single placement.",
        "Count 1-through-9 in a nearly full row, column or box to spot the last missing digit instantly.",
      ],
      fr: [
        "Balayez chaque bloc 3×3 pour trouver un chiffre qui ne peut tenir qu'à une seule place.",
        "Balayez lignes et colonnes de la même façon — cherchez un chiffre manquant à une ligne et voyez quelle colonne il peut occuper.",
        "Après chaque placement, revérifiez immédiatement sa ligne, colonne et bloc : les grilles faciles s'enchaînent souvent en cascade.",
        "Comptez de 1 à 9 dans une ligne, colonne ou bloc presque plein pour repérer le dernier chiffre manquant.",
      ],
    },
    techniques: [
      { name: "Scanning", desc: { en: "Systematically checking rows and columns to eliminate positions for a digit — the bread and butter of easy grids.", fr: "Vérification systématique des lignes et colonnes pour éliminer des positions d'un chiffre — la base des grilles faciles." } },
      { name: "Cross-hatching", desc: { en: "Focusing on one 3×3 box and marking where a digit is blocked by rows/columns crossing it.", fr: "Se concentrer sur un bloc 3×3 et marquer où un chiffre est bloqué par les lignes/colonnes qui le traversent." } },
      { name: "Last free cell", desc: { en: "In a row, column or box with a single empty cell, that cell takes the only missing digit.", fr: "Dans une ligne, colonne ou bloc à case unique vide, cette case prend le seul chiffre manquant." } },
    ],
    mistakes: {
      en: [
        "Guessing instead of scanning — even one lucky guess breaks the deduction habit you will need later.",
        "Filling candidates everywhere: on easy grids it slows you down more than it helps.",
        "Forgetting the 3×3 box constraint and only checking rows and columns.",
      ],
      fr: [
        "Deviner au lieu de balayer — même une intuition réussie casse l'habitude de déduction indispensable ensuite.",
        "Remplir les candidats partout : sur les grilles faciles, cela ralentit plus qu'autre chose.",
        "Oublier la contrainte de bloc 3×3 en ne vérifiant que lignes et colonnes.",
      ],
    },
    tips: {
      en: [
        "Time yourself only from your second week — let the logic settle first.",
        "Solve one easy grid daily to build speed before touching medium.",
        "Play our free easy sudoku online — no download, hints available if you get stuck.",
      ],
      fr: [
        "Ne vous chronométrez qu'à partir de la deuxième semaine — laissez la logique s'installer.",
        "Résolvez une grille facile par jour pour gagner en vitesse avant le niveau moyen.",
        "Jouez à nos sudokus faciles gratuits en ligne — sans téléchargement, avec indices si besoin.",
      ],
    },
    faq: [
      { q: { en: "How many clues does an easy sudoku have?", fr: "Combien d'indices dans un sudoku facile ?" }, a: { en: "Typically 40–50 givens out of 81 cells. The theoretical minimum for any valid sudoku is 17, but easy grids stay far above that.", fr: "En général 40 à 50 chiffres donnés sur 81 cases. Le minimum théorique d'un sudoku valide est 17, mais les grilles faciles restent bien au-dessus." } },
      { q: { en: "Is easy sudoku good for your brain?", fr: "Le sudoku facile est-il bon pour le cerveau ?" }, a: { en: "Yes — regular scanning practice improves focused attention and working memory, and the low difficulty makes it a sustainable daily habit.", fr: "Oui — la pratique régulière du balayage améliore l'attention et la mémoire de travail, et la faible difficulté en fait une habitude quotidienne tenable." } },
      { q: { en: "How long should an easy sudoku take?", fr: "Combien de temps pour un sudoku facile ?" }, a: { en: "Beginners: 10–20 minutes. Regular players: 3–5 minutes. If you consistently solve under 3 minutes, move to medium.", fr: "Débutants : 10–20 minutes. Joueurs réguliers : 3–5 minutes. Sous les 3 minutes systématiquement ? Passez au niveau moyen." } },
    ],
    metaTitle: { en: "Easy Sudoku — Free Easy Puzzles Online (Play Now)", fr: "Sudoku Facile — Grilles gratuites en ligne (Jouer)" },
    metaDescription: { en: "Play free easy sudoku online. 40–50 clues per grid, solved by simple scanning — perfect for beginners. Tips, techniques and daily practice.", fr: "Jouez au sudoku facile gratuit en ligne. 40–50 indices par grille, résolubles par simple balayage — parfait pour débuter. Conseils et pratique quotidienne." },
  },
  {
    slug: "medium",
    h1: { en: "Medium Sudoku — The Perfect Daily Challenge", fr: "Sudoku Moyen — Le défi quotidien idéal" },
    intro: {
      en: "Medium sudoku sits at the sweet spot: 32 to 39 clues, requiring genuine candidate tracking but no advanced patterns. Most daily newspaper grids are medium, which is exactly why our Daily Challenge uses this level as its baseline.",
      fr: "Le sudoku moyen est le juste milieu : 32 à 39 indices, demandant un vrai suivi des candidats mais aucun motif avancé. La plupart des grilles de journaux sont moyennes — c'est pourquoi notre Défi du jour adopte ce niveau par défaut.",
    },
    whatIs: {
      en: [
        "A medium grid removes enough clues that pure scanning stalls after the first few placements. You will need pencil marks — small candidate lists in empty cells — to keep the logic visible.",
        "Solving a medium grid takes a typical player 10 to 20 minutes, which fits a coffee break and makes it the most-played difficulty worldwide.",
      ],
      fr: [
        "Une grille moyenne supprime assez d'indices pour que le simple balayage bloque après les premiers placements. Il faut passer au crayonnage — petites listes de candidats dans les cases vides — pour garder la logique visible.",
        "La résolution prend 10 à 20 minutes pour un joueur type : une pause café parfaite, et le niveau le plus joué au monde.",
      ],
    },
    who: {
      en: [
        "Players comfortable with easy grids wanting a real but fair challenge",
        "Commuters with 15 minutes to fill",
        "Daily Challenge regulars — our daily puzzle defaults to medium difficulty",
        "Anyone training before attempting hard grids",
      ],
      fr: [
        "Les joueurs à l'aise en facile qui veulent un défi réel mais équitable",
        "Les trajets quotidiens de 15 minutes à occuper",
        "Les habitués du Défi du jour — notre grille quotidienne est moyenne par défaut",
        "Toute personne qui s'entraîne avant d'aborder le niveau difficile",
      ],
    },
    difficultyExplained: {
      en: "Medium grids rate roughly 500–1200 points. Every step is still a logical certainty, but finding it requires organized candidates instead of eyesight alone. Expect 2–4 minutes of setup before the grid starts cascading.",
      fr: "Les grilles moyennes valent environ 500 à 1200 points. Chaque étape reste une certitude logique, mais la trouver exige des candidats organisés, pas seulement de la vue. Comptez 2–4 minutes de mise en place avant que la grille ne s'enchaîne.",
    },
    howToSolve: {
      en: [
        "Fill every obvious single first — a few minutes of scanning still pays off.",
        "Enter pencil marks in all empty cells, then hunt for naked pairs: two cells in a unit sharing the same two candidates. Those digits can be removed from the rest of the unit.",
        "Look for hidden singles inside boxes: a candidate that appears in only one cell of a 3×3 box must go there even if the cell holds several marks.",
        "After each elimination, check whether a cell dropped to a single candidate — that is your next placement.",
      ],
      fr: [
        "Remplissez d'abord tous les singletons évidents — quelques minutes de balayage restent rentables.",
        "Crayonnez toutes les cases vides, puis chassez les paires nues : deux cases d'une même unité partageant les deux mêmes candidats. Ces chiffres sortent du reste de l'unité.",
        "Cherchez les singletons cachés dans les blocs : un candidat qui n'apparaît que dans une case d'un bloc 3×3 s'y place, même si la case porte plusieurs marques.",
        "Après chaque élimination, vérifiez si une case est tombée à un seul candidat — c'est votre prochain placement.",
      ],
    },
    techniques: [
      { name: "Naked pair", desc: { en: "Two cells in a row/column/box holding the same two candidates eliminate them elsewhere in that unit.", fr: "Deux cases d'une ligne/colonne/bloc portant les deux mêmes candidats les éliminent du reste de l'unité." } },
      { name: "Hidden single", desc: { en: "A digit with only one possible cell in a unit, even if that cell shows several candidates.", fr: "Un chiffre qui ne dispose que d'une seule case possible dans une unité, même si cette case porte plusieurs candidats." } },
      { name: "Pointing pair", desc: { en: "A candidate restricted to one row/column inside a box eliminates it from that row/column outside the box.", fr: "Un candidat restreint à une ligne/colonne dans un bloc en est éliminé dans cette ligne/colonne hors du bloc." } },
    ],
    mistakes: {
      en: [
        "Skipping pencil marks and trying to hold candidates mentally — errors follow within minutes.",
        "Confusing a hidden single with a guess: always verify the digit truly has no other cell in the unit.",
        "Neglecting boxes: on medium grids, most hidden singles live in the 3×3 boxes.",
      ],
      fr: [
        "Négliger le crayonnage en gardant les candidats en tête — les erreurs arrivent en minutes.",
        "Confondre singleton caché et intuition : vérifiez toujours que le chiffre n'a vraiment aucune autre case dans l'unité.",
        "Délaisser les blocs : sur les grilles moyennes, la plupart des singletons cachés se cachent dans les blocs 3×3.",
      ],
    },
    tips: {
      en: [
        "Our Daily Challenge is a medium grid — solve it every day to track your progress.",
        "Aim to finish under 12 minutes before considering hard grids.",
        "Use the hint button once per grid maximum: it reveals the technique name, not the answer.",
      ],
      fr: [
        "Notre Défi du jour est une grille moyenne — faites-le chaque jour pour mesurer vos progrès.",
        "Visez moins de 12 minutes avant d'envisager le niveau difficile.",
        "Utilisez le bouton indice une fois par grille maximum : il révèle le nom de la technique, pas la réponse.",
      ],
    },
    faq: [
      { q: { en: "How many clues in a medium sudoku?", fr: "Combien d'indices dans un sudoku moyen ?" }, a: { en: "Between 32 and 39. Below 32 the grid usually demands hard-level techniques; above 39 it typically stays easy.", fr: "Entre 32 et 39. En dessous de 32, la grille exige généralement des techniques de niveau difficile ; au-dessus de 39, elle reste facile." } },
      { q: { en: "Do you need pencil marks for medium sudoku?", fr: "Faut-il crayonner pour un sudoku moyen ?" }, a: { en: "Most players do. A few strong solvers manage without, but organized candidates cut both time and errors for everyone else.", fr: "La plupart, oui. Quelques solvers forts s'en passent, mais des candidats organisés réduisent le temps et les erreurs pour tous les autres." } },
      { q: { en: "What is the difference between medium and hard?", fr: "Quelle différence entre moyen et difficile ?" }, a: { en: "Hard grids (26–31 clues) require locked candidates and subset reasoning; medium grids stay solvable with singles and naked pairs.", fr: "Les grilles difficiles (26–31 indices) exigent candidats verrouillés et raisonnements de sous-ensembles ; les moyennes se résolvent avec singletons et paires nues." } },
    ],
    metaTitle: { en: "Medium Sudoku — Free Medium Puzzles & Daily Challenge", fr: "Sudoku Moyen — Grilles gratuites et Défi du jour" },
    metaDescription: { en: "Play free medium sudoku online: naked pairs, hidden singles, pencil-mark strategy. Includes our medium Daily Challenge with streaks and coins.", fr: "Jouez au sudoku moyen gratuit : paires nues, singletons cachés, stratégie de crayonnage. Avec notre Défi du jour moyen, séries et coins." },
  },
  {
    slug: "hard",
    h1: { en: "Hard Sudoku — Naked Pairs Are Not Enough", fr: "Sudoku Difficile — Quand les paires ne suffisent plus" },
    intro: {
      en: "Hard sudoku grids carry 26 to 31 clues and are the first level where scanning and naked pairs genuinely stall. You will need locked candidates, pointing pairs and subset logic — the exact techniques taught in our Academy.",
      fr: "Les grilles difficiles comptent 26 à 31 indices : c'est le premier niveau où balayage et paires nues bloquent réellement. Il vous faudra candidats verrouillés, paires pointantes et logique de sous-ensembles — précisément ce qu'enseigne notre Académie.",
    },
    whatIs: {
      en: [
        "A hard grid is engineered so that at least one point in the solve, no single is available anywhere on the board. Progress only resumes after an elimination technique unlocks new candidates.",
        "These grids rate 1200–2500 points. Solving one cleanly — without guessing — is the badge of a technically competent player.",
      ],
      fr: [
        "Une grille difficile est conçue pour qu'à au moins un moment, aucun singleton ne soit disponible sur la planche. La progression ne reprend qu'après qu'une technique d'élimination a débloqué de nouveaux candidats.",
        "Ces grilles valent 1200–2500 points. En résoudre une proprement — sans deviner — est la marque d'un joueur techniquement compétent.",
      ],
    },
    who: {
      en: [
        "Players consistently under 12 minutes on medium grids",
        "Daily Challenge streak keepers seeking tougher static puzzles",
        "Duel players — most rated duels are fought on hard grids",
        "Technique learners practicing X-Wing setups before expert grids",
      ],
      fr: [
        "Les joueurs régulièrement sous les 12 minutes en moyen",
        "Les gardiens de séries du Défi du jour cherchant plus dur en statique",
        "Les joueurs de duel — la plupart des duels classés se jouent en difficile",
        "Les apprenants qui s'exercent aux X-Wing avant les grilles expert",
      ],
    },
    difficultyExplained: {
      en: "Hard grids are rated by the hardest technique required: pointing/claiming pairs, naked triples, hidden pairs, and occasionally a basic X-Wing. Solve times range from 20 to 45 minutes depending on fluency with candidates.",
      fr: "Les grilles difficiles se classent par la technique la plus dure exigée : paires pointantes/réclamantes, triplets nus, paires cachées, parfois un X-Wing basique. Comptez 20 à 45 minutes selon votre aisance avec les candidats.",
    },
    howToSolve: {
      en: [
        "Do a full candidate pass — every empty cell marked — before placing anything beyond obvious singles.",
        "Run the elimination cycle in order: pointing pairs, claiming pairs, then naked triples. Each pass prunes candidates until a single reappears.",
        "Check for X-Wing whenever one digit has exactly two candidate cells in two different rows AND those cells share the same columns — the pattern removes that digit from the columns elsewhere.",
        "Keep candidates clean: a stale mark will send you down a wrong path for twenty minutes.",
      ],
      fr: [
        "Faites un passage complet des candidats — chaque case vide marquée — avant tout placement au-delà des singletons évidents.",
        "Enchaînez le cycle d'élimination dans l'ordre : paires pointantes, paires réclamantes, puis triplets nus. Chaque passe élague jusqu'au retour d'un singleton.",
        "Cherchez le X-Wing quand un chiffre a exactement deux cases candidates dans deux lignes différentes ET que ces cases partagent les mêmes colonnes — le motif retire ce chiffre des colonnes ailleurs.",
        "Gardez des candidats propres : une marque périmée vous envoie sur une fausse piste pendant vingt minutes.",
      ],
    },
    techniques: [
      { name: "Pointing pair", desc: { en: "In a box, when a digit's candidates align on one row, eliminate that digit from the rest of the row.", fr: "Dans un bloc, quand les candidats d'un chiffre s'alignent sur une ligne, éliminez ce chiffre du reste de la ligne." } },
      { name: "Claiming pair", desc: { en: "The mirror: in a row/column, a digit confined to one box eliminates it from the rest of that box.", fr: "Le miroir : dans une ligne/colonne, un chiffre confiné à un bloc en est éliminé dans le reste du bloc." } },
      { name: "Naked triple", desc: { en: "Three cells sharing three candidates total purge those candidates from their common unit.", fr: "Trois cases partageant trois candidats au total les purgent de leur unité commune." } },
      { name: "X-Wing", desc: { en: "A rectangle of four candidate cells for one digit: eliminate the digit from the rows/columns outside the pattern.", fr: "Un rectangle de quatre cases candidates pour un chiffre : éliminez le chiffre des lignes/colonnes hors du motif." } },
    ],
    mistakes: {
      en: [
        "Guessing when stuck — on hard grids a guess without verification destroys 20+ minutes of work when wrong.",
        "Marking too many candidates early: prune with box-line interactions first, then re-mark.",
        "Missing the second X-Wing orientation (columns instead of rows).",
      ],
      fr: [
        "Deviner quand on bloque — sur les grilles difficiles, une intuition non vérifiée détruit plus de 20 minutes de travail si elle est fausse.",
        "Marquer trop de candidats trop tôt : élaguez d'abord par interactions bloc-ligne, puis re-marquez.",
        "Rater la seconde orientation du X-Wing (colonnes au lieu de lignes).",
      ],
    },
    tips: {
      en: [
        "Read the Academy's locked-candidates lesson before your first hard grid — it halves the learning curve.",
        "Hard duels are where rating points move the most: practice static speed, then compete.",
        "Log which technique unlocked each stuck point; your weak spot is usually one pattern.",
      ],
      fr: [
        "Lisez la leçon candidats verrouillés de l'Académie avant votre première grille difficile — la courbe d'apprentissage est divisée par deux.",
        "Les duels difficiles font bouger le rating : travaillez la vitesse en statique, puis competez.",
        "Notez quelle technique a débloqué chaque blocage ; votre point faible est souvent un seul motif.",
      ],
    },
    faq: [
      { q: { en: "How many clues does hard sudoku have?", fr: "Combien d'indices dans un sudoku difficile ?" }, a: { en: "26 to 31. The count alone doesn't set difficulty — the placement pattern decides which techniques are required.", fr: "26 à 31. Le nombre seul ne fixe pas la difficulté — c'est le schéma de placement qui détermine les techniques exigées." } },
      { q: { en: "Do hard sudoku puzzles require guessing?", fr: "Les sudokus difficiles exigent-ils de deviner ?" }, a: { en: "Never. Every published hard grid on this site is solvable by logic alone — if you are stuck, a technique exists that you haven't applied yet.", fr: "Jamais. Chaque grille difficile publiée ici se résout par pure logique — si vous bloquez, une technique existe que vous n'avez pas encore appliquée." } },
      { q: { en: "What should I learn after medium?", fr: "Qu'apprendre après le moyen ?" }, a: { en: "Pointing and claiming pairs first, then naked triples, then X-Wing — in that order. Each unlocks a whole tier of hard grids.", fr: "Paires pointantes et réclamantes d'abord, puis triplets nus, puis X-Wing — dans cet ordre. Chacune débloque toute une strate de grilles difficiles." } },
    ],
    metaTitle: { en: "Hard Sudoku — Free Hard Puzzles, X-Wing & Strategies", fr: "Sudoku Difficile — Grilles gratuites, X-Wing et stratégies" },
    metaDescription: { en: "Play free hard sudoku online: pointing pairs, naked triples, X-Wing. Logic-only grids with Academy lessons, duels and daily challenges.", fr: "Jouez au sudoku difficile gratuit : paires pointantes, triplets nus, X-Wing. Grilles 100 % logique, leçons d'Académie, duels et défis quotidiens." },
  },
  {
    slug: "expert",
    h1: { en: "Expert Sudoku — Advanced Techniques Required", fr: "Sudoku Expert — Techniques avancées exigées" },
    intro: {
      en: "Expert sudoku grids (22–26 clues) assume full command of intermediate techniques and introduce swordfish, XY-Wing and coloring chains. Solving one is a genuine skill achievement — and the rating system rewards it accordingly.",
      fr: "Les grilles expert (22–26 indices) supposent la maîtrise complète des techniques intermédiaires et introduisent swordfish, XY-Wing et chaînes de coloriage. En résoudre une est un vrai exploit — le système de rating le récompense en conséquence.",
    },
    whatIs: {
      en: [
        "An expert grid guarantees multiple deduction bottlenecks that only advanced eliminations break: XY-Wings, swordfish, or short coloring chains.",
        "Ratings span 2500–4000 points. Solve times of 30–60 minutes are normal even for strong players; below 25 minutes places you in competitive territory.",
      ],
      fr: [
        "Une grille expert garantit plusieurs goulets d'étranglement que seules des éliminations avancées franchissent : XY-Wing, swordfish, ou courtes chaînes de coloriage.",
        "Le rating s'étend de 2500 à 4000 points. Des temps de 30 à 60 minutes sont normaux même pour de bons joueurs ; sous 25 minutes, vous entrez en territoire compétitif.",
      ],
    },
    who: {
      en: [
        "Players who solve hard grids without hints",
        "Rating climbers — expert duels move the most points",
        "Technique collectors mastering swordfish and XY-Wing",
        "Puzzle purists who refuse to guess, ever",
      ],
      fr: [
        "Les joueurs qui résolvent les grilles difficiles sans indice",
        "Les grimpeurs de rating — les duels experts font bouger le plus de points",
        "Les collectionneurs de techniques maîtrisant swordfish et XY-Wing",
        "Les puristes qui refusent de deviner, toujours",
      ],
    },
    difficultyExplained: {
      en: "The step to expert is qualitative: intermediate techniques stop producing eliminations at all, and progress depends on spotting compound patterns like XY-Wing (three bivalue cells in a pivot-and-pincer shape) or 3-row swordfish.",
      fr: "Le passage à expert est qualitatif : les techniques intermédiaires ne produisent plus aucune élimination, et la progression dépend du repérage de motifs composés comme le XY-Wing (trois cases bivaluées en pivot et pinces) ou le swordfish sur 3 lignes.",
    },
    howToSolve: {
      en: [
        "Complete the intermediate elimination cycle first — expert grids still contain pointing pairs and triples that must be cleared before advanced patterns become visible.",
        "Hunt bivalue cells (exactly two candidates): they are the raw material of XY-Wings and chains.",
        "When one digit is stuck, try single-digit coloring: link the conjugate pairs of that digit and watch for a contradiction.",
        "Verify every advanced elimination twice — an error here is nearly undetectable later.",
      ],
      fr: [
        "Bouclez d'abord le cycle intermédiaire — les grilles expert contiennent encore paires pointantes et triplets à nettoyer avant que les motifs avancés ne deviennent visibles.",
        "Chassez les cases bivaluées (exactement deux candidats) : c'est la matière première des XY-Wing et des chaînes.",
        "Quand un chiffre bloque, essayez le coloriage mono-chiffre : reliez les paires conjuguées de ce chiffre et guettez la contradiction.",
        "Vérifiez deux fois chaque élimination avancée — une erreur ici est quasi indétectable ensuite.",
      ],
    },
    techniques: [
      { name: "XY-Wing", desc: { en: "A pivot cell (XY) with two pincers (XZ, YZ) sharing a unit eliminates Z from any cell seeing both pincers.", fr: "Une cellule pivot (XY) avec deux pinces (XZ, YZ) partageant une unité élimine Z de toute case voyant les deux pinces." } },
      { name: "Swordfish", desc: { en: "The 3×3 extension of X-Wing: a digit restricted to three cells across three rows (or columns) forms a elimination grid.", fr: "L'extension 3×3 du X-Wing : un chiffre restreint à trois cases sur trois lignes (ou colonnes) forme une grille d'élimination." } },
      { name: "Simple coloring", desc: { en: "Chain conjugate pairs of one digit in two colors; a cell seeing both colors of the same digit settles the chain.", fr: "Enchaînez les paires conjuguées d'un chiffre en deux couleurs ; une case voyant les deux couleurs du même chiffre règle la chaîne." } },
    ],
    mistakes: {
      en: [
        "Applying XY-Wing with a non-bivalue pivot — the pattern strictly requires exactly two candidates per cell.",
        "Coloring two different digits in the same chain — one chain, one digit, always.",
        "Skipping re-verification after a big elimination cascade.",
      ],
      fr: [
        "Appliquer un XY-Wing avec un pivot non bivalué — le motif exige strictement deux candidats exactement par case.",
        "Colorier deux chiffres différents dans la même chaîne — une chaîne, un chiffre, toujours.",
        "Sauter la re-vérification après une grande cascade d'éliminations.",
      ],
    },
    tips: {
      en: [
        "The Academy's XY-Wing trainer drills the pivot-pincer shape until spotting it takes seconds.",
        "Expert duels against real opponents exist here — they pay the highest rating swings.",
        "Track your solve times per technique: expert progress is measurable and fast.",
      ],
      fr: [
        "L'entraîneur XY-Wing de l'Académie muscle la forme pivot-pinces jusqu'au repérage en quelques secondes.",
        "Les duels expert contre de vrais opposants existent ici — ce sont les plus fortes variations de rating.",
        "Suivez vos temps par technique : en expert, les progrès sont mesurables et rapides.",
      ],
    },
    faq: [
      { q: { en: "How many clues in expert sudoku?", fr: "Combien d'indices dans un sudoku expert ?" }, a: { en: "22 to 26. The hardest published 9×9 grids in the world sit at 17 clues and require full chain techniques.", fr: "22 à 26. Les grilles 9×9 les plus dures publiées au monde descendent à 17 indices et exigent des chaînes complètes." } },
      { q: { en: "Is expert sudoku solvable without guessing?", fr: "Un sudoku expert se résout-il sans deviner ?" }, a: { en: "Yes — every grid we publish has a verified logic path. The path may be deep, but it always exists.", fr: "Oui — chaque grille publiée ici possède un chemin logique vérifié. Le chemin peut être profond, mais il existe toujours." } },
      { q: { en: "What is harder than expert?", fr: "Qu'y a-t-il de plus dur qu'expert ?" }, a: { en: "Extreme grids (below 22 clues) — and our duel mode against highly-rated humans, which no technique fully prepares you for.", fr: "Les grilles extrêmes (moins de 22 indices) — et notre mode duel contre des humains très bien classés, auquel aucune technique ne vous prépare totalement." } },
    ],
    metaTitle: { en: "Expert Sudoku — Free Expert Puzzles, XY-Wing & Swordfish", fr: "Sudoku Expert — Grilles gratuites, XY-Wing et Swordfish" },
    metaDescription: { en: "Play free expert sudoku online: XY-Wing, swordfish, coloring chains. Logic-verified grids, Academy trainers and high-stakes duels.", fr: "Jouez au sudoku expert gratuit : XY-Wing, swordfish, chaînes de coloriage. Grilles vérifiées, entraîneurs d'Académie et duels à haut enjeu." },
  },
  {
    slug: "extreme",
    h1: { en: "Extreme Sudoku — The Deepest Logic We Publish", fr: "Sudoku Extrême — La logique la plus profonde que nous publiions" },
    intro: {
      en: "Extreme sudoku grids have fewer than 22 clues and demand chained reasoning: alternating inference chains, uniqueness arguments, and multi-pattern combinations. They are rare, brutal, and deeply satisfying to crack.",
      fr: "Les grilles extrêmes comptent moins de 22 indices et exigent un raisonnement chaîné : chaînes d'inférence alternées, arguments d'unicité, et combinaisons multi-motifs. Elles sont rares, brutales, et profondément satisfaisantes à craquer.",
    },
    whatIs: {
      en: [
        "An extreme grid is built so eliminations interact: an X-Wing feeds a coloring chain that unlocks a swordfish. Single-technique thinking does not finish these grids.",
        "Ratings exceed 4000 points. Only a small fraction of players solve them unaided — which is precisely their value as a benchmark.",
      ],
      fr: [
        "Une grille extrême est construite pour que les éliminations interagissent : un X-Wing alimente une chaîne de coloriage qui débloque un swordfish. La pensée mono-technique ne termine pas ces grilles.",
        "Le rating dépasse 4000 points. Seule une fraction des joueurs les résout sans aide — c'est exactement leur valeur d'étalon.",
      ],
    },
    who: {
      en: [
        "Players fluent with expert techniques looking for the ceiling",
        "Chain-style solvers (AIC, uniqueness) wanting worthy material",
        "Anyone preparing for top-tier competitive play",
        "The stubborn — and we mean that as a compliment",
      ],
      fr: [
        "Les joueurs à l'aise avec les techniques expertes qui cherchent le plafond",
        "Les solvers de chaînes (AIC, unicité) voulant une matière digne",
        "Ceux qui préparent la compétition de haut niveau",
        "Les têtus — et c'est un compliment",
      ],
    },
    difficultyExplained: {
      en: "Extreme difficulty is defined by chain depth: the shortest logical proof of the solution requires long sequences of linked inferences, sometimes over 10 steps. No fixed repertoire suffices; you improvise over the fundamentals.",
      fr: "La difficulté extrême se définit par la profondeur de chaîne : la plus courte preuve logique de la solution exige de longues séquences d'inférences liées, parfois plus de 10 étapes. Aucun répertoire figé ne suffit ; on improvise sur les fondamentaux.",
    },
    howToSolve: {
      en: [
        "Exhaust every intermediate technique first and keep an immaculate candidate grid — chains are only as reliable as their marks.",
        "Prefer bivalue chains: link cells that share a candidate and watch how a contradiction propagates.",
        "Use uniqueness responsibly: in a valid puzzle, deadly patterns (like a rectangle using only two digits) cannot stand, so one of their candidates must be false.",
        "When a chain contradicts, record WHY — the same structure often reappears later in the solve.",
      ],
      fr: [
        "Épuisez d'abord toutes les techniques intermédiaires et gardez une grille de candidats impeccable — les chaînes ne valent que leurs marques.",
        "Privilégiez les chaînes bivaluées : reliez les cases partageant un candidat et observez la propagation d'une contradiction.",
        "Utilisez l'unicité avec rigueur : dans un puzzle valide, les motifs mortels (comme un rectangle n'utilisant que deux chiffres) ne peuvent tenir, donc un de leurs candidats est faux.",
        "Quand une chaîne contredit, notez POURQUOI — la même structure réapparaît souvent plus loin dans la résolution.",
      ],
    },
    techniques: [
      { name: "Alternating Inference Chain (AIC)", desc: { en: "A chain alternating strong and weak links between candidates that proves one endpoint true or eliminates shared candidates.", fr: "Une chaîne alternant liens forts et faibles entre candidats qui prouve une extrémité vraie ou élimine des candidats partagés." } },
      { name: "Unique Rectangle", desc: { en: "Exploits the uniqueness guarantee: arrangements that would allow two solutions are impossible, so their dangerous candidates are false.", fr: "Exploite la garantie d'unicité : les dispositions qui autoriseraient deux solutions sont impossibles, donc leurs candidats dangereux sont faux." } },
      { name: "Multi-fish / franken patterns", desc: { en: "Generalized fish covering overlapping row/column sets — rare but decisive on extreme grids.", fr: "Poissons généralisés couvrant des ensembles lignes/colonnes qui se chevauchent — rares mais décisifs sur les grilles extrêmes." } },
    ],
    mistakes: {
      en: [
        "Trusting a chain with a single weak-link error — verify every link's shared unit.",
        "Applying uniqueness on a grid that might have multiple solutions (only valid on verified-unique puzzles).",
        "Attempting extreme grids before expert fluency: the gap is a wall, not a step.",
      ],
      fr: [
        "Faire confiance à une chaîne avec une seule erreur de lien faible — vérifiez l'unité partagée de chaque maillon.",
        "Appliquer l'unicité sur une grille possiblement multi-solutions (valide seulement sur des puzzles à unicité vérifiée).",
        "Tenter l'extrême avant la fluidité expert : l'écart est un mur, pas une marche.",
      ],
    },
    tips: {
      en: [
        "Solve one extreme grid per week rather than daily — these burn out enthusiasm fast.",
        "Write down your chain notation on paper first; screen candidates hide link errors.",
        "When you crack your first extreme, take a duel against a top-rated player: you have earned it.",
      ],
      fr: [
        "Résolvez une grille extrême par semaine plutôt qu'une par jour — elles épuisent l'enthousiasme vite.",
        "Écrivez d'abord votre notation de chaîne sur papier ; les candidats à l'écran masquent les erreurs de lien.",
        "Quand vous craquez votre première extrême, faites un duel contre un joueur très bien classé : vous l'avez mérité.",
      ],
    },
    faq: [
      { q: { en: "What makes a sudoku extreme?", fr: "Qu'est-ce qui rend un sudoku extrême ?" }, a: { en: "Below 22 clues AND a deep solving path: long chains or uniqueness arguments are mandatory, not optional.", fr: "Moins de 22 indices ET un chemin de résolution profond : chaînes longues ou arguments d'unicité obligatoires, pas optionnels." } },
      { q: { en: "How rare are extreme grids?", fr: "Les grilles extrêmes sont-elles rares ?" }, a: { en: "Very. Generating a fair extreme grid (logic-solvable, no guessing) requires heavy filtering — that scarcity is part of the value.", fr: "Très. Générer une grille extrême équitable (résoluble par logique, sans deviner) exige un filtrage lourd — cette rareté fait partie de la valeur." } },
      { q: { en: "Should I use chains or just very advanced singles?", fr: "Chaînes ou singletons très avancés ?" }, a: { en: "On extreme grids, chains are unavoidable. Practiced solvers shorten them, but nobody avoids them entirely.", fr: "Sur les grilles extrêmes, les chaînes sont inévitables. Les solvers entraînés les raccourcissent, mais personne ne les évite totalement." } },
    ],
    metaTitle: { en: "Extreme Sudoku — Hardest Free Puzzles Online", fr: "Sudoku Extrême — Les grilles gratuites les plus dures" },
    metaDescription: { en: "Play extreme sudoku online: under 22 clues, AIC chains, unique rectangles. The hardest logic-verified grids we publish — free.", fr: "Jouez au sudoku extrême : moins de 22 indices, chaînes AIC, rectangles uniques. Les grilles logiques les plus dures que nous publions — gratuit." },
  },
];

export const getDifficulty = (slug: string) => DIFFICULTIES.find((d) => d.slug === slug);
