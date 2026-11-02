import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false, slowMo: 50 });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

console.log("=== WATCHING NAVBAR CONSTRUCTION LIVE ===");
console.log("Seeking to t=7.8 (just before hero section)...\n");

await page.evaluate(() => window.__intro.seek(7.8));
await page.waitForTimeout(500);

// Sample agent 10's position every 200ms for 3 seconds
const samples = [];
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(200);
  const snap = await page.evaluate(() => {
    const g = document.querySelector("g[data-agent='a-10']");
    const m = g?.getAttribute("transform")?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    return {
      time: window.__intro.getState().time.toFixed(2),
      activity: document.getElementById("ap-activity")?.textContent || "",
      agent10: m ? `${Math.round(+m[1])},${Math.round(+m[2])}` : "NONE",
      navVisible: (() => {
        const nav = document.querySelector("nav[data-layer='nav.root']");
        const clip = nav ? getComputedStyle(nav).clipPath : null;
        return clip === "none" || !clip?.includes("inset");
      })(),
    };
  });
  samples.push(snap);
  if (i % 5 === 0) console.log(`t=${snap.time}  a-10: ${snap.agent10}  nav: ${snap.navVisible ? "visible" : "hidden"}  "${snap.activity}"`);
}

console.log("\n=== AGENT 10 (Route) MOVEMENT DURING HERO ===");
samples.forEach((s, i) => console.log(`${i}: t=${s.time}  pos=${s.agent10}  ${s.activity}`));

console.log("\n=== ANALYSIS ===");
const yPositions = samples.map((s) => parseInt(s.agent10.split(",")[1]));
const atTop = yPositions.filter((y) => y >= 0 && y <= 80).length;
console.log(`Agent 10 at navbar height (y≤80) for ${atTop}/${samples.length} samples`);
console.log(atTop >= 3 ? "✓ Agent 10 IS flying to navbar area" : "✗ Agent 10 NOT reaching navbar");

await page.waitForTimeout(2000);
await browser.close();
