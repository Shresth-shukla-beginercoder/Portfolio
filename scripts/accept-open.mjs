import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const PORT = process.env.PORT || "5174";
const url = `http://localhost:${PORT}/`;
const out = "scripts/shots/accept";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro, null, { timeout: 10000 });
await page.waitForFunction(() => window.__intro.getState().duration > 0, null, { timeout: 10000 });

// Mirror of src/intro/intro-config.js timings, for exact checkpoint seeking.
const S = 1.0, GAP = 0.5, WAVE = 1.0, SYNC = 1.0, HOLD = 2.0, DISPATCH = 1.0;
const tW = [S, S + GAP, S + 2 * GAP];
const syncAt = tW[2] + WAVE;
const holdAt = syncAt + SYNC;
const breakAt = holdAt + HOLD;

const shot = async (name, t, wait = 250) => {
  await page.evaluate((v) => window.__intro.seek(v), t);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`✓ shot ${name} @ ${t.toFixed(2)}s`);
};

const labels = (await page.evaluate(() => window.__intro.getState())).labels;
console.log("timeline labels:", JSON.stringify(labels));

// The 8 required opening checkpoints
await shot("01-s-alone", 0.55);
await shot("02-wave1", tW[0] + WAVE * 0.55);
await shot("03-all-15", syncAt - 0.15);
await shot("04-orbiting", syncAt + 0.6);
await shot("05-formation", holdAt + 1.0);
await shot("06-break-apart", breakAt + DISPATCH * 0.45);
await shot("07-toward-hero", breakAt + DISPATCH + 0.12);
await shot("08-hero-construction", labels.hero + 1.5, 500);

// Structural checks
const checks = await page.evaluate(() => {
  const agents = document.querySelectorAll("#agent-nodes .agent").length;
  const chips = document.querySelectorAll(".agent .chip").length;
  const overlayText = document.getElementById("agent-overlay")?.textContent || "";
  const names = ["Axis", "Grid", "Align", "Glyph", "Kern", "Lead", "Lens", "Crop", "Frame", "Route", "Press", "Deck", "Atmos", "Polish", "Sentinel"];
  const nameHits = names.filter((n) => overlayText.includes(n)).length;
  const m = document.querySelector("#s-mono .s-letter")?.getBoundingClientRect();
  const ring = document.querySelector(".s-ring.r3")?.getBoundingClientRect();
  return {
    agents,
    chips,
    nameHits,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    sCenter: m ? { x: Math.round((m.left + m.right) / 2), y: Math.round((m.top + m.bottom) / 2) } : null,
    ringCenter: ring ? { x: Math.round((ring.left + ring.right) / 2), y: Math.round((ring.top + ring.bottom) / 2) } : null,
    vw: window.innerWidth,
    vh: window.innerHeight,
  };
});
console.log(JSON.stringify(checks, null, 2));

// 9 — skip flow from inside the loading sequence must hand over cleanly
await page.evaluate(() => window.__intro.seek(0.6));
await page.click("#ap-skip");
await page.waitForTimeout(2500);
const skip = await page.evaluate(() => ({
  overlayGone: !document.getElementById("agent-overlay"),
  introAttr: document.documentElement.getAttribute("data-intro"),
  layerCount: document.querySelectorAll("[data-layer]").length,
  leftoverClip: [...document.querySelectorAll("[data-layer]")].filter(
    (el) => getComputedStyle(el).clipPath.includes("inset")
  ).length,
}));
console.log(JSON.stringify(skip, null, 2));
await page.screenshot({ path: `${out}/09-after-skip.png` });

// 10 — natural completion: the existing construction tour still runs to the end
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__intro, null, { timeout: 10000 });
await page.waitForFunction(() => window.__intro.getState().duration > 0, null, { timeout: 10000 });
const dur = (await page.evaluate(() => window.__intro.getState())).duration;
await page.evaluate((d) => window.__intro.seek(Math.max(0, d - 0.15)), dur);
await page.waitForTimeout(3500);
const final = await page.evaluate(() => ({
  overlayGone: !document.getElementById("agent-overlay"),
  introAttr: document.documentElement.getAttribute("data-intro"),
  built: document.querySelectorAll(".layer-built").length,
  layers: document.querySelectorAll("[data-layer]").length,
  scrollY: Math.round(window.scrollY),
}));
console.log(JSON.stringify(final, null, 2));
await page.screenshot({ path: `${out}/10-after-tour.png` });

console.log("console/page errors:", errors.length ? errors : "none");
await browser.close();
