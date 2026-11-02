import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

async function probe(t, label) {
  await page.evaluate((v) => window.__intro.seek(v), t);
  await page.waitForTimeout(350);
  const pos = await page.evaluate(() => {
    const gs = document.querySelectorAll("#agent-svg g[data-agent]");
    const out = [];
    gs.forEach((g) => {
      const m = g.getAttribute("transform")?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
      if (m) out.push({ id: g.dataset.agent, x: Math.round(+m[1]), y: Math.round(+m[2]) });
    });
    return out;
  });
  console.log(`--- ${label} (seek ${t}) ---`);
  console.log(pos.map((p) => `${p.id}:${p.x},${p.y}`).join("  "));
}

await probe(1.5, "mid wave-flight (a-01..05 should be between start & orbit)");
await probe(2.2, "after wave 1, mid wave 2");
await probe(3.2, "sync orbit");
await probe(5.0, "hold — should still be ORBITING, not static");
await probe(6.2, "just after break");

// inspect the flight tweens on the master timeline
const tweenInfo = await page.evaluate(() => {
  const tl = window.__intro.getTL ? window.__intro.getTL() : null;
  return {
    canInspect: !!tl,
    time: window.__intro.getState().time,
  };
});
console.log("\ntweenInfo:", JSON.stringify(tweenInfo));

await browser.close();
