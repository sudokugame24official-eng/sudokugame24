// Dev-only scanner: lists likely hardcoded French strings in a file.
// Usage: node scan-fr.js <file...>
const fs = require("fs");
const frWords =
  /\b(le|la|les|des|du|une|être|avec|pour|dans|vous|nous|jouer|parties?|défis?|classements?|boutique|gratuit|inscrit|réservés|langues|étoiles|sécurisé|certifié|passionnés|merci|votre|erreur|chargement|envoyer|annuler|rejouer|victoire|défaite|score|niveaux?|facile|moyen|difficile|expert|maître|amis|messages?|paramètres|profil|aide|contact|accueil|adversaire|table|créer|trouver|matchmaking|terminé|gagné|gagnée|égalité|expérience|secondes?|minutes?|prêt|action|rejoignez|commencez|première|grille|moins|invité|connecter|inscrire|statistiques|succès|communauté|apprendre|compte|publier|brouillon|articles?|questions?|réponses?|vote|signalement|envoyé|partager|copié|lien|catégories?|sujets?|récent|meilleurs?|joueurs?|en ligne|aujourd'hui|monde|mondial|e|championnat|duels?|classés?|pièces|ligue|récompense|quotidien|partie|déconnexion|connexion|vérification|paiement|achat|acheter|stock|reçu|règles|règle|tournoi|spectateur|défi)\b/i;

for (const f of process.argv.slice(2)) {
  if (!fs.existsSync(f)) {
    console.log("missing " + f);
    continue;
  }
  console.log("===== " + f);
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((l, i) => {
    if (/^\s*import /.test(l)) return;
    const matches =
      l.match(
        /"([^"\\]*[A-Za-zÀ-ü' ]{3,}[^"\\]*)"/g
      ) || [];
    for (const raw of matches) {
      const txt = raw.slice(1, -1);
      if (
        frWords.test(txt) &&
        !/^(https?:|\/|api\/|#[0-9a-f]|from |rgba|linear|radial)/i.test(txt) &&
        !/[A-Za-z]+-[A-Za-z]+/.test(txt.replace(/text-|bg-|border-|hover:|group-hover:|font-|rounded-|shadow-/g, ""))
      ) {
        console.log(i + 1 + ": " + txt.slice(0, 130));
      }
    }
    // JSX text nodes
    const jsx = l.match(/>([^<>{}]*[A-Za-zÀ-ü]{3,}[^<>{}]*)</g) || [];
    for (const j of jsx) {
      const txt = j.replace(/^>|<$/g, "").trim();
      if (txt && frWords.test(txt)) console.log(i + 1 + ": " + txt.slice(0, 130));
    }
  });
}
