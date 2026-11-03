// Experience Section Construction Verification
// Verifies that all experience items are hidden initially and revealed
// progressively during construction, synchronized with agent activity.

import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

console.log("Starting dev server verification...");
console.log("Navigating to http://localhost:5175/\n");

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });

// Wait for intro to initialize
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

console.log("✓ Construction intro initialized\n");

// Check initial state - all experience items must be hidden
console.log("=== INITIAL STATE CHECK ===");
const initialState = await page.evaluate(() => {
  const experienceItems = [...document.querySelectorAll('[data-layer^="experience.entry."]')];
  const dataIntro = document.documentElement.getAttribute('data-intro');

  return {
    dataIntro,
    itemCount: experienceItems.length,
    items: experienceItems.map((el, i) => ({
      layer: el.dataset.layer,
      owner: el.dataset.owner,
      isHidden: getComputedStyle(el).clipPath !== 'none',
      clipPath: getComputedStyle(el).clipPath,
      hasLayerBuilt: el.classList.contains('layer-built'),
      isVisible: el.offsetWidth > 0 && el.offsetHeight > 0,
    })),
  };
});

console.log(`data-intro="${initialState.dataIntro}"`);
console.log(`Experience items found: ${initialState.itemCount}`);
console.log();

initialState.items.forEach((item, i) => {
  const status = item.isHidden && !item.hasLayerBuilt ? "✓ HIDDEN" : "✗ VISIBLE PREMATURELY";
  console.log(`Item ${i}: ${item.layer}`);
  console.log(`  Owner: agent-${item.owner} | ${status}`);
  console.log(`  clipPath: ${item.clipPath}`);
});

const allHidden = initialState.items.every(item => item.isHidden && !item.hasLayerBuilt);
console.log(`\nAll items initially hidden: ${allHidden ? "✓ PASS" : "✗ FAIL"}`);

if (!allHidden) {
  console.log("\n⚠️  ISSUE DETECTED: Some experience items are visible before construction!");
  const visible = initialState.items.filter(item => !item.isHidden || item.hasLayerBuilt);
  console.log("Prematurely visible items:", visible.map(v => v.layer).join(", "));
}

console.log("\n=== CONSTRUCTION TIMELINE CHECK ===");

// Seek to just before Experience section construction
const state = await page.evaluate(() => window.__intro.getState());
const experienceLabel = state.labels?.experience;

if (experienceLabel) {
  console.log(`Experience section starts at t=${experienceLabel.toFixed(2)}s`);

  // Check state just before construction
  await page.evaluate((t) => window.__intro.seek(t - 0.5), experienceLabel);
  await page.waitForTimeout(300);

  const beforeConstruction = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[data-layer^="experience.entry."]')];
    return items.map(el => ({
      layer: el.dataset.layer,
      visible: !el.classList.contains('layer-built') && getComputedStyle(el).clipPath === 'none',
    }));
  });

  console.log("\nBefore construction (t=" + (experienceLabel - 0.5).toFixed(2) + "s):");
  beforeConstruction.forEach(item => {
    console.log(`  ${item.layer}: ${item.visible ? "✗ VISIBLE" : "✓ HIDDEN"}`);
  });

  // Seek to middle of Experience construction
  await page.evaluate((t) => window.__intro.seek(t + 2.0), experienceLabel);
  await page.waitForTimeout(300);

  const duringConstruction = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[data-layer^="experience.entry."]')];
    return items.map(el => ({
      layer: el.dataset.layer,
      built: el.classList.contains('layer-built'),
    }));
  });

  console.log("\nDuring construction (t=" + (experienceLabel + 2.0).toFixed(2) + "s):");
  duringConstruction.forEach(item => {
    console.log(`  ${item.layer}: ${item.built ? "✓ BUILT" : "⏳ BUILDING"}`);
  });

  // Seek to after Experience section
  await page.evaluate((t) => window.__intro.seek(t + 5.0), experienceLabel);
  await page.waitForTimeout(300);

  const afterConstruction = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[data-layer^="experience.entry."]')];
    return items.map(el => ({
      layer: el.dataset.layer,
      built: el.classList.contains('layer-built'),
      visible: getComputedStyle(el).clipPath === 'none',
    }));
  });

  console.log("\nAfter construction (t=" + (experienceLabel + 5.0).toFixed(2) + "s):");
  afterConstruction.forEach(item => {
    const status = item.built && item.visible ? "✓ COMPLETE" : "✗ NOT BUILT";
    console.log(`  ${item.layer}: ${status}`);
  });

  const allBuilt = afterConstruction.every(item => item.built && item.visible);
  console.log(`\nAll items constructed: ${allBuilt ? "✓ PASS" : "✗ FAIL"}`);
} else {
  console.log("⚠️  Experience section label not found in timeline");
}

console.log("\n=== AGENT VISIBILITY CHECK ===");
// Check that only assigned agents appear during Experience construction
await page.evaluate((t) => window.__intro.seek(t), experienceLabel);
await page.waitForTimeout(300);

const agentVisibility = await page.evaluate(() => {
  const agents = [...document.querySelectorAll('#agent-nodes g[data-agent]')];
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  return agents.map(g => {
    const transform = g.getAttribute('transform');
    const match = transform?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!match) return { id: g.dataset.agent, visible: false, pos: null };

    const x = parseFloat(match[1]);
    const y = parseFloat(match[2]);
    const visible = x >= -50 && x <= viewport.width + 50 && y >= -50 && y <= viewport.height + 50;

    return {
      id: g.dataset.agent,
      visible,
      pos: { x: Math.round(x), y: Math.round(y) },
    };
  });
});

const visibleAgents = agentVisibility.filter(a => a.visible);
console.log(`Agents on screen during Experience construction: ${visibleAgents.length}/15`);
visibleAgents.forEach(a => {
  console.log(`  ${a.id} at (${a.pos.x}, ${a.pos.y})`);
});

console.log("\n=== SUMMARY ===");
console.log(`Initial hide: ${allHidden ? "✓ PASS" : "✗ FAIL"}`);
console.log(`Construction sync: Check logs above`);
console.log(`Agent visibility: ${visibleAgents.length} agents visible (should be 1-3)`);

await page.waitForTimeout(2000);
await browser.close();

console.log("\n✓ Verification complete");
