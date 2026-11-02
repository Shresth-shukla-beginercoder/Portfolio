// Phase 7 — construction sync audit.
// Proves: (a) every [data-layer] in the ?intro=0 DOM is auto-discovered by
// the tour at the same viewport, (b) owners stay within agents 1..15,
// (c) the panel total matches, (d) post-tour DOM is clean (no overlay,
// no data-intro, no lock, no residual .layer-built, clip released) and
// matches the ?intro=0 DOM structure.
import { chromium } from "playwright";

const browser = await chromium.launch();
const V = { width: 1440, height: 900 };

const layerSnap = () => ({
  ids: [...document.querySelectorAll("[data-layer]")].map((el) => el.dataset.layer).sort(),
  owners: [...new Set([...document.querySelectorAll("[data-layer]")].map((el) => el.dataset.owner).filter(Boolean))],
  count: document.querySelectorAll("[data-layer]").length,
});

// 1) baseline from ?intro=0
const ctx1 = await browser.newContext({ viewport: V });
const p1 = await ctx1.newPage();
await p1.goto("http://localhost:5175/?intro=0", { waitUntil: "networkidle" });
await p1.waitForTimeout(1500);
const baseline = await p1.evaluate(layerSnap);
console.log("baseline ?intro=0:", baseline.count, "layers; owners:", baseline.owners.sort().join(","));

// 2) tour path discovery
const ctx2 = await browser.newContext({ viewport: V });
const p2 = await ctx2.newPage();
const errors = [];
p2.on("pageerror", (e) => errors.push("pageerror: " + e.message));
p2.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await p2.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await p2.waitForSelector("#agent-overlay", { timeout: 15000 });
await p2.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });
const tour = await p2.evaluate(() => {
  const layerSnap = () => ({
    ids: [...document.querySelectorAll("[data-layer]")].map((el) => el.dataset.layer).sort(),
    owners: [...new Set([...document.querySelectorAll("[data-layer]")].map((el) => el.dataset.owner).filter(Boolean))],
    count: document.querySelectorAll("[data-layer]").length,
  });
  const s = layerSnap();
  return {
    ids: window.__intro.ids().sort(),
    panelTotal: parseInt((document.getElementById("ap-layers")?.textContent || "").match(/\/ (\d+)/)?.[1] ?? -1),
    ...s,
  };
});
const missing = baseline.ids.filter((id) => !tour.ids.includes(id));
const extra = tour.ids.filter((id) => !baseline.ids.includes(id));
const badOwners = tour.owners.filter((o) => !(o >= 1 && o <= 15));
console.log("tour ids:", tour.ids.length, "| panel '0 / N':", tour.panelTotal, "| owners:", tour.owners.sort().join(","));
console.log("baseline-only layers (excluded from tour):", JSON.stringify(missing));
console.log("tour-only layers:", JSON.stringify(extra));
console.log("owners outside 1..15:", badOwners.length ? badOwners : "none");

// 3) run to the natural end
const dur = await p2.evaluate(() => window.__intro.getState().duration);
await p2.evaluate((v) => window.__intro.seek(v), dur - 0.03);
await p2.waitForFunction(() => window.__intro.getState().finished, null, { timeout: 30000 });
await p2.waitForTimeout(1400); // teardown fade
const after = await p2.evaluate(() => ({
  overlay: !!document.getElementById("agent-overlay"),
  dataIntro: document.documentElement.getAttribute("data-intro"),
  lock: document.documentElement.classList.contains("intro-interaction-lock"),
  layerBuilt: document.querySelectorAll(".layer-built").length,
  clip: (el) => { const e = document.querySelector(el); return e ? getComputedStyle(e).clipPath : "n/a"; },
  heroClip: null,
}));
after.heroClip = await p2.evaluate(() => {
  const e = document.querySelector("[data-layer='hero.headline']");
  return e ? getComputedStyle(e).clipPath : "n/a";
});
after.trailCanvas = await p2.evaluate(() => !!document.getElementById("trail-canvas"));
console.log("post-tour:", JSON.stringify({ overlay: after.overlay, dataIntro: after.dataIntro, lock: after.lock, layerBuilt: after.layerBuilt, heroClip: after.heroClip, trailCanvas: after.trailCanvas }));

// 4) structural identity vs baseline (same ids, no residual state)
const afterSnap = await p2.evaluate(layerSnap);
const structuralDrift = baseline.ids.filter((id) => !afterSnap.ids.includes(id));
console.log("layers lost after tour:", structuralDrift.length ? structuralDrift : "none");
console.log("errors:", errors.length ? errors : "none");
await browser.close();
