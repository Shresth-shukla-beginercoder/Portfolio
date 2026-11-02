import { chromium } from "playwright";
const URL = "http://localhost:5173/";
const launch = () => chromium.launch({ headless: true, channel: "chrome" });
const ids = ["about", "skills", "projects", "experience", "certifications", "achievements", "contact"];

const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const failed = [];
page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().split("/").pop()}`); });
await page.goto(URL, { waitUntil: "load" });
await page.waitForTimeout(600);
await page.evaluate(() => document.getElementById("skip-intro")?.click());
await page.waitForTimeout(1200);

// scroll through each section to fire its ScrollTrigger, then read opacity
const report = await page.evaluate(async (ids) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = {};
  for (const id of ids) {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
    await sleep(900);
    const title = document.querySelector(`#${id} [data-section-title]`);
    out[id] = title ? { titleOpacity: getComputedStyle(title).opacity } : "no-section";
  }
  return out;
}, ids);

// Now that projects is in view, screenshot it to confirm the real cards render
await page.evaluate(() => document.getElementById("projects").scrollIntoView({ block: "start" }));
await page.waitForTimeout(1200);
await page.locator("#projects").screenshot({ path: "scripts/shots/projects.png" });

const imgs = await page.evaluate(() =>
  [...document.querySelectorAll("#projects img")].map((im) => ({ src: im.src.split("/").pop(), loaded: im.complete && im.naturalWidth > 0 }))
);

await ctx.close(); await b.close();
console.log(JSON.stringify({ report, imgs, failed: [...new Set(failed)] }, null, 2));
