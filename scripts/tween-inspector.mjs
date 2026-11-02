import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

// Inspect GSAP internals to see if "silk" exists and if wave tweens are on the timeline
const diagnosis = await page.evaluate(() => {
  // Check if CustomEase registered "silk"
  const silkExists = typeof gsap !== "undefined" && gsap.parseEase && !!gsap.parseEase("silk");

  // Try to get the master timeline via the __intro debug interface
  const state = window.__intro.getState();

  // Check agent a-01's current position
  const g = document.querySelector("g[data-agent='a-01']");
  const transform = g?.getAttribute("transform") || "";
  const m = transform.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
  const pos = m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;

  return {
    silkExists,
    time: state.time,
    duration: state.duration,
    a01Position: pos,
    gsapAvailable: typeof gsap !== "undefined",
  };
});

console.log("=== TWEEN DIAGNOSIS ===");
console.log(JSON.stringify(diagnosis, null, 2));

// Now seek to t=1.5 (mid-wave) and check if arrow moved at all from its start position
await page.evaluate(() => window.__intro.seek(0.8)); // before wave starts
await page.waitForTimeout(200);
const posBefore = await page.evaluate(() => {
  const g = document.querySelector("g[data-agent='a-01']");
  const tr = g?.getAttribute("transform") || "";
  const m = tr.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
});

await page.evaluate(() => window.__intro.seek(1.5)); // mid-wave
await page.waitForTimeout(200);
const posDuring = await page.evaluate(() => {
  const g = document.querySelector("g[data-agent='a-01']");
  const tr = g?.getAttribute("transform") || "";
  const m = tr.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
});

console.log("\n=== ARROW a-01 WAVE MOVEMENT TEST ===");
console.log(`Before wave (t=0.8): ${JSON.stringify(posBefore)}`);
console.log(`Mid-wave (t=1.5):    ${JSON.stringify(posDuring)}`);
console.log(`Distance moved: ${Math.hypot(posDuring.x - posBefore.x, posDuring.y - posBefore.y).toFixed(1)}px`);
console.log(`Wave tween is ${Math.abs(posDuring.x - posBefore.x) > 10 ? "WORKING ✓" : "NOT EXECUTING ✗"}`);

await browser.close();
