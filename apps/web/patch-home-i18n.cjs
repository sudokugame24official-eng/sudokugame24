/* Patch one-off: internationalise les chaines hardcoded du HomeClient + LiveStatsTicker.
   A retraiter apres validation. */
const fs = require('fs');
const path = require('path');
const WEB = path.resolve(__dirname);

// [key, {en,fr,de}] - texte a traduire (sans l'emoji, l'emoji reste en JSX)
const NEW_KEYS = [
  ['showcaseBadge',   { en:'Sudoku Masters Universe', fr:'Univers des Maîtres Sudoku', de:'Sudoku-Meister-Universum' }],
  ['tabArt',          { en:'Artwork', fr:'Art', de:'Kunstwerk' }],
  ['tabGrid',         { en:'AI Grid', fr:'Grille IA', de:'KI-Raster' }],
  ['heroBadge2',      { en:'Academy & Mind', fr:'Académie & Esprit', de:'Akademie & Geist' }],
  ['heroBadge3',      { en:'+150 XP Earned', fr:'+150 XP Gagnés', de:'+150 XP verdient' }],
  ['featureBadge',    { en:'The Complete Sudoku Experience', fr:'L\'Expérience Sudoku Complète', de:'Das vollständige Sudoku-Erlebnis' }],
  ['featureTitle',    { en:'Four Game Modes. Zero Compromise.', fr:'Quatre Modes de Jeu. Zéro Compromis.', de:'Vier Spielmodi. Null Kompromisse.' }],
  ['featureDesc',     { en:'From casual solver to esports champion, every mode is powered by a certified logical engine with no guessing.', fr:'Du solveur casual jusqu\'au champion d\'esports, chaque mode est optimisé avec un moteur logique certifié sans devinette.', de:'Von Casuloyalität zum Esports-Champion, jeder Modus läuft mit einer zertifizierten logischen Engine ohne Raten.' }],
  ['finalsLive',      { en:'FINALs LIVE', fr:'FINALs EN DIRECT', de:'FINALs LIVE' }],
  ['eloMatchmaking',  { en:'1v1 Elo Matchmaking', fr:'1v1 Matchmaking Elo', de:'1v1 Elo-Matchmaking' }],
  ['topDuel',         { en:'World Top Duel', fr:'Top Duel Mondial', de:'Welt-Top-Duell' }],
  ['joinDuel',        { en:'Join', fr:'Rejoindre', de:'Beitreten' }],
  ['streakDays',      { en:'12 Days', fr:'12 Jours', de:'12 Tage' }],
  ['resetCaption',    { en:'Resets at 00:00 UTC', fr:'Réinitialisation UTC à 00:00', de:'Setzt sich um 00:00 UTC zurück' }],
  ['academyBadge',    { en:'Learning Progression', fr:'Progression Pédagogique', de:'Lernfortschritt' }],
  ['academyDesc',     { en:'Become a deduction master with our interactive lessons, annotated diagrams, and targeted exercises.', fr:'Devenez un maître de la déduction avec nos leçons interactives, diagrammes annotés et exercices ciblés.', de:'Werden Sie zum Deduktionsmeister mit interaktiven Lektionen, kommentierten Diagrammen und gezielten Übungen.' }],
  ['gridLiveLabel',   { en:'Live • AI Solver', fr:'Direct • IA Solver', de:'Live • KI-Löser' }],
];

// --- 1. Patch JSON message files ---
const locales = ['en', 'fr', 'de'];
for (const loc of locales) {
  const f = path.join(WEB, 'messages', loc + '.json');
  const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
  let added = 0;
  for (const [k, vals] of NEW_KEYS) {
    if (obj.home[k] === undefined) { obj.home[k] = vals[loc]; added++; }
    else { console.warn(`WARN: key '${k}' deja present dans ${loc}`); }
  }
  // re-serialize, 2-space, preserve trailing newline
  let out = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(f, out);
  console.log(`[json] ${loc}.json: +${added} keys (total home=${Object.keys(obj.home).length})`);
}

// --- 2. Patch HomeClient.tsx : remplacer les chaines hardcoded par t("key") ---
// bare-text replacements (uniques). On garde l'emoji ⚔️ aupres du texte duel.
const TSX = path.join(WEB, 'components', 'home', 'HomeClient.tsx');
let src = fs.readFileSync(TSX, 'utf8');

const REPL = [
  ['Sudoku Masters Universe', '{t("showcaseBadge")}'],
  ['Artwork', '{t("tabArt")}'],   // assert unique later
  ['Grille IA', '{t("tabGrid")}'],
  ['Académie & Esprit', '{t("heroBadge2")}'],
  ['+150 XP Gagnés', '{t("heroBadge3")}'],
  ["L'Expérience Sudoku Complète", '{t("featureBadge")}'],
  ['Quatre Modes de Jeu. Zéro Compromis.', '{t("featureTitle")}'],
  ["Du solveur casual jusqu'au champion d'esports, chaque mode est optimisé avec un moteur logique certifié sans devinette.", '{t("featureDesc")}'],
  ['FINALs LIVE', '{t("finalsLive")}'],
  ['1v1 Elo Matchmaking', '{t("eloMatchmaking")}'],
  ['Top Duel Mondial', '{t("topDuel")}'],
  ['Rejoindre', '{t("joinDuel")}'],
  ['12 Jours', '{t("streakDays")}'],
  ['Réinitialisation UTC à 00:00', '{t("resetCaption")}'],
  ['Progression Pédagogique', '{t("academyBadge")}'],
  ["Devenez un maître de la déduction avec nos leçons interactives, diagrammes annotés et exercices ciblés.", '{t("academyDesc")}'],
  ['Direct • IA Solver', '{t("gridLiveLabel")}'],
];

let changes = 0;
for (const [oldS, newS] of REPL) {
    const count = src.split(oldS).length - 1;
  if (count === 0) { console.warn(`WARN tsx: '${oldS.slice(0,30)}' introuvable`); continue; }
  if (count > 1) { console.warn(`WARN tsx: '${oldS.slice(0,30)}' apparu ${count}x (remplace tout)`); }
  src = src.split(oldS).join(newS);
  changes++;
}
fs.writeFileSync(TSX, src);
console.log(`[tsx] HomeClient.tsx: ${changes} remplacements effectues`);
console.log('PATCH_DONE');
