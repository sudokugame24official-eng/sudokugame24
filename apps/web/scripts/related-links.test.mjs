import { test } from "node:test";
import assert from "node:assert/strict";
import { extractContextualLinks } from "../lib/related-links.ts";

test("detects techniques in forum text and links to Academy", () => {
  const links = extractContextualLinks(
    "I'm stuck on this hard sudoku grid, the hint says look for an X-Wing but I don't get it. Also what is a naked pair?",
    "en",
  );
  const hrefs = links.map((l) => l.href);
  assert.ok(hrefs.includes("/en/learn/x-wing"), "x-wing lesson expected, got " + JSON.stringify(hrefs));
  assert.ok(hrefs.includes("/en/learn/naked-pair"));
  assert.ok(hrefs.includes("/en/sudoku/hard"));
});

test("French text maps to French labels and slugs", () => {
  const links = extractContextualLinks(
    "Je bloque sur les grilles diaboliques. La technique X-Wing est indispensable mais je n'arrive pas à l'appliquer.",
    "fr",
  );
  const xwing = links.find((l) => l.href === "/fr/learn/x-wing");
  assert.ok(xwing, "fr x-wing link expected");
  assert.equal(xwing.label, "Leçon X-Wing");
  assert.ok(links.some((l) => l.href === "/fr/sudoku/extreme"), "diabolique -> extreme");
});

test("most-mentioned topic ranks first", () => {
  const links = extractContextualLinks("duel duel duel daily", "en");
  assert.equal(links[0].href, "/en/duel");
});

test("caps at 6 links (no link spam)", () => {
  const links = extractContextualLinks(
    "x-wing swordfish naked pair hidden single locked candidates daily duel leaderboard forum easy medium hard expert",
    "en",
  );
  assert.ok(links.length <= 6);
});

test("no links from unrelated text", () => {
  assert.deepEqual(extractContextualLinks("hello world", "en"), []);
  assert.deepEqual(extractContextualLinks("", "en"), []);
});

test("regex special characters in terms do not crash", () => {
  const links = extractContextualLinks("qu'est-ce qu'un sudoku 1v1?", "en");
  assert.ok(Array.isArray(links));
});
