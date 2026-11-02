import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

// Seek to hero construction phase and check where navbar layers are measured
await page.evaluate(() => window.__intro.seek(8.0));
await page.waitForTimeout(300);

const navData = await page.evaluate(() => {
  const navLayers = [...document.querySelectorAll("[data-layer][data-owner='10']")]
    .filter((el) => el.dataset.layer.startsWith("nav."));

  return navLayers.map((el) => {
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    return {
      id: el.dataset.layer,
      viewport: { x: Math.round(rect.left), y: Math.round(rect.top), w: Math.round(rect.width), h: Math.round(rect.height) },
      document: { x: Math.round(rect.left), y: Math.round(rect.top + scrollY), w: Math.round(rect.width), h: Math.round(rect.height) },
      visible: rect.top >= 0 && rect.top < 900,
    };
  });
});

console.log("=== NAVBAR LAYER MEASUREMENTS (t=8.0, during hero construction) ===");
console.log(JSON.stringify(navData, null, 2));

console.log("\n=== ANALYSIS ===");
navData.forEach((layer) => {
  const target = { x: layer.document.x + layer.document.w / 2, y: layer.document.y + layer.document.h / 2 };
  const viewportY = target.y - 0; // scrollY is near 0 during hero
  console.log(`${layer.id}: target doc(${target.x}, ${target.y}) → viewport y=${viewportY} ${viewportY < 0 || viewportY > 900 ? "✗ OFF-SCREEN" : "✓ on-screen"}`);
});

await browser.close();
