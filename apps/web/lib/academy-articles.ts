export interface AcademyArticle {
  slug: string;
  level: "beginner" | "intermediate" | "advanced";
  readingTime: number;
  translations: {
    fr: {
      title: string;
      excerpt: string;
      metaTitle: string;
      metaDescription: string;
      contentHtml: string;
    };
    en: {
      title: string;
      excerpt: string;
      metaTitle: string;
      metaDescription: string;
      contentHtml: string;
    };
    de: {
      title: string;
      excerpt: string;
      metaTitle: string;
      metaDescription: string;
      contentHtml: string;
    };
  };
}

export const ACADEMY_ARTICLES: Record<string, AcademyArticle> = {
  rules: {
    slug: "rules",
    level: "beginner",
    readingTime: 5,
    translations: {
      fr: {
        title: "Règles Fondamentales & Guide Complet du Sudoku",
        excerpt:
          "Découvrez les règles d'or, la structure de la grille 9x9 et la logique de déduction sans devinette pour résoudre n'importe quelle grille de Sudoku.",
        metaTitle: "Règles du Sudoku — Guide Officiel, Astuces & Stratégies | Académie",
        metaDescription:
          "Apprenez toutes les règles du Sudoku expliquées pas à pas : structure 9x9, chiffres uniques de 1 à 9 par ligne, colonne et bloc 3x3, avec astuces et exemples interactifs.",
        contentHtml: `
          <div class="space-y-8">
            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">Qu'est-ce que le Sudoku ?</h2>
              <p class="text-gray-300 leading-relaxed">
                Le <strong>Sudoku</strong> (du japonais <em>Sūji wa dokushin ni kagiru</em>, signifiant « le chiffre doit être unique ») est un jeu de réflexion et de déduction logique universel. Contrairement à une idée reçue fréquente, le Sudoku ne requiert <strong>aucune compétence en calcul mathématique</strong> : les chiffres de 1 à 9 ne sont que des symboles logiques distincts.
              </p>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">La Structure d'une Grille de Sudoku</h2>
              <p class="text-gray-300 leading-relaxed">
                Une grille classique de Sudoku est un carré structuré de façon géométrique très précise :
              </p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div class="w-8 h-8 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold font-black">9</div>
                  <h3 class="font-bold text-white text-sm uppercase tracking-wide">9 Lignes Horizontales</h3>
                  <p class="text-xs text-gray-400">Chaque ligne traverse la grille de gauche à droite et compte 9 cases.</p>
                </div>
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div class="w-8 h-8 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange font-black">9</div>
                  <h3 class="font-bold text-white text-sm uppercase tracking-wide">9 Colonnes Verticales</h3>
                  <p class="text-xs text-gray-400">Chaque colonne descend du haut vers le bas et compte 9 cases.</p>
                </div>
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div class="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-black">9</div>
                  <h3 class="font-bold text-white text-sm uppercase tracking-wide">9 Blocs Régionaux (3×3)</h3>
                  <p class="text-xs text-gray-400">La grille est divisée en 9 carrés délimités de 3 par 3 cases (ou régions).</p>
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">Les 3 Règles d'Or Inviolables</h2>
              <div class="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-500/30 space-y-4">
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-gold text-brand-navy font-black flex items-center justify-center shrink-0 text-sm">1</span>
                  <div>
                    <strong class="text-white block text-sm">Règle de Ligne :</strong>
                    <p class="text-xs text-gray-300">Chaque ligne horizontale doit contenir tous les chiffres de 1 à 9, sans aucune répétition.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-orange text-white font-black flex items-center justify-center shrink-0 text-sm">2</span>
                  <div>
                    <strong class="text-white block text-sm">Règle de Colonne :</strong>
                    <p class="text-xs text-gray-300">Chaque colonne verticale doit contenir tous les chiffres de 1 à 9, sans aucune répétition.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-cyan text-brand-navy font-black flex items-center justify-center shrink-0 text-sm">3</span>
                  <div>
                    <strong class="text-white block text-sm">Règle de Région (Bloc 3x3) :</strong>
                    <p class="text-xs text-gray-300">Chaque sous-grille de 3×3 cases doit contenir tous les chiffres de 1 à 9, sans doublon.</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">Exemple Visuel : Découpage d'un Bloc</h2>
              <p class="text-gray-300 leading-relaxed">
                Voici comment un bloc 3x3 s'articule avec ses lignes et colonnes associées :
              </p>
              <div class="p-6 rounded-3xl bg-black/50 border border-white/10 flex flex-col items-center justify-center">
                <div class="grid grid-cols-3 gap-1.5 p-3 bg-brand-navy border-2 border-brand-gold/60 rounded-2xl shadow-xl">
                  <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-white">5</div>
                  <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-white">3</div>
                  <div class="w-12 h-12 bg-brand-orange/30 border-2 border-brand-orange rounded-xl flex items-center justify-center font-mono font-black text-lg text-brand-gold animate-pulse">?</div>
                  <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-white">6</div>
                  <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-white">7</div>
                  <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-white">2</div>
                  <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-white">1</div>
                  <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-white">9</div>
                  <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-white">8</div>
                </div>
                <p class="text-xs text-brand-gold font-bold mt-4">
                  💡 Déduction logique : les chiffres 1, 2, 3, 5, 6, 7, 8, 9 sont présents. La case <strong>?</strong> est obligatoirement le <strong>4</strong> !
                </p>
              </div>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">Les 4 Stratégies Essentielles pour Débuter</h2>
              
              <div class="space-y-4">
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10">
                  <h3 class="font-bold text-brand-gold text-base mb-1">1. La Dernière Case Libre (Last Free Cell)</h3>
                  <p class="text-xs text-gray-300 leading-relaxed">
                    Lorsqu'une ligne, une colonne ou un bloc 3x3 compte déjà 8 chiffres placés, le dernier chiffre manquant se déduit automatiquement par simple élimination (1+2+3+4+5+6+7+8+9 = 45).
                  </p>
                </div>

                <div class="p-5 rounded-2xl bg-black/40 border border-white/10">
                  <h3 class="font-bold text-brand-orange text-base mb-1">2. La Technique du Balayage (Cross-Hatching)</h3>
                  <p class="text-xs text-gray-300 leading-relaxed">
                    Balayez visuellement les lignes et colonnes adjacentes pour un même chiffre (par exemple le 7). Si deux colonnes d'un groupe de trois contiennent déjà un 7, alors dans le troisième bloc, le 7 se situe obligatoirement dans la colonne restante non couverte.
                  </p>
                </div>

                <div class="p-5 rounded-2xl bg-black/40 border border-white/10">
                  <h3 class="font-bold text-brand-cyan text-base mb-1">3. Le Dernier Chiffre Possible (Naked Single)</h3>
                  <p class="text-xs text-gray-300 leading-relaxed">
                    En observant les intersections d'une case vide (sa ligne, sa colonne et son bloc), si 8 chiffres différents sont déjà visibles dans son champ d'influence, cette case ne possède qu'une seule issue possible.
                  </p>
                </div>

                <div class="p-5 rounded-2xl bg-black/40 border border-white/10">
                  <h3 class="font-bold text-purple-400 text-base mb-1">4. La Prise de Notes au Crayon (Pencil Marks)</h3>
                  <p class="text-xs text-gray-300 leading-relaxed">
                    Dès que la difficulté augmente, écrivez les petits chiffres candidats résiduels dans chaque case. Cela permet d'identifier les paires nues, les paires cachées et d'éviter toute surcharge mentale.
                  </p>
                </div>
              </div>
            </section>

            <section class="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <h3 class="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                ⚠️ Règle d'Or du Grand Maître : Ne Jamais Deviner !
              </h3>
              <p class="text-xs text-gray-200 leading-relaxed">
                Toutes les grilles officielles générées sur notre plateforme possèdent <strong>une solution logique unique garantie</strong>. Vous ne devez jamais deviner ou poser un chiffre au hasard. Chaque coup est le fruit d'une déduction mathématique rigoureuse.
              </p>
            </section>
          </div>
        `,
      },
      en: {
        title: "Fundamental Sudoku Rules & Complete Master Guide",
        excerpt:
          "Master the golden rules of Sudoku, the 9x9 grid layout, and pure deductive logic with interactive illustrations and step-by-step strategies.",
        metaTitle: "Sudoku Rules — Official Guide, Tips & Winning Strategies | Academy",
        metaDescription:
          "Learn how to play Sudoku with our comprehensive guide: 9x9 board structure, row/column/box constraints, cross-hatching methods, and candidate notations.",
        contentHtml: `
          <div class="space-y-8">
            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">What is Sudoku?</h2>
              <p class="text-gray-300 leading-relaxed">
                <strong>Sudoku</strong> is a world-renowned logic-based number-placement puzzle. Despite utilizing digits from 1 to 9, Sudoku requires <strong>zero arithmetic math skills</strong>: numbers simply act as distinct logical symbols.
              </p>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">The 9×9 Grid Architecture</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div class="w-8 h-8 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold font-black">9</div>
                  <h3 class="font-bold text-white text-sm uppercase tracking-wide">9 Horizontal Rows</h3>
                  <p class="text-xs text-gray-400">Each row spans from left to right and contains exactly 9 cells.</p>
                </div>
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div class="w-8 h-8 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange font-black">9</div>
                  <h3 class="font-bold text-white text-sm uppercase tracking-wide">9 Vertical Columns</h3>
                  <p class="text-xs text-gray-400">Each column runs from top to bottom and contains exactly 9 cells.</p>
                </div>
                <div class="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div class="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-black">9</div>
                  <h3 class="font-bold text-white text-sm uppercase tracking-wide">9 Regional 3×3 Boxes</h3>
                  <p class="text-xs text-gray-400">The grid is subdivided into nine 3×3 square blocks (or regions).</p>
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">The 3 Inviolable Golden Rules</h2>
              <div class="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-500/30 space-y-4">
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-gold text-brand-navy font-black flex items-center justify-center shrink-0 text-sm">1</span>
                  <div>
                    <strong class="text-white block text-sm">Row Constraint:</strong>
                    <p class="text-xs text-gray-300">Each horizontal row must contain all digits from 1 to 9 with no duplicates.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-orange text-white font-black flex items-center justify-center shrink-0 text-sm">2</span>
                  <div>
                    <strong class="text-white block text-sm">Column Constraint:</strong>
                    <p class="text-xs text-gray-300">Each vertical column must contain all digits from 1 to 9 with no duplicates.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-cyan text-brand-navy font-black flex items-center justify-center shrink-0 text-sm">3</span>
                  <div>
                    <strong class="text-white block text-sm">3×3 Box Constraint:</strong>
                    <p class="text-xs text-gray-300">Each 3×3 square region must contain all digits from 1 to 9 with no duplicates.</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <h3 class="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                ⚠️ Grandmaster Tip: Never Guess!
              </h3>
              <p class="text-xs text-gray-200 leading-relaxed">
                All puzzles on our platform have <strong>a guaranteed unique logical solution</strong>. Guessing is never required; each placement can be deduced with 100% certainty.
              </p>
            </section>
          </div>
        `,
      },
      de: {
        title: "Grundregeln & Vollständiger Sudoku Leitfaden",
        excerpt:
          "Meistern Sie die goldenen Regeln des Sudokus, die 9x9-Gitterstruktur und logische Lösungsstrategien für Anfänger und Fortgeschrittene.",
        metaTitle: "Sudoku Regeln — Offizielle Anleitung, Tipps & Strategien | Akademie",
        metaDescription:
          "Lernen Sie Sudoku Schritt für Schritt: 9x9 Raster, Zeilen-, Spalten- und Blockregeln sowie nützliche Notiztechniken und Lösungsbeispiele.",
        contentHtml: `
          <div class="space-y-8">
            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">Was ist Sudoku?</h2>
              <p class="text-gray-300 leading-relaxed">
                <strong>Sudoku</strong> ist das weltweit beliebteste Zahlenrätsel. Obwohl Ziffern von 1 bis 9 verwendet werden, sind <strong>keine mathematischen Rechenfähigkeiten</strong> erforderlich: Es handelt sich um ein reines logisches Deduktionsspiel.
              </p>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">Die 3 Goldenen Regeln</h2>
              <div class="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-500/30 space-y-4">
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-gold text-brand-navy font-black flex items-center justify-center shrink-0 text-sm">1</span>
                  <div>
                    <strong class="text-white block text-sm">Zeilenregel:</strong>
                    <p class="text-xs text-gray-300">Jede horizontale Zeile muss alle Ziffern von 1 bis 9 genau einmal enthalten.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-orange text-white font-black flex items-center justify-center shrink-0 text-sm">2</span>
                  <div>
                    <strong class="text-white block text-sm">Spaltenregel:</strong>
                    <p class="text-xs text-gray-300">Jede vertikale Spalte muss alle Ziffern von 1 bis 9 genau einmal enthalten.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <span class="w-7 h-7 rounded-full bg-brand-cyan text-brand-navy font-black flex items-center justify-center shrink-0 text-sm">3</span>
                  <div>
                    <strong class="text-white block text-sm">3×3 Blockregel:</strong>
                    <p class="text-xs text-gray-300">Jeder 3×3-Unterblock muss alle Ziffern von 1 bis 9 ohne Wiederholung enthalten.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        `,
      },
    },
  },

  "how-to-play": {
    slug: "how-to-play",
    level: "beginner",
    readingTime: 6,
    translations: {
      fr: {
        title: "Comment Jouer au Sudoku — Méthode Pas à Pas",
        excerpt:
          "Un guide étape par étape de la grille vierge à la victoire : analyse méthodique, balayage visuel et élimination des doublons.",
        metaTitle: "Comment Jouer au Sudoku — Guide Débutant Pas à Pas | Académie",
        metaDescription:
          "Apprenez comment débuter une grille de Sudoku, trouver les premiers chiffres et structurer votre réflexion pas à pas.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Méthode de Résolution pour Débutant</h2>
            <p class="text-gray-300 leading-relaxed">
              Pour résoudre votre première grille sans paniquer, suivez cette séquence en 3 étapes :
            </p>
            <ol class="list-decimal pl-6 space-y-3 text-gray-300">
              <li><strong>Repérez les zones presque pleines :</strong> Recherchez les lignes, colonnes ou blocs 3x3 qui ne possèdent que 1 ou 2 cases vides.</li>
              <li><strong>Balayez chaque chiffre de 1 à 9 :</strong> Concentrez-vous d'abord sur les chiffres les plus fréquents dans la grille.</li>
              <li><strong>Utilisez les notes au crayon :</strong> Dès qu'un doute persiste, inscrivez les candidats pour libérer votre esprit.</li>
            </ol>
          </div>
        `,
      },
      en: {
        title: "How to Play Sudoku — Step-by-Step Beginner Method",
        excerpt:
          "A step-by-step walkthrough from an empty puzzle to solved completion: scanning, eliminate duplicates, and build momentum.",
        metaTitle: "How to Play Sudoku — Step-by-Step Guide | Academy",
        metaDescription:
          "Learn how to start a Sudoku puzzle, find initial digits, and structure your deduction step by step.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Beginner Solving Sequence</h2>
            <p class="text-gray-300 leading-relaxed">
              Follow this simple 3-step sequence to solve any easy puzzle effortlessly:
            </p>
            <ol class="list-decimal pl-6 space-y-3 text-gray-300">
              <li><strong>Scan near-complete houses:</strong> Find rows, columns, or boxes with only 1 or 2 empty cells left.</li>
              <li><strong>Cross-hatch digits 1 through 9:</strong> Focus on the most frequent numbers first across neighboring blocks.</li>
              <li><strong>Use pencil marks:</strong> Write candidate notes whenever 2 or 3 choices remain.</li>
            </ol>
          </div>
        `,
      },
      de: {
        title: "Wie man Sudoku spielt — Schritt-für-Schritt-Anleitung",
        excerpt:
          "Eine schrittweise Anleitung vom ersten Blick auf das Gitter bis zum fehlerfreien Lösen für Anfänger.",
        metaTitle: "Wie man Sudoku spielt — Schritt-für-Schritt | Akademie",
        metaDescription:
          "Lernen Sie die Grundlagen des Sudokus: Scan-Techniken, Notizen und logische Vorgehensweise.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Schritt-für-Schritt Lösungsansatz</h2>
            <p class="text-gray-300 leading-relaxed">
              Befolgen Sie diese 3 Schritte, um ein Sudoku mühelos zu lösen:
            </p>
            <ol class="list-decimal pl-6 space-y-3 text-gray-300">
              <li><strong>Fast gefüllte Bereiche prüfen:</strong> Suchen Sie Zeilen, Spalten oder Blöcke mit nur 1 oder 2 leeren Feldern.</li>
              <li><strong>Ziffern 1 bis 9 scannen:</strong> Beginnen Sie mit den am häufigsten vorkommenden Zahlen im Gitter.</li>
              <li><strong>Kandidaten-Notizen nutzen:</strong> Notieren Sie verbleibende Möglichkeiten in kleinen Ziffern.</li>
            </ol>
          </div>
        `,
      },
    },
  },

  "naked-singles": {
    slug: "naked-singles",
    level: "beginner",
    readingTime: 4,
    translations: {
      fr: {
        title: "Technique des Singletons Nus (Naked Singles)",
        excerpt:
          "Découvrez la technique du singleton nu (ou chiffre unique évident), lorsque 8 chiffres excluent toutes les autres options pour une case.",
        metaTitle: "Singletons Nus au Sudoku — Définition et Exemples | Académie",
        metaDescription:
          "Apprenez à repérer les singletons nus dans une grille de Sudoku : principe d'exclusion par ligne, colonne et bloc.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Qu'est-ce qu'un Singleton Nu ?</h2>
            <p class="text-gray-300 leading-relaxed">
              Un <strong>singleton nu</strong> (<em>Naked Single</em>) se produit lorsqu'une case donnée ne peut contenir qu'<strong>un seul chiffre possible</strong> parce que les 8 autres chiffres de 1 à 9 sont déjà présents dans sa ligne, sa colonne ou son bloc 3×3.
            </p>
          </div>
        `,
      },
      en: {
        title: "Naked Singles Technique — Finding Obvious Numbers",
        excerpt:
          "Learn how to spot naked singles when 8 other digits eliminate all possibilities except one for a specific cell.",
        metaTitle: "Naked Singles Sudoku Technique | Academy",
        metaDescription:
          "Master naked singles in Sudoku: exclusion principles across intersecting rows, columns, and 3x3 boxes.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Understanding Naked Singles</h2>
            <p class="text-gray-300 leading-relaxed">
              A <strong>naked single</strong> occurs when a cell has only <strong>one remaining candidate</strong> because the other 8 digits are already placed in its intersecting row, column, and 3×3 box.
            </p>
          </div>
        `,
      },
      de: {
        title: "Nackte Einer (Naked Singles) — Die Grundtechnik",
        excerpt:
          "Erfahren Sie, wie Sie eindeutige Zahlen finden, wenn 8 andere Ziffern alle Alternativen für ein Feld ausschließen.",
        metaTitle: "Naked Singles beim Sudoku | Akademie",
        metaDescription:
          "Meistern Sie die Naked Singles Technik im Sudoku: Ausschlussverfahren in Zeilen, Spalten und Blöcken.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Was ist ein Naked Single?</h2>
            <p class="text-gray-300 leading-relaxed">
              Ein <strong>Naked Single</strong> liegt vor, wenn für ein bestimmtes Feld nur noch <strong>eine einzige Ziffer</strong> infrage kommt, da die anderen 8 Ziffern bereits in derselben Zeile, Spalte oder im selben Block stehen.
            </p>
          </div>
        `,
      },
    },
  },

  "naked-pairs": {
    slug: "naked-pairs",
    level: "intermediate",
    readingTime: 6,
    translations: {
      fr: {
        title: "Technique des Paires Nues (Naked Pairs)",
        excerpt:
          "Deux cases dans la même zone contenant uniquement les deux mêmes candidats permettent d'éliminer ces chiffres partout ailleurs dans la zone.",
        metaTitle: "Paires Nues au Sudoku — Stratégie Intermédiaire | Académie",
        metaDescription:
          "Maîtrisez les paires nues au Sudoku : comment verrouiller 2 chiffres dans 2 cases et nettoyer les notes de la ligne, colonne ou bloc.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Le Principe des Paires Nues</h2>
            <p class="text-gray-300 leading-relaxed">
              Si deux cases d'un même bloc (ou d'une même ligne/colonne) contiennent exactement la même paire de candidats (par exemple <strong>[3, 7]</strong>), alors ces deux chiffres doivent obligatoirement occuper ces deux cases. Ils ne peuvent être placés nulle part ailleurs dans cette zone.
            </p>
          </div>
        `,
      },
      en: {
        title: "Naked Pairs Strategy — Cleaning Candidate Notes",
        excerpt:
          "Two cells sharing the exact same pair of candidates in a house lock those digits and eliminate them from other cells.",
        metaTitle: "Naked Pairs Sudoku Strategy | Academy",
        metaDescription:
          "Master naked pairs in Sudoku: lock two digits into two cells and eliminate extra candidate marks.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">How Naked Pairs Work</h2>
            <p class="text-gray-300 leading-relaxed">
              When two cells in the same row, column, or 3×3 box contain only the exact same pair of candidate numbers (e.g. <strong>[3, 7]</strong>), those two numbers are locked into those two cells. You can safely eliminate them from all other cells in that house.
            </p>
          </div>
        `,
      },
      de: {
        title: "Nackte Paare (Naked Pairs) — Fortgeschrittene Notizbereinigung",
        excerpt:
          "Zwei Felder in einem Bereich mit denselben zwei Kandidaten sperren diese Zahlen für alle anderen Felder.",
        metaTitle: "Naked Pairs Sudoku Technik | Akademie",
        metaDescription:
          "Lernen Sie die Naked Pairs Strategie im Sudoku kennen und bereinigen Sie Kandidaten-Notizen effektiv.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Funktionsweise von Naked Pairs</h2>
            <p class="text-gray-300 leading-relaxed">
              Wenn zwei Felder in derselben Zeile, Spalte oder im selben 3×3-Block genau dasselbe Kandidatenpaar (z. B. <strong>[3, 7]</strong>) aufweisen, müssen diese Zahlen in diesen zwei Feldern stehen und können aus allen anderen Feldern des Bereichs gestrichen werden.
            </p>
          </div>
        `,
      },
    },
  },

  "x-wing": {
    slug: "x-wing",
    level: "advanced",
    readingTime: 8,
    translations: {
      fr: {
        title: "Technique Avancée X-Wing — Maîtrise des Rectangles Logiques",
        excerpt:
          "La technique reine du Sudoku Expert : repérez un rectangle formé par un même candidat dans deux lignes pour éliminer ce candidat de ses colonnes.",
        metaTitle: "Technique X-Wing au Sudoku — Guide Expert Complet | Académie",
        metaDescription:
          "Apprenez le pattern X-Wing : structure à 4 coins, éliminations en colonnes et résolution des grilles Expert et Maître.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">La Structure du X-Wing</h2>
            <p class="text-gray-300 leading-relaxed">
              Le <strong>X-Wing</strong> est l'une des techniques les plus élégantes du Sudoku avancé. Elle s'applique lorsqu'un chiffre candidat n'apparaît que <strong>deux fois par ligne</strong> dans exactement deux lignes différentes, et que ces candidats sont alignés sur les deux <strong>mêmes colonnes</strong>.
            </p>
            <div class="p-6 rounded-3xl bg-blue-950/40 border border-blue-500/30">
              <h3 class="font-bold text-white mb-2">Conséquence Logique :</h3>
              <p class="text-xs text-gray-300 leading-relaxed">
                Puisque le chiffre doit occuper l'un des deux coins opposés du rectangle (en diagonale X), il ne peut se trouver nulle part ailleurs dans ces deux colonnes. On peut éliminer ce candidat de toutes les autres cases de ces colonnes !
              </p>
            </div>
          </div>
        `,
      },
      en: {
        title: "Advanced X-Wing Technique — Mastering Rectangular Logic",
        excerpt:
          "The quintessential expert Sudoku technique: spot a 4-corner rectangle across two rows to eliminate candidates from columns.",
        metaTitle: "X-Wing Sudoku Technique — Complete Expert Guide | Academy",
        metaDescription:
          "Master the X-Wing pattern: 4-corner structure, column eliminations, and solving Expert and Master puzzles.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Understanding the X-Wing Pattern</h2>
            <p class="text-gray-300 leading-relaxed">
              The <strong>X-Wing</strong> pattern occurs when a candidate digit appears exactly <strong>twice in two different rows</strong>, and those candidate cells share the exact same two columns, forming a logical rectangle.
            </p>
            <div class="p-6 rounded-3xl bg-blue-950/40 border border-blue-500/30">
              <h3 class="font-bold text-white mb-2">Logical Deduction:</h3>
              <p class="text-xs text-gray-300 leading-relaxed">
                Because the digit must occupy either the top-left/bottom-right or top-right/bottom-left corners, it can be safely eliminated from all other cells in those two columns!
              </p>
            </div>
          </div>
        `,
      },
      de: {
        title: "X-Wing Technik — Logische Rechteckmuster für Experten",
        excerpt:
          "Die Königsdisziplin im Experten-Sudoku: Erkennen Sie ein 4-Ecken-Muster in zwei Zeilen, um Kandidaten in den Spalten zu eliminieren.",
        metaTitle: "X-Wing Sudoku Technik — Experten-Leitfaden | Akademie",
        metaDescription:
          "Meistern Sie das X-Wing-Muster im Sudoku: 4-Ecken-Struktur, Spalteneliminierungen und das Lösen schwerer Gitter.",
        contentHtml: `
          <div class="space-y-6">
            <h2 class="text-2xl font-black text-white">Das X-Wing Muster</h2>
            <p class="text-gray-300 leading-relaxed">
              Ein <strong>X-Wing</strong> entsteht, wenn eine Kandidatenziffer in genau <strong>zwei Zeilen jeweils nur zweimal vorkommt</strong> und diese Felder genau in denselben zwei Spalten liegen.
            </p>
          </div>
        `,
      },
    },
  },
};

// Aliases mapping (e.g. regles-du-sudoku -> rules)
export const ARTICLE_SLUG_ALIASES: Record<string, string> = {
  "regles-du-sudoku": "rules",
  "sudoku-rules": "rules",
  "sudoku-regeln": "rules",
  "derniere-case-libre": "rules",
  "derniere-case-restante": "rules",
  "technique-du-dernier-chiffre-possible": "naked-singles",
  "les-notes-dans-le-sudoku": "how-to-play",
  "singletons-nus": "naked-singles",
  "paires-nues": "naked-pairs",
  "beginner": "rules",
  "intermediate": "naked-pairs",
  "advanced": "x-wing",
};
