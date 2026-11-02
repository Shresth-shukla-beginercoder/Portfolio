import { chromium } from "playwright";
import { writeFile } from "fs/promises";

const URL = "http://localhost:5176/";

async function captureHeroScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Desktop
  const desktop = await context.newPage();
  await desktop.setViewportSize({ width: 1440, height: 900 });
  await desktop.goto(URL + "?intro=0", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(2000);
  await desktop.screenshot({ path: "scripts/shots/hero-desktop.png", fullPage: false });

  // Tablet
  const tablet = await context.newPage();
  await tablet.setViewportSize({ width: 768, height: 1024 });
  await tablet.goto(URL + "?intro=0", { waitUntil: "networkidle" });
  await tablet.waitForTimeout(2000);
  await tablet.screenshot({ path: "scripts/shots/hero-tablet.png", fullPage: false });

  // Mobile
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(URL + "?intro=0", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(2000);
  await mobile.screenshot({ path: "scripts/shots/hero-mobile.png", fullPage: false });

  // Test construction intro
  const intro = await context.newPage();
  await intro.setViewportSize({ width: 1440, height: 900 });
  console.log("Loading page with construction intro...");
  await intro.goto(URL, { waitUntil: "networkidle" });

  // Wait for intro to start
  await intro.waitForTimeout(1000);

  // Check if S monogram appears
  const sMonoVisible = await intro.locator("#s-mono").isVisible().catch(() => false);
  console.log("S monogram visible:", sMonoVisible);

  // Check if agents are spawned
  const agents = await intro.locator(".agent").count();
  console.log("Number of agents:", agents);

  // Check if hero layers are registered
  const heroLayers = await intro.locator('[data-layer^="hero."]').count();
  console.log("Hero layers registered:", heroLayers);

  // Check if nav layers are registered
  const navLayers = await intro.locator('[data-layer^="nav."]').count();
  console.log("Nav layers registered:", navLayers);

  // Wait a bit more to see construction
  await intro.waitForTimeout(3000);
  await intro.screenshot({ path: "scripts/shots/hero-construction.png" });

  // Check if portrait is visible
  const portraitVisible = await intro.locator('[data-hero-photo]').isVisible().catch(() => false);
  console.log("Portrait visible:", portraitVisible);

  // Check console errors
  const errors = [];
  intro.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  await intro.waitForTimeout(2000);

  if (errors.length > 0) {
    console.log("\n❌ Console errors detected:");
    errors.forEach((err) => console.log("  -", err));
  } else {
    console.log("\n✅ No console errors");
  }

  await browser.close();

  return {
    sMonoVisible,
    agents,
    heroLayers,
    navLayers,
    portraitVisible,
    errors: errors.length,
  };
}

console.log("Starting hero redesign verification...\n");

const results = await captureHeroScreenshots();

console.log("\n=== VERIFICATION RESULTS ===");
console.log("S Monogram:", results.sMonoVisible ? "✅ Visible" : "❌ Not visible");
console.log("Agents spawned:", results.agents === 15 ? `✅ ${results.agents}/15` : `❌ ${results.agents}/15`);
console.log("Hero layers:", results.heroLayers > 0 ? `✅ ${results.heroLayers}` : `❌ ${results.heroLayers}`);
console.log("Nav layers:", results.navLayers > 0 ? `✅ ${results.navLayers}` : `❌ ${results.navLayers}`);
console.log("Portrait:", results.portraitVisible ? "✅ Visible" : "❌ Not visible");
console.log("Console errors:", results.errors === 0 ? "✅ None" : `❌ ${results.errors}`);

console.log("\n📸 Screenshots saved:");
console.log("  - scripts/shots/hero-desktop.png");
console.log("  - scripts/shots/hero-tablet.png");
console.log("  - scripts/shots/hero-mobile.png");
console.log("  - scripts/shots/hero-construction.png");

const report = {
  timestamp: new Date().toISOString(),
  passed: results.sMonoVisible && results.agents === 15 && results.heroLayers > 0 && results.navLayers > 0 && results.portraitVisible && results.errors === 0,
  results,
};

await writeFile("scripts/shots/hero-verification.json", JSON.stringify(report, null, 2));
console.log("\n✅ Verification complete!");
