import { chromium } from "playwright";

async function verify3DExperience() {
  console.log("🚀 Verifying 3D Interactive Experience\n");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  try {
    // Navigate to local dev server
    console.log("📍 Loading http://localhost:5173");
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

    // Wait for React to render
    await page.waitForTimeout(2000);

    // Check for console errors
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Skip intro for faster testing
    await page.goto("http://localhost:5173?intro=0", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Test 1: Check 3D components are rendering
    console.log("\n✓ Testing 3D component rendering...");
    const aboutCards = await page.$$("[data-layer^='about.s']");
    if (aboutCards.length === 6) {
      results.passed.push(`About cards: ${aboutCards.length}/6 rendered`);
    } else {
      results.failed.push(`About cards: Only ${aboutCards.length}/6 rendered`);
    }

    const skillBars = await page.$$("[data-layer^='skills.bar']");
    if (skillBars.length === 7) {
      results.passed.push(`Skill tiles: ${skillBars.length}/7 rendered`);
    } else {
      results.failed.push(`Skill tiles: Only ${skillBars.length}/7 rendered`);
    }

    const projectCards = await page.$$("[data-layer^='projects.card.']");
    if (projectCards.length >= 4) {
      results.passed.push(`Project cards: ${projectCards.length} rendered`);
    } else {
      results.failed.push(`Project cards: Only ${projectCards.length} rendered`);
    }

    // Test 2: Check portrait is present
    console.log("✓ Testing portrait...");
    const portrait = await page.$("[data-layer='hero.portrait']");
    if (portrait) {
      results.passed.push("Portrait element present");
    } else {
      results.failed.push("Portrait element missing");
    }

    // Test 3: Check links are functional
    console.log("✓ Testing project links...");
    const repoLinks = await page.$$("a[href*='github.com']");
    if (repoLinks.length >= 4) {
      results.passed.push(`GitHub links: ${repoLinks.length} found`);
    } else {
      results.warnings.push(`GitHub links: Only ${repoLinks.length} found`);
    }

    const liveLinks = await page.$$("a[href*='vercel.app'], a[href*='render.com']");
    if (liveLinks.length >= 3) {
      results.passed.push(`Live demo links: ${liveLinks.length} found`);
    } else {
      results.warnings.push(`Live demo links: Only ${liveLinks.length} found`);
    }

    // Test 4: Check no horizontal overflow
    console.log("✓ Testing layout...");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    if (bodyWidth <= windowWidth + 5) {
      results.passed.push("No horizontal overflow");
    } else {
      results.failed.push(`Horizontal overflow: ${bodyWidth}px body vs ${windowWidth}px viewport`);
    }

    // Test 5: Console errors
    console.log("✓ Checking console...");
    if (errors.length === 0) {
      results.passed.push("No console errors");
    } else {
      results.failed.push(`Console errors: ${errors.length}`);
      errors.slice(0, 3).forEach((err) => {
        console.log(`   ❌ ${err}`);
      });
    }

    // Capture screenshots
    console.log("\n📸 Capturing screenshots...");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: "scripts/shots/3d-desktop.png", fullPage: true });
    console.log("   ✓ Desktop screenshot saved");

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: "scripts/shots/3d-tablet.png", fullPage: true });
    console.log("   ✓ Tablet screenshot saved");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: "scripts/shots/3d-mobile.png", fullPage: true });
    console.log("   ✓ Mobile screenshot saved");

    // Test with construction intro
    console.log("\n🔨 Testing construction intro...");
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const sMonogram = await page.$("#s-mono");
    if (sMonogram) {
      results.passed.push("S monogram present");
    } else {
      results.warnings.push("S monogram not found (intro may have finished)");
    }

    await page.screenshot({ path: "scripts/shots/3d-construction.png" });
    console.log("   ✓ Construction screenshot saved");

  } catch (err) {
    results.failed.push(`Test error: ${err.message}`);
    console.error("\n❌ Error during verification:", err);
  } finally {
    await browser.close();
  }

  // Print results
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION RESULTS");
  console.log("=".repeat(60));

  if (results.passed.length > 0) {
    console.log("\n✅ PASSED:");
    results.passed.forEach((msg) => console.log(`   ✓ ${msg}`));
  }

  if (results.warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    results.warnings.forEach((msg) => console.log(`   ⚠ ${msg}`));
  }

  if (results.failed.length > 0) {
    console.log("\n❌ FAILED:");
    results.failed.forEach((msg) => console.log(`   ✗ ${msg}`));
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Summary: ${results.passed.length} passed, ${results.warnings.length} warnings, ${results.failed.length} failed`);
  console.log("=".repeat(60) + "\n");

  return results.failed.length === 0;
}

verify3DExperience()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
