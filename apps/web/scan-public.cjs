// Dev-only: find likely hardcoded French UI strings in public-facing files.
// Output: JSON to stdout. Delete after use.
const fs = require("fs");
const path = require("path");
const root = __dirname;

const PUBLIC = /shop|auth|daily|play|forum|questions|duel|profile|leaderboard|learn|help|faq|multiplayer|sudoku|messages|friends|chat|about|contact|privacy|terms|guidelines|disclaimer|article|knowledge/i;
const FR = /(rechercher|selectionnez|envoyer|annuler|rejouer|victoire|defaite|niveaux|facile|moyen|difficile|expert|maitre|amis|parametres|profil|adversaire|creer|trouver|termin|gagne|egalit|secondes|minutes|rejoignez|commencez|grille|invite|connexion|deconnexion|inscrire|statistiques|succes|communaute|apprendre|compte|publier|brouillon|articles|questions|reponses|vote|signalement|partager|copie|categories|sujets|recent|joueurs|championnat|duels|pieces|ligue|recompense|quotidien|spectateur|moder|ajouter|bloquer|quitter|choisir|couper|en ligne|daujourd|aucune|aucun|erreur|chargement|activer|permanent|actif|disponible|confirmer|veuillez|boutique|gratuit|payer|achat|acheter)/i;

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".tsx")) out.push(p);
  }
}
const files = [];
walk(path.join(root, "app"), files);
walk(path.join(root, "components"), files);
const report = [];
for (const f of files) {
  const b = f.replace(/\\/g, "/").split("/").slice(-2).join("/");
  if (!PUBLIC.test(b)) continue;
  if (/admin|layout|route|\.config|translations\.d/i.test(b) && b.includes("admin")) continue;
  const lines = fs.readFileSync(f, "utf8").split("\n");
  const hits = [];
  lines.forEach((l, i) => {
    if (/^\s*import /.test(l)) return;
    // string literals
    const matches = l.match(/"([^"\\]{2,})"/g) || [];
    for (const raw of matches) {
      const txt = raw.slice(1, -1);
      if (/^(https?:|\/|#|#|from |rgba|linear|radial|var\(|Microsoft|Sans|Mono|clsx|\.)/i.test(txt)) continue;
      if (/^[a-z][a-z0-9]*(\.|')[a-z0-9]+$/i.test(txt)) continue;
      if (/^[A-Za-z\s'\u00c0-\u00ff-]{2,}$/.test(txt) && FR.test(txt)) hits.push((i + 1) + "S: " + txt.slice(0, 80));
    }
    // JSX text nodes
    const jsx = l.match(/>([^<>{}]*[A-Za-z\u00c0-\u00ff]{3,}[^<>{}]*)</g) || [];
    for (const j of jsx) {
      const txt = j.replace(/^>|<$/g, "").trim();
      if (txt && txt.length > 2 && FR.test(txt) && /^[A-Za-z\u00c0-\u00ff']/.test(txt)) hits.push((i + 1) + "J: " + txt.slice(0, 80));
    }
  });
  if (hits.length) report.push({ file: b, hits });
}
console.log(JSON.stringify(report, null, 1));