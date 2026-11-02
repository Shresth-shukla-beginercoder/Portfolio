import { chromium } from "playwright";

const browser = await chromium.launch();

async function freshPage() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:5175/", { waitUntil: "networkidle" });
  await page.waitForSelector("#agent-overlay", { timeout: 15000 });
  await page.waitForFunction(() => window.__intro && window.__intro.getState().duration > 0, null, { timeout: 10000 });
  return page;
}

const arrowDump = () => {
  const uses = [...document.querySelectorAll("#agent-svg g[data-agent]")];
  return uses.map((g) => {
    const m = g.getAttribute("transform")?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    return m ? [Math.round(+m[1]), Math.round(+m[2])] : null;
  });
};

// ---- PASS 1: live playthrough of the S orbit window (no seeking) ----
console.log("=== LIVE PLAY: S orbit window (arrows must orbit continuously) ===");
const p1 = await freshPage();
const st = await p1.evaluate(() => window.__intro.getState());
console.log(`intro started, duration ${st.duration.toFixed(1)}s — waiting until t>3.1 (orbit window), sampling live for ~4s`);
await p1.waitForFunction(() => {
  const s = window.__intro.getState();
  return s.time > 3.1 && s.time < 5.5;
}, null, { timeout: 15000 });
const live = [];
for (let i = 0; i < 4; i++) {
  await p1.waitForTimeout(1000);
  live.push(await p1.evaluate(arrowDump));
}
const t0 = live[0], t1 = live[1], t2 = live[2];
const moved = (a, b) => a.length && b.length && Math.abs(a[0][0] - b[0][0]) + Math.abs(a[0][1] - b[0][1]);
const a12 = moved(t0, t1), a23 = moved(t1, t2);
console.log(`a-01: ${t0[0]} → ${t1[0]} → ${t2[0]} → ${live[3][0]}`);
console.log(`orbit still turning between samples: ${a12 > 30 && a23 > 10 ? "YES ✓" : "NO ✗"} (moved ${Math.round(a12)}px, ${Math.round(a23)}px per second)`);
await p1.close();

// ---- PASS 2: seek probes of the whole tour (no live waits) ----
const p2 = await freshPage();
const dur = await p2.evaluate(() => window.__intro.getState().duration);
console.log(`\ntimeline duration: ${dur.toFixed(2)}s\n`);

async function probe(t, label) {
  await p2.evaluate((v) => window.__intro.seek(v), t);
  await p2.waitForTimeout(250);
  const data = await p2.evaluate(arrowDump);
  const onScreen = data.filter((p) => p && p[0] >= -50 && p[0] <= 1490 && p[1] >= -50 && p[1] <= 950).length;
  console.log(`t=${t} (${label})  onScreen: ${onScreen}/15`);
  console.log("  " + data.map((p, i) => p ? `${i + 1}:${p[0]},${p[1]}` : `${i + 1}:NOPOS`).join(" "));
  return data;
}

console.log("=== OPENING: S + orbiting arrows ===");
await probe(3.6, "orbit — circling the S");
await probe(5.5, "hold — still circling, NOT static");

console.log("\n=== TRANSITION: all 15 leave the circle ===");
await probe(7.0, "dispatch — arrows in flight / parking, none frozen in circle");

console.log("\n=== CONSTRUCTION: only working agents on screen ===");
await probe(12, "mid-construction");
await probe(20, "later construction");

console.log("\n=== FINALE: gather into S, spread, all disappear ===");
const finale = dur - 3.8 - 0.4;
await probe(finale + 0.5, "gather — 15 near center forming the S");
await probe(dur - 0.3, "end — every arrow outside the viewport");

await p2.close();
await browser.close();
