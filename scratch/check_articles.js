import { ACADEMY_ARTICLES, ARTICLE_SLUG_ALIASES } from "../apps/web/lib/academy-articles";

const slugs = [
  "rules", "how-to-play", "candidates", "naked-singles", "hidden-singles",
  "naked-pairs", "hidden-pairs", "naked-triples", "pointing-pairs", "box-line",
  "x-wing", "swordfish", "xy-wing", "unique-rectangle", "chains"
];

console.log("Checking slugs in ACADEMY_ARTICLES...");
slugs.forEach(s => {
  const norm = ARTICLE_SLUG_ALIASES[s] || s;
  const article = ACADEMY_ARTICLES[norm];
  if (!article) {
    console.error(`MISSING ARTICLE: ${s} (norm: ${norm})`);
  } else {
    ["fr", "en", "de"].forEach(lang => {
      if (!article.translations[lang] || !article.translations[lang].title) {
        console.error(`MISSING TRANSLATION for ${s} in ${lang}`);
      }
    });
  }
});
console.log("Check complete.");
