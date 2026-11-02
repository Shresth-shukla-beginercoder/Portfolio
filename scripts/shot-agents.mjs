import { chromium } from "playwright";

const PORT = process.env.PORT || "5174";
const url = `http://localhost:${PORT}/?intro=1`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(url, { waitUntil: "networkidle" });
// Ensure intro runs: clear skip state, force autoplay
await page.evaluate(() => sessionStorage.removeItem("pf.introDone"));
await page.reload({ waitUntil: "networkidle" });

// Wait for the overlay to appear
await page.waitForSelector("#agent-overlay", { timeout: 10000 });
await page.waitForFunction(() => window.__intro, null, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: "scripts/shots/agents-intro.png" });

const state = await page.evaluate(() => window.__intro ? window.__intro.getState() : null);
if (state && state.labels) {
  const mid = state.labels.projects ?? state.duration / 2;
  await page.evaluate((t) => window.__intro.seek(t), mid);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "scripts/shots/agents-projects.png" });
  const agents = await page.locator("#agent-nodes .agent").count();
  const panel = await page.locator("#ap-layers").innerText().catch(() => "none");
  console.log(JSON.stringify({ agents, panel, duration: state.duration, layers: state.layers, labels: Object.keys(state.labels), errors }, null, 2));
} else {
  console.log(JSON.stringify({ state: state, errors }, null, 2));
}
await browser.close();
