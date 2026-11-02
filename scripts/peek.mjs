import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = "scripts/shots/peek"; mkdirSync(out, {recursive:true});
const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{width:1440,height:900} });
await page.goto("http://localhost:5175/", { waitUntil:"networkidle" });
await page.waitForSelector("#agent-overlay", {timeout:15000});
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration>0, null, {timeout:10000});
for (const [name,t] of [["s-only",0.6],["scanA",1.2],["wave",2.0],["orbit",3.6],["hold",5.0],["break",6.4],["dispatch",7.0]]) {
  await page.evaluate(v=>window.__intro.seek(v), t);
  await page.waitForTimeout(300);
  await page.screenshot({path:`${out}/${name}.png`});
  console.log("shot", name, "@", t);
}
await browser.close();
