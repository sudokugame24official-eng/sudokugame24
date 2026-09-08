const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('apps/web/lib/academy-articles.ts');
let content = fs.readFileSync(targetFile, 'utf8');

// Function to replace content
const replaceTranslation = (slug, lang, newHtml) => {
  const nakedTriplesRegexStr = '("' + slug + '"\\s*:\\s*{[\\s\\S]*?translations\\s*:\\s*{[\\s\\S]*?' + lang + '\\s*:\\s*{[\\s\\S]*?contentHtml\\s*:\\s*`)(.*?)(`,?\\s*}\\s*[,}]+)';
  const regex = new RegExp(nakedTriplesRegexStr, 's');
  if(regex.test(content)) {
    content = content.replace(regex, '$1\\n' + newHtml + '\\n$3');
  } else {
    console.log("Could not find translation for " + slug + " in " + lang);
  }
}

const nakedTriplesFr = `
          <div class="space-y-10">
            <section class="space-y-6">
              <h2 class="text-3xl font-black text-white leading-tight">Technique des Triplets Nus (Naked Triples) : Le Guide Expert</h2>
              <p class="text-gray-300 leading-relaxed text-lg">
                Si vous voulez dépasser le niveau Intermédiaire, la technique du <strong>Triplet Nu (Naked Triple)</strong> est votre meilleure alliée. Souvent confondu avec la paire nue, le triplet nu est un modèle logique redoutable qui permet d'éliminer des dizaines de candidats inutiles en un seul coup d'œil.
              </p>
            </section>

            <section class="space-y-6">
              <h3 class="text-2xl font-black text-white">Qu'est-ce qu'un Triplet Nu ? Définition Mathématique</h3>
              <p class="text-gray-300 leading-relaxed">
                Un triplet nu se produit lorsque <strong>trois cases</strong> appartenant à une même région (une ligne, une colonne ou un bloc 3x3) contiennent exclusivement une combinaison de <strong>trois candidats spécifiques</strong>. Puisque ces trois chiffres doivent obligatoirement occuper ces trois cases, ils ne peuvent exister nulle part ailleurs dans cette même région.
              </p>
              <div class="p-6 rounded-2xl bg-black/40 border border-brand-cyan/20 space-y-4">
                <h4 class="font-bold text-brand-cyan uppercase tracking-wide">Exemples de Combinaisons Valides</h4>
                <ul class="list-disc pl-6 space-y-2 text-gray-300 text-sm">
                  <li><strong>Triplet Parfait :</strong> Trois cases contiennent exactement {1, 2, 3}.</li>
                  <li><strong>Triplet Asymétrique :</strong> Case 1: {1, 2}, Case 2: {2, 3}, Case 3: {1, 3}. Même si chaque case n'a que deux candidats, l'ensemble des trois cases forme un système fermé de 3 chiffres !</li>
                  <li><strong>Triplet Hétérogène :</strong> Case 1: {1, 2, 3}, Case 2: {1, 2}, Case 3: {2, 3}. Toujours valide.</li>
                </ul>
              </div>
            </section>

            <section class="space-y-6">
              <h3 class="text-2xl font-black text-white">Guide Pas-à-Pas : Comment Repérer un Triplet Nu ?</h3>
              <p class="text-gray-300 leading-relaxed">Les experts du Sudoku utilisent le "scanning de sous-ensembles" pour les trouver rapidement :</p>
              <ol class="list-decimal pl-6 space-y-4 text-gray-300">
                <li><strong>Générez tous les candidats :</strong> Vous devez utiliser la notation complète (Full Pencil Marks).</li>
                <li><strong>Analysez les lignes faibles :</strong> Concentrez-vous sur les lignes/colonnes ayant beaucoup de cases vides (5 à 7 cases vides).</li>
                <li><strong>Cherchez les paires :</strong> Trouvez une case avec seulement 2 candidats. Regardez les cases voisines. Partagent-elles ces candidats ? Si vous trouvez un groupe fermé de 3 chiffres sur 3 cases, bingo !</li>
                <li><strong>Nettoyez la région :</strong> Effacez ces 3 chiffres de toutes les autres cases de la ligne, colonne ou bloc concerné.</li>
              </ol>
            </section>
            
            <section class="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4 shadow-lg">
              <h3 class="font-black text-amber-400 text-lg uppercase flex items-center gap-3">
                ⚠️ Erreur de Débutant à Éviter
              </h3>
              <p class="text-sm text-gray-200 leading-relaxed">
                Ne cherchez pas uniquement des cases contenant les 3 mêmes chiffres (ex: {4,5,6}, {4,5,6}, {4,5,6}). C'est extrêmement rare. Le vrai pouvoir du Triplet Nu se révèle dans les combinaisons partielles comme {4,5}, {5,6}, {4,6}. Ne les ratez pas !
              </p>
            </section>
          </div>
`;

const nakedTriplesEn = `
          <div class="space-y-10">
            <section class="space-y-6">
              <h2 class="text-3xl font-black text-white leading-tight">Naked Triples Technique: The Ultimate Expert Guide</h2>
              <p class="text-gray-300 leading-relaxed text-lg">
                If you want to break through the Intermediate plateau, mastering the <strong>Naked Triple</strong> is mandatory. A step up from the Naked Pair, the Naked Triple is a powerful logical pattern that cleans up your pencil marks and unlocks seemingly impossible Sudoku grids.
              </p>
            </section>

            <section class="space-y-6">
              <h3 class="text-2xl font-black text-white">What is a Naked Triple? The Core Logic</h3>
              <p class="text-gray-300 leading-relaxed">
                A Naked Triple occurs when exactly <strong>three cells</strong> in a single house (a row, a column, or a 3x3 block) contain no other candidates other than a specific combination of <strong>three digits</strong>. Because these three digits are restricted entirely to these three cells, they can be safely eliminated from every other cell in that house.
              </p>
              <div class="p-6 rounded-2xl bg-black/40 border border-brand-cyan/20 space-y-4">
                <h4 class="font-bold text-brand-cyan uppercase tracking-wide">Valid Naked Triple Combinations</h4>
                <ul class="list-disc pl-6 space-y-2 text-gray-300 text-sm">
                  <li><strong>Perfect Triple:</strong> All three cells contain {1, 2, 3}.</li>
                  <li><strong>Asymmetric Triple:</strong> Cell 1: {1, 2}, Cell 2: {2, 3}, Cell 3: {1, 3}. This forms a closed loop of exactly 3 digits across 3 cells!</li>
                  <li><strong>Mixed Triple:</strong> Cell 1: {1, 2, 3}, Cell 2: {1, 2}, Cell 3: {2, 3}. Perfectly valid.</li>
                </ul>
              </div>
            </section>

            <section class="space-y-6">
              <h3 class="text-2xl font-black text-white">Step-by-Step: Spotting a Naked Triple</h3>
              <p class="text-gray-300 leading-relaxed">Grandmasters use "subset scanning" to find them in seconds:</p>
              <ol class="list-decimal pl-6 space-y-4 text-gray-300">
                <li><strong>Full Candidate Notation:</strong> You must write down all possible pencil marks first.</li>
                <li><strong>Target Weak Houses:</strong> Focus on rows or blocks that have 5 to 7 empty cells.</li>
                <li><strong>Hunt Bivalue Cells:</strong> Find a cell with only 2 candidates. Look at its neighbors. Do they share these digits? If you find a locked set of 3 digits across 3 cells, you found it!</li>
                <li><strong>The Purge:</strong> Erase those 3 digits from all other candidate lists in that row/col/box.</li>
              </ol>
            </section>
            
            <section class="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4 shadow-lg">
              <h3 class="font-black text-amber-400 text-lg uppercase flex items-center gap-3">
                ⚠️ The #1 Beginner Mistake
              </h3>
              <p class="text-sm text-gray-200 leading-relaxed">
                Don't just look for three cells that have the exact same three digits (e.g., {4,5,6}, {4,5,6}, {4,5,6}). That is incredibly rare. The true power of the Naked Triple lies in the partial combinations like {4,5}, {5,6}, {4,6}. Train your eyes to spot the closed loop!
              </p>
            </section>
          </div>
`;

const nakedTriplesDe = `
          <div class="space-y-10">
            <section class="space-y-6">
              <h2 class="text-3xl font-black text-white leading-tight">Nackte Dreier (Naked Triples): Der Experten-Leitfaden</h2>
              <p class="text-gray-300 leading-relaxed text-lg">
                Wenn Sie fortgeschrittene Rätsel lösen wollen, ist die Beherrschung der <strong>Naked Triple</strong> Technik unerlässlich. Der "Nackte Dreier" ist ein mächtiges logisches Muster, das Ihre Kandidatenliste sofort bereinigt und blockierte Sudoku-Gitter öffnet.
              </p>
            </section>

            <section class="space-y-6">
              <h3 class="text-2xl font-black text-white">Was ist ein Nackter Dreier? Die Logik</h3>
              <p class="text-gray-300 leading-relaxed">
                Ein nackter Dreier entsteht, wenn genau <strong>drei Zellen</strong> in einem Bereich (Zeile, Spalte oder 3x3-Block) ausschließlich eine Kombination aus <strong>genau drei Ziffern</strong> enthalten. Da diese drei Zahlen in diesen drei Zellen platziert werden müssen, können sie aus allen anderen Zellen desselben Bereichs sicher eliminiert werden.
              </p>
              <div class="p-6 rounded-2xl bg-black/40 border border-brand-cyan/20 space-y-4">
                <h4 class="font-bold text-brand-cyan uppercase tracking-wide">Gültige Nackte Dreier Kombinationen</h4>
                <ul class="list-disc pl-6 space-y-2 text-gray-300 text-sm">
                  <li><strong>Perfekter Dreier:</strong> Alle drei Zellen enthalten {1, 2, 3}.</li>
                  <li><strong>Asymmetrischer Dreier:</strong> Zelle 1: {1, 2}, Zelle 2: {2, 3}, Zelle 3: {1, 3}. Eine geschlossene Schleife!</li>
                  <li><strong>Gemischter Dreier:</strong> Zelle 1: {1, 2, 3}, Zelle 2: {1, 2}, Zelle 3: {2, 3}. Völlig gültig.</li>
                </ul>
              </div>
            </section>

            <section class="space-y-6">
              <h3 class="text-2xl font-black text-white">Schritt-für-Schritt: So finden Sie Nackte Dreier</h3>
              <ol class="list-decimal pl-6 space-y-4 text-gray-300">
                <li><strong>Vollständige Notizen:</strong> Sie müssen alle möglichen Bleistiftmarkierungen notieren.</li>
                <li><strong>Schwache Bereiche scannen:</strong> Konzentrieren Sie sich auf Blöcke mit 5 bis 7 leeren Zellen.</li>
                <li><strong>Zwei-Kandidaten-Zellen suchen:</strong> Finden Sie eine Zelle mit nur 2 Optionen. Prüfen Sie die Nachbarn. Ergibt sich ein geschlossenes System aus 3 Zahlen?</li>
                <li><strong>Kandidaten löschen:</strong> Streichen Sie diese 3 Zahlen aus allen anderen Zellen im Bereich.</li>
              </ol>
            </section>
          </div>
`;

replaceTranslation('naked-triples', 'fr', nakedTriplesFr);
replaceTranslation('naked-triples', 'en', nakedTriplesEn);
replaceTranslation('naked-triples', 'de', nakedTriplesDe);

fs.writeFileSync(targetFile, content);
console.log("Injected naked-triples");
