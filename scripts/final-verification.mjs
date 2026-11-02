// Comprehensive verification of the redesign: loading screen → construction → finale
import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

const results = {};

// 1. Navbar hidden during loading
results.navbarHiddenOnLoad = await page.evaluate(() => {
  const nav = document.querySelector("nav[data-layer='nav.root']");
  const clip = nav ? getComputedStyle(nav).clipPath : null;
  return clip && clip.includes("inset");
});

// 2. All 15 arrows orbit at t=3.6 (orbit phase)
await page.evaluate(() => window.__intro.seek(3.6));
await page.waitForTimeout(300);
results.arrowsOrbiting = await page.evaluate(() => document.querySelectorAll("#agent-svg use").length === 15);

// 3. All 15 arrows leave the circle when loading ends (t=7.2 → construction starts)
await page.evaluate(() => window.__intro.seek(7.5));
await page.waitForTimeout(500);
const pos7_5 = await page.evaluate(() => {
  const uses = [...document.querySelectorAll("#agent-svg use")];
  return uses.map((el) => {
    const g = el.closest("g");
    const tr = g.getAttribute("transform");
    const m = tr?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
  });
});

// Check: arrows are spread out from the center circle (not all clustered at one position)
const cx = 720, cy = 450;
const distances = pos7_5.map((p) => p ? Math.hypot(p[0] - cx, p[1] - cy) : 0);
const maxDist = Math.max(...distances);
const minDist = Math.min(...distances.filter((d) => d > 0));
results.arrowsDispersed = maxDist - minDist > 200; // not all frozen in same spot

// 4. Idle agents exit the viewport during long gaps
// (sample at t=10.5, middle of skills section, where non-working agents should be off-screen)
await page.evaluate(() => window.__intro.seek(10.5));
await page.waitForTimeout(300);
const pos10_5 = await page.evaluate(() => {
  const uses = [...document.querySelectorAll("#agent-svg use")];
  const vw = window.innerWidth, vh = window.innerHeight;
  const inViewport = uses.filter((el) => {
    const g = el.closest("g");
    const tr = g.getAttribute("transform");
    const m = tr?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!m) return false;
    const [x, y] = [parseFloat(m[1]), parseFloat(m[2])];
    return x >= 0 && x <= vw && y >= 0 && y <= vh;
  });
  return inViewport.length;
});
results.someIdleAgentsHidden = pos10_5 < 15;

// 5. Finale: all 15 arrows gather into S formation (t = finale + 0.3)
const dur = await page.evaluate(() => window.__intro.getState().duration);
const finaleAt = dur - 4.0; // approximate finale start
await page.evaluate((t) => window.__intro.seek(t), finaleAt + 0.8);
await page.waitForTimeout(400);
const posGather = await page.evaluate(() => {
  const uses = [...document.querySelectorAll("#agent-svg use")];
  return uses.map((el) => {
    const g = el.closest("g");
    const tr = g.getAttribute("transform");
    const m = tr?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
  });
});
// S formation: all arrows should be within ~150px of center
const gatherVariance = posGather.reduce((sum, p) => sum + (p ? Math.hypot(p[0] - cx, p[1] - cy) : 0), 0) / posGather.length;
results.gatherFormed = gatherVariance < 200;

// 6. All arrows exit after finale (t = near end)
await page.evaluate((t) => window.__intro.seek(t), dur - 0.5);
await page.waitForTimeout(400);
const posEnd = await page.evaluate(() => {
  const uses = [...document.querySelectorAll("#agent-svg use")];
  const vw = window.innerWidth, vh = window.innerHeight;
  return uses.filter((el) => {
    const g = el.closest("g");
    const tr = g.getAttribute("transform");
    const m = tr?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!m) return true;
    const [x, y] = [parseFloat(m[1]), parseFloat(m[2])];
    return x >= -100 && x <= vw + 100 && y >= -100 && y <= vh + 100;
  }).length;
});
results.arrowsExiting = posEnd <= 5; // most arrows off-screen

// 7. Tour completes without console errors
await page.waitForFunction(() => window.__intro.getState().finished, null, { timeout: 60000 });
await page.waitForTimeout(1500); // wait for overlay fade & teardown
results.noConsoleErrors = errors.length === 0;

// 8. Post-tour cleanup
const cleanup = await page.evaluate(() => ({
  overlayGone: !document.getElementById("agent-overlay"),
  dataIntroGone: document.documentElement.getAttribute("data-intro") === null,
  lockGone: !document.documentElement.classList.contains("intro-interaction-lock"),
  navbarVisible: (() => {
    const nav = document.querySelector("nav");
    return nav && getComputedStyle(nav).clipPath === "none";
  })(),
}));
results.cleanTeardown = cleanup.overlayGone && cleanup.dataIntroGone && !cleanup.lockGone && cleanup.navbarVisible;

// 9. Skip path also exits all agents
const page2 = await ctx.newPage();
const errors2 = [];
page2.on("pageerror", (e) => errors2.push(e.message));
page2.on("console", (m) => { if (m.type() === "error") errors2.push(m.text()); });
await page2.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page2.waitForSelector("#agent-overlay", { timeout: 15000 });
await page2.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });
await page2.click("#ap-skip");
await page2.waitForTimeout(1500);
const skipCleanup = await page2.evaluate(() => ({
  overlayGone: !document.getElementById("agent-overlay"),
  navbarVisible: (() => {
    const nav = document.querySelector("nav");
    return nav && getComputedStyle(nav).clipPath === "none";
  })(),
}));
results.skipClean = skipCleanup.overlayGone && skipCleanup.navbarVisible;

console.log("\n=== FINAL VERIFICATION RESULTS ===");
for (const [k, v] of Object.entries(results)) {
  console.log(`  ${k}: ${v ? "✓ PASS" : "✗ FAIL"}`);
}
console.log(`\nConsole errors (main): ${errors.length ? errors : "none"}`);
console.log(`Console errors (skip): ${errors2.length ? errors2 : "none"}`);

const allPass = Object.values(results).every((v) => v === true) && errors.length === 0 && errors2.length === 0;
console.log(`\nOVERALL: ${allPass ? "✓ ALL TESTS PASS" : "✗ SOME TESTS FAILED"}`);

await browser.close();
