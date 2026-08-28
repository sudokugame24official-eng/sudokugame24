// Dev-only: dump likely user-visible string literals from a TSX file.
// Usage: node dump-strings.cjs <file...>
const fs = require("fs");
const SKIP =
  /^(rgba|#|linear|http|api\/|GET|POST|PUT|PATCH|DELETE|Content-Type|application|Bearer|loading|idle|success|error|EASY|MEDIUM|HARD|EXPERT|MASTER|DAILY|SOLO|TIME_OUT|ERRORS|VICTORY|NORMAL|LEADERBOARD)/;
for (const f of process.argv.slice(2)) {
  console.log("\n===== " + f);
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((l, i) => {
    const m = l.match(/"([A-Z][^"{}]{3,140})"/g) || [];
    for (const q of m) {
      const txt = q.slice(1, -1);
      if (SKIP.test(txt)) continue;
      if (/^[a-zA-Z0-9_-]+$/.test(txt)) continue; // single token identifiers
      console.log(i + 1 + " | " + txt);
    }
  });
}
