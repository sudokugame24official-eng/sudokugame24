/* ULTIMATE BLACK-BOX UAT — Batch1 v2 (robust). Output: test-results/uat-batch1.json */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = "http://localhost:3000";
const results = [];
function rec(phase, persona, page, action, expected, actual, status, evidence) {
  results.push({ phase, persona, page, action, expected, actual: String(actual), status, evidence });
  console.log(`${status === "PASS" ? "OK " : status === "FAIL" ? "!! " : "~~ "}[${status}] ${phase}|${persona}|${page}|${action} -> ${String(actual).slice(0, 110)}`);
}
async function textOf(p) { await p.waitForTimeout(1000); return p.evaluate(() => document.body.innerText); }
async function statusOf(url) { try { const r = await fetch(url, { redirect: "manual" }); return { status: r.status, loc: r.headers.get("location") || "" }; } catch (e) { return { status: 0, loc: "" }; } }
function save() { fs.writeFileSync(path.join(__dirname, "..", "test-results", "uat-batch1.json"), JSON.stringify(results, null, 2)); }
process.on("unhandledRejection", (e) => { console.log("UNHANDLED:", String(e)); });
process.on("uncaughtException", (e) => { console.log("UNCAUGHT:", String(e)); save(); });

(async () => {
  const browser = await chromium.launch({ headless: true });
  /* PART A */
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    for (const seg of ["es", "it"]) {
      const r = await statusOf(`${BASE}/${seg}/play`);
      rec("PART-A", "SEO bot", `/${seg}/play`, "Legacy locale route", "307/308 -> /en/play",
        `${r.status} -> ${r.loc}`, (r.status === 307 || r.status === 308) && /^\/en/.test(r.loc) ? "PASS" : "FAIL", "");
    }
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const btn = page.locator("button[aria-label^='Language']");
    if (await btn.count()) {
      await btn.first().click();
      await page.waitForTimeout(600);
      const options = await page.locator("[role='listbox'] [role='option']").allInnerTexts();
      const all = options.join("|");
      const only3 = /English/i.test(all) && /Français/i.test(all) && /Deutsch/i.test(all);
      const noESIT = !/Español|Italiano|Spanish|Italian/i.test(all);
      rec("PART-A", "Guest", "/en Header", "Open language selector", "only English/Français/Deutsch",
        all.slice(0, 100), only3 && noESIT ? "PASS" : "FAIL", "");
    } else {
      rec("PART-A", "Guest", "/en Header", "Find language selector", "aria-label 'Language…' button", "not found", "FAIL", "");
    }
    const sigs = [
      { loc: "en", have: ["Play Sudoku"], no: ["Jouez au Sudoku", "Spielen Sie Sudoku"] },
      { loc: "fr", have: ["Jouer au Sudoku"], no: ["Play Sudoku. Improve", "Spielen Sie Sudoku"] },
      { loc: "de", have: ["Sudoku spielen"], no: ["Jouez au Sudoku", "Play Sudoku. Improve"] },
    ];
    for (const s of sigs) {
      await page.goto(`${BASE}/${s.loc}`, { waitUntil: "domcontentloaded" });
      const t = await textOf(page);
      const okH = s.have.every((m) => t.toLowerCase().includes(m.toLowerCase()));
      const okN = s.no.every((m) => !t.includes(m));
      rec("PART-A", "Guest", "/(home)", `Load /${s.loc} hero`, `has ${s.have}; none of ${s.no}`,
        `have=${okH} none=${okN}`, okH && okN ? "PASS" : "FAIL", "");
    }
    await page.goto(`${BASE}/en/shop`, { waitUntil: "domcontentloaded" });
    let t2 = await textOf(page);
    rec("PART-A", "Guest", "/en/shop", "Shop UI language", "English, no French leak",
      /Boutique|Veuillez vous connecter|Plus Populaire|Pièces Gratuites/.test(t2) ? "FRENCH LEAK" : "english",
      !/Boutique|Veuillez vous connecter|Plus Populaire|Pièces Gratuites/.test(t2) && /Shop|Perks|Coins/i.test(t2) ? "PASS" : "FAIL", "");
    await page.goto(`${BASE}/de/shop`, { waitUntil: "domcontentloaded" });
    t2 = await textOf(page);
    rec("PART-A", "Guest", "/de/shop", "Shop UI language", "German, no FR leak",
      /Boutique|Veuillez vous connecter|Plus Populaire/.test(t2) ? "FR LEAK" : "german",
      !/Boutique|Veuillez vous connecter|Plus Populaire/.test(t2) && /Shop|Vorteile|Münzen/i.test(t2) ? "PASS" : "FAIL", "");
    for (const [loc] of [["en"], ["de"]]) {
      await page.goto(`${BASE}/${loc}/auth`, { waitUntil: "domcontentloaded" });
      const t3 = await textOf(page);
      const bad = /Rebonjour|Adresse e-mail|Nom d'utilisateur|Mot de passe|Se connecter avec Google/.test(t3);
      rec("PART-A", "Guest", `/${loc}/auth`, "Auth UI language", "localized, zero FR leakage",
        bad ? "FRENCH LEAK" : "clean", bad ? "FAIL" : "PASS", "");
    }
    await page.goto(`${BASE}/en/daily`, { waitUntil: "domcontentloaded" });
    const td = await textOf(page);
    rec("PART-A", "Guest", "/en/daily", "How It Works section", "'How It Works' + no {t( literal",
      td.includes("{t(") ? "literal rendered!" : (/How It Works/i.test(td) ? "rendered" : "section missing"),
      !td.includes("{t(") && /How It Works/i.test(td) ? "PASS" : "FAIL", "");
    save(); await ctx.close();
  } catch (e) { console.log("PARTA ERR:", String(e)); save(); }
  /* PHASE 1 — GUEST */
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    for (const route of ["", "/play", "/daily", "/duel", "/leaderboard", "/learn", "/forum", "/questions", "/help", "/faq", "/about", "/contact", "/shop", "/auth", "/privacy", "/terms"]) {
      let st = 0;
      try { const res = await page.goto(`${BASE}/en${route}`, { waitUntil: "domcontentloaded", timeout: 30000 }); st = res ? res.status() : 0; } catch (e) { st = 0; }
      const len = (await page.content()).length;
      const body = await textOf(page);
      const nf = route !== "" && /This page could not be found/i.test(body);
      rec("PHASE-1", "Guest", `/en${route}`, "Direct navigation", "HTTP200+content",
        `HTTP ${st}, DOM ${len}${nf ? " 404!" : ""}`, st === 200 && len > 3000 && !nf ? "PASS" : "FAIL", "");
    }
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    for (const c of ["/play", "/daily", "/duel", "/leaderboard"]) {
      const link = page.locator(`header a[href*='${c}']`).last();
      const vis = (await link.count()) > 0 && (await link.isVisible().catch(() => false));
      let clicked = "";
      if (vis) {
        try {
          await Promise.all([page.waitForURL((u) => u.pathname.includes(c), { timeout: 8000 }).catch(() => {}), link.click({ timeout: 4000 })]);
          await page.waitForTimeout(900);
          clicked = page.url();
        } catch (e) { clicked = "click-failed"; }
        await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" }).catch(() => {});
        await page.waitForTimeout(600);
      }
      rec("PHASE-1", "Guest", "/en header", `Click nav '${c}'`, "navigates to target",
        vis ? clicked : "not visible",
        typeof clicked === "string" && clicked.includes(c) ? "PASS" : vis ? "PARTIAL" : "FAIL", "");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const mobVisible = await page.locator("nav.md\\:hidden").first().isVisible().catch(() => false);
    rec("PHASE-1", "Guest mobile", "/en 390x844", "Bottom mobile nav renders", "visible",
      mobVisible ? "visible" : "hidden", mobVisible ? "PASS" : "FAIL", "");
    save(); await ctx.close();
  } catch (e) { console.log("P1 ERR:", String(e)); save(); }
  /* PHASE 2 — GAME DISCOVERY (guest) */
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/en/play`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    let grids = await page.locator("div[class*='grid-cols-9']").count();
    if (!grids) {
      const cta = page.locator("text=/^(Easy|Facile|Leicht)\\b/i").first();
      if ((await cta.count()) > 0) {
        await cta.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(3000);
        grids = await page.locator("div[class*='grid-cols-9']").count();
      } else {
        rec("PHASE-2", "Guest", "/en/play", "Find difficulty card 'Easy'", "clickable card visible",
          "not found", "FAIL", "");
      }
    }
    rec("PHASE-2", "Guest", "/en/play", "Enter classic mode, 9x9 grid appears", "grids>=1",
      `grids=${grids}`, grids > 0 ? "PASS" : "FAIL", "");
    // interact: click first empty cell & press a digit
    if (grids) {
      const cell = page.locator("div[class*='grid-cols-9'] button").nth(12);
      try {
        await cell.click({ timeout: 4000 });
        await page.keyboard.press("5");
        await page.waitForTimeout(400);
        rec("PHASE-2", "Guest", "/en/play", "Type digit into empty cell", "cell accepts input",
          "input sent", "PASS");
      } catch (e) {
        rec("PHASE-2", "Guest", "/en/play", "Type digit into empty cell", "cell clickable",
          String(e).slice(0, 80), "PARTIAL", "");
      }
    }
    await page.goto(`${BASE}/en/daily`, { waitUntil: "domcontentloaded" });
    const dt = await textOf(page);
    rec("PHASE-2", "Guest", "/en/daily", "Daily reachable with CTA/gate", "CTA or login gate",
      /play|start|sign in|log in|streak/i.test(dt) ? "CTA present" : "none",
      /play|start|sign in|log in|streak/i.test(dt) ? "PASS" : "FAIL", "");
    await page.goto(`${BASE}/en/duel`, { waitUntil: "domcontentloaded" });
    const du = await textOf(page);
    rec("PHASE-2", "Guest", "/en/duel", "Duel hub reachable", "content>400 chars",
      `${du.length} chars`, du.length > 400 ? "PASS" : "FAIL", "");
    await page.goto(`${BASE}/en/leaderboard`, { waitUntil: "domcontentloaded" });
    const lb = await textOf(page);
    rec("PHASE-2", "Guest", "/en/leaderboard", "Leaderboard renders", ">500 chars",
      `${lb.length} chars`, lb.length > 500 ? "PASS" : "FAIL", "");
    const allTxt = dt + lb;
    const future = /tournament\b|spectator mode\b|puzzle challenge\b/i.test(allTxt);
    rec("PHASE-2", "Guest", "daily+leaderboard", "Future modes hidden", "not advertised",
      future ? "advertised" : "hidden", future ? "FAIL" : "PASS", "");
    save(); await ctx.close();
  } catch (e) { console.log("P2 ERR:", String(e)); save(); }
  /* PHASE 3 — AUTH FLOW */
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const email = `uat${Date.now()}@uatmail.dev`;
    const pass = "UatPass!2026x";
    const uname = `UATUser${Date.now().toString().slice(-6)}`;

    await page.goto(`${BASE}/en/auth`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const toggle = page.locator("div.text-center button, form ~ div button").last();
    await toggle.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(700);
    const txtFields = await page.locator("input[type='text']").count();
    if (txtFields > 0) await page.fill("input[type='text']", uname).catch(() => {});
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", pass);
    let nav = false;
    try {
      await Promise.all([
        page.waitForURL("**/profile**", { timeout: 20000 }),
        page.locator("form button").first().click(),
      ]);
      nav = true;
    } catch (e) { nav = false; }
    await page.waitForTimeout(1500);
    rec("PHASE-3", "New user", "/en/auth", `Register ${email}`, "redirect to /profile",
      `${page.url()} (${nav ? "navigated" : "no-nav"})`,
      /profile|admin/.test(page.url()) ? "PASS" : "FAIL", "");
    if (!/profile|admin/.test(page.url())) console.log("REG-CTX:", (await textOf(page)).slice(0, 250));

    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);
    const still = page.url().includes("/profile") || /coins|balance|stat/i.test(await textOf(page));
    rec("PHASE-3", "New user", "/en/profile", "Reload keeps session", "still authed",
      still ? "persists" : "lost", still ? "PASS" : "FAIL", "");

    const logoutBtn = page.locator("button:has-text('Log out'), a:has-text('Log out'), button:has-text('LogOut')").first();
    if ((await logoutBtn.count()) > 0 && (await logoutBtn.isVisible().catch(() => false))) {
      await logoutBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      rec("PHASE-3", "New user", "header", "Logout", "guest state restored",
        page.url(), !page.url().includes("/admin") && !page.url().includes("/profile") ? "PASS" : "PARTIAL", "");
    } else {
      rec("PHASE-3", "New user", "header", "Find logout control", "visible control", "not found", "PARTIAL", "");
    }

    // wrong password
    await page.goto(`${BASE}/en/auth`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", "WrongPass!999");
    await page.locator("form button").first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const errShown = await page.locator(".text-red-500, [class*='error']").first().isVisible().catch(() => false);
    rec("PHASE-3", "Existing user", "/en/auth", "Login wrong password", "visible error",
      errShown ? "error shown" : "none", errShown ? "PASS" : "FAIL", "");

    // duplicate
    await page.goto(`${BASE}/en/auth`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.locator("div.text-center button, form ~ div button").last().click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(600);
    if ((await page.locator("input[type='text']").count()) > 0) await page.fill("input[type='text']", "DupTest").catch(() => {});
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", pass);
    await page.locator("form button").first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2200);
    const dupErr = await page.locator("text=/already|exists|taken|duplicate/i").first().isVisible().catch(() => false)
      || /already|exists|taken|duplicate/i.test(await textOf(page));
    rec("PHASE-3", "Visitor", "/en/auth", "Duplicate registration", "clear error",
      dupErr ? "duplicate error shown" : "unclear", dupErr ? "PASS" : "PARTIAL", "");

    // empty fields
    await page.goto(`${BASE}/en/auth`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.fill("input[type='email']", "");
    await page.fill("input[type='password']", "");
    await page.locator("form button").first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);
    rec("PHASE-3", "Visitor", "/en/auth", "Submit empty form", "stays on page",
      page.url(), page.url().includes("/auth") ? "PASS" : "FAIL", "");
    save(); await ctx.close();
  } catch (e) { console.log("P3 ERR:", String(e)); save(); }

  await browser.close();
  save();
  const counts = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  console.log("\n=== BATCH1 SUMMARY ===", JSON.stringify(counts));
})();




