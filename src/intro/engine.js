import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import { AGENTS, SECTIONS } from "../data/agents.js";
import * as SFX from "./sfx.js";
import { TIMINGS, ORBIT } from "./intro-config.js";

gsap.registerPlugin(ScrollToPlugin);

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
const FINALE = 3.2;
const HEADER = 70;

const STEP = SCAN * 0.6;  // layer cadence

let tl = null;
let agents = [];
let layers = [];
let sectionEls = [];
let plan = [];            // {t, dur, from, to} — planned window scrollY
let doneTimes = [];
let layerTimes = {};      // layer id -> reveal start time (for verification)
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
          <circle class="s-scan" r="0" fill="none" stroke="#ff5a3c" stroke-width="2" stroke-linecap="round" />
        </g>
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
  agents = AGENTS.map((a) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("class", "agent");
    node.setAttribute("data-agent", a.id);
    node.innerHTML = `
      <polyline class="trail" points="" fill="none" stroke="${a.color}" stroke-width="1.4"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.75"
        ${a.trail === "dotted" ? 'stroke-dasharray="1.5 6"' : a.trail === "dashed" ? 'stroke-dasharray="7 5"' : ""}/>
      <use href="#arrow-cursor" width="30" height="30" x="-15" y="-15" fill="${a.color}" stroke="#05060a" stroke-width="1.2"/>`;
    g.appendChild(node);
    return { ...a, node, x: -80, y: -80, rot: -30, trail: [] };
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

  const scan = g.querySelector(".s-scan");
  scan.setAttribute("r", (R * 0.95).toFixed(1));
  const circ = 2 * Math.PI * R * 0.95;
  scan.setAttribute("stroke-dasharray", `${(circ * 0.16).toFixed(1)} ${(circ * 0.84).toFixed(1)}`);

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
function place(agent, x, y, rot) {
  agent.x = x;
  agent.y = y;
  agent.rot = rot;
  agent.trail.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  if (agent.trail.length > 14) agent.trail.shift();
  agent.node.querySelector(".trail").setAttribute("points", agent.trail.join(" "));
  agent.node.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`);
}

// Fly an agent to a document point, re-aiming every frame against the planned
// scroll so it lands on the element regardless of seeking or scroll progress.
// The start position is captured lazily so flights chain seamlessly from
// wherever the agent actually is at launch time.
function flyTo(agent, docX, docY, at, dur) {
  const d = dur / agent.speed;
  let sx = null, sy = null;
  const proxy = { t: 0 };
  tl.to(proxy, {
    t: 1,
    duration: d,
    ease: "power3.inOut",
    onUpdate: () => {
      if (sx === null) { sx = agent.x; sy = agent.y; }
      const k = proxy.t;
      const sNow = scrollAt(at + k * d);
      const tvy = docY - sNow;
      const bow = Math.sin(k * Math.PI) * 26 * (agent.num % 2 ? 1 : -1);
      const vx = sx + (docX - sx) * k + bow;
      const vy = sy + (tvy - sy) * k;
      const ang = (Math.atan2(tvy - sy, docX - sx) * 180) / Math.PI + 90;
      place(agent, vx, vy, ang);
    },
  }, at);
}

// Quadratic Bézier flight in viewport space (used by the opening sequence,
// where the page is not yet scrolling). The start point is captured lazily.
function curveTo(agent, tx, ty, at, dur, bowSign = 1, bow = 90) {
  const d = dur / agent.speed;
  let sx = null, sy = null;
  const p = { t: 0 };
  tl.to(p, {
    t: 1,
    duration: d,
    ease: "power2.inOut",
    onUpdate: () => {
      if (sx === null) { sx = agent.x; sy = agent.y; }
      const t = p.t, m = 1 - t;
      const dx = tx - sx, dy = ty - sy, len = Math.hypot(dx, dy) || 1;
      const mx = (sx + tx) / 2 + (-dy / len) * bow * bowSign;
      const my = (sy + ty) / 2 + (dx / len) * bow * bowSign;
      const x = m * m * sx + 2 * m * t * mx + t * t * tx;
      const y = m * m * sy + 2 * m * t * my + t * t * ty;
      const vx = 2 * m * (mx - sx) + 2 * t * (tx - mx);
      const vy = 2 * m * (my - sy) + 2 * t * (ty - my);
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
  const apply = () => {
    const el = target.el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    box.style.left = r.left - 6 + "px";
    box.style.top = r.top - 6 + "px";
    box.style.width = r.width + 12 + "px";
    box.style.height = r.height + 12 + "px";
    const dims = box.querySelector(".scan-dims");
    if (dims) dims.textContent = `${Math.round(r.width)}×${Math.round(r.height)}`;
  };
  apply();
  const b = gsap.timeline();
  b.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.2 });
  b.to(box, { opacity: 0, duration: 0.35, onComplete: () => box.remove() });
  b.to({}, { duration: life, onUpdate: apply });
  tl.add(b, at);
}

function verify(section, at) {
  const el = $("scan-layer");
  const mark = document.createElement("div");
  mark.className = "verify-mark";
  mark.innerHTML = `✓ ${section.name.toUpperCase()} VERIFIED`;
  el.appendChild(mark);
  const r = section.el.getBoundingClientRect();
  const s = scrollAt(at);
  const placeAt = () => {
    const rr = section.el.getBoundingClientRect();
    mark.style.left = rr.right - 6 + "px";
    mark.style.top = rr.top + 46 + "px";
  };
  placeAt();
  const m = gsap.timeline();
  m.fromTo(mark, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" });
  m.to(mark, { opacity: 0, duration: 0.3, onComplete: () => mark.remove() });
  m.to({}, { duration: VERIFY, onUpdate: placeAt });
  tl.add(m, at);
}

/* ---------- reveals ---------- */
// The element is CSS-hidden (clip) while [data-intro=active]; the agent's build
// animates the clip back and marks it built so it stays visible.
function reveal(layer, at, dur) {
  const el = layer.el;
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

/* ---------- panel ---------- */
function setPanel() {
  if (!tl) return;
  const t = tl.time();
  const done = doneTimes.filter((d) => d <= t + 0.001).length;
  $("ap-layers").textContent = `${done} / ${layers.length}`;
  $("ap-bar-fill").style.width = (tl.progress() * 100).toFixed(2) + "%";

  let secIdx = 0;
  SECTIONS.forEach((s, i) => { if (tl.labels[s.id] !== undefined && t >= tl.labels[s.id] - 0.01) secIdx = i; });
  $("ap-section").textContent = `${String(secIdx + 1).padStart(2, "0")} / ${String(SECTIONS.length).padStart(2, "0")}  ${SECTIONS[secIdx].name}`;

  const stage = t < tl.labels.hero ? "INTRODUCING"
    : t >= (tl.labels.finale ?? tl.duration()) ? "INSPECTING"
    : "CONSTRUCTING";
  $("ap-stage").textContent = stage;
  $("ap-status").textContent = paused ? "PAUSED — YOU'RE IN CONTROL" : finished ? "COMPLETE" : "TOURING";
}

function lightDot(id, on) {
  document.querySelector(`.ap-dot[data-agent="${id}"]`)?.classList.toggle("lit", on);
}

/* ---------- the tour ---------- */
function buildTimeline() {
  tl = gsap.timeline({ paused: true, onUpdate: setPanel });
  plan = [];

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
  tl.to(".s-scan", { rotation: 540, duration: openEnd, ease: "none" }, 0);
  tl.call(() => SFX.whoosh(), null, 0.2);

  // 2 — three coordinated waves of five: every arrow flies its own curved
  //    Bézier from off-screen into a distinct orbit slot, head facing travel.
  agents.forEach((a, i) => {
    const a0 = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
    const startR = mono.R * 1.25 + Math.max(vw, vh) * 0.35;
    place(a, mono.cx + Math.cos(a0) * startR, mono.cy + Math.sin(a0) * startR, (a0 * 180) / Math.PI + 90);
    const s = orbitSlot(i, 0);
    curveTo(a, s.x, s.y, tW[Math.floor(i / 5)], TIMINGS.wave, i % 2 ? 1 : -1, 100);
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
  tl.to(".s-ring.r2", { rotation: 40, duration: TIMINGS.sync, ease: "power1.inOut" }, syncAt);
  tl.to(".s-letter", { stroke: "#ff8568", duration: 0.5, ease: "power1.inOut", yoyo: true, repeat: 1 }, syncAt + 0.1);
  tl.call(() => SFX.thump(), null, holdAt);

  // 4 — break & dispatch: S emits one pulse, the rings expand and fade, and
  //    every arrow leaves its slot on its own Bézier path toward its first
  //    real hero-component staging point. The tour takes over from here.
  const hero = sectionEls[0];
  const staging = hero
    ? [
        [hero.docX + 80, hero.docY + 60],
        [hero.docX + Math.max(hero.w - 160, 160), hero.docY + hero.h * 0.4],
        [vw / 2, hero.docY + hero.h * 0.55],
      ]
    : [[vw / 2, vh / 2]];
  agents.forEach((a, i) => {
    const [bx, by] = staging[i % 3];
    curveTo(a, bx + (i - 7) * 30, by + (i % 3) * 22 - 22, breakAt, TIMINGS.dispatch, i % 2 ? -1 : 1, 120);
  });
  tl.to("#s-mono", { scale: 1.05, duration: 0.28, ease: "power2.out", yoyo: true, repeat: 1 }, breakAt);
  tl.to(".s-rings", { scale: 1.55, opacity: 0, duration: 0.8, ease: "power2.out" }, breakAt);
  tl.to("#s-mono", { opacity: 0, duration: TIMINGS.fade, ease: "power1.in" }, breakAt + TIMINGS.dispatch - TIMINGS.fade);
  tl.call(() => SFX.sting(), null, breakAt);

  /* ===== tour over the REAL site ===== */
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
      flyTo(a, sweepPts[k][0], sweepPts[k][1], cursor + 0.2 + k * 0.28, 0.9);
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
      flyTo(agent, layer.docX + layer.w / 2, layer.docY + layer.h / 2, at, 0.8);
      flyTo(partner, layer.docX + 8, layer.docY + layer.h - 8, at + 0.15, 0.8);

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
        flyTo(agent, frame.docX + frame.w / 2, frame.docY + frame.h / 2, T, 0.8);
        flyTo(partner, frame.docX + 8, frame.docY + 8, T + 0.15, 0.8);
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
    flyTo(sentinel, sectionEls[sIdx].docX + 120, sectionEls[sIdx].docY + 60, vAt, 0.7);
    verify(sec, vAt);
    tl.call(() => lightDot(sentinel.id, false), null, vAt + VERIFY);
    cursor += VERIFY + GAP;
  });

  // FINALE: Sentinel sweeps, the ring gathers, agents exit, handover.
  tl.addLabel("finale", cursor);
  tl.call(() => SFX.sting(), null, cursor);
  const last = sectionEls[sectionEls.length - 1];
  flyTo(agents[14], last.docX + 200, last.docY + 80, cursor, 1.0);
  cursor += FINALE * 0.6;
  ringExit(cursor);
  cursor += FINALE * 0.4 + 0.6;
  tl.call(finish, null, cursor);

  doneTimes.sort((a, b) => a - b);
}

// Finale: all 15 agents gather into a ring, hold, then exit in staggered
// curved paths.
function ringExit(at) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const cx = vw / 2, cy = vh / 2, R = Math.min(vw, vh) * 0.28;
  agents.forEach((a, i) => {
    const ang = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
    flyTo(a, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, at, 0.9);
  });
  agents.forEach((a, i) => {
    const outX = a.edge === "left" ? -80 : a.edge === "right" ? vw + 80 : cx;
    const outY = a.edge === "top" ? -80 : a.edge === "bottom" ? vh + 80 : cy + 60;
    flyTo(a, outX, outY, at + 1.1 + i * 0.05, 0.55);
  });
}

function finish() {
  if (finished) return;
  finished = true;
  setPanel();
  teardown(true);
  if (typeof window.__onIntroDone === "function") window.__onIntroDone();
}

function teardown(animated) {
  listeners.forEach((off) => off());
  listeners.length = 0;
  const overlay = $("agent-overlay");
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
  // Hand scrolling back to the visitor: re-arm Lenis so they can roam.
  window.__lenis?.start?.();
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
  SFX.duck();
  tl.progress(1);
  finish();
}

function bindControls() {
  const on = (t, type, fn, opts) => { t.addEventListener(type, fn, opts); listeners.push(() => t.removeEventListener(type, fn, opts)); };
  on($("ap-pause"), "click", () => (paused ? resume() : interrupt()));
  on($("ap-skip"), "click", skip);
  on($("ap-mute"), "click", () => { SFX.toggle(); $("ap-mute").textContent = SFX.enabled() ? "SOUND ON" : "SOUND OFF"; });
  on(window, "wheel", interrupt, { passive: true });
  on(window, "touchstart", interrupt, { passive: true });
  on(window, "keydown", (e) => {
    if (e.key === "Escape") skip();
    else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", " ", "Home", "End"].includes(e.key)) interrupt();
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
  buildOverlay();
  spawnAgents();
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
