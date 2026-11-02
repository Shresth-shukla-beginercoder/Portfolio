import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

const dur = await page.evaluate(() => window.__intro.getState().duration);
console.log(`timeline: ${dur.toFixed(2)}s`);

// Wait for the tour to complete naturally
console.log("waiting for tour completion...");
await page.waitForFunction(() => window.__intro.getState().finished, null, { timeout: 90000 });
await page.waitForTimeout(2000); // extra time for teardown

// Check the cleanup state
const cleanup = await page.evaluate(() => ({
  overlayExists: !!document.getElementById("agent-overlay"),
  dataIntroAttr: document.documentElement.getAttribute("data-intro"),
  lockClass: document.documentElement.classList.contains("intro-interaction-lock"),
  navVisible: (() => {
    const nav = document.querySelector("nav[data-layer='nav.root']");
    const clip = nav ? getComputedStyle(nav).clipPath : null;
    return { hasClip: !!clip && clip !== "none", clipValue: clip };
  })(),
  arrowPos: (() => {
    const g = document.querySelector("#agent-svg g[data-agent='a-01']");
    if (!g) return null;
    const m = g.getAttribute("transform")?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
  })(),
}));

console.log("\n=== POST-TOUR CLEANUP STATE ===");
console.log(JSON.stringify(cleanup, null, 2));

console.log("\n=== DIAGNOSTIC ===");
console.log(`Overlay removed: ${!cleanup.overlayExists ? "YES ✓" : "NO ✗ (still in DOM)"}`);
console.log(`data-intro cleared: ${cleanup.dataIntroAttr === null ? "YES ✓" : `NO ✗ (value="${cleanup.dataIntroAttr}")`}`);
console.log(`Interaction lock removed: ${!cleanup.lockClass ? "YES ✓" : "NO ✗"}`);
console.log(`Navbar visible: ${!cleanup.navVisible.hasClip ? "YES ✓" : `NO ✗ (clip="${cleanup.navVisible.clipValue}")`}`);
console.log(`Arrows still visible: ${cleanup.arrowPos ? "YES ✗" : "NO ✓ (should be off-screen or DOM gone)"}`);

await browser.close();
