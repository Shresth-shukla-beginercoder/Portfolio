import { chromium } from "playwright";
const URL = "http://localhost:5173/";
const b = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const failed = [];
page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().split("/").pop()}`); });
await page.goto(URL, { waitUntil: "load" });
await page.waitForTimeout(500);
await page.evaluate(() => document.getElementById("skip-intro")?.click());
await page.waitForTimeout(800);

// YelpCamp image now a real capture?
const yel = await page.evaluate(() => {
  const im = [...document.querySelectorAll("#projects img")].find((x) => /yelpcamp/.test(x.src));
  return im ? { src: im.src.split("/").pop(), loaded: im.complete && im.naturalWidth > 0, w: im.naturalWidth } : "not-in-dna-yet";
});

// Signature: scroll into view, sample drawn-progress at two times
await page.evaluate(() => document.getElementById("contact")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(600);
const sample = () =>
  page.evaluate(() => {
    const paths = [...document.querySelectorAll("#sign-off .sig-stroke")];
    const done = paths.filter((p) => {
      const o = p.style.strokeDashoffset;
      return o === "" || parseFloat(o) < 1;
    }).length;
    return { total: paths.length, done };
  });
const at600 = await sample();
await page.waitForTimeout(1500); // 0.6 -> 2.1s total
const at2100 = await sample();
await page.waitForTimeout(800);
await page.locator("#sign-off").screenshot({ path: "scripts/shots/signature.png" });

await ctx.close();
await b.close();
console.log(JSON.stringify({ yel, at600, at2100, failed: [...new Set(failed)] }, null, 2));
