import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
await page.waitForSelector("#agent-overlay", { timeout: 15000 });
await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });

console.log("=== NAVBAR CONSTRUCTION CHECK ===\n");

// The navbar is owned by agent 10 (Route) and should be built during the hero section
// Let's check the hero section timeline around t=7-10s

async function probe(t, label) {
  await page.evaluate((v) => window.__intro.seek(v), t);
  await page.waitForTimeout(300);
  const data = await page.evaluate(() => {
    const nav = document.querySelector("nav[data-layer='nav.root']");
    const navClip = nav ? getComputedStyle(nav).clipPath : null;
    const agent10 = document.querySelector("g[data-agent='a-10']");
    const a10tr = agent10?.getAttribute("transform");
    const m = a10tr?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);

    return {
      time: window.__intro.getState().time,
      navExists: !!nav,
      navClip: navClip,
      navHidden: navClip && navClip.includes("inset"),
      agent10pos: m ? `${Math.round(+m[1])},${Math.round(+m[2])}` : "NONE",
      activity: document.getElementById("ap-activity")?.textContent || "",
    };
  });
  console.log(`t=${t} (${label})`);
  console.log(`  navbar hidden: ${data.navHidden ? "YES (clip)" : "NO"}`);
  console.log(`  agent 10 (Route) at: ${data.agent10pos}`);
  console.log(`  activity: "${data.activity}"`);
  console.log();
}

await probe(3.5, "S orbit — navbar should be hidden");
await probe(7.2, "openEnd — hero construction begins");
await probe(8.5, "hero construction — navbar should be building");
await probe(10, "mid hero construction");
await probe(12, "about section — navbar should be fully visible");

// Check which layers are assigned to agent 10
const navLayers = await page.evaluate(() => {
  const layers = [...document.querySelectorAll("[data-layer][data-owner='10']")];
  return layers.map((el) => ({
    id: el.dataset.layer,
    owner: el.dataset.owner,
    kind: el.dataset.kind,
    built: el.classList.contains("layer-built"),
  }));
});

console.log("=== LAYERS ASSIGNED TO AGENT 10 (Route - Navigation) ===");
console.log(JSON.stringify(navLayers, null, 2));

await browser.close();
