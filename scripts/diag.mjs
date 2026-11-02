import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
mkdirSync("scripts/shots", { recursive: true });
const URL = "http://localhost:5173/";
const launch = () => chromium.launch({ headless: true, channel: "chrome" });

const overflowProbe = () => {
  const vw = document.documentElement.clientWidth;
  const out = document.documentElement.scrollWidth;
  const offenders = [];
  const all = document.querySelectorAll("body *");
  all.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el);
      offenders.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        cls: (el.className && el.className.baseVal !== undefined) ? el.className.baseVal : (el.className || undefined),
        right: Math.round(r.right),
        left: Math.round(r.left),
        w: Math.round(r.width),
        pos: cs.position,
      });
    }
  });
  // keep the deepest / largest offenders
  offenders.sort((a, b) => b.right - a.right);
  return { vw, out, overflow: out > vw, offenders: offenders.slice(0, 12) };
};

async function probe(view) {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: view, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const intro = await page.evaluate(overflowProbe);
  // skip to site
  await page.evaluate(() => document.getElementById("skip-intro")?.click());
  await page.waitForTimeout(1600);
  const site = await page.evaluate(overflowProbe);
  const skipWorked = await page.evaluate(() => ({
    overlayHidden: document.getElementById("intro-overlay")?.classList.contains("hidden"),
    booted: sessionStorage.getItem("pf.introDone") === "1",
  }));
  await ctx.close(); await b.close();
  return { view, intro, site, skipWorked, errors, failed };
}

const r = { "390": await probe(390), "768": await probe(768), "1440": await probe(1440) };
console.log(JSON.stringify(r, null, 2));
