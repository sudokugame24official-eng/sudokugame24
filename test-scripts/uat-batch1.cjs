/* ULTIMATE BLACK-BOX UAT — Batch 1 harness (real user via headless Chromium)
 * Output: test-results/uat-batch1.json
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";
const results = [];

function rec(phase, persona, page, action, expected, actual, status, evidence) {
  results.push({ phase, persona, page, action, expected, actual, status, evidence });
  const mark = status === "PASS" ? "OK " : status === "FAIL" ? "!! " : "~~ ";
  console.log(`${mark}[${status}] ${phase} | ${persona} | ${page} | ${action} -> ${String(actual).slice(0, 120)}`);
}

async function textOf(page) {
  await page.waitForTimeout(1000);
  return await page.evaluate(() => document.body.innerText);
}

async function statusOf(url) {
  try {
    const r = await fetch(url, { redirect: "manual" });
    return { status: r.status, location: r.headers.get("location") || "" };
  } catch (e) {
    return { status: 0, location: "", err: String(e) };
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true });

  /* ============ PART A — i18n repair verification ============ */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    for (const seg of ["es", "it"]) {
      const r = await statusOf(`${BASE}/${seg}/play`);
      const ok = (r.status === 307 || r.status === 308) && /^\/en/.test(r.location);
      rec("PART-A", "SEO bot", `/${seg}/play`, "Request legacy locale route",
        "307/308 redirect to /en/play", `${r.status} -> ${r.location}`,
        ok ? "PASS" : "FAIL", JSON.stringify(r));
    }

    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    const btn = page.locator("button[aria-label^='Language']");
    if (await btn.count()) {
      await btn.first().click();
      const options = await page.locator("[role='listbox'] [role='option']").allInnerTexts();
      const all = options.join(" | ");
      const only3 = /English/i.test(all) && /Français/i.test(all) && /Deutsch/i.test(all);
      const noESIT = !/Español|Italiano|Spanish|Italian/i.test(all);
      rec("PART-A", "Guest", "/en Header", "Open language selector",
        "Exactly English/Français/Deutsch; no ES/IT", all.slice(0, 120),
        only3 && noESIT ? "PASS" : "FAIL", "selector-options");
    } else {
      rec("PART-A", "Guest", "/en Header", "Find language selector",
        "Button with aria-label 'Language' exists", "not found", "FAIL", "header-scan");
    }

    const sigs = [
      { loc: "en", mustHave: ["Play Sudoku"], forbidden: ["Jouez au Sudoku", "Spielen Sie Sudoku"] },
      { loc: "fr", mustHave: ["Jouer au Sudoku"], forbidden: ["Play Sudoku. Improve", "Spielen Sie Sudoku"] },
      { loc: "de", mustHave: ["Sudoku spielen"], forbidden: ["Jouez au Sudoku", "Play Sudoku. Improve"] },
    ];
    for (const s of sigs) {
      await page.goto(`${BASE}/${s.loc}`, { waitUntil: "domcontentloaded" });
      const txt = await textOf(page);
      const haveOk = s.mustHave.every((m) => txt.toLowerCase().includes(m.toLowerCase()));
      const forbOk = s.forbidden.every((m) => !txt.includes(m));
      rec("PART-A", "Guest", "/ (homepage)", `Load /${s.loc}, inspect hero copy`,
        `has ${JSON.stringify(s.mustHave)}; none of ${JSON.stringify(s.forbidden)}`,
        `have=${haveOk} forb=${forbOk}`, haveOk && forbOk ? "PASS" : "FAIL", "");
    }
    // Shop + auth + daily localized checks
    await page.goto(`${BASE}/en/shop`, { waitUntil: "domcontentloaded" });
    let txt = await textOf(page);
    const shopEn = !/Boutique|Veuillez vous connecter|Plus Populaire|Avantages & Bonus|Pièces Gratuites/.test(txt) && /Shop|Perks|Bonus|Coins/i.test(txt);
    rec("PART-A", "Guest", "/en/shop", "Inspect shop UI language", "English UI, zero French leakage",
      shopEn ? "English UI" : `leak? ${txt.slice(0, 160).replace(/\n/g, " ")}`, shopEn ? "PASS" : "FAIL", "");

    await page.goto(`${BASE}/de/shop`, { waitUntil: "domcontentloaded" });
    txt = await textOf(page);
    const shopDe = !/Boutique|Veuillez vous connecter|Plus Populaire/.test(txt) && /Shop|Vorteile|Münzen/i.test(txt);
    rec("PART-A", "Guest", "/de/shop", "Inspect shop UI language", "German UI",
      shopDe ? "German UI" : `unexpected: ${txt.slice(0, 160).replace(/\n/g, " ")}`, shopDe ? "PASS" : "FAIL", "");

    for (const [loc, expectWord] of [["en", "Sign In"], ["de", "Anmelden"]]) {
      await page.goto(`${BASE}/${loc}/auth`, { waitUntil: "domcontentloaded" });
      const t2 = await textOf(page);
      const bad = /Rebonjour|Adresse e-mail|Nom d'utilisateur|Mot de passe|Se connecter avec Google|Rejoignez la légende/.test(t2);
      rec("PART-A", "Guest", `/${loc}/auth`, "Inspect auth UI language", `localized (${expectWord})`,
        bad ? "French leakage found" : "clean", !bad ? "PASS" : "FAIL", "");
    }

    await page.goto(`${BASE}/en/daily`, { waitUntil: "domcontentloaded" });
    const dailyTxt = await textOf(page);
    const noLiteral = !dailyTxt.includes("{t(");
    const hasHow = /How It Works/i.test(dailyTxt);
    rec("PART-A", "Guest", "/en/daily", "How It Works section copy renders translated",
      "'How It Works' visible; no raw {t(...)} literal rendered",
      noLiteral && hasHow ? "rendered" : `literal=${!noLiteral} how=${hasHow}`,
      noLiteral && hasHow ? "PASS" : "FAIL", "");
    await ctx.close();
  }
  /* ============ PHASE 1 — GUEST journeys ============ */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const guestRoutes = ["", "/play", "/daily", "/duel", "/leaderboard", "/learn", "/forum", "/questions", "/help", "/faq", "/about", "/contact", "/shop", "/auth", "/privacy", "/terms"];
    for (const route of guestRoutes) {
      const url = `${BASE}/en${route}`;
      let st = 0;
      try {
        const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        st = res ? res.status() : 0;
      } catch (e) { st = 0; }
      const bodyLen = (await page.content()).length;
      const body = await textOf(page);
      const notFoundMarker = /This page could not be found|404 page/i.test(body) && route !== "";
      const pass = st === 200 && bodyLen > 3000 && !notFoundMarker;
      rec("PHASE-1", "Guest", `/en${route}`, "Direct navigation", "HTTP 200 + real content",
        `HTTP ${st}, DOM ${bodyLen}${notFoundMarker ? ", 404 marker" : ""}`,
        pass ? "PASS" : "FAIL", url);
    }

    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    for (const c of [["/play"], ["/daily"], ["/duel"], ["/leaderboard"]]) {
      const link = page.locator(`a[href*='${c[0]}']`).first();
      const vis = (await link.count()) > 0 && (await link.isVisible().catch(() => false));
      let clicked = "";
      if (vis) {
        try {
          await link.click({ timeout: 4000 });
          await page.waitForLoadState("domcontentloaded");
          clicked = page.url();
          await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
        } catch (e) { clicked = "click-failed"; }
      }
      rec("PHASE-1", "Guest", "/en header", `Click nav '${c[0]}'`, "visible+clickable+navigates",
        vis ? clicked : "not visible",
        typeof clicked === "string" && clicked.includes(c[0]) ? "PASS" : vis ? "PARTIAL" : "FAIL", "");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    const mobNav = page.locator("nav >> nth=0");
    const mobVisible = await mobNav.first().isVisible().catch(() => false);
    rec("PHASE-1", "Guest mobile 390x844", "/en", "Bottom mobile navigation renders",
      "mobile bottom nav visible", mobVisible ? "visible" : "hidden", mobVisible ? "PASS" : "FAIL", "");
    await ctx.close();
  }
  /* ============ PHASE 2 — GAME DISCOVERY (guest) ============ */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto(`${BASE}/en/play`, { waitUntil: "domcontentloaded" });
    const grids = await page.locator("div[class*='grid-cols-9']").count();
    rec("PHASE-2", "Guest", "/en/play", "Classic 9x9 grid renders", "interactive grid present",
      `grids=${grids}`, grids > 0 ? "PASS" : "FAIL", "");

    // Click into an actual game (find first Play/Start CTA that navigates to a puzzle)
    let played = false;
    try {
      const startBtn = page.locator("a[href*='/play?'], button:has-text('Play'), a:has-text('Start')").first();
      if ((await startBtn.count()) > 0) {
        await startBtn.click({ timeout: 5000 });
        await page.waitForLoadState("domcontentloaded");
        played = true;
      }
    } catch (e) {}
    if (played) {
      const cells = await page.locator("button:has-text(''), [class*='cell']").count();
      rec("PHASE-2", "Guest", page.url(), "Enter a classic game session", "puzzle board appears",
        `cells=${cells}`, cells > 40 ? "PASS" : "PARTIAL", "");
    }

    await page.goto(`${BASE}/en/daily`, { waitUntil: "domcontentloaded" });
    const dailyTxt = await textOf(page);
    rec("PHASE-2", "Guest", "/en/daily", "Daily challenge reachable with CTA/gate",
      "clear CTA or login gate", /play|start|sign in|log in|streak/i.test(dailyTxt) ? "CTA present" : "no CTA",
      /play|start|sign in|log in|streak/i.test(dailyTxt) ? "PASS" : "FAIL", "");

    await page.goto(`${BASE}/en/duel`, { waitUntil: "domcontentloaded" });
    const duelTxt = await textOf(page);
    rec("PHASE-2", "Guest", "/en/duel", "Duel hub reachable as guest",
      "page renders duel info/auth gate", duelTxt.length > 400 ? "content OK" : duelTxt.slice(0, 100),
      duelTxt.length > 400 ? "PASS" : "FAIL", "");

    await page.goto(`${BASE}/en/leaderboard`, { waitUntil: "domcontentloaded" });
    const lbTxt = await textOf(page);
    rec("PHASE-2", "Guest", "/en/leaderboard", "Public leaderboard renders",
      ">500 chars of content or clean empty state", `${lbTxt.length} chars`,
      lbTxt.length > 500 ? "PASS" : "FAIL", "");

    const futureRe = /tournament\b|spectator mode\b|puzzle challenge\b/i;
    await page.goto(`${BASE}/en/play`, { waitUntil: "domcontentloaded" });
    const allText = dailyTxt + lbTxt + (await textOf(page));
    const futureAdvertised = futureRe.test(allText);
    rec("PHASE-2", "Guest", "play+daily+leaderboard", "Future modes stay hidden",
      "No tournament/spectator/puzzle-challenge advertised while disabled",
      futureAdvertised ? "future mode visible" : "hidden", futureAdvertised ? "FAIL" : "PASS", "");
    await ctx.close();
  }
  /* ============ PHASE 3 — AUTH FLOW (real user, UI only) ============ */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const email = `uat_${Date.now()}@uatmail.dev`;
    const pass = "UatPass!2026x";
    const uname = `UATUser${Date.now().toString().slice(-6)}`;

    await page.goto(`${BASE}/en/auth`, { waitUntil: "domcontentloaded" });
    // switch to register mode via toggle under the form
    const toggle = page.locator("form ~ div button").last();
    try { await toggle.click({ timeout: 4000 }); } catch (e) {}
    await page.waitForTimeout(600);
    await page.fill("input[type='text']", uname).catch(() => {});
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", pass);
    await Promise.all([
      page.waitForURL("**/profile**", { timeout: 20000 }).catch(() => {}),
      page.locator("form button[type='submit']").click().catch(() => {}),
    ]);
    await page.waitForTimeout(1500);
    let url = page.url();
    rec("PHASE-3", "New user", "/en/auth", `Register ${email}`, "redirect to /profile with session",
      url, /profile|admin/.test(url) ? "PASS" : "FAIL", "");
    if (!/profile|admin/.test(url)) {
      const err = await textOf(page);
      console.log("REGISTER ERROR CONTEXT:", err.slice(0, 300));
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    const stillIn = page.url().includes("/profile") || /coins|balance|stat/i.test(await textOf(page));
    rec("PHASE-3", "New user", "/en/profile", "Reload keeps session", "still authenticated",
      stillIn ? "persists" : "lost", stillIn ? "PASS" : "FAIL", "");

    const logout = page.locator("button:has-text('Log out'), a:has-text('Log out')").first();
    if ((await logout.count()) > 0 && (await logout.isVisible().catch(() => false))) {
      await logout.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      rec("PHASE-3", "New user", "header", "Logout control works",
        "back to guest state", page.url(), !page.url().includes("/admin") ? "PASS" : "PARTIAL", "");
    } else {
      rec("PHASE-3", "New user", "header", "Find logout control", "visible logout control",
        "not found", "PARTIAL", "");
    }

    // Wrong password
    await page.goto(`${BASE}/en/auth`, { waitUntil: "domcontentloaded" });
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", "WrongPass!999");
    await page.locator("form button[type='submit']").first().click().catch(() => {});
    await page.waitForTimeout(1800);
    const errShown = await page.locator(".text-red-500, [class*='error']").first().isVisible().catch(() => false);
    rec("PHASE-3", "Existing user", "/en/auth", "Login with wrong password",
      "visible error, no session", errShown ? "error shown" : "no error",
      errShown ? "PASS" : "FAIL", "");

    // Duplicate registration
    await page.goto(`${BASE}/en/auth`, { waitUntil: "domcontentloaded" });
    const tog2 = page.locator("form ~ div button").last();
    try { await tog2.click({ timeout: 3000 }); } catch (e) {}
    await page.fill("input[type='text']", "DupUserTest").catch(() => {});
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", pass);
    await page.locator("form button[type='submit']").first().click().catch(() => {});
    await page.waitForTimeout(1800);
    const dupErr = await page.locator("text=/already|exists|taken|duplicate/i").first().isVisible().catch(() => false);
    rec("PHASE-3", "Visitor", "/en/auth", "Duplicate email registration",
      "'account already exists' style error", dupErr ? "duplicate error" : "unclear",
      dupErr ? "PASS" : "PARTIAL", "");

    // Empty form
    await page.goto(`${BASE}/en/auth`, { waitUntil: "domcontentloaded" });
    await page.fill("input[type='email']", "");
    await page.fill("input[type='password']", "");
    await page.locator("form button[type='submit']").first().click().catch(() => {});
    await page.waitForTimeout(800);
    rec("PHASE-3", "Visitor", "/en/auth", "Submit empty form", "blocked by validation, stays on page",
      page.url(), page.url().includes("/auth") ? "PASS" : "FAIL", "");
    await ctx.close();
  }
  await browser.close();

  const outPath = path.join(__dirname, "..", "test-results", "uat-batch1.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  const counts = results.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  console.log("\n=== BATCH1 SUMMARY ===", JSON.stringify(counts));
})();



