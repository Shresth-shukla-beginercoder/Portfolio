import { chromium } from "playwright";
const launch = () => chromium.launch({ headless: true, channel: "chrome" });

const targets = [
  { out: "meditrack", url: "https://medi-track-lake-two.vercel.app" },
  { out: "yelpcamp", url: "https://yelp-camp-two-omega.vercel.app" },
];

const results = {};
for (const t of targets) {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  try {
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 25000 });
    await page.waitForTimeout(1500);
    const path = `src/assets/images/projects/${t.out}.jpg`;
    await page.screenshot({ path, type: "jpeg", quality: 82 });
    results[t.out] = "ok";
  } catch (e) {
    results[t.out] = "FAIL: " + String(e).slice(0, 120);
  } finally {
    await ctx.close();
    await b.close();
  }
}
console.log(JSON.stringify(results, null, 2));
