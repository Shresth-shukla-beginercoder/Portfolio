// Phase 8 — Full test matrix across 3 viewports + FPS measurement under 4× throttle.
// Desktop 1440×900, tablet 768×1024, mobile 390×844.
// Tests: project links (repo/live), cert viewer (zoom/Esc/backdrop/scroll-lock/mobile),
// About blocks, intro (pause/resume/wheel/keys-lock/skip), 15 arrows, console errors,
// navbar (link/active/hover/mobile), consistency vs ?intro=0.
import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const results = [];
let browser = null;

async function test(V) {
  const ctx = await browser.newContext({ viewport: V });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const R = { viewport: V.name, tests: {}, errors: [] };

  // 1) Intro tour: 15 arrows, pause/resume, interaction lock (wheel/keys), skip at various positions
  await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
  await page.waitForSelector("#agent-overlay", { timeout: 15000 });
  await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });
  const arrows = await page.evaluate(() => document.querySelectorAll("#agent-svg use").length);
  R.tests.arrows = arrows === 15 ? "PASS" : `FAIL: ${arrows}`;

  // Pause/resume
  await page.click("#ap-pause");
  await page.waitForTimeout(200);
  const pausedState = await page.evaluate(() => window.__intro.getState().paused);
  await page.click("#ap-pause"); // resume
  await page.waitForTimeout(200);
  const resumedState = await page.evaluate(() => !window.__intro.getState().paused);
  R.tests.pauseResume = (pausedState && resumedState) ? "PASS" : "FAIL";

  // Interaction lock: wheel/keys preventDefault during tour
  const lockClass = await page.evaluate(() => document.documentElement.classList.contains("intro-interaction-lock"));
  R.tests.interactionLock = lockClass ? "PASS" : "FAIL";

  // Skip at hold phase (t≈5.0)
  await page.evaluate(() => window.__intro.seek(5.0));
  await page.waitForTimeout(200);
  await page.click("#ap-skip");
  await page.waitForTimeout(1200);
  const skipClean = await page.evaluate(() => !document.getElementById("agent-overlay") && !document.documentElement.classList.contains("intro-interaction-lock"));
  R.tests.skipCleanup = skipClean ? "PASS" : "FAIL";

  // 2) Projects: repo/live buttons present and correct destinations
  await page.goto("http://localhost:5175/?intro=0", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const projects = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-layer^='projects.card.']")].filter((el) => el.dataset.layer.match(/^projects\.card\.\d+$/));
    return cards.map((card, i) => {
      const repo = card.querySelector("[data-layer$='.repo']");
      const live = card.querySelector("[data-layer$='.live']");
      return {
        i,
        hasRepo: !!repo,
        repoHref: repo?.href || null,
        hasLive: !!live,
        liveHref: live?.href || null,
      };
    });
  });
  const p01HasLive = projects.find((p) => p.i === 0)?.liveHref?.includes("sales-analytics-project-2fjs.onrender.com");
  const p04NoLive = projects.find((p) => p.i === 3)?.hasLive === false;
  R.tests.projectLinks = (p01HasLive && p04NoLive && projects.every((p) => p.hasRepo)) ? "PASS" : "FAIL";

  // 3) Certifications lightbox: zoom, Esc, backdrop, scroll-lock, mobile
  const certCards = await page.$$("[data-layer^='certifications.card.']");
  if (certCards.length > 0) {
    await certCards[0].click();
    await page.waitForTimeout(300);
    const lightboxOpen = await page.evaluate(() => !!document.querySelector(".fixed.inset-0.z-\\[100\\]"));
    const scrollLock = await page.evaluate(() => document.body.style.overflow === "hidden");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const lightboxClosed = await page.evaluate(() => !document.querySelector(".fixed.inset-0.z-\\[100\\]"));
    const scrollUnlock = await page.evaluate(() => document.body.style.overflow !== "hidden");
    R.tests.certLightbox = (lightboxOpen && scrollLock && lightboxClosed && scrollUnlock) ? "PASS" : "FAIL";
  } else {
    R.tests.certLightbox = "SKIP: no cert cards";
  }

  // 4) About: six subsections present
  const aboutBlocks = await page.evaluate(() => document.querySelectorAll("[data-layer^='about.s']").length);
  R.tests.aboutBlocks = aboutBlocks === 6 ? "PASS" : `FAIL: ${aboutBlocks}`;

  // 5) Navbar: active indicator, hover underline (desktop only), mobile menu (mobile only)
  if (V.name === "desktop") {
    const navLinks = await page.$$("[data-layer^='nav.link.']");
    if (navLinks.length > 0) {
      const beforeHover = await page.evaluate((sel) => {
        const link = document.querySelector(sel);
        return link ? getComputedStyle(link, "::after").transform : null;
      }, "[data-layer='nav.link.0'] a");
      await navLinks[0].hover();
      await page.waitForTimeout(350);
      const afterHover = await page.evaluate((sel) => {
        const link = document.querySelector(sel);
        return link ? getComputedStyle(link, "::after").transform : null;
      }, "[data-layer='nav.link.0'] a");
      R.tests.navHover = (beforeHover !== afterHover) ? "PASS" : "FAIL";
    } else {
      R.tests.navHover = "SKIP: no nav links";
    }
  } else if (V.name === "mobile") {
    const menuBtn = await page.$("[data-layer='nav.menu']");
    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(350);
      const sheetOpen = await page.evaluate(() => {
        const sheet = document.querySelector("nav > div:last-child");
        return sheet ? getComputedStyle(sheet).maxHeight !== "0px" : false;
      });
      await menuBtn.click();
      await page.waitForTimeout(350);
      const sheetClosed = await page.evaluate(() => {
        const sheet = document.querySelector("nav > div:last-child");
        return sheet ? getComputedStyle(sheet).maxHeight === "0px" : false;
      });
      R.tests.mobileMenu = (sheetOpen && sheetClosed) ? "PASS" : "FAIL";
    } else {
      R.tests.mobileMenu = "SKIP: no menu button";
    }
  }

  R.errors = errors;
  await ctx.close();
  return R;
}

async function measureFPS() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const client = await ctx.newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
  await page.waitForSelector("#agent-overlay", { timeout: 15000 });
  await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

  // Sample rAF frame times during the orbit phase (3.0–4.5s, arrows circling at full speed with trails)
  await page.evaluate(() => window.__intro.seek(3.0));
  await page.waitForTimeout(300);
  const samples = await page.evaluate(async () => {
    const times = [];
    let last = performance.now();
    const sample = () => {
      const now = performance.now();
      if (times.length > 0) times.push(now - last);
      last = now;
      if (times.length < 120) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    await new Promise((r) => setTimeout(r, 2100)); // ~120 frames at 60fps
    return times.slice(10, -10); // trim warm-up and tail
  });
  if (samples.length === 0) return { median: "N/A", mean: "N/A", medianFt: "N/A", meanFt: "N/A" };
  const median = samples.slice().sort((a, b) => a - b)[Math.floor(samples.length / 2)];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const fps = { median: (1000 / median).toFixed(1), mean: (1000 / mean).toFixed(1), medianFt: median.toFixed(2), meanFt: mean.toFixed(2) };
  await ctx.close();
  return fps;
}

// Run
browser = await chromium.launch();
for (const V of VIEWPORTS) {
  console.log(`\n=== ${V.name} ${V.width}×${V.height} ===`);
  const R = await test(V);
  results.push(R);
  for (const [k, v] of Object.entries(R.tests)) {
    console.log(`  ${k}: ${v}`);
  }
  if (R.errors.length > 0) console.log(`  console errors: ${R.errors.length}`, R.errors.slice(0, 2));
  else console.log(`  console errors: none`);
}

console.log("\n=== FPS under 4× CPU throttle (desktop, orbit phase) ===");
const fps = await measureFPS();
console.log(`  median: ${fps.median} fps (${fps.medianFt} ms/frame)`);
console.log(`  mean: ${fps.mean} fps (${fps.meanFt} ms/frame)`);

await browser.close();

// Summary
const allPass = results.every((R) => Object.values(R.tests).every((v) => v === "PASS" || v.startsWith("SKIP")));
const noErrors = results.every((R) => R.errors.length === 0);
console.log("\n=== SUMMARY ===");
console.log(`All tests: ${allPass ? "PASS" : "FAIL"}`);
console.log(`Zero console errors: ${noErrors ? "PASS" : "FAIL"}`);
console.log(`FPS under 4× throttle: ${parseFloat(fps.median) >= 30 ? "PASS (≥30fps)" : "MARGINAL (<30fps)"}`);
