/*
 * Pooled canvas light-trails for the 15 construction agents.
 *
 * The previous approach rebuilt an SVG <polyline> points string for every
 * agent every frame (15 × 14-point string concatenations + setAttribute),
 * which churning the DOM on the hot path was a stutter source. This module
 * instead keeps a fixed ring buffer of positions per agent and draws all 15
 * trails onto a single DPR-aware <canvas> in one pass per frame.
 *
 *  - Luminous tapered strokes, colour-matched to each agent.
 *  - Soft "glow" faked with a wide faint pass + a thin bright pass (no
 *    full-screen shadowBlur / CSS blur — keeps it cheap).
 *  - One draw per frame, no per-frame DOM element creation.
 *  - No-op / hidden when the intro is torn down.
 */

const TRAIL_LEN = 28;

let canvas = null;
let ctx = null;
let dpr = 1;
let vw = 0;
let vh = 0;
let buffers = [];
let ro = null;
let raf = 0;
let active = false;

function size() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(vw * dpr));
  canvas.height = Math.max(1, Math.floor(vh * dpr));
  canvas.style.width = vw + "px";
  canvas.style.height = vh + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// hex "#rrggbb" -> [r,g,b]
function rgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function initTrails(agents, container) {
  canvas = document.createElement("canvas");
  canvas.id = "trail-canvas";
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:1;";
  const svg = container.querySelector("#agent-svg");
  container.insertBefore(canvas, svg); // arrows render above their trails
  ctx = canvas.getContext("2d");
  size();
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(size);
    ro.observe(document.body);
  } else {
    window.addEventListener("resize", size);
  }

  buffers = agents.map((a, i) => ({
    x: new Float32Array(TRAIL_LEN),
    y: new Float32Array(TRAIL_LEN),
    head: 0,
    count: 0,
    color: a.color || "#ff5a3c",
    rgb: rgb(a.color || "#ff5a3c"),
    style: a.trail || "solid",
    // staggered idle phase so the settle wobble isn't a wall of identical motion
    phase: i * 0.7,
    // where the arrow head actually is right now (for the wobble, decoupled
    // from the recorded logical trail path)
    px: a.x, py: a.y,
  }));

  active = true;
  return {
    record(i, x, y) {
      const b = buffers[i];
      if (!b) return;
      b.x[b.head] = x;
      b.y[b.head] = y;
      b.head = (b.head + 1) % TRAIL_LEN;
      b.count = Math.min(b.count + 1, TRAIL_LEN);
      b.px = x; b.py = y;
    },
    // One full pass: clear + draw every agent's tapered luminous trail.
    draw(now = performance.now()) {
      if (!active || !ctx) return;
      ctx.clearRect(0, 0, vw, vh);
      for (let i = 0; i < buffers.length; i++) {
        drawTrail(buffers[i], i, now);
      }
    },
    clear() {
      buffers.forEach((b) => { b.count = 0; b.head = 0; });
      if (ctx) ctx.clearRect(0, 0, vw, vh);
    },
    destroy() {
      active = false;
      if (ro) ro.disconnect();
      window.removeEventListener("resize", size);
      canvas && canvas.remove();
      canvas = null; ctx = null; buffers = [];
    },
  };
}

function pointAt(b, fromHead) {
  // fromHead: 0 = newest, TRAIL_LEN-1 = oldest
  const idx = (b.head - 1 - fromHead + TRAIL_LEN * 2) % TRAIL_LEN;
  return [b.x[idx], b.y[idx]];
}

function drawTrail(b, i, now) {
  if (b.count < 2) return;
  const n = b.count;
  const [r, g, bl] = b.rgb;

  // idle settle wobble: subtle drift that fades as the agent moves fast.
  // (read from the agent's logical head position passed via b.px/b.py)
  const speed = 0; // wobble amplitude is applied to the ARROW, not the trail

  // Tapered two-pass stroke. We draw per-segment so width + alpha can ramp
  // from a faint wide tail up to a bright thin head.
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (b.style === "dotted") ctx.setLineDash([1, 7]);
  else if (b.style === "dashed") ctx.setLineDash([8, 6]);
  else ctx.setLineDash([]);

  // Pass 1 — soft glow (wide, faint). Pass 2 — bright core (thin).
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 1; k < n; k++) {
      const [x0, y0] = pointAt(b, n - 1 - k);      // older
      const [x1, y1] = pointAt(b, n - 1 - (k - 1)); // newer
      const p = k / n;                                // 0 tail -> ~1 head
      const wBase = pass === 0 ? 6 : 2;
      const wMax = pass === 0 ? wBase : 1.6;
      const aBase = pass === 0 ? 0.05 : 0.35;
      const width = 0.4 + (wMax - 0.4) * p;
      const alpha = (pass === 0 ? aBase : aBase * p) * p;
      ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha.toFixed(3)})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }
  void speed; void now; void i;
}
