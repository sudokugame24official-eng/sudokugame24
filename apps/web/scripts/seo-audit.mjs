#!/usr/bin/env node
/**
 * P1-R: SEO audit against RENDERED pages.
 *
 * Fetches every public route from a RUNNING web server (WEB_URL, default
 * http://localhost:3000), parses the served HTML and reports:
 *   route, status, title, description, canonical, hreflang, JSON-LD types,
 *   H1 count, word count, indexable.
 *
 * Usage: node scripts/seo-audit.mjs [baseUrl]
 * Output: console table + apps/web/seo-audit-result.json
 */

const BASE = process.argv[2] || process.env.WEB_URL || "http://localhost:3000";

const ROUTES = [
  // [path, locale]
  ...["en", "fr"].flatMap((l) => [
    [`/${l}`, "home"],
    [`/${l}/play`, "play"],
    [`/${l}/sudoku`, "sudoku hub"],
    [`/${l}/sudoku/easy`, "sudoku easy"],
    [`/${l}/sudoku/medium`, "sudoku medium"],
    [`/${l}/sudoku/hard`, "sudoku hard"],
    [`/${l}/sudoku/expert`, "sudoku expert"],
    [`/${l}/sudoku/extreme`, "sudoku extreme"],
    [`/${l}/daily`, "daily"],
    [`/${l}/duel`, "duel"],
    [`/${l}/leaderboard`, "leaderboard"],
    [`/${l}/learn`, "learn hub"],
    [`/${l}/forum`, "forum"],
    [`/${l}/questions`, "qa"],
    [`/${l}/shop`, "shop"],
    [`/${l}/about`, "about"],
    [`/${l}/contact`, "contact"],
    [`/${l}/faq`, "faq"],
    [`/${l}/help`, "help"],
    [`/${l}/auth`, "auth (expected noindex)"],
  ]),
];

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

async function auditRoute(path, label) {
  const url = `${BASE}${path}`;
  const result = {
    route: path,
    label,
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
    result.description = match1(html, /<meta\s+name="description"\s+content="([^"]*)"/i)
      || match1(html, /<meta\s+content="([^"]*)"\s+name="description"/i);
    result.canonical = match1(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);

    result.hreflang = (html.match(/<link\s+rel="alternate"\s+hreflang=/gi) || []).length;

    const ldBlocks = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
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

    const robots = match1(html, /<meta\s+name="robots"\s+content="([^"]*)"/i)
      || match1(html, /<meta\s+content="([^"]*)"\s+name="robots"/i);
    const isNoindex = /noindex/i.test(robots);
    result.indexable = res.status === 200 && !isNoindex && result.h1Count >= 1 && result.title.length > 10;
  } catch (e) {
    result.error = e.message;
  }
  return result;
}

async function main() {
  console.log(`SEO audit against ${BASE}\n`);
  const results = [];
  for (const [path, label] of ROUTES) {
    results.push(await auditRoute(path, label));
  }

  const width = 34;
  const line = (r) =>
    `${(r.label || r.route).padEnd(width)} ${String(r.status).padEnd(6)} ${r.indexable ? "OK " : "!! "} h1:${r.h1Count} w:${String(r.wordCount).padEnd(6)} ld:[${r.jsonld.join(",") || "-"}] ${r.canonical ? "canon✓" : "canon✗"} ${r.hreflang ? `href(${r.hreflang})` : "href✗"} ${r.error}`;

  for (const r of results) console.log(line(r));

  const ready = results.filter((r) => r.indexable).length;
  console.log(`\n${ready}/${results.length} routes indexable (200 + title + H1 + not noindex)`);

  // Machine-readable output for the fix loop + docs
  const fs = await import("node:fs");
  fs.writeFileSync(
    new URL("../seo-audit-result.json", import.meta.url),
    JSON.stringify({ baseUrl: BASE, auditedAt: new Date().toISOString(), results }, null, 2),
  );
  console.log("wrote apps/web/seo-audit-result.json");
}

main();
