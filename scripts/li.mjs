import { chromium } from "playwright";
const launch = () =>
  chromium.launch({
    headless: true,
    channel: "chrome",
  });

// 1) re-capture the correct YelpCamp deploy
{
  const b = await launch();
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  try {
    await page.goto("https://yelp-camp-tau-mocha.vercel.app/", { waitUntil: "networkidle", timeout: 25000 });
    await page.waitForTimeout(1500);
    const title = await page.title();
    await page.screenshot({ path: "src/assets/images/projects/yelpcamp.jpg", type: "jpeg", quality: 82 });
    console.log("YELPCAMP capture:", title || "(no title)");
  } catch (e) {
    console.log("YELPCAMP capture FAIL:", String(e).slice(0, 120));
  } finally {
    await ctx.close();
    await b.close();
  }
}

// 2) read the public LinkedIn profile
{
  const b = await launch();
  const ctx = await b.newContext({
    viewport: { width: 1300, height: 900 },
    locale: "en-US",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  const out = { ok: false, title: null, text: null };
  try {
    await page.goto("https://www.linkedin.com/in/shresth-shukla-9117b6296/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
    // dismiss any auth modal so the underlying profile DOM is readable
    try {
      const close = page.locator('button[aria-label="Close"], .modal-header__button, button[class*="Dismiss"]');
      if (await close.count()) await close.first().click({ timeout: 1500 });
      else await page.keyboard.press("Escape");
      await page.waitForTimeout(1500);
    } catch {}
    out.title = await page.title();
    // grab section text by their data-test hooks, fall back to body text
    const grab = async (sel) => {
      const els = page.locator(sel);
      const n = await els.count();
      const parts = [];
      for (let i = 0; i < n && i < 6; i++) parts.push((await els.nth(i).innerText()).trim());
      return parts.filter(Boolean).join(" | ");
    };
    out.about = await grab('[data-test="root__about"]');
    out.exp = await grab('[data-test="experience__item-list"], [aria-label="Experience"] section');
    out.edu = await grab('[data-test="education__item-list"], [aria-label="Education"] section');
    out.skills = await grab('[data-test="skills-list"], [aria-label="Skills"] section');
    const body = await page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, "\n").trim());
    out.text = body.slice(0, 5000);
    out.ok = /experience|about|education|skill/i.test(out.text || "");
    await page.screenshot({ path: "scripts/shots/linkedin.png", fullPage: false });
  } catch (e) {
    out.error = String(e).slice(0, 200);
  } finally {
    await ctx.close();
    await b.close();
  }
  console.log(JSON.stringify(out, null, 2));
}
