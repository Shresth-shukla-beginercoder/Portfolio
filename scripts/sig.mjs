import { chromium } from "playwright";
const URL = "http://localhost:5173/";
const launch = () => chromium.launch({ headless: true, channel: "chrome" });

const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1000, height: 800 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "load" });
await page.waitForTimeout(600);
await page.evaluate(() => document.getElementById("skip-intro")?.click());
await page.waitForTimeout(1200);
await page.evaluate(() => document.getElementById("sign-off")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(4500); // let the signature draw
const info = await page.evaluate(() => {
  const strokes = [...document.querySelectorAll("#sign-off .sig-stroke")];
  const vis = strokes.filter((el) => { const c = getComputedStyle(el); return parseFloat(c.strokeDashoffset) < 5; }).length;
  return { total: strokes.length, drawn: vis, penVisible: getComputedStyle(document.querySelector(".sig-pen")).opacity };
});
await page.locator("#sign-off").screenshot({ path: "scripts/shots/signoff.png" });
console.log(JSON.stringify(info));
await ctx.close(); await b.close();
