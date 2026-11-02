import gsap from "gsap";
import { AGENTS } from "../data/agents.js";

/*
 * 15-agent construction intro.
 * A blueprint building cross-section is constructed on an SVG stage.
 * Fifteen agent avatars (each its own accent color) move to their target
 * element and perform a coordinated stage action, logged to a HUD console.
 * Ends with a cinematic handover wipe that reveals the real site.
 */

const STAGE_BLUEPRINT = `
<svg id="bp-svg" viewBox="0 0 400 280" style="width:100%;height:100%">
  <!-- blueprint grid -->
  <g id="stage-grid" style="opacity:0">
    <path d="M20 0 H380 M0 20 V260 M380 0 V260 M0 260 H400" stroke="rgba(255,90,60,0.25)" stroke-width="1"/>
    <path d="M20 260 L380 20 M20 20 L380 260" stroke="rgba(255,90,60,0.1)" stroke-width="1" class="bp-dash" id="grid-diag"/>
    <text x="24" y="14">SITE PLAN // 1:500</text>
  </g>

  <!-- structural frame -->
  <g id="stage-beam-1" style="opacity:0">
    <rect x="80" y="60" width="8" height="200" fill="#1b2233" stroke="#ff5a3c" stroke-width="1"/>
    <rect x="312" y="60" width="8" height="200" fill="#1b2233" stroke="#ff5a3c" stroke-width="1"/>
  </g>
  <g id="stage-beam-2" style="opacity:0">
    <rect x="80" y="60" width="240" height="8" fill="#1b2233" stroke="#ff5a3c" stroke-width="1"/>
    <rect x="80" y="120" width="240" height="6" fill="#1b2233" stroke="#ff5a3c" stroke-width="0.8"/>
    <rect x="80" y="180" width="240" height="6" fill="#1b2233" stroke="#ff5a3c" stroke-width="0.8"/>
    <rect x="200" y="68" width="6" height="192" fill="#1b2233" stroke="#ff5a3c" stroke-width="0.8"/>
  </g>

  <!-- floor slabs -->
  <g id="stage-floor" style="opacity:0">
    <rect x="76" y="252" width="248" height="8" fill="#141a26" stroke="#ff5a3c" stroke-width="0.8"/>
  </g>

  <!-- pipes -->
  <path id="stage-pipes" d="M40 260 H360 M120 260 V40 M280 260 V40"
        stroke="#ffd75e" stroke-width="2" fill="none" opacity="0" stroke-linecap="round"/>

  <!-- wiring -->
  <path id="stage-wiring" d="M200 68 L240 100 L160 100 L220 140 L180 140 L250 180 L200 180"
        stroke="#fff3e0" stroke-width="1.5" fill="none" opacity="0" stroke-linecap="round"/>
  <circle id="stage-lamp" cx="250" cy="180" r="4" fill="#ffd75e" opacity="0"/>

  <!-- windows -->
  <g id="stage-windows" style="opacity:0">
    <rect x="130" y="80" width="40" height="30" fill="rgba(30,144,255,0.08)" stroke="rgba(173,255,47,0.5)"/>
    <rect x="230" y="80" width="40" height="30" fill="rgba(30,144,255,0.08)" stroke="rgba(173,255,47,0.5)"/>
    <rect x="130" y="140" width="40" height="30" fill="rgba(30,144,255,0.08)" stroke="rgba(173,255,47,0.5)"/>
    <rect x="230" y="140" width="40" height="30" fill="rgba(30,144,255,0.08)" stroke="rgba(173,255,47,0.5)"/>
  </g>

  <!-- weld joints (spark bursts) -->
  <g id="stage-joints" style="opacity:0">
    <circle cx="84" cy="64" r="3" fill="#ff5a3c"/>
    <circle cx="316" cy="64" r="3" fill="#ff5a3c"/>
    <circle cx="203" cy="123" r="3" fill="#ff5a3c"/>
    <circle cx="203" cy="183" r="3" fill="#ff5a3c"/>
  </g>

  <!-- wall fill -->
  <rect id="stage-walls" x="84" y="68" width="232" height="184" fill="rgba(255,90,60,0.05)"
        style="opacity:0; clip-path: inset(0 100% 0 0)"/>

  <!-- paint sweep -->
  <rect id="stage-paint" x="84" y="68" width="232" height="184" fill="rgba(255,140,66,0.06)"
        style="opacity:0; clip-path: inset(0 100% 0 0)"/>

  <!-- floorboards -->
  <g id="stage-tile" style="opacity:0">
    <path d="M84 236 H316 M84 244 H316" stroke="#ff8c42" stroke-width="1.5"/>
  </g>

  <!-- furniture + portrait card -->
  <g id="stage-furniture" style="opacity:0">
    <rect x="150" y="216" width="44" height="20" fill="#1b2233" stroke="#ffa366" stroke-width="1"/>
    <rect x="158" y="196" width="28" height="20" fill="#10131b" stroke="#ffa366" stroke-width="1"/>
    <text x="212" y="222" fill="#ffa366" font-size="8">[ your site ]</text>
  </g>

  <!-- roof planters -->
  <g id="stage-plants" style="opacity:0; transform-origin: 200px 60px; transform: scaleY(0)">
    <path d="M120 60 L112 44 M120 60 L128 44 M120 60 L120 38" stroke="#32cd32" stroke-width="2" fill="none"/>
    <path d="M280 60 L272 44 M280 60 L288 44 M280 60 L280 38" stroke="#32cd32" stroke-width="2" fill="none"/>
    <rect x="108" y="56" width="24" height="6" fill="#141a26"/>
    <rect x="268" y="56" width="24" height="6" fill="#141a26"/>
  </g>

  <!-- inspector stamp -->
  <g id="stage-stamp" style="opacity:0">
    <rect x="150" y="98" width="100" height="36" fill="none" stroke="#fff" stroke-width="1.5" transform="rotate(-8 200 116)"/>
    <text x="163" y="122" fill="#fff" font-size="14" font-weight="bold" transform="rotate(-8 200 116)">APPROVED</text>
  </g>
</svg>`;

let finished = false;

/* -------- HUD helpers -------- */
function hud() {
  const el = (id) => document.getElementById(id);
  return {
    agent: el("hud-agent"),
    counter: el("hud-counter"),
    log: el("hud-log"),
    ticks: el("hud-ticks"),
    stage: el("intro-stage"),
    overlay: el("intro-overlay"),
    skip: el("skip-intro"),
  };
}

function initHUD() {
  const h = hud();
  h.ticks.innerHTML = AGENTS.map((a) => `<span class="tick" data-id="${a.id}"></span>`).join("");
}

function setHUD(agent, index) {
  const h = hud();
  h.agent.innerHTML = `${agent.name} <span class="role">/ ${agent.role}</span>`;
  h.counter.textContent = `0${index + 1}/${AGENTS.length}`;
  h.log.textContent = `> ${agent.log}`;
  h.ticks.querySelector(`.tick[data-id="${agent.id}"]`)?.classList.add("on");
}

/* -------- agent avatars -------- */
function spawnAgents(stage) {
  const svg = stage.querySelector("#bp-svg");
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.id = "agent-layer";
  svg.appendChild(group);

  return AGENTS.map((a, i) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", a.id);
    g.innerHTML = `
      <circle r="7" fill="${a.color}" opacity="0.9"/>
      <circle r="12" fill="none" stroke="${a.color}" stroke-width="1" opacity="0.4"/>
      <line x1="0" y1="-12" x2="0" y2="-18" stroke="${a.color}" stroke-width="1.5"/>
      <circle cx="0" cy="-18" r="1.6" fill="${a.color}"/>
      <text y="4" text-anchor="middle" font-size="6" fill="#05060a" font-weight="bold">${i + 1}</text>
    `;
    g.style.opacity = 0;
    // start scattered off-stage at the bottom
    g.setAttribute("transform", `translate(${30 + (i * 340) / AGENTS.length}, 300)`);
    group.appendChild(g);
    return g;
  });
}

function moveAgentTo(el, targetSel, agent, tl, at) {
  const stage = document.getElementById("intro-stage");
  const tEl = stage.querySelector(targetSel);
  // Missing target must not crash the intro: fall back to the stage centre.
  const box = tEl ? tEl.getBBox() : { x: 100, y: 0, width: 200, height: 280 };
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  tl.to(agent.el, {
    attr: { transform: `translate(${cx}, ${cy})` },
    duration: agent.duration * 0.35,
    ease: "power2.inOut",
  }, at);
}

/* -------- per-agent stage actions -------- */
function agentAction(agent, tl, index, at) {
  const stage = hud().stage;
  const $ = (s) => stage.querySelector(s);

  switch (agent.id) {
    case "a-01": // Surveyor: grid draws in
      tl.set("#stage-grid", { opacity: 1 }, at);
      tl.from("#grid-diag", { strokeDashoffset: 800, strokeDasharray: "6 6" }, { ...{ duration: agent.duration * 0.6 }, at });
      break;
    case "a-02": // Crane Op: columns rise
      tl.from("#stage-beam-1", { opacity: 0, scaleY: 0, transformOrigin: "center bottom" }, { duration: agent.duration * 0.6, ease: "power3.out" }, at);
      break;
    case "a-03": // Structural Eng: beams snap
      tl.set("#stage-beam-2", { opacity: 1 }, at);
      tl.from("#stage-beam-2 rect", { scaleX: 0, transformOrigin: "left center", stagger: 0.12 }, { duration: agent.duration * 0.55, ease: "back.out(1.4)" }, at);
      break;
    case "a-04": // Mason: slab drops
      tl.set("#stage-floor", { opacity: 1 }, at);
      tl.from("#stage-floor", { y: -60 }, { duration: agent.duration * 0.5, ease: "bounce.out" }, at);
      break;
    case "a-05": // Plumber: pipes draw
      tl.to("#stage-pipes", { opacity: 1, duration: 0.3 }, at);
      tl.from("#stage-pipes", { strokeDasharray: 900, strokeDashoffset: 900 }, { duration: agent.duration * 0.6 }, at);
      break;
    case "a-06": // Electrician: wiring lights, lamp flickers
      tl.to("#stage-wiring", { opacity: 1, duration: 0.3 }, at);
      tl.from("#stage-wiring", { strokeDasharray: 500, strokeDashoffset: 500 }, { duration: agent.duration * 0.5 }, at);
      tl.to("#stage-lamp", { opacity: 1, duration: 0.15, repeat: 5, yoyo: true, stagger: 0.05 }, at + agent.duration * 0.5);
      break;
    case "a-07": // Glazier: panes fall in
      tl.set("#stage-windows", { opacity: 1 }, at);
      tl.from("#stage-windows rect", { y: -30, opacity: 0, stagger: 0.1 }, { duration: agent.duration * 0.4, ease: "power4.in" }, at);
      break;
    case "a-08": // Welder: spark bursts
      tl.set("#stage-joints", { opacity: 1 }, at);
      tl.fromTo("#stage-joints circle", { scale: 0.4 }, { scale: 2.2, transformOrigin: "center", duration: 0.15, repeat: 5, yoyo: true, stagger: 0.08, ease: "power1.inOut" }, at);
      break;
    case "a-09": // Plasterer: wall fill sweep
      tl.set("#stage-walls", { opacity: 1 }, at);
      tl.to("#stage-walls", { clipPath: "inset(0 0% 0 0)", duration: agent.duration * 0.6, ease: "power2.inOut" }, at);
      break;
    case "a-10": // Painter: paint wipe
      tl.set("#stage-paint", { opacity: 1 }, at);
      tl.to("#stage-paint", { clipPath: "inset(0 0% 0 0)", duration: agent.duration * 0.6, ease: "power2.inOut" }, at);
      break;
    case "a-11": // Floorer: boards sweep
      tl.set("#stage-tile", { opacity: 1 }, at);
      tl.from("#stage-tile path", { scaleX: 0, transformOrigin: "left center", stagger: 0.15 }, { duration: agent.duration * 0.45 }, at);
      break;
    case "a-12": // Designer: furniture + card
      tl.set("#stage-furniture", { opacity: 1 }, at);
      tl.from("#stage-furniture", { x: -40 }, { duration: agent.duration * 0.5, ease: "power2.out" }, at);
      break;
    case "a-13": // Landscaper: plants grow
      tl.set("#stage-plants", { opacity: 1, transform: "scaleY(1)" }, at);
      tl.from("#stage-plants", { scaleY: 0 }, { duration: agent.duration * 0.5, ease: "back.out(1.2)" }, at);
      break;
    case "a-14": // Inspector: stamp
      tl.to("#stage-stamp", { opacity: 1, duration: 0.01 }, at + agent.duration * 0.3);
      tl.from("#stage-stamp", { scale: 3, opacity: 0, rotation: -20, transformOrigin: "center" }, { duration: 0.5, ease: "power4.out" }, at + agent.duration * 0.3);
      break;
    case "a-15": // Foreman: full lights, HUD fade
      tl.to("#intro-hud", { opacity: 0, duration: 0.8 }, at + agent.duration * 0.4);
      break;
    default:
      tl.set(agent.target, { opacity: 1 }, at);
  }
}

/* -------- handover: reveal the real site -------- */
function handover() {
  if (finished) return;
  finished = true;
  const overlay = hud().overlay;
  gsap.to(overlay, {
    clipPath: "inset(0 0 100% 0)",
    duration: 1.2,
    ease: "power4.inOut",
    onComplete: () => {
      overlay.classList.add("hidden");
      gsap.set(overlay, { clipPath: "inset(0 0 0% 0)" });
      if (typeof window.__onIntroDone === "function") window.__onIntroDone();
    },
  });
}

/* -------- master timeline -------- */
let tl = null;

export function startIntro() {
  const h = hud();
  if (!h.stage || !h.overlay) { revealNow(); return; }
  initHUD();
  h.stage.innerHTML = STAGE_BLUEPRINT;
  const agents = spawnAgents(h.stage);

  // Wire skip + Esc and a hard failsafe BEFORE any timeline work, so the
  // site can always be reached — even if timeline construction throws.
  let hardTimer = 0;
  let fired = false;
  const finish = () => {
    if (fired) return;
    fired = true;
    window.clearTimeout(hardTimer);
    document.removeEventListener("keydown", onEsc, true);
    if (h.skip) h.skip.removeEventListener("click", finish);
    if (tl) { try { tl.progress(1); } catch {} try { tl.kill(); } catch {} }
    handover();
  };
  const onEsc = (e) => { if (e.key === "Escape") finish(); };
  if (h.skip) h.skip.addEventListener("click", finish);
  document.addEventListener("keydown", onEsc, true);
  hardTimer = window.setTimeout(finish, 120000);

  try {
    tl = gsap.timeline({
      defaults: { ease: "power1.inOut" },
      onStart: () => {
        h.skip?.focus?.();
        gsap.set(agents.map((a) => a), { opacity: 1, duration: 0.4, stagger: 0.05 });
      },
    });

    AGENTS.forEach((a, i) => {
      const agent = { ...a, el: agents[i] };
      const at = i * a.duration;

      tl.call(() => setHUD(a, i), null, at + 0.2);
      // agent moves toward its target while its stage action plays
      moveAgentTo(agent, agent.target, agent, tl, at + 0.2);
      agentAction(agent, tl, i, at + 0.4);

      // brief rest between agents; agents drift to resting spots
      tl.to(agent.el, { attr: { transform: `translate(${40 + i * 22}, 268) rotate(${i % 2 ? 12 : -12})` }, duration: 0.5 }, `> + 0.2`);
    });

    // hold the completed building, then hand over
    tl.to({}, { duration: 1.0 });
    tl.call(finish, null, ">");
    window.__introTl = tl;
    tl.play();
  } catch (err) {
    console.error("[construction] intro build failed, revealing site:", err);
    finish();
  }
}

// Fallback used by main.jsx if startIntro throws before its own guard.
export function revealNow() {
  const overlay = document.getElementById("intro-overlay");
  if (overlay) overlay.classList.add("hidden");
  if (typeof window.__onIntroDone === "function") window.__onIntroDone();
}

export { handover };
