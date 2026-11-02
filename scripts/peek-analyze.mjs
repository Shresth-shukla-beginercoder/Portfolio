import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{width:1440,height:900} });
await page.goto("http://localhost:5175/", { waitUntil:"networkidle" });
await page.waitForSelector("#agent-overlay", {timeout:15000});
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration>0, null, {timeout:10000});

async function analyze(name, t) {
  await page.evaluate(v=>window.__intro.seek(v), t);
  await page.waitForTimeout(300);
  const b64 = await page.evaluate(async () => {
    const c = document.createElement("canvas"); c.width = innerWidth; c.height = innerHeight;
    // draw the overlay layers we care about? Can't grab the whole page render easily;
    // instead measure the actual DOM/SVG geometry, which is the source of truth.
    const out = {};
    const mono = document.getElementById("s-mono");
    out.monoTransform = mono?.getAttribute("transform");
    // every element in the SVG with a red-ish stroke
    const reds = [];
    document.querySelectorAll("#agent-svg *").forEach(el => {
      const s = el.getAttribute("stroke") || getComputedStyle(el).stroke;
      const m = s && s.match(/(\d+)/g);
      if (s && (m && m[0] >= 180 && Number(m[1] || 0) < 160 && Number(m[2] || 0) < 160)) {
        const r = el.getBoundingClientRect();
        reds.push({ tag: el.tagName.toLowerCase(), cls: el.getAttribute("class")||"", stroke: s,
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          opacity: getComputedStyle(el).opacity });
      }
    });
    out.reds = reds;
    // trail canvas: is it there, and what fraction of its area is non-empty
    const tc = document.getElementById("trail-canvas");
    out.trailCanvas = !!tc;
    return JSON.stringify(out);
  });
  console.log(`\n=== ${name} @ ${t} ===`);
  console.log(b64);
}
await analyze("s-only", 0.6);
await analyze("orbit", 3.6);
await analyze("break", 6.4);
await browser.close();
