import { chromium } from "playwright";

async function debugVisibility() {
  console.log("🔍 Debugging 3D visibility issues\n");

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Collect all console messages
  page.on("console", (msg) => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    console.error(`[PAGE ERROR] ${err.message}`);
  });

  try {
    await page.goto("http://localhost:5173?intro=0", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Check what's actually visible
    console.log("\n📊 Checking visibility:\n");

    const aboutSection = await page.$("#about");
    const aboutVisible = await aboutSection?.isVisible();
    console.log(`About section: ${aboutVisible ? "✓ visible" : "✗ hidden"}`);

    const aboutCards = await page.$$("[data-layer^='about.s']");
    console.log(`About cards count: ${aboutCards.length}`);

    // Check computed styles
    if (aboutCards.length > 0) {
      const firstCard = aboutCards[0];
      const opacity = await firstCard.evaluate((el) => window.getComputedStyle(el).opacity);
      const display = await firstCard.evaluate((el) => window.getComputedStyle(el).display);
      const visibility = await firstCard.evaluate((el) => window.getComputedStyle(el).visibility);
      const transform = await firstCard.evaluate((el) => window.getComputedStyle(el).transform);

      console.log(`\nFirst About card styles:`);
      console.log(`  opacity: ${opacity}`);
      console.log(`  display: ${display}`);
      console.log(`  visibility: ${visibility}`);
      console.log(`  transform: ${transform}`);
    }

    // Check 3D context state
    const contextState = await page.evaluate(() => {
      return window.__set3DLayerState ? "✓ Context bridge set up" : "✗ No context bridge";
    });
    console.log(`\n3D Context: ${contextState}`);

    // Check if layers have construction state
    const layerStates = await page.evaluate(() => {
      const layers = document.querySelectorAll("[data-layer]");
      const states = {};
      layers.forEach((el) => {
        const id = el.dataset.layer;
        // Try to find parent with construction state info
        states[id] = {
          classList: el.className,
          opacity: window.getComputedStyle(el).opacity,
        };
      });
      return states;
    });

    console.log("\n📋 Layer states (first 5):");
    Object.entries(layerStates).slice(0, 5).forEach(([id, state]) => {
      console.log(`  ${id}: opacity=${state.opacity}`);
    });

    await page.screenshot({ path: "scripts/shots/debug-visibility.png", fullPage: true });
    console.log("\n📸 Screenshot saved to scripts/shots/debug-visibility.png");

    console.log("\n⏸️  Browser kept open for manual inspection. Press Ctrl+C when done.");
    await page.waitForTimeout(300000); // Keep open for 5 minutes

  } catch (err) {
    console.error("\n❌ Error:", err);
  } finally {
    await browser.close();
  }
}

debugVisibility().catch(console.error);
