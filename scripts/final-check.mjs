import { chromium } from "playwright";
const URL = "http://localhost:5173/";
const b = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const failed = [];
page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().split("/").pop()}`); });
await page.goto(URL, { waitUntil: "load" });
await page.waitForTimeout(500);
await page.evaluate(() => document.getElementById("skip-intro")?.click());
await page.waitForTimeout(900);

const res = await page.evaluate(() => {
  const text = (sel) => document.querySelector(sel)?.textContent?.trim() || "";
  const heroBio = text("#hero");
  // find the contact email link
  const emailLink = [...document.querySelectorAll("a[href^='mailto:']")].map((a) => a.href);
  const contactText = text("#contact");
  // yelp card: find it and read its tags
  const cards = [...document.querySelectorAll("#projects [data-project-card], #projects article, #projects li")];
  let yelp = null;
  for (const c of document.querySelectorAll("#projects *")) {
    if (c.textContent && /YelpCamp/.test(c.textContent) && c.textContent.length < 400) { yelp = c.textContent.trim(); break; }
  }
  return {
    heroBioHas: heroBio.includes("building real-world projects") ? "bio-updated" : heroBio.slice(0, 120),
    emailLinks: emailLink,
    contactHasGmail: contactText.includes("shresthshukla1234@gmail.com"),
    yelpSnippet: yelp ? yelp.replace(/\s+/g, " ").slice(0, 200) : "yelp-card-not-found",
  };
});

await ctx.close();
await b.close();
console.log(JSON.stringify({ ...res, failed: [...new Set(failed)] }, null, 2));
