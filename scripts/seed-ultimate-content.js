const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const beginnerContent = `
<h2>L'Architecture Fondamentale du Sudoku</h2>
<p>Le Sudoku est un jeu de logique pure qui se déroule sur une grille de 81 cases. Avant même de placer un seul chiffre, il est crucial de comprendre la géométrie de ce plateau. La grille est divisée en trois structures essentielles appelées <strong>maisons</strong> (houses) :</p>
<ul>
  <li><strong>Les Lignes :</strong> 9 horizontales.</li>
  <li><strong>Les Colonnes :</strong> 9 verticales.</li>
  <li><strong>Les Blocs (Nonnets) :</strong> 9 carrés de 3x3 cases.</li>
</ul>
<div class="bg-brand-navy-light p-5 rounded-2xl border border-brand-gold/20 my-6 shadow-lg">
  <h3 class="text-brand-gold font-bold mb-3 flex items-center gap-2">?? Astuce d'Expert</h3>
  <p class="text-sm text-white/90 leading-relaxed">Chaque case individuelle appartient simultanément à exactement trois maisons (une ligne, une colonne, et un bloc). C'est cette intersection qui crée la magie du Sudoku et permet de déduire la solution finale.</p>
</div>
<h2>La Règle d'Or Universelle</h2>
<p>Il n'y a pas de mathématiques dans le Sudoku, uniquement de la déduction. La règle absolue est la suivante :</p>
<blockquote class="border-l-4 border-brand-orange pl-5 italic my-6 text-white/90 py-2">
  "Chaque ligne, chaque colonne et chaque bloc de 3x3 doit contenir tous les chiffres de 1 à 9, exactement une seule fois."
</blockquote>
<h3>Ce que cela implique :</h3>
<p>Cela signifie qu'aucune répétition n'est tolérée, et qu'aucune omission n'est permise. Lorsqu'il ne manque qu'un seul chiffre dans une maison, il suffit de regarder quels chiffres de 1 à 9 sont déjà présents pour déduire instantanément le chiffre manquant.</p>
`;

const intermediateContent = `
<h2>Les Candidats : Votre Deuxième Cerveau</h2>
<p>Lorsque les techniques de base comme le <em>Full House</em> ou les <em>Hidden Singles</em> ne suffisent plus, le joueur de Sudoku doit évoluer vers la gestion des <strong>candidats</strong> (ou pencil marks). Un candidat est un petit chiffre annoté dans une case vide, représentant une valeur potentielle.</p>
<div class="bg-brand-navy-light p-5 rounded-2xl border border-brand-gold/20 my-6 shadow-lg">
  <h3 class="text-brand-gold font-bold mb-3">?? L'Approche Systématique</h3>
  <p class="text-sm text-white/90 leading-relaxed">Inscrire tous les candidats possibles dans chaque case vide peut sembler laborieux, mais c'est le seul moyen d'appliquer les techniques intermédiaires et avancées. Sur SudokuGame24, le mode "Notes" vous permet de faire cela proprement.</p>
</div>
<h2>Les Paires Nues (Naked Pairs)</h2>
<p>Une <em>Paire Nue</em> se forme lorsque exactement <strong>deux cases de la même maison</strong> (ligne, colonne ou bloc) ne contiennent que les <strong>deux mêmes candidats</strong>.</p>
<p>Parce que ces deux cases doivent obligatoirement contenir l'un ou l'autre de ces deux chiffres (peu importe lequel va dans laquelle), ces deux chiffres ne peuvent se trouver <strong>nulle part ailleurs</strong> dans cette même maison. Vous pouvez donc les effacer en toute sécurité des autres cases de la maison.</p>
<h3>Exemple Pratique</h3>
<p>Si la ligne 1 contient deux cases (ex: R1C2 et R1C5) avec uniquement les candidats {3, 7}, aucun autre espace de la ligne 1 ne peut contenir un 3 ou un 7. Si vous trouvez un 3 en R1C8, vous pouvez l'éliminer de vos candidats !</p>
`;

const advancedContent = `
<h2>L'Élégance du X-Wing</h2>
<p>Le X-Wing est l'une des techniques avancées les plus célèbres et les plus satisfaisantes à maîtriser. Elle appartient à la famille des techniques de <em>Fish</em> (Poissons) et se base sur le concept des chaînes forcées simples.</p>
<h2>Comment repérer un X-Wing ?</h2>
<p>Un X-Wing apparaît lorsque, pour un chiffre donné, il n'existe que <strong>exactement deux cases possibles</strong> dans deux lignes différentes, et que ces cases s'alignent parfaitement sur les <strong>mêmes deux colonnes</strong> (ou inversement : deux colonnes parfaitement alignées sur deux lignes).</p>
<div class="bg-brand-navy-light p-5 rounded-2xl border border-brand-gold/20 my-6 shadow-lg">
  <h3 class="text-brand-gold font-bold mb-3 flex items-center gap-2">?? Le Motifs Visuel</h3>
  <p class="text-sm text-white/90 leading-relaxed">Dessinez mentalement un rectangle reliant ces quatre cases. Les coins de ce rectangle ???????. Puisque le chiffre doit absolument apparaître une fois dans la première ligne et une fois dans la deuxième ligne, il sera forcé sur l'une des deux diagonales du X.</p>
</div>
<h3>Conséquence Éliminatoire</h3>
<p>Puisque le chiffre est garanti de remplir les deux colonnes (grâce à sa présence diagonale), vous pouvez <strong>éliminer ce candidat de toutes les autres cases de ces deux colonnes</strong>.</p>
<p>Maîtriser le X-Wing est le passeport vers les ligues supérieures. Pratiquez cette technique sur les grilles de niveau Difficile et Expert !</p>
`;

async function main() {
  console.log('Starting Ultimate Content Injection...');
  try {
     let c1 = await prisma.lesson.updateMany({
       where: { slug: 'grid-anatomy-basics' },
       data: { content: beginnerContent }
     });
     let c2 = await prisma.lesson.updateMany({
       where: { slug: 'naked-pairs-triples' },
       data: { content: intermediateContent }
     });
     let c3 = await prisma.lesson.updateMany({
       where: { slug: 'x-wing-strategy' },
       data: { content: advancedContent }
     });
     console.log('Content beautifully injected!', c1.count, c2.count, c3.count);
  } catch (error) {
    console.error('Error during injection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
