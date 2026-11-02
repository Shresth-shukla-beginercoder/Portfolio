import { chromium } from "playwright";
const URL = "http://localhost:5173/";
const b = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const failed = [];
page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().split("/").pop()}`); });
page.on("pageerror", (e) => failed.push("pageerror: " + String(e).slice(0, 120)));
await page.goto(URL, { waitUntil: "load" });
await page.waitForTimeout(500);
await page.evaluate(() => document.getElementById("skip-intro")?.click());
await page.waitForTimeout(900);

// hero
await page.locator("#hero").screenshot({ path: "scripts/shots/hero.png" });
const hero = await page.evaluate(() => ({
  h2: document.querySelector("#hero h2")?.textContent?.trim(),
  chips: [...document.querySelectorAll("#hero .rounded-full")].map((c) => c.textContent.trim()),
}));

// certifications — images
await page.evaluate(() => document.getElementById("certifications")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(1200);
const certs = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("#certifications img")].map((im) => ({
    src: im.src.split("/").pop(),
    loaded: im.complete && im.naturalWidth > 0,
    w: im.naturalWidth,
  }));
  const titles = [...document.querySelectorAll("#certifications h3")].map((h) => h.textContent.trim());
  return { imgs, titles };
});
await page.locator("#certifications").screenshot({ path: "scripts/shots/certifications.png" });

// skills
await page.evaluate(() => document.getElementById("skills")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(900);
const skills = await page.evaluate(() =>
  [...document.querySelectorAll("#skills [data-skill-bar]")].length || document.querySelectorAll("#skills .skill-name, #skills h3").length
);
const skillText = await page.evaluate(() => document.getElementById("skills")?.innerText?.replace(/\s+/g, " ").slice(0, 300));

// contact mailto
await page.evaluate(() => document.getElementById("contact")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(700);
const mailto = await page.evaluate(() => [...document.querySelectorAll("a[href^='mailto:']")].map((a) => a.href));

await ctx.close();
await b.close();
console.log(JSON.stringify({ hero, certs, skills, skillText, mailto, failed: [...new Set(failed)] }, null, 2));
