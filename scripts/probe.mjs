import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5174/?intro=1", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const trace = await page.evaluate(()=>window.__introTrace||[]);
const s = await page.evaluate(()=>({
  overlay: !!document.getElementById("agent-overlay"),
  intro: !!window.__intro,
  di: document.documentElement.getAttribute("data-intro"),
}));
console.log("STATE:", JSON.stringify(s));
console.log("TRACE:\n"+trace.join("\n"));
await browser.close();
