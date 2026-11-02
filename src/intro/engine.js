import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import CustomEase from "gsap/CustomEase";
import { AGENTS, SECTIONS } from "../data/agents.js";
import * as SFX from "./sfx.js";
import { TIMINGS, ORBIT } from "./intro-config.js";
import { initTrails } from "./trails.js";
import "./interaction-lock.css";

gsap.registerPlugin(ScrollToPlugin, CustomEase);
// Signature "silky" ease: fast commit out of the gate, long graceful settle.
// Standard cubic-bezier format (4 values: x1, y1, x2, y2)
try {
  CustomEase.create("silk", "M0,0 C0.16,1 0.3,1 1,1");
} catch (e) {
  console.error("[intro] CustomEase.create('silk') failed:", e);
}

/*
 * 15-agent construction tour over the REAL portfolio.
 *
 * Architecture (see docs/INTRO_FIX_REPORT.md for the root causes this fixes):
 *  - The overlay SVG is position:fixed; agent nodes live in VIEWPORT coordinates.
 *    Their targets are measured from the real DOM (getBoundingClientRect + scroll
 *    offset = document coords), and every frame they retarget against the tour's
 *    PLANNED scroll:  viewportY = docY - scrollAt(t).
 *  - One master timeline drives auto-scroll (ScrollToPlugin) and every flight,
 *    selection box, measurement guide and reveal. No ScrollTrigger scrub.
 *  - While [data-intro=active] is on <html>, every [data-layer] element is
 *    clip-hidden (inset, so zero layout shift) until its agent builds it.
 *    Reveals animate the clip back, mark .layer-built and clearProps — released
 *    layers stay released, so constructed sections remain visible as the tour
 *    scrolls on. Nothing is ever "revealed" wholesale.
 *  - The real page (black + deep-red design) is visible the whole time; the
 *    scanning layer works over it, never over an empty background.
 *  - window.__intro exposes seek/getState/skip/pause/resume for verification.
 */

const SWEEP = 1.1;        // agents 1-3 inspect the real section
const SCAN = 1.0;         // selection box + measurement guides
const REVEAL = 0.8;       // element gets built
const SCROLL_DUR = 1.0;
const VERIFY = 0.7;       // Sentinel check per section
const GAP = 0.35;
const FINALE = 3.8;
const HEADER = 70;

// Idle-management geometry for the agent flights:
const ENTER = 0.65;      // curved re-entry to a task position
const EXIT_DUR = 0.55;   // curved exit to the nearest screen edge
const IDLE_GAP = 1.5;    // task gap above which an agent parks off-screen

const STEP = SCAN * 0.6;  // layer cadence

let tl = null;
let agents = [];
let layers = [];
let sectionEls = [];
let plan = [];            // {t, dur, from, to} — planned window scrollY
let doneTimes = [];
let layerTimes = {};      // layer id -> reveal start time (for verification)
let agentEvents = [];    // per-agent task list, filled by the tour pass
const childTLs = [];      // child timelines (scan boxes, verify marks) — killed in teardown
let paused = false;
let finished = false;
let started = false;
const listeners = [];
const mono = { R: 120, cx: 0, cy: 0 };   // S monogram geometry (viewport space)

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const byId = new Map(AGENTS.map((a) => [a.num, a]));

/* ---------- overlay DOM ---------- */
function buildOverlay() {
  const root = document.createElement("div");
  root.id = "agent-overlay";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <svg id="agent-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <symbol id="arrow-cursor" viewBox="-16 -16 32 32">
          <path d="M0 -13 L8 7 L2.4 5.2 L0 12 L-2.4 5.2 L-8 7 Z" />
        </symbol>
        <filter id="s-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feFlood flood-color="#ff5a3c" flood-opacity="0.55" result="c" />
          <feComposite in="c" in2="b" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g id="s-mono" opacity="0">
        <g class="s-rings">
          <circle class="s-ring r1" r="0" fill="none" stroke="rgba(255,90,60,0.35)" stroke-width="1" />
          <circle class="s-ring r2" r="0" fill="none" stroke="rgba(255,215,94,0.22)" stroke-width="1" stroke-dasharray="2 6" />
          <circle class="s-ring r3" r="0" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1" />
          <g class="s-ticks"></g>
        </g>
        <!-- One-shot shockwave that fires on the break moment, then stays hidden. -->
        <circle class="s-pulse" r="0" fill="none" stroke="#ff5a3c" stroke-width="2" opacity="0" />
        <path class="s-letter" opacity="0" d="M 92 8 L 20 8 L 8 20 L 8 44 L 20 56 L 76 56 L 92 68 L 92 104 L 20 104 L 8 92"
          transform="translate(-50 -56) scale(1)" fill="none" stroke="#ff5a3c" stroke-width="14"
          stroke-linecap="square" stroke-linejoin="miter" filter="url(#s-glow)" />
      </g>
      <g id="agent-nodes"></g>
    </svg>
    <div id="scan-layer"></div>
    <aside id="agent-panel">
      <div class="ap-row">
        <span id="ap-stage">INTRODUCING</span>
        <span id="ap-status">TOURING</span>
      </div>
      <div id="ap-dots"></div>
      <div class="ap-row">
        <span id="ap-section">01 / 08</span>
        <span id="ap-layers">0 / 0</span>
      </div>
      <div id="ap-activity">&nbsp;</div>
      <div id="ap-bar"><div id="ap-bar-fill"></div></div>
      <div class="ap-row ap-actions">
        <button id="ap-pause" type="button">Pause</button>
        <button id="ap-skip" type="button">Skip intro</button>
        <button id="ap-mute" type="button" aria-label="Toggle sound">${SFX.enabled() ? "SOUND ON" : "SOUND OFF"}</button>
      </div>
    </aside>`;
  document.body.appendChild(root);

  const dots = $("ap-dots");
  dots.innerHTML = AGENTS.map(
    (a) => `<span class="ap-dot" data-agent="${a.id}" style="background:${a.color}"></span>`
  ).join("");
  return root;
}

function spawnAgents() {
  const g = $("agent-nodes");
  agents = AGENTS.map((a, idx) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("class", "agent");
    node.setAttribute("data-agent", a.id);
    // Trail is no longer an SVG polyline — the pooled canvas in trails.js
    // renders it (one draw pass, zero DOM churn). Only the arrow body here.
    node.innerHTML = `<use href="#arrow-cursor" width="30" height="30" x="-15" y="-15" fill="${a.color}" stroke="#05060a" stroke-width="1.2"/>`;
    g.appendChild(node);
    return { ...a, ti: idx, node, x: -80, y: -80, rot: -30 };
  });
}

/* ---------- central S monogram (responsive, centred in the viewport) ---------- */
function layoutSMono() {
  const g = $("s-mono");
  if (!g) return;
  const vw = window.innerWidth, vh = window.innerHeight;
  const cx = vw / 2, cy = vh / 2;
  const R = clamp(Math.min(vw, vh) * 0.16, 80, 150);
  mono.R = R; mono.cx = cx; mono.cy = cy;
  g.setAttribute("transform", `translate(${cx} ${cy})`);

  g.querySelector(".s-ring.r1").setAttribute("r", (R * 0.55).toFixed(1));
  g.querySelector(".s-ring.r2").setAttribute("r", (R * 0.75).toFixed(1));
  g.querySelector(".s-ring.r3").setAttribute("r", (R * 0.95).toFixed(1));

  // The break-moment shockwave starts at the outer ring and expands outward.
  g.querySelector(".s-pulse").setAttribute("r", (R * 0.95).toFixed(1));

  // technical tick marks on the middle ring
  let ticks = "";
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    const inr = R * 0.75 - (major ? 6 : 3), outr = R * 0.75 + (major ? 6 : 3);
    ticks += `<line x1="${(Math.cos(a) * inr).toFixed(1)}" y1="${(Math.sin(a) * inr).toFixed(1)}" x2="${(Math.cos(a) * outr).toFixed(1)}" y2="${(Math.sin(a) * outr).toFixed(1)}" stroke="${major ? "rgba(255,90,60,0.55)" : "rgba(255,255,255,0.16)"}" stroke-width="${major ? 1 : 0.6}"/>`;
  }
  g.querySelector(".s-ticks").innerHTML = ticks;

  // centre + size the monogram letter (drawn on a 100x112 grid centred at 50,56)
  const s = (R * 0.88) / 112;
  g.querySelector(".s-letter").setAttribute("transform", `translate(${(-50 * s).toFixed(2)} ${(-56 * s).toFixed(2)}) scale(${s.toFixed(4)})`);
}

/* Orbit slot for agent i given the global orbit rotation (radians). */
function orbitSlot(i, rot) {
  const OR = mono.R * 1.25;
  const a = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2 + rot;
  return { x: mono.cx + Math.cos(a) * OR, y: mono.cy + Math.sin(a) * OR, rot: (a * 180) / Math.PI + 90 };
}

/* ---------- measurements (document coordinates) ---------- */
function measure() {
  const sx = window.scrollX, sy = window.scrollY;
  layers = [...document.querySelectorAll("[data-layer]")]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        id: el.dataset.layer,
        owner: Number(el.dataset.owner) || 1,
        kind: el.dataset.kind || "layout",
        docX: r.left + sx,
        docY: r.top + sy,
        w: r.width,
        h: r.height,
      };
    })
    .filter((l) => l.w > 2 && l.h > 2);

  sectionEls = SECTIONS.map((s) => {
    const el = document.getElementById(s.id);
    const r = el?.getBoundingClientRect() ?? { top: 0, left: 0, width: 0, height: 0 };
    return { ...s, el, docX: r.left + sx, docY: r.top + sy, w: r.width, h: r.height };
  }).filter((s) => s.el && s.h > 0);

  doneTimes = [];
}

/* ---------- planned scroll ---------- */
function scrollAt(t) {
  let cur = 0;
  for (const s of plan) {
    if (t < s.t) return cur;
    const end = s.t + s.dur;
    if (t < end) {
      const k = (t - s.t) / s.dur;
      return s.from + (s.to - s.from) * k;
    }
    cur = s.to;
  }
  return cur;
}

/* ---------- motion ---------- */
// place() only records logical position + rotation for an agent. The DOM
// (arrow transform + canvas trail) is updated once per frame by the single
// gsap.ticker below, so 15 agents never churn 15 DOM writes a frame each.
function place(agent, x, y, rot) {
  agent.x = x;
  agent.y = y;
  agent.rot = rot;
  if (trails) trails.record(agent.ti, x, y);
}

let trails = null;
let tickerFn = null;
// Idle settle: a slow per-agent sine drift when an agent is (nearly) still,
// so the formation breathes instead of freezing. Amplitude scales with how
// little the agent moved since the last frame — a fast flight gets zero
// wobble, a landed agent gets the full gentle drift. Driven by the same
// ticker that renders (never a second loop).
let prevPos = [];
function renderAgents() {
  const now = performance.now();
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const pv = prevPos[i] || [a.x, a.y];
    const vx = a.x - pv[0], vy = a.y - pv[1];
    pv[0] = a.x; pv[1] = a.y;
    const v = Math.hypot(vx, vy);
    const still = paused ? 0 : Math.max(0, 1 - v / 5);
    const wx = a.x + Math.sin(now * 0.0016 + i * 1.7) * 2.4 * still;
    const wy = a.y + Math.cos(now * 0.0021 + i * 2.3) * 2.4 * still;
    a.node.setAttribute("transform", `translate(${wx.toFixed(1)} ${wy.toFixed(1)}) rotate(${a.rot.toFixed(1)})`);
  }
  if (trails) trails.draw(now);
}
function armTicker() {
  prevPos = agents.map((a) => [a.x, a.y]);
  if (tickerFn) return;
  tickerFn = renderAgents;
  gsap.ticker.add(tickerFn);
}
function disarmTicker() {
  if (tickerFn) { gsap.ticker.remove(tickerFn); tickerFn = null; }
}

// Cubic Bézier flight to a DOCUMENT point, re-aiming every frame against the
// planned scroll so the agent lands on the element regardless of seeking or
// scroll progress. The start position is captured lazily so flights chain
// seamlessly from wherever the agent actually is at launch time.
function flightTo(agent, docX, docY, at, dur, bowSign = 1, bow = 60, ease = "silk") {
  const d = dur / agent.speed;
  let sx = null, sy = null;
  const p = { t: 0 };
  tl.to(p, {
    t: 1,
    duration: d,
    ease,
    onUpdate: () => {
      if (sx === null) { sx = agent.x; sy = agent.y; }
      const t = p.t, m = 1 - t;
      const ty = docY - scrollAt(at + t * d); // re-aimed viewport target
      const dx = docX - sx, dy = ty - sy, len = Math.hypot(dx, dy) || 1;
      const px = -dy / len, py = dx / len;    // unit perpendicular
      const c1x = sx + dx / 3 + px * bow * bowSign, c1y = sy + dy / 3 + py * bow * bowSign;
      const c2x = sx + dx * (2 / 3) - px * bow * bowSign, c2y = sy + dy * (2 / 3) - py * bow * bowSign;
      const x = m*m*m*sx + 3*m*m*t*c1x + 3*m*t*t*c2x + t*t*t*docX;
      const y = m*m*m*sy + 3*m*m*t*c1y + 3*m*t*t*c2y + t*t*t*ty;
      const vx = 3*m*m*(c1x-sx) + 6*m*t*(c2x-c1x) + 3*t*t*(docX-c2x);
      const vy = 3*m*m*(c1y-sy) + 6*m*t*(c2y-c1y) + 3*t*t*(ty-c2y);
      place(agent, x, y, (Math.atan2(vy, vx) * 180) / Math.PI + 90);
    },
  }, at);
}

// Cubic Bézier flight in viewport space (used by the opening sequence and
// dispatch, where the page is not yet scrolling). The start point is captured
// lazily so flights chain seamlessly. Two control points bow to opposite
// sides of the chord for a smooth S-curve — silkier than a single arc.
function curveTo(agent, tx, ty, at, dur, bowSign = 1, bow = 90, ease = "power3.inOut") {
  const d = dur / agent.speed;
  let sx = null, sy = null;
  const p = { t: 0 };
  tl.to(p, {
    t: 1,
    duration: d,
    ease,
    onUpdate: () => {
      if (sx === null) { sx = agent.x; sy = agent.y; }
      const t = p.t, m = 1 - t;
      const dx = tx - sx, dy = ty - sy, len = Math.hypot(dx, dy) || 1;
      const px = -dy / len, py = dx / len; // unit perpendicular
      const c1x = sx + dx * (1 / 3) + px * bow * bowSign;
      const c1y = sy + dy * (1 / 3) + py * bow * bowSign;
      const c2x = sx + dx * (2 / 3) - px * bow * bowSign;
      const c2y = sy + dy * (2 / 3) - py * bow * bowSign;
      const x = m*m*m*sx + 3*m*m*t*c1x + 3*m*t*t*c2x + t*t*t*tx;
      const y = m*m*m*sy + 3*m*m*t*c1y + 3*m*t*t*c2y + t*t*t*ty;
      const vx = 3*m*m*(c1x-sx) + 6*m*t*(c2x-c1x) + 3*t*t*(tx-c2x);
      const vy = 3*m*m*(c1y-sy) + 6*m*t*(c2y-c1y) + 3*t*t*(ty-c2y);
      place(agent, x, y, (Math.atan2(vy, vx) * 180) / Math.PI + 90);
    },
  }, at);
}

/* ---------- scanning / measurement overlays ---------- */
function drawBox(target, label, at, life) {
  // target: {el, docX, docY, w, h} or a section record
  const box = document.createElement("div");
  box.className = "scan-box";
  box.innerHTML = `<span class="scan-tag">${label}</span><i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i>
    <span class="scan-dims"></span>`;
  $("scan-layer").appendChild(box);
  // Static geometry once (elements don't resize during the tour) — only `top`
  // tracks the planned scroll, computed from cached doc coords (no layout read
  // per frame, so no reflow storm).
  box.style.left = target.docX - 6 + "px";
  box.style.width = target.w + 12 + "px";
  box.style.height = target.h + 12 + "px";
  const dims = box.querySelector(".scan-dims");
  if (dims) dims.textContent = `${Math.round(target.w)}×${Math.round(target.h)}`;
  const apply = () => {
    box.style.top = target.docY - scrollAt(tl.time()) - 6 + "px";
  };
  apply();
  const b = gsap.timeline();
  b.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.2 });
  b.to(box, { opacity: 0, duration: 0.35, onComplete: () => box.remove() });
  b.to({}, { duration: life, onUpdate: apply });
  tl.add(b, at);
  childTLs.push(b);
}

function verify(section, at) {
  const el = $("scan-layer");
  const mark = document.createElement("div");
  mark.className = "verify-mark";
  mark.innerHTML = `✓ ${section.name.toUpperCase()} VERIFIED`;
  el.appendChild(mark);
  mark.style.left = section.docX + section.w - 6 + "px";
  const placeAt = () => {
    mark.style.top = section.docY - scrollAt(tl.time()) + 46 + "px";
  };
  placeAt();
  const m = gsap.timeline();
  m.fromTo(mark, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" });
  m.to(mark, { opacity: 0, duration: 0.3, onComplete: () => mark.remove() });
  m.to({}, { duration: VERIFY, onUpdate: placeAt });
  tl.add(m, at);
  childTLs.push(m);
}

/* ---------- reveals ---------- */
// The element is CSS-hidden (clip) while [data-intro=active]; the agent's build
// animates the clip back and marks it built so it stays visible.
function reveal(layer, at, dur) {
  const el = layer.el;

  // NEW: Trigger 3D state transition at start of reveal
  tl.call(() => {
    if (window.__set3DLayerState) {
      window.__set3DLayerState(layer.id, "revealing");
    }
  }, null, at);

  if (layer.kind === "image") {
    // diagonal wipe for the portrait
    tl.fromTo(el,
      { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" },
      { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: dur, ease: "power2.inOut" },
      at);
  } else {
    tl.fromTo(el,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: dur, ease: "power2.inOut" },
      at);
  }

  tl.call(() => {
    el.classList.add("layer-built");
    gsap.set(el, { clearProps: "clip-path" });

    // NEW: Mark 3D state as fully active after construction
    if (window.__set3DLayerState) {
      window.__set3DLayerState(layer.id, "active");
    }
  }, null, at + dur);

  doneTimes.push(at + dur);
  layerTimes[layer.id] = at;
}

// A different agent measures the far corner while the owner constructs —
// the pairing the roster describes, without stacking agents on one path.
function partnerOf(owner, fallback) {
  const p = ((owner + (owner % 2 ? 1 : 2) - 1) % 15) + 1;
  return agents[p - 1] || fallback;
}

const ACTION = {
  layout: "POSITIONING", type: "CONSTRUCTING", image: "REVEALING",
  nav: "ROUTING", button: "SEATING", card: "ASSEMBLING", bg: "GRADING", polish: "FINISHING",
};

function setActivity(agent, layer) {
  const el = $("ap-activity");
  if (!el || !layer) return;
  el.textContent = `${ACTION[layer.kind] || "BUILDING"} ${layer.id}`;
}

/* ---------- panel ----------
   Called every frame by the master timeline's onUpdate. To avoid DOM thrash
   (and the per-frame layout reflow that `style.width` caused), we cache each
   value and only write the node when it actually changes, and drive the
   progress bar with a compositor-only transform instead of width. */
const panelCache = {};
function setPanel() {
  if (!tl) return;
  const t = tl.time();
  const done = doneTimes.filter((d) => d <= t + 0.001).length;
  const layersTxt = `${done} / ${layers.length}`;
  if (panelCache.layers !== layersTxt) { panelCache.layers = layersTxt; $("ap-layers").textContent = layersTxt; }

  const prog = tl.progress();
  const scaleX = (prog * 100).toFixed(1);
  if (panelCache.scaleX !== scaleX) { panelCache.scaleX = scaleX; $("ap-bar-fill").style.transform = `scaleX(${prog})`; }

  let secIdx = 0;
  SECTIONS.forEach((s, i) => { if (tl.labels[s.id] !== undefined && t >= tl.labels[s.id] - 0.01) secIdx = i; });
  const sectionTxt = `${String(secIdx + 1).padStart(2, "0")} / ${String(SECTIONS.length).padStart(2, "0")}  ${SECTIONS[secIdx].name}`;
  if (panelCache.section !== sectionTxt) { panelCache.section = sectionTxt; $("ap-section").textContent = sectionTxt; }

  const stage = t < tl.labels.hero ? "INTRODUCING"
    : t >= (tl.labels.finale ?? tl.duration()) ? "INSPECTING"
    : "CONSTRUCTING";
  if (panelCache.stage !== stage) { panelCache.stage = stage; $("ap-stage").textContent = stage; }

  const status = paused ? "PAUSED — YOU'RE IN CONTROL" : finished ? "COMPLETE" : "TOURING";
  if (panelCache.status !== status) { panelCache.status = status; $("ap-status").textContent = status; }
}

function lightDot(id, on) {
  document.querySelector(`.ap-dot[data-agent="${id}"]`)?.classList.toggle("lit", on);
}

/* ---------- the tour ---------- */
function buildTimeline() {
  tl = gsap.timeline({ paused: true, onUpdate: setPanel });
  plan = [];
  for (const k in panelCache) delete panelCache[k]; // rebuild -> recompute panel

  /* ===== OPENING: central S monogram + 15-agent circular formation =====
     All timings live in src/intro/intro-config.js (TIMINGS). The sequence ends
     exactly where the real construction tour begins — flights chain lazily from
     orbit slots, so no agent ever teleports. */
  layoutSMono();
  const vw = window.innerWidth, vh = window.innerHeight;
  const tW = [TIMINGS.S, TIMINGS.S + TIMINGS.waveGap, TIMINGS.S + 2 * TIMINGS.waveGap]; // three waves of five
  const syncAt = tW[2] + TIMINGS.wave;          // everyone in slot
  const holdAt = syncAt + TIMINGS.sync;
  const breakAt = holdAt + TIMINGS.hold;
  const openEnd = breakAt + TIMINGS.dispatch + 0.2;

  // 1 — the S identity: letter blooms, rings scale in, the scan light travels.
  tl.to("#s-mono", { opacity: 1, duration: 0.4, ease: "power1.out" }, 0.05);
  tl.to(".s-letter", { opacity: 1, duration: 0.7, ease: "power2.out" }, 0.15);
  tl.from(".s-rings", { scale: 0.6, opacity: 0, duration: TIMINGS.S, ease: "power2.out" }, 0.1);
  tl.call(() => SFX.whoosh(), null, 0.2);

  // 2 — three coordinated waves of five: every arrow flies its own curved
  //    Bézier from off-screen into a distinct orbit slot, head facing travel.
  agents.forEach((a, i) => {
    const a0 = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
    const startR = mono.R * 1.25 + Math.max(vw, vh) * 0.35;
    place(a, mono.cx + Math.cos(a0) * startR, mono.cy + Math.sin(a0) * startR, (a0 * 180) / Math.PI + 90);
    const s = orbitSlot(i, 0);
    curveTo(a, s.x, s.y, tW[Math.floor(i / 5)], TIMINGS.wave, i % 2 ? 1 : -1, 70, "silk");
    tl.call(() => SFX.blip(), null, tW[Math.floor(i / 5)] + TIMINGS.wave - 0.05);
  });

  // 3 — synchronization: the ring eases into a slow orbit (they slow down,
  //    lock into formation), S brightens, rings make one subtle rotation.
  const orbit = { rot: 0 };
  const updateOrbit = () => {
    agents.forEach((a, i) => {
      const s = orbitSlot(i, orbit.rot * Math.PI * 2);
      place(a, s.x, s.y, s.rot);
    });
  };
  tl.to(orbit, { rot: ORBIT.turnsOnSync, duration: TIMINGS.sync, ease: "power2.out", onUpdate: updateOrbit }, syncAt);
  // Continuous slow orbit through the hold: the loading screen must show the
  // formation circling the S, never a frozen ring. Constant angular velocity
  // (ease "none") carries straight into the break, where each arrow's
  // dispatch flight chains lazily from its current slot position.
  tl.to(orbit, { rot: ORBIT.turnsOnSync + ORBIT.turnsOnHold, duration: TIMINGS.hold, ease: "none", onUpdate: updateOrbit }, holdAt);
  tl.to(".s-ring.r2", { rotation: 40, duration: TIMINGS.sync, ease: "power1.inOut" }, syncAt);
  tl.to(".s-letter", { stroke: "#ff8568", duration: 0.5, ease: "power1.inOut", yoyo: true, repeat: 1 }, syncAt + 0.1);
  tl.call(() => SFX.thump(), null, holdAt);

  // 4 — break: a single red shockwave emits from the S, the monogram and
  //    rings fade out gracefully. Every arrow leaves its orbit slot on its
  //    own silk Bézier toward where it is actually needed — no arrow stays
  //    frozen in the circle. The per-agent dispatch + idle enter/exit
  //    flights are scheduled centrally below (scheduleAgentFlights), after
  //    the tour has recorded each agent's real tasks.
  tl.fromTo(".s-pulse",
    { attr: { r: mono.R * 0.95, "stroke-width": 2.5 }, opacity: 0.9 },
    { attr: { r: mono.R * 2.6, "stroke-width": 0.4 }, opacity: 0, duration: 0.9, ease: "power2.out" }, breakAt);
  tl.to("#s-mono", { scale: 1.06, duration: 0.22, ease: "power2.out" }, breakAt);
  tl.to("#s-mono", { scale: 1.0, duration: 0.3, ease: "power1.in" }, breakAt + 0.22);
  tl.to(".s-rings", { scale: 1.12, opacity: 0, duration: 0.5, ease: "power1.inOut" }, breakAt + 0.05);
  tl.to("#s-mono", { opacity: 0, duration: 0.5, ease: "power1.in" }, breakAt + TIMINGS.dispatch - 0.2);
  tl.call(() => SFX.launch(), null, breakAt);

  /* ===== tour over the REAL site ===== */
  // Agent tasks are recorded as data while the construction is scheduled;
  // the flights themselves are scheduled centrally afterwards, so every
  // agent moves on clean curves: orbit → its own first task, off-screen
  // while idle, curved re-entry for the next task. Nothing lingers,
  // nothing teleports, nothing overlaps in time.
  agentEvents = agents.map(() => []);
  const task = (ai, x, y, t, work) => {
    if (ai >= 0 && ai < agents.length) agentEvents[ai].push({ x, y, t, work });
  };

  let cursor = openEnd;
  let lastY = 0;
  sectionEls.forEach((sec, sIdx) => {
    tl.addLabel(sec.id, cursor);

    // 1 — ARRIVE + SWEEP: scroll the real section in; agents 1-3 inspect
    // the three corners of its actual measured box (staggered line).
    const targetY = Math.max(0, sec.docY - HEADER);
    plan.push({ t: cursor, dur: SCROLL_DUR, from: lastY, to: targetY });
    lastY = targetY;
    tl.to(window, { scrollTo: { y: targetY, autoKill: false }, duration: SCROLL_DUR, ease: "power2.inOut" }, cursor);
    tl.call(() => { SFX.thump(); SFX.whoosh(); }, null, cursor + 0.1);

    const sweepPts = [
      [sec.docX + 50, sec.docY + 50],
      [sec.docX + Math.max(sec.w - 50, 50), sec.docY + sec.h / 2],
      [sec.docX + sec.w / 2, sec.docY + 34],
    ];
    [0, 1, 2].forEach((n, k) => {
      const a = agents[n];
      task(n, sweepPts[k][0], sweepPts[k][1], cursor + 0.2 + k * 0.28, 1.0);
      tl.call(() => lightDot(a.id, true), null, cursor + 0.2 + k * 0.28);
      tl.call(() => lightDot(a.id, false), null, cursor + 0.2 + k * 0.28 + 1.0);
    });
    drawBox(sec, sec.name.toLowerCase(), cursor + 0.25, SWEEP + SCAN * 0.6);
    cursor += SWEEP * 0.8;

    // 2 — CONSTRUCT LAYER BY LAYER, so the site visibly takes shape.
    // Every layer is claimed: nav.* builds with the hero, the footer
    // (contact.footer.*) with contact — nothing stays clipped forever.
    let mine = layers.filter((l) => l.id.startsWith(sec.id + "."));
    if (sec.id === "hero") mine = layers.filter((l) => l.id.startsWith("nav.") || l.id.startsWith("hero."));

    // A "card" is a frame that owns sub-layers (image, title, tags...).
    // In a grid, different Deck agents build different cards SIDE BY SIDE.
    const dividers = [12, 10, 8, 11];
    const cardKidsOf = (frame) => mine.filter((k) => k.id.startsWith(frame.id + "."));
    const cards = mine.filter((f) => cardKidsOf(f).length);
    const cardKidIds = new Set(cards.flatMap((f) => cardKidsOf(f).map((k) => k.id)));
    const singles = mine.filter((l) => !cardKidIds.has(l.id));

    let cardRun = 0;

    // 2a — single layers: owner flies in, partner measures the far corner,
    // the box is drawn, the element is constructed.
    for (const layer of singles) {
      let owner = layer.owner;
      if (layer.kind === "card") { owner = dividers[cardRun % dividers.length]; cardRun++; }
      const agent = agents[owner - 1] || agents[0];
      const partner = partnerOf(owner, agents[1]);
      const at = cursor;

      tl.call(() => { lightDot(agent.id, true); setActivity(agent, layer); }, null, at);
      task(agent.ti, layer.docX + layer.w / 2, layer.docY + layer.h / 2, at, SCAN * 0.8 + REVEAL);
      task(partner.ti, layer.docX + 8, layer.docY + layer.h - 8, at + 0.15, SCAN * 0.8 + REVEAL);

      tl.call(() => { drawBox(layer, layer.id, at + 0.5, SCAN + REVEAL * 0.5); SFX.blip(); }, null, at + 0.5);
      reveal(layer, at + SCAN * 0.8, REVEAL);
      tl.call(() => SFX.chime(), null, at + SCAN * 0.8 + REVEAL * 0.5);
      tl.call(() => lightDot(agent.id, false), null, at + SCAN * 0.8 + REVEAL);
      cursor = at + STEP;
    }

    // 2b — card grids: frames build in parallel, sub-layers build inside
    // each frame — a finished card sits next to a half-built one.
    if (cards.length) {
      const t0 = cursor;
      cards.forEach((frame, i) => {
        const owner = dividers[cardRun % dividers.length]; cardRun++;
        const agent = agents[owner - 1] || agents[0];
        const partner = partnerOf(owner, agents[1]);
        const kids = cardKidsOf(frame);
        const T = t0 + i * 0.4;

        tl.call(() => { lightDot(agent.id, true); setActivity(agent, frame); }, null, T);
        const cardWork = 0.95 + kids.length * 0.18 + 0.45;
        task(agent.ti, frame.docX + frame.w / 2, frame.docY + frame.h / 2, T, cardWork);
        task(partner.ti, frame.docX + 8, frame.docY + 8, T + 0.15, cardWork);
        tl.call(() => { drawBox(frame, frame.id, T + 0.45, 0.5 + kids.length * 0.18 + 0.5); SFX.blip(); }, null, T + 0.45);
        reveal(frame, T + 0.5, 0.55);                       // card background + border first
        kids.forEach((k, c) => {                             // then inside: image, title, tags, link…
          const kt = T + 0.95 + c * 0.18;
          tl.call(() => setActivity(agents[(k.owner || owner) - 1] || agent, k), null, kt);
          reveal(k, kt, 0.42);
        });
        tl.call(() => SFX.chime(), null, T + 0.95 + kids.length * 0.18 + 0.15);
        tl.call(() => lightDot(agent.id, false), null, T + 0.95 + kids.length * 0.18 + 0.45);
      });
      const maxKids = Math.max(0, ...cards.map((f) => cardKidsOf(f).length));
      cursor = t0 + 0.4 * (cards.length - 1) + 0.95 + maxKids * 0.18 + 0.7;
    }

    // 2c — skill proficiency: once the rows are built, the Deck draws the fills.
    if (sec.id === "skills") {
      const bars = document.getElementById("skills")?.querySelectorAll("[data-skill-bar]") ?? [];
      if (bars.length) {
        gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });
        tl.to(bars, { scaleX: 1, duration: 0.55, stagger: 0.09, ease: "power3.out" }, cursor + 0.15);
        cursor += 0.55 + bars.length * 0.09;
      }
    }

    // 3 — VERIFY: Sentinel check mark over the section title
    const sentinel = agents[14];
    const vAt = cursor + 0.1;
    tl.call(() => lightDot(sentinel.id, true), null, vAt);
    task(14, sectionEls[sIdx].docX + 120, sectionEls[sIdx].docY + 60, vAt, VERIFY);
    verify(sec, vAt);
    tl.call(() => lightDot(sentinel.id, false), null, vAt + VERIFY);
    cursor += VERIFY + GAP;
  });

  // ===== coordinated handover: dispatch + idle enter/exit flights =====
  // Runs after the whole tour is timed, so every agent knows its first task
  // and can break from the orbit straight toward it (or to an off-screen
  // park if the first task is far off).
  const finaleAt = cursor;
  scheduleAgentFlights(breakAt, finaleAt);

  // ===== FINALE: sting, all 15 gather into the S, hold, spread out =====
  // The sentinel's last verify above is the final inspection; every layer
  // is already at its completed state by now.
  tl.addLabel("finale", finaleAt);
  tl.call(() => SFX.sting(), null, finaleAt);
  finaleGather(finaleAt + 0.15);

  // NEW: Automatic smooth scroll to top after the finale (once all arrows and
  // overlays have dispersed). This runs after spreadAt + exits are scheduled.
  const spreadAt = finaleAt + 0.15 + 0.9 + 1.1; // hold S formation for 1.1s
  tl.to(window, {
    scrollTo: { y: 0, autoKill: false },
    duration: 1.2,
    ease: "power3.inOut"
  }, spreadAt + 0.8); // Start scroll after arrows have begun to exit

  tl.call(finish, null, finaleAt + FINALE + 1.6); // Add delay for the scroll

  doneTimes.sort((a, b) => a - b);
}

// One park point per task: the nearest screen edge, aligned with the task's
// viewport height so idle agents wait OUT of sight, not in the way.
function parkFor(e) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const vy = e.y - scrollAt(e.t);
  const px = e.x < vw / 2 ? -70 : vw + 70;
  return [px, clamp(vy, 110, vh - 110)];
}

// Central agent-flight scheduler (requirement: no frozen arrows, no idle
// wandering, no overlapping paths).
//   - dispatch: at the break, every arrow leaves the orbit on its own silk
//     cubic toward its FIRST real task — or to an off-screen park when that
//     task is far away, where it stays hidden until needed.
//   - between tasks: a gap >= IDLE_GAP means the agent exits to the edge
//     right after its previous work and re-enters on a curve just in time;
//     smaller gaps get a short silk re-aim so the agent slides between
//     stations instead of lingering.
//   - flights chain lazily (start captured at launch), never overlap in time
//     for the same agent, and use each agent's own speed/bow identity.
function scheduleAgentFlights(breakAt, finaleAt) {
  agents.forEach((a, i) => {
    const evts = agentEvents[i].slice().sort((p, q) => p.t - q.t);
    if (!evts.length) return;
    const sign = i % 2 ? -1 : 1;
    const last = evts[evts.length - 1];

    // -- dispatch: leave the circle on the break
    const e0 = evts[0];
    const delay = breakAt + i * 0.045;
    let prevFree;
    if (e0.t - ENTER - delay >= 2.0) {
      // first task is far: break to the off-screen park, wait hidden,
      // then curve in just in time for the task.
      const p = parkFor(e0);
      curveTo(a, p[0], p[1], delay, 0.9, -sign, 110, "silk");
      flightTo(a, e0.x, e0.y, e0.t - ENTER, ENTER, sign, 80, "silk");
      prevFree = e0.t;
    } else {
      // first task is near: straight from the orbit slot to the task.
      flightTo(a, e0.x, e0.y, delay, clamp(e0.t - 0.15 - delay, 0.6, 2.4), sign, 90, "silk");
      prevFree = e0.t - 0.15;
    }

    // -- between tasks
    let lastEnd = e0.t + e0.work;
    for (let k = 1; k < evts.length; k++) {
      const e = evts[k];
      const gap = e.t - lastEnd;
      if (gap >= IDLE_GAP) {
        // idle: exit to the edge after the previous work, stay hidden.
        const p = parkFor(e);
        curveTo(a, p[0], p[1], lastEnd + 0.25, EXIT_DUR, -sign, 100, "silk");
        prevFree = lastEnd + 0.25 + EXIT_DUR;
      }
      const start = Math.max(prevFree, e.t - 0.55);
      const dur = Math.max(0.15, Math.min(0.6, e.t - 0.05 - start));
      flightTo(a, e.x, e.y, start, dur, sign, 70, "silk");
      prevFree = start + dur;
      lastEnd = e.t + e.work;
    }

    // -- after the LAST task, exit again so idle agents never camp on the
    //    site; the finale re-gathers everyone from off-screen.
    if (last.t + last.work < finaleAt - 2.0) {
      const p = parkFor(last);
      curveTo(a, p[0], p[1], last.t + last.work + 0.25, EXIT_DUR, -sign, 100, "silk");
    }
  });
}

// The S monogram traced by 15 arrow positions: an upper bowl (∩) flowing
// into a lower bowl (∪) — a serpentine S, read in the order the arrows fly.
function sFormation() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const cx = vw / 2, cy = vh / 2;
  const r = Math.min(vw, vh) * 0.15;
  const top = cy - r * 0.62, bot = cy + r * 0.62;
  const pts = [];
  for (let k = 0; k < 8; k++) { // upper bowl: left → over the top → right
    const th = Math.PI + (k / 7) * Math.PI;
    pts.push({ x: cx + r * Math.cos(th), y: top + r * Math.sin(th) });
  }
  for (let k = 0; k < 7; k++) { // lower bowl: right → under the bottom → left
    const th = (k / 6) * Math.PI;
    pts.push({ x: cx + r * Math.cos(th), y: bot + r * Math.sin(th) });
  }
  return pts;
}

// Finale: all 15 gather into the S, hold it, then each spreads out on its
// own curved path to a distinct point OUTSIDE the viewport. Trails clear
// as the last arrow leaves; overlays + panel are removed by teardown in
// finish(), after the last arrow is off-screen.
function finaleGather(at) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const pts = sFormation();
  agents.forEach((a, i) => curveTo(a, pts[i].x, pts[i].y, at, 0.9, i % 2 ? -1 : 1, 34, "silk"));
  const spreadAt = at + 0.9 + 1.1; // hold the S formation for 1.1 s
  const exits = [
    { x: -90, y: -90 }, { x: vw * 0.3, y: -90 }, { x: vw + 90, y: -90 },
    { x: -90, y: vh * 0.5 }, { x: vw + 90, y: vh * 0.5 },
    { x: -90, y: vh + 90 }, { x: vw * 0.5, y: vh + 90 }, { x: vw + 90, y: vh + 90 },
  ];
  agents.forEach((a, i) => {
    const e = exits[i % exits.length];
    curveTo(a, e.x, e.y, spreadAt + i * 0.045, 0.7, i % 2 ? 1 : -1, 70, "power2.in");
  });
  tl.call(() => { if (trails) trails.clear(); }, null, spreadAt + 0.8);
}

function finish() {
  if (finished) return;
  finished = true;
  SFX.stopAll();
  setPanel();
  teardown(true);
  if (typeof window.__onIntroDone === "function") window.__onIntroDone();
}

function teardown(animated) {
  listeners.forEach((off) => off());
  listeners.length = 0;
  const overlay = $("agent-overlay");
  // Single ticker + pooled trail canvas are torn down with the overlay.
  disarmTicker();
  if (trails) { trails.destroy(); trails = null; }
  // Kill all child timelines (scan boxes, verify marks) to prevent leaks.
  childTLs.forEach((ct) => { try { ct.kill(); } catch {} });
  childTLs.length = 0;
  // Release the site: un-hide layers, clear the planned scroll, re-arm Lenis.
  document.documentElement.removeAttribute("data-intro");
  document.documentElement.classList.remove("intro-interaction-lock");
  document.querySelectorAll(".layer-built").forEach((el) => el.classList.remove("layer-built"));
  document.querySelectorAll("[data-skill-bar]").forEach((b) => gsap.set(b, { clearProps: "transform" }));
  window.__lenis?.start?.();
  const go = () => {
    overlay?.remove();
    if (tl) { try { tl.kill(); } catch {} tl = null; }
  };
  if (animated && overlay) gsap.to(overlay, { opacity: 0, duration: 0.6, onComplete: go });
  else go();
}

/* ---------- interruption ---------- */
function interrupt() {
  if (!tl || finished || paused) return;
  paused = true;
  tl.pause();
  // No Lenis hand-back while paused: the tour keeps single ownership of
  // scrolling, and the interaction lock stays in place until resume.
  setPanel();
}

function resume() {
  if (!tl || finished) return;
  paused = false;
  window.__lenis?.stop?.();
  tl.resume();
  setPanel();
}

function skip() {
  if (!tl || finished) return;
  SFX.stopAll();
  tl.progress(1);
  finish();
}

function bindControls() {
  const on = (t, type, fn, opts) => { t.addEventListener(type, fn, opts); listeners.push(() => t.removeEventListener(type, fn, opts)); };
  on($("ap-pause"), "click", () => (paused ? resume() : interrupt()));
  on($("ap-skip"), "click", skip);
  on($("ap-mute"), "click", () => { SFX.toggle(); $("ap-mute").textContent = SFX.enabled() ? "SOUND ON" : "SOUND OFF"; });
  // Interaction lock: wheel / touch / scrollbar keys are swallowed for the
  // whole tour (the auto-scroll driver owns movement). Panel buttons stay
  // the only interactive surface. Everything is released on finish/skip.
  on(window, "wheel", (e) => e.preventDefault(), { passive: false });
  on(window, "touchmove", (e) => e.preventDefault(), { passive: false });
  on(window, "keydown", (e) => {
    // Escape is still a valid "skip" during the tour.
    if (e.key === "Escape") { skip(); return; }
    // Scroll keys are locked out (no default scroll) while the tour runs;
    // they do NOT pause — Pause/Resume/Skip/Sound are the only controls.
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", " ", "Home", "End"].includes(e.key)) {
      e.preventDefault();
    }
  });
}

/* ---------- resize: record progress, rebuild, restore ---------- */
let resizeTimer = 0;
function onResize() {
  if (!tl || finished) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!tl || finished) return;
    const t = tl.time();
    try { tl.kill(); } catch {}
    tl = null;
    measure();
    buildTimeline();
    tl.time(Math.min(t, tl.duration() - 0.05));
    tl.resume();
  }, 250);
}

/* ---------- readiness: wait for React, fonts, portrait ---------- */
async function waitForReady() {
  const want = () => document.querySelectorAll("[data-layer]").length;
  const t0 = Date.now();
  while (want() === 0 && Date.now() - t0 < 3000) await new Promise((r) => setTimeout(r, 50));
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch {}
  const photo = document.querySelector("[data-hero-photo]");
  if (photo && !photo.complete) {
    try { await Promise.race([new Promise((res) => { photo.onload = photo.onerror = res; }), new Promise((r) => setTimeout(r, 1500))]); } catch {}
  }
  return want() > 0;
}

/* ---------- public ---------- */
export async function startIntro() {
  if (started) return;
  started = true;
  SFX.init();
  const overlayRoot = buildOverlay();
  spawnAgents();
  // Pooled canvas trail layer + one shared ticker: 15 agents render their
  // trails in a single pass per frame, arrows updated once per frame.
  trails = initTrails(agents, overlayRoot);
  armTicker();
  // Conceal the site's layers immediately so the real page (never an empty
  // background) is what the agents build on, with zero layout shift.
  document.documentElement.setAttribute("data-intro", "active");

  const ready = await waitForReady();
  measure();
  const total = layers.length;
  if (!ready || total === 0) { finish(); return; }

  $("ap-layers").textContent = `0 / ${total}`;
  buildTimeline();
  bindControls();
  window.addEventListener("resize", onResize);
  window.__intro = {
    seek: (labelOrTime) => {
      if (!tl || finished) return; // one-way: after teardown the overlay is gone
      const target = typeof labelOrTime === "string" ? (tl.labels[labelOrTime] ?? 0) : labelOrTime;
      tl.time(clamp(target, 0, tl.duration()));
      setPanel();
    },
    getState: () => ({
      time: tl?.time() ?? 0,
      duration: tl?.duration() ?? 0,
      paused, finished,
      layers: layers.length,
      done: doneTimes.filter((d) => d <= (tl?.time() ?? 0)).length,
      labels: tl ? { ...tl.labels } : {},
      activity: $("ap-activity")?.textContent ?? "",
    }),
    at: (id) => layerTimes[id] ?? -1,
    ids: () => layers.map((l) => l.id),
    skip, pause: interrupt, resume,
  };

  // Pause Lenis for the whole tour so the single scroll driver owns it.
  window.__lenis?.stop?.();
  document.documentElement.classList.add("intro-interaction-lock");
  tl.play();
}

export function revealNow() {
  document.documentElement.classList.remove("intro-interaction-lock");
  $("agent-overlay")?.remove();
  document.documentElement.removeAttribute("data-intro");
  document.querySelectorAll(".layer-built").forEach((el) => el.classList.remove("layer-built"));
  if (tl) { try { tl.kill(); } catch {} tl = null; }
  if (typeof window.__onIntroDone === "function") window.__onIntroDone();
}
