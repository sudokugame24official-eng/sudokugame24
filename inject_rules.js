const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('apps/web/lib/academy-articles.ts');
let content = fs.readFileSync(targetFile, 'utf8');

// Rules
const rulesFr = `
          <div class="space-y-8">
            <section class="space-y-4">
              <h2 class="text-3xl font-black text-white mb-6">Qu'est-ce que le Sudoku ? Le Guide Complet</h2>
              <p class="text-gray-300 leading-relaxed text-lg">
                <strong>Le Sudoku</strong> (du japonais "su" pour chiffre et "doku" pour unique) est un jeu de logique et de déduction de renommée mondiale. Contrairement aux idées reçues, le Sudoku ne requiert <strong>absolument aucune compétence mathématique</strong>. Les chiffres de 1 à 9 sont utilisés uniquement comme des symboles distincts. Vous pourriez tout aussi bien jouer avec des couleurs ou des lettres !
              </p>
              <p class="text-gray-300 leading-relaxed">
                Notre plateforme, <strong>Sudoku Premium</strong>, offre l'expérience la plus pure et la plus certifiée pour s'entraîner, participer à des tournois mondiaux et s'améliorer grâce à l'intelligence artificielle.
              </p>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">L'Architecture de la Grille 9×9</h2>
              <p class="text-gray-300 leading-relaxed">
                Avant de commencer, il est crucial de comprendre la terminologie exacte utilisée par les experts. La grille de Sudoku classique est un carré de 81 cases (ou cellules). Ces cases sont divisées en trois "zones" fondamentales :
              </p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                <div class="p-6 rounded-2xl bg-black/40 border border-brand-gold/20 shadow-lg hover:border-brand-gold/50 transition-colors space-y-3">
                  <div class="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold font-black text-xl">9</div>
                  <h3 class="font-bold text-white text-md uppercase tracking-wide">Lignes Horizontales</h3>
                  <p class="text-sm text-gray-400">Il y a 9 lignes au total. Chaque ligne s'étend de gauche à droite et comporte exactement 9 cases.</p>
                </div>
                <div class="p-6 rounded-2xl bg-black/40 border border-brand-orange/20 shadow-lg hover:border-brand-orange/50 transition-colors space-y-3">
                  <div class="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange font-black text-xl">9</div>
                  <h3 class="font-bold text-white text-md uppercase tracking-wide">Colonnes Verticales</h3>
                  <p class="text-sm text-gray-400">Il y a 9 colonnes au total. Chaque colonne s'étend de haut en bas et comporte exactement 9 cases.</p>
                </div>
                <div class="p-6 rounded-2xl bg-black/40 border border-brand-cyan/20 shadow-lg hover:border-brand-cyan/50 transition-colors space-y-3">
                  <div class="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-black text-xl">9</div>
                  <h3 class="font-bold text-white text-md uppercase tracking-wide">Blocs 3×3 (Régions)</h3>
                  <p class="text-sm text-gray-400">La grille est divisée en 9 blocs carrés de 3 par 3 cases (souvent appelés "régions" ou "boîtes").</p>
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <h2 class="text-2xl font-black text-white">Les 3 Règles d'Or Inviolables du Sudoku</h2>
              <p class="text-gray-300 leading-relaxed mb-4">
                La beauté du Sudoku réside dans sa simplicité. Il n'y a que trois règles pour résoudre n'importe quelle grille, qu'elle soit facile ou de niveau diabolique.
              </p>
              <div class="p-8 rounded-3xl bg-gradient-to-br from-[#0A2A5C]/80 to-[#0D387A]/80 border border-blue-500/30 space-y-6 shadow-2xl">
                <div class="flex items-start gap-5">
                  <span class="w-10 h-10 rounded-full bg-brand-gold text-brand-navy font-black flex items-center justify-center shrink-0 text-lg shadow-[0_0_15px_rgba(255,193,7,0.4)]">1</span>
                  <div>
                    <strong class="text-white block text-lg mb-1">Contrainte de Ligne</strong>
                    <p class="text-sm text-gray-300 leading-relaxed">Chaque ligne horizontale doit contenir absolument tous les chiffres de 1 à 9. Il ne peut y avoir de doublons (par exemple, vous ne pouvez pas avoir deux '4' sur la même ligne).</p>
                  </div>
                </div>
                <div class="w-full h-px bg-white/10"></div>
                <div class="flex items-start gap-5">
                  <span class="w-10 h-10 rounded-full bg-brand-orange text-white font-black flex items-center justify-center shrink-0 text-lg shadow-[0_0_15px_rgba(255,69,0,0.4)]">2</span>
                  <div>
                    <strong class="text-white block text-lg mb-1">Contrainte de Colonne</strong>
                    <p class="text-sm text-gray-300 leading-relaxed">Chaque colonne verticale doit contenir tous les chiffres de 1 à 9. Aucun chiffre ne peut être répété dans la même colonne verticale.</p>
                  </div>
                </div>
                <div class="w-full h-px bg-white/10"></div>
                <div class="flex items-start gap-5">
                  <span class="w-10 h-10 rounded-full bg-brand-cyan text-brand-navy font-black flex items-center justify-center shrink-0 text-lg shadow-[0_0_15px_rgba(0,255,255,0.4)]">3</span>
                  <div>
                    <strong class="text-white block text-lg mb-1">Contrainte de Bloc 3×3</strong>
                    <p class="text-sm text-gray-300 leading-relaxed">Chaque sous-grille carrée de 3x3 doit contenir tous les chiffres de 1 à 9. Aucun chiffre ne peut apparaître deux fois dans le même bloc.</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4 shadow-lg relative overflow-hidden">
              <div class="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <svg class="w-32 h-32 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22M12 6l7.5 13h-15M11 10h2v5h-2m0 2h2v2h-2"/></svg>
              </div>
              <h3 class="font-black text-amber-400 text-lg uppercase flex items-center gap-3">
                ⚠️ Astuce de Grand Maître : Ne devinez JAMAIS !
              </h3>
              <p class="text-sm text-gray-200 leading-relaxed">
                Toutes les grilles sur <strong>Sudoku Premium</strong> (que ce soit en mode Solo, Défi Quotidien ou Duel) sont générées par notre moteur certifié pour garantir <strong>une seule et unique solution logique</strong>. <br/><br/>
                La conjecture (ou "pifomètre") n'est jamais nécessaire. Si vous êtes bloqué, cela signifie simplement qu'il y a une technique logique que vous n'avez pas encore repérée. Deviner ruinera votre grille et entraînera des erreurs fatales plus tard dans le jeu.
              </p>
            </section>
            
            <section class="space-y-4 mt-8">
              <h2 class="text-2xl font-black text-white">Pourquoi jouer au Sudoku ?</h2>
              <ul class="list-disc pl-6 space-y-3 text-gray-300">
                <li><strong>Développement Cognitif :</strong> Stimule la mémoire à court terme et la capacité de concentration.</li>
                <li><strong>Réduction du Stress :</strong> Le processus de déduction plonge le joueur dans un état de "flow" relaxant.</li>
                <li><strong>Accessibilité Globale :</strong> Pas de barrière de langue, juste une logique universelle pure.</li>
              </ul>
              <p class="text-gray-300 mt-4">
                Prêt à appliquer ces règles ? Lisez notre prochain guide sur la façon de résoudre votre première grille !
              </p>
            </section>
          </div>
`;

const replaceInFile = (slug, lang, newHtml) => {
  const rulesRegexStr = '("' + slug + '"\\s*:\\s*{[\\s\\S]*?translations\\s*:\\s*{[\\s\\S]*?' + lang + '\\s*:\\s*{[\\s\\S]*?contentHtml\\s*:\\s*`)(.*?)(`,?\\s*}\\s*[,}]+)';
  const regex = new RegExp(rulesRegexStr, 's');
  
  // replace
  if(regex.test(content)) {
    content = content.replace(regex, '$1\\n' + newHtml + '\\n$3');
  } else {
    console.log("Could not find translation for " + slug);
  }
};

replaceInFile('rules', 'fr', rulesFr);

fs.writeFileSync(targetFile, content);
console.log("Injected rules FR");
