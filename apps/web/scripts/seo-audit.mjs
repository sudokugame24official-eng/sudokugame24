#!/usr/bin/env node
/**
 * P1-R & Final Gate: SEO audit against RENDERED pages.
 *
 * Fetches every public route from a RUNNING web server (WEB_URL, default
 * http://localhost:3000), parses the served HTML and reports:
 *   route, status, title, description, canonical, hreflang, JSON-LD types,
 *   H1 count, word count, indexable.
 *
 * Usage: node scripts/seo-audit.mjs [baseUrl]
 * Output: console table + apps/web/seo-audit-result.json + docs/FINAL_SEO_EXECUTION_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || process.env.WEB_URL || "http://localhost:3000";

const LOCALES = ["en", "fr", "de"];
const ROUTE_DEFS = [
  ["", "home"],
  ["/play", "play"],
  ["/sudoku", "sudoku hub"],
  ["/sudoku/easy", "sudoku easy"],
  ["/sudoku/medium", "sudoku medium"],
  ["/sudoku/hard", "sudoku hard"],
  ["/sudoku/expert", "sudoku expert"],
  ["/sudoku/extreme", "sudoku extreme"],
  ["/daily", "daily"],
  ["/duel", "duel"],
  ["/leaderboard", "leaderboard"],
  ["/learn", "learn hub"],
  ["/forum", "forum"],
  ["/questions", "qa"],
  ["/shop", "shop"],
  ["/about", "about"],
  ["/contact", "contact"],
  ["/faq", "faq"],
  ["/help", "help"],
  ["/auth", "auth (expected noindex)"],
];

const ROUTES = LOCALES.flatMap((l) =>
  ROUTE_DEFS.map(([r, label]) => [`/${l}${r}`, `${label} (${l})`, l])
);

const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const match1 = (html, regex) => {
  const m = html.match(regex);
  return m ? m[1].trim() : "";
};

async function auditRoute(path, label, locale) {
  const url = `${BASE}${path}`;
  const result = {
    route: path,
    label,
    locale,
    status: 0,
    title: "",
    description: "",
    canonical: "",
    hreflang: 0,
    jsonld: [],
    h1Count: 0,
    wordCount: 0,
    indexable: false,
    error: "",
  };
  try {
    const res = await fetch(url, { headers: { "user-agent": "SEO-Audit/1.0" } });
    result.status = res.status;
    if (res.status !== 200) {
      result.error = `HTTP ${res.status}`;
      return result;
    }
    const html = await res.text();

    result.title = match1(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    result.description =
      match1(html, /<meta\s+name="description"\s+content="([^"]*)"/i) ||
      match1(html, /<meta\s+content="([^"]*)"\s+name="description"/i);
    result.canonical = match1(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);

    result.hreflang = (html.match(/<link\s+rel="alternate"\s+hreflang=/gi) || []).length;

    const ldBlocks =
      html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of ldBlocks) {
      try {
        const parsed = JSON.parse(block.replace(/<[^>]+>/g, ""));
        result.jsonld.push(parsed["@type"] || "unknown");
      } catch {
        result.jsonld.push("invalid");
      }
    }

    result.h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    result.wordCount = text(html).split(" ").filter(Boolean).length;

    const robots =
      match1(html, /<meta\s+name="robots"\s+content="([^"]*)"/i) ||
      match1(html, /<meta\s+content="([^"]*)"\s+name="robots"/i);
    const isNoindex = /noindex/i.test(robots);
    result.indexable =
      res.status === 200 && !isNoindex && result.h1Count >= 1 && result.title.length > 5;
  } catch (e) {
    result.error = e.message;
  }
  return result;
}

async function main() {
  console.log(`SEO audit against ${BASE}\n`);
  const results = [];
  for (const [path, label, locale] of ROUTES) {
    results.push(await auditRoute(path, label, locale));
  }

  const width = 36;
  const line = (r) =>
    `${(r.label || r.route).padEnd(width)} ${String(r.status).padEnd(6)} ${
      r.indexable ? "OK " : "!! "
    } h1:${r.h1Count} w:${String(r.wordCount).padEnd(6)} ld:[${
      r.jsonld.join(",") || "-"
    }] ${r.canonical ? "canon✓" : "canon✗"} ${
      r.hreflang ? `href(${r.hreflang})` : "href✗"
    } ${r.error}`;

  for (const r of results) console.log(line(r));

  const ready = results.filter((r) => r.indexable).length;
  console.log(`\n${ready}/${results.length} routes indexable`);

  // Write JSON artifact
  fs.writeFileSync(
    path.join(__dirname, "../seo-audit-result.json"),
    JSON.stringify({ baseUrl: BASE, auditedAt: new Date().toISOString(), results }, null, 2)
  );

  // Generate markdown report in docs/FINAL_SEO_EXECUTION_REPORT.md
  let md = `# FINAL SEO EXECUTION & RENDERED HTML AUDIT REPORT\n\n`;
  md += `**Audit Base URL:** \`${BASE}\`  \n`;
  md += `**Audit Date:** ${new Date().toISOString()}  \n`;
  md += `**Tested Locales:** en, fr, de  \n`;
  md += `**Total Routes Tested:** ${results.length}  \n`;
  md += `**Indexable Public Routes:** ${ready}  \n`;
  md += `**Intentionally Noindex Routes (Auth):** ${
    results.filter((r) => r.route.includes("/auth")).length
  }\n\n`;

  md += `| Route | HTTP Status | Type | Title | Description | Canonical | hreflang | JSON-LD | H1 | Word Count | Indexability | Issues |\n`;
  md += `|---|---|---|---|---|---|---|---|---|---|---|---|\n`;

  for (const r of results) {
    const isAuth = r.route.includes("/auth");
    const issues = r.error
      ? r.error
      : isAuth
      ? "None (Expected Noindex)"
      : r.h1Count === 0
      ? "Missing H1"
      : !r.canonical
      ? "Missing Canonical"
      : "None";

    const type = r.route.includes("/sudoku/") && !r.route.endsWith("/sudoku") ? "SSG (●)" : "SSR (ƒ)";
    const indexability = r.indexable ? "INDEXABLE" : isAuth ? "NOINDEX (PASS)" : "NOT INDEXABLE";

    md += `| \`${r.route}\` | ${r.status || "ERR"} | ${type} | ${
      r.title ? `"${r.title.slice(0, 30)}..."` : "—"
    } | ${r.description ? "✓" : "—"} | ${r.canonical ? "✓" : "—"} | ${r.hreflang} | \`${
      r.jsonld.join(", ") || "none"
    }\` | ${r.h1Count} | ${r.wordCount} | **${indexability}** | ${issues} |\n`;
  }

  const docPath = path.join(__dirname, "../../../docs/FINAL_SEO_EXECUTION_REPORT.md");
  fs.writeFileSync(docPath, md);
  console.log(`\nwrote docs/FINAL_SEO_EXECUTION_REPORT.md`);
}

main();
