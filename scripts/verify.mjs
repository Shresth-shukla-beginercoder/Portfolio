import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "scripts/shots";
mkdirSync(OUT, { recursive: true });
const URL = "http://localhost:5173/";
const views = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "phone", width: 390, height: 844 },
  { name: "tiny", width: 320, height: 640 },
];

function launch() {
  return chromium.launch({ headless: true, channel: "chrome" });
}

// ---- scenarios (one browser each to keep state isolation simple) ----
async function main() {
  const report = {};

  for (const v of views) {
    const b = await launch();
    // viewport-specific: rebuild context inside runScenario? keep simple: set viewport via context
    const ctx = await b.newContext({ viewport: { width: v.width, height: v.height } });
    const page = await ctx.newPage();
    const errors = [];
    const consoleErr = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") consoleErr.push(m.text()); });
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const s = await page.evaluate(() => ({
      overlay: !!document.getElementById("intro-overlay") && !document.getElementById("intro-overlay").classList.contains("hidden"),
      introTl: typeof window.__introTl === "object" && !!window.__introTl,
      agents: document.querySelectorAll("#agent-layer > *").length,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      links: document.querySelectorAll("a").length,
      buttons: document.querySelectorAll("button").length,
    }));
    await page.screenshot({ path: `${OUT}/${v.name}-intro.png` });
    await page.evaluate(() => document.getElementById("skip-intro")?.click());
    await page.waitForTimeout(1600);
    const p = await page.evaluate(() => ({
      overlayHidden: document.getElementById("intro-overlay")?.classList.contains("hidden"),
      booted: sessionStorage.getItem("pf.introDone") === "1",
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      links: document.querySelectorAll("a").length,
      buttons: document.querySelectorAll("button").length,
    }));
    await page.screenshot({ path: `${OUT}/${v.name}-site.png` });
    await ctx.close();
    await b.close();
    report[v.name] = { s, p, errors, consoleErr };
  }

  // reduced-motion: overlay should be hidden immediately, no intro timeline
  {
    const b = await launch();
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(800);
    const s = await page.evaluate(() => ({
      overlayHidden: document.getElementById("intro-overlay")?.classList.contains("hidden"),
      introTl: typeof window.__introTl === "object" && !!window.__introTl,
      sigComplete: [...document.querySelectorAll("#sign-off .sig-stroke")].every((el) => getComputedStyle(el).strokeDasharray === "none"),
    }));
    await page.screenshot({ path: `${OUT}/reduced-site.png` });
    await ctx.close();
    await b.close();
    report.reducedMotion = { s, errors };
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
