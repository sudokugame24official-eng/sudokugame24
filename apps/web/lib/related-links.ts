/**
 * P1-U: semantic content graph.
 *
 * Extracts contextual internal links from user-generated text (forum topics,
 * Q&A questions) by detecting technique names, game concepts and difficulty
 * mentions. Links go BOTH ways: UGC pages point to Academy lessons and game
 * pages; this is the "help the user" mesh required by the directive — no
 * keyword stuffing, max 6 links, only detections with real targets.
 *
 * Pure module: no Next imports, testable with node:test.
 */

export interface ContextualLink {
  href: string;
  label: string;
  matchedTerms: string[];
}

interface Rule {
  slug: string;
  terms: string[];
  label: { en: string; fr: string };
  kind: "technique" | "game" | "level" | "community";
}

const RULES: Rule[] = [
  // Techniques -> Academy lessons (seeded slugs)
  { slug: "/learn/naked-single", terms: ["naked single", "single nu", "sole candidat"], label: { en: "Naked Single lesson", fr: "Leçon Singleton nu" }, kind: "technique" },
  { slug: "/learn/hidden-single", terms: ["hidden single", "singleton caché", "caché"], label: { en: "Hidden Single lesson", fr: "Leçon Singleton caché" }, kind: "technique" },
  { slug: "/learn/naked-pair", terms: ["naked pair", "paire nue", "paire cachée", "hidden pair"], label: { en: "Naked & hidden pairs lesson", fr: "Leçon Paires nues et cachées" }, kind: "technique" },
  { slug: "/learn/locked-candidates", terms: ["locked candidates", "pointing pair", "claiming pair", "candidats verrouillés", "paire pointante", "box-line"], label: { en: "Locked Candidates lesson", fr: "Leçon Candidats verrouillés" }, kind: "technique" },
  { slug: "/learn/x-wing", terms: ["x-wing", "x wing", "aile de x"], label: { en: "X-Wing lesson", fr: "Leçon X-Wing" }, kind: "technique" },
  { slug: "/learn/swordfish", terms: ["swordfish", "espadon", "poisson"], label: { en: "Swordfish lesson", fr: "Leçon Swordfish" }, kind: "technique" },
  // Concepts -> Academy articles
  { slug: "/learn/what-is-sudoku", terms: ["what is sudoku", "qu'est-ce qu'un sudoku", "règles", "rules"], label: { en: "What is Sudoku?", fr: "Qu'est-ce que le Sudoku ?" }, kind: "technique" },
  { slug: "/learn/how-to-play-sudoku", terms: ["how to play", "comment jouer", "beginner", "débutant", "debutant"], label: { en: "How to play Sudoku", fr: "Comment jouer au Sudoku" }, kind: "technique" },
  // Game modes
  { slug: "/daily", terms: ["daily", "défi du jour", "defi du jour", "streak", "série"], label: { en: "Daily Challenge", fr: "Défi du jour" }, kind: "game" },
  { slug: "/duel", terms: ["duel", "pvp", "1v1", "versus"], label: { en: "Play duels", fr: "Jouer en duel" }, kind: "game" },
  { slug: "/leaderboard", terms: ["leaderboard", "classement", "ranking", "rating", "elo"], label: { en: "Leaderboard", fr: "Classement" }, kind: "game" },
  { slug: "/questions", terms: ["question", "help", "aide", "stuck", "bloqué", "bloque"], label: { en: "Ask the community", fr: "Demander à la communauté" }, kind: "community" },
  { slug: "/forum", terms: ["forum", "topic", "discussion"], label: { en: "Community forum", fr: "Forum de la communauté" }, kind: "community" },
  // Difficulty pages
  { slug: "/sudoku/easy", terms: ["easy sudoku", "sudoku facile", "facile"], label: { en: "Easy Sudoku", fr: "Sudoku facile" }, kind: "level" },
  { slug: "/sudoku/medium", terms: ["medium sudoku", "sudoku moyen", "moyen"], label: { en: "Medium Sudoku", fr: "Sudoku moyen" }, kind: "level" },
  { slug: "/sudoku/hard", terms: ["hard sudoku", "sudoku difficile", "difficile"], label: { en: "Hard Sudoku", fr: "Sudoku difficile" }, kind: "level" },
  { slug: "/sudoku/expert", terms: ["expert sudoku", "sudoku expert"], label: { en: "Expert Sudoku", fr: "Sudoku expert" }, kind: "level" },
  { slug: "/sudoku/extreme", terms: ["extreme sudoku", "sudoku extrême", "diabolical", "diabolique"], label: { en: "Extreme Sudoku", fr: "Sudoku extrême" }, kind: "level" },
];

const MAX_LINKS = 6;

export function extractContextualLinks(text: string, locale: string): ContextualLink[] {
  if (!text) return [];
  const haystack = text.toLowerCase();

  const hits: (ContextualLink & { score: number })[] = [];
  for (const rule of RULES) {
    const matchedTerms: string[] = [];
    let occurrences = 0;
    for (const term of rule.terms) {
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const count = (haystack.match(re) || []).length;
      if (count > 0) {
        matchedTerms.push(term);
        occurrences += count;
      }
    }
    if (matchedTerms.length > 0) {
      hits.push({
        href: `/${locale}${rule.slug}`,
        label: locale === "fr" ? rule.label.fr : rule.label.en,
        matchedTerms,
        score: occurrences + (rule.kind === "technique" ? 3 : rule.kind === "level" ? 2 : 1),
      });
    }
  }

  // Most-mentioned first; techniques weigh more than generic game links
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, MAX_LINKS).map(({ href, label, matchedTerms }) => ({ href, label, matchedTerms }));
}
