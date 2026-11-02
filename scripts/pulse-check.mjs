import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

// 1) Structure: .s-scan must be gone; .s-pulse must exist
const structure = await page.evaluate(() => ({
  scan: !!document.querySelector(".s-scan"),
  pulse: !!document.querySelector(".s-pulse"),
  rings: document.querySelectorAll(".s-ring").length,
  arrows: document.querySelectorAll("#agent-svg use").length,
}));
console.log("structure:", JSON.stringify(structure));

// 2) Pulse state at break (6.4s)
await page.evaluate((v) => window.__intro.seek(v), 6.4);
await page.waitForTimeout(300);
const pulse = await page.evaluate(() => {
  const p = document.querySelector(".s-pulse");
  return p ? { r: p.getAttribute("r"), opacity: getComputedStyle(p).opacity } : null;
});
console.log("pulse@6.4:", JSON.stringify(pulse));

// 3) Tour start: seek past openEnd (~7.2) into construction
await page.evaluate((v) => window.__intro.seek(v), 10);
await page.waitForTimeout(500);
const tour = await page.evaluate(() => ({
  introAttr: document.documentElement.getAttribute("data-intro"),
  scanBoxes: document.querySelectorAll(".scan-box").length,
  built: document.querySelectorAll(".layer-built").length,
  panelVisible: (() => { const p = document.getElementById("agent-panel"); return p ? getComputedStyle(p).display !== "none" : false; })(),
  overlayGone: !document.getElementById("agent-overlay"),
}));
console.log("tour@10:", JSON.stringify(tour));

// 4) Skip path from a fresh load
const page2 = await ctx.newPage();
const errors2 = [];
page2.on("console", (m) => { if (m.type() === "error") errors2.push(m.text()); });
page2.on("pageerror", (e) => errors2.push("PAGEERROR: " + e.message));
await page2.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page2.waitForSelector("#agent-overlay", { timeout: 15000 });
await page2.click("#ap-skip");
await page2.waitForTimeout(1200);
const skip = await page2.evaluate(() => ({
  overlayGone: !document.getElementById("agent-overlay"),
  dataIntro: document.documentElement.getAttribute("data-intro"),
  lock: document.documentElement.classList.contains("intro-interaction-lock"),
}));
console.log("skip:", JSON.stringify(skip));

// 5) Fresh replay: reload, confirm .s-scan never reappears during full open
await page2.reload({ waitUntil: "networkidle" });
await page2.waitForSelector("#agent-overlay", { timeout: 15000 });
let worst = null;
for (const t of [0.6, 1.5, 2.4, 3.6, 4.5, 5.4, 6.0, 6.6, 7.0]) {
  await page2.evaluate((v) => window.__intro.seek(v), t);
  await page2.waitForTimeout(120);
  const s = await page2.evaluate(() => !!document.querySelector(".s-scan"));
  if (s) worst = t;
}
console.log("replay .s-scan reappear at:", worst ?? "never");
console.log("console errors (page1):", errors.length ? errors : "none");
console.log("console errors (page2):", errors2.length ? errors2 : "none");
await browser.close();
