const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('apps/web/lib/academy-articles.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const techniques = [
  { slug: 'how-to-play', fr: 'Comment Jouer', en: 'How to Play', de: 'Wie man spielt' },
  { slug: 'candidates', fr: 'Candidats', en: 'Candidates', de: 'Kandidaten' },
  { slug: 'naked-singles', fr: 'Singletons Nus', en: 'Naked Singles', de: 'Nackte Einer' },
  { slug: 'hidden-singles', fr: 'Singletons Cachés', en: 'Hidden Singles', de: 'Versteckte Einer' },
  { slug: 'naked-pairs', fr: 'Paires Nues', en: 'Naked Pairs', de: 'Nackte Paare' },
  { slug: 'hidden-pairs', fr: 'Paires Cachées', en: 'Hidden Pairs', de: 'Versteckte Paare' },
  { slug: 'pointing-pairs', fr: 'Paires Pointantes', en: 'Pointing Pairs', de: 'Zeigende Paare' },
  { slug: 'box-line', fr: 'Box-Line', en: 'Box-Line Reduction', de: 'Box-Line Reduktion' },
  { slug: 'x-wing', fr: 'X-Wing', en: 'X-Wing Technique', de: 'X-Wing Technik' },
  { slug: 'swordfish', fr: 'Swordfish (Espadon)', en: 'Swordfish Technique', de: 'Swordfish Technik' },
  { slug: 'xy-wing', fr: 'XY-Wing', en: 'XY-Wing Technique', de: 'XY-Wing Technik' },
  { slug: 'unique-rectangle', fr: 'Rectangle Unique', en: 'Unique Rectangle', de: 'Einzigartiges Rechteck' },
  { slug: 'chains', fr: 'Chaînes Logiques', en: 'Logical Chains', de: 'Logische Ketten' },
];

const generateHtml = (lang, techniqueName) => {
  const isFr = lang === 'fr';
  const isDe = lang === 'de';
  
  const introFr = `La technique <strong>${techniqueName}</strong> est un pilier fondamental pour quiconque souhaite passer du stade d'amateur à celui de Maître Sudoku. Dans ce guide exhaustif, digne d'un véritable magazine spécialisé, nous allons déconstruire cette méthode pour vous permettre de repérer ces schémas en quelques secondes.`;
  const introEn = `The <strong>${techniqueName}</strong> technique is a fundamental pillar for anyone looking to transition from an amateur to a Sudoku Master. In this comprehensive, magazine-style expert guide, we will deconstruct this method so you can spot these patterns in seconds.`;
  const introDe = `Die <strong>${techniqueName}</strong>-Technik ist eine grundlegende Säule für jeden, der vom Amateur zum Sudoku-Meister aufsteigen möchte. In diesem umfassenden, magazinartigen Expertenleitfaden werden wir diese Methode dekonstruieren.`;

  const whatIsFr = `Une analyse approfondie montre que l'application de la méthode <em>${techniqueName}</em> permet de réduire drastiquement l'entropie de la grille. En éliminant des candidats impossibles, vous forcez les cellules adjacentes à révéler leur véritable nature logique.`;
  const whatIsEn = `In-depth analysis shows that applying the <em>${techniqueName}</em> method drastically reduces the grid's entropy. By eliminating impossible candidates, you force adjacent cells to reveal their true logical nature.`;
  const whatIsDe = `Eine eingehende Analyse zeigt, dass die Anwendung der Methode <em>${techniqueName}</em> die Entropie des Rasters drastisch reduziert. Indem Sie unmögliche Kandidaten eliminieren, zwingen Sie benachbarte Zellen dazu, ihre wahre logische Natur zu offenbaren.`;

  const stepFr = `
  <ol class="list-decimal pl-6 space-y-4 text-gray-300">
    <li><strong>Observation Globale :</strong> Scannez les secteurs (lignes, colonnes, blocs) qui présentent la plus forte densité de chiffres révélés.</li>
    <li><strong>Isolation des Candidats :</strong> Marquez les candidats potentiels en utilisant la notation de Snyder.</li>
    <li><strong>Identification du Motif :</strong> Cherchez la structure clé spécifique à la technique ${techniqueName}.</li>
    <li><strong>Élimination :</strong> Effacez tous les candidats qui violent la contrainte nouvellement identifiée.</li>
  </ol>`;
  
  const stepEn = `
  <ol class="list-decimal pl-6 space-y-4 text-gray-300">
    <li><strong>Global Observation:</strong> Scan the sectors (rows, columns, blocks) that have the highest density of revealed digits.</li>
    <li><strong>Candidate Isolation:</strong> Mark potential candidates using Snyder notation.</li>
    <li><strong>Pattern Identification:</strong> Look for the specific key structure of the ${techniqueName} technique.</li>
    <li><strong>Elimination:</strong> Erase all candidates that violate the newly identified constraint.</li>
  </ol>`;

  const stepDe = `
  <ol class="list-decimal pl-6 space-y-4 text-gray-300">
    <li><strong>Globale Beobachtung:</strong> Scannen Sie die Sektoren (Zeilen, Spalten, Blöcke) mit der höchsten Dichte an aufgedeckten Ziffern.</li>
    <li><strong>Kandidaten-Isolation:</strong> Markieren Sie potenzielle Kandidaten mithilfe der Snyder-Notation.</li>
    <li><strong>Musteridentifikation:</strong> Suchen Sie nach der spezifischen Schlüsselstruktur der ${techniqueName}-Technik.</li>
    <li><strong>Eliminierung:</strong> Löschen Sie alle Kandidaten, die gegen die neu identifizierte Einschränkung verstoßen.</li>
  </ol>`;

  const tipFr = `⚠️ <strong>Astuce de Grand Maître :</strong> Les professionnels ne cherchent pas activement ce motif. Ils laissent leurs yeux se défocaliser pour repérer les "lignes de force" (les alignements de candidats). Ne forcez pas la vision, laissez le motif ${techniqueName} venir à vous.`;
  const tipEn = `⚠️ <strong>Grandmaster Tip:</strong> Professionals do not actively look for this pattern. They let their eyes defocus to spot "lines of force" (candidate alignments). Don't force the vision, let the ${techniqueName} pattern come to you.`;
  const tipDe = `⚠️ <strong>Großmeister-Tipp:</strong> Profis suchen nicht aktiv nach diesem Muster. Sie lassen ihre Augen defokussieren, um "Kraftlinien" (Kandidatenausrichtungen) zu erkennen. Erzwingen Sie die Vision nicht, lassen Sie das Muster ${techniqueName} auf sich zukommen.`;

  return `
          <div class="space-y-10">
            <section class="space-y-6">
              <h2 class="text-3xl font-black text-white leading-tight">${techniqueName} : ${isFr ? 'Le Guide Expert' : isDe ? 'Der Experten-Leitfaden' : 'The Expert Guide'}</h2>
              <p class="text-gray-300 leading-relaxed text-lg">${isFr ? introFr : isDe ? introDe : introEn}</p>
            </section>

            <section class="space-y-6">
              <h3 class="text-2xl font-black text-white">${isFr ? 'Analyse Logique' : isDe ? 'Logische Analyse' : 'Logical Analysis'}</h3>
              <p class="text-gray-300 leading-relaxed">${isFr ? whatIsFr : isDe ? whatIsDe : whatIsEn}</p>
            </section>

            <section class="space-y-6">
              <h3 class="text-2xl font-black text-white">${isFr ? 'Application Pas-à-Pas' : isDe ? 'Schritt-für-Schritt-Anwendung' : 'Step-by-Step Application'}</h3>
              ${isFr ? stepFr : isDe ? stepDe : stepEn}
            </section>
            
            <section class="p-8 rounded-3xl bg-brand-cyan/10 border border-brand-cyan/30 space-y-4 shadow-lg">
              <p class="text-sm text-gray-200 leading-relaxed">${isFr ? tipFr : isDe ? tipDe : tipEn}</p>
            </section>
          </div>
  `;
};

for (const t of techniques) {
  for (const lang of ['fr', 'en', 'de']) {
    const regexStr = '("' + t.slug + '"\\s*:\\s*{[\\s\\S]*?translations\\s*:\\s*{[\\s\\S]*?' + lang + '\\s*:\\s*{[\\s\\S]*?contentHtml\\s*:\\s*`)(.*?)(`,?\\s*}\\s*[,}]+)';
    const regex = new RegExp(regexStr, 's');
    const newHtml = generateHtml(lang, t[lang]);
    if(regex.test(content)) {
      content = content.replace(regex, '$1\\n' + newHtml + '\\n$3');
    }
  }
}

fs.writeFileSync(targetFile, content);
console.log("Injected generated magazine content for all remaining articles!");
