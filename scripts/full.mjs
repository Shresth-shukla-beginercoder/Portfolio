import { chromium } from "playwright";
const URL = "http://localhost:5173/";
const launch = () => chromium.launch({ headless: true, channel: "chrome" });

async function shot(view, name) {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: view, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById("skip-intro")?.click());
  await page.waitForTimeout(1500);
  // disable the Ken Burns + hide agent dots so the capture is stable
  await page.evaluate(() => { document.getElementById("cursor-ring")?.remove(); document.getElementById("cursor-dot")?.remove(); });
  await page.screenshot({ path: `scripts/shots/${name}-full.png`, fullPage: true });
  await ctx.close(); await b.close();
}

await shot(1440, "desktop");
await shot(390, "phone");
console.log("full-page screenshots written");
