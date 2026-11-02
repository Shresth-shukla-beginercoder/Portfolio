import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("CONSOLE ERROR: " + m.text());
  if (m.text().includes("TypeError") || m.text().includes("ReferenceError")) errors.push("CONSOLE: " + m.text());
});

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

console.log("=== ERRORS CAPTURED ===");
if (errors.length === 0) console.log("No errors");
else errors.forEach((e) => console.log(e));

// Check if intro started
const state = await page.evaluate(() => window.__intro ? window.__intro.getState() : null);
console.log("\n=== INTRO STATE ===");
console.log(state);

// Check arrow positions
const arrows = await page.evaluate(() => {
  const uses = document.querySelectorAll("#agent-svg use");
  if (uses.length === 0) return "NO ARROWS FOUND";
  const first = uses[0].closest("g").getAttribute("transform");
  return { count: uses.length, firstTransform: first };
});
console.log("\n=== ARROWS ===");
console.log(arrows);

await browser.close();
