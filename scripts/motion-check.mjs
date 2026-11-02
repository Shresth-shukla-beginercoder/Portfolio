import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

// Sample arrow 0's position over 2 seconds
const samples = [];
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(200);
  const pos = await page.evaluate(() => {
    const g = document.querySelector("#agent-svg g[data-agent='a-01']");
    if (!g) return null;
    const tr = g.getAttribute("transform");
    const m = tr?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]), time: window.__intro.getState().time } : null;
  });
  samples.push(pos);
}

console.log("=== ARROW POSITION SAMPLES (arrow a-01) ===");
samples.forEach((s, i) => console.log(`${i}: t=${s.time.toFixed(2)}s  x=${s.x.toFixed(1)}  y=${s.y.toFixed(1)}`));

const moving = samples.some((s, i) => i > 0 && (Math.abs(s.x - samples[i-1].x) > 5 || Math.abs(s.y - samples[i-1].y) > 5));
console.log(`\nARROWS MOVING: ${moving ? "YES ✓" : "NO ✗"}`);

if (!moving) {
  console.log("\n=== CHECKING GSAP TICKER ===");
  const tickerInfo = await page.evaluate(() => ({
    tickerExists: typeof gsap !== "undefined" && !!gsap.ticker,
    tickerActive: typeof gsap !== "undefined" ? gsap.ticker._listeners.length : 0,
  }));
  console.log(tickerInfo);
}

await browser.close();
