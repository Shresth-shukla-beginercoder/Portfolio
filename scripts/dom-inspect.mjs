import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5174/?intro=0", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const secs = ["hero","about","skills","projects","experience","certifications","achievements","contact"];
  return {
    total: document.querySelectorAll("[data-layer]").length,
    ready: document.readyState,
    sections: secs.map(id => {
      const el = document.getElementById(id);
      const layers = el ? el.querySelectorAll("[data-layer]").length : -1;
      return id + ":" + layers;
    })
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
