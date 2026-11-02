import { chromium } from "playwright";
const b = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await b.newContext({
  viewport: { width: 1300, height: 900 },
  locale: "en-US",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
});
const page = await ctx.newPage();
const out = { ok: false };
try {
  await page.goto("https://www.linkedin.com/in/shresth-shukla-9117b6296/", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  // Wait for the initial HTML to settle — meta/og tags are in there before the modal blocks
  await page.waitForTimeout(3000);

  // 1. Grab all meta/og tags
  out.meta = await page.evaluate(() => {
    const metas = [...document.querySelectorAll("meta")];
    const result = {};
    for (const m of metas) {
      const name = m.getAttribute("name") || m.getAttribute("property") || "";
      const content = m.getAttribute("content");
      if (content && content.length > 2) result[name] = content;
    }
    return result;
  });

  // 2. Check for embedded JSON-LD structured data
  out.jsonLd = await page.evaluate(() => {
    const scripts = [...document.querySelectorAll('script[type="ld+json"]')];
    return scripts.map((s) => {
      try { return JSON.parse(s.textContent); } catch { return s.textContent.slice(0, 2000); }
    });
  });

  // 3. Check for profile name in body innerText (sometimes the page title + some text are visible)
  const bodyText = await page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, "\n").trim());
  out.bodyTextSample = bodyText.slice(0, 3000);

  // 4. Also check the document title which often contains the name + headline
  out.title = await page.title();

  out.ok = true;
} catch (e) {
  out.error = String(e).slice(0, 300);
}
await ctx.close();
await b.close();
console.log(JSON.stringify(out, null, 2));
