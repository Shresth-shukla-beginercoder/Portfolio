/*
 * Cinematic "galaxy-level" sound design, 100% synthesized (WebAudio).
 * No audio assets, no licensing, works offline.
 *
 * - Ambient: detuned sub-bass drone + filtered "starfield" noise + a slow
 *   6 s swell. Fades in after the first user gesture (autoplay policy).
 * - One-shots: whoosh (agent travel), blip (selection), chime (layer built),
 *   thump (section scroll), sting (finale).
 * - `?sfx=0` hard-disables; the panel mute button persists in sessionStorage.
 */

const qs = new URLSearchParams(location.search);
const hardDisabled = qs.get("sfx") === "0";
let muted = false;
try { muted = sessionStorage.getItem("pf.sfxMuted") === "1"; } catch {}

let ctx = null;
let master = null;
let ambientOn = false;
let noiseBuf = null;

function ready() {
  if (!ctx || hardDisabled || muted) return false;
  return true;
}

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

function noise() {
  if (noiseBuf) return noiseBuf;
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function startAmbient() {
  if (!ctx || ambientOn || hardDisabled) return;
  ambientOn = true;
  const t = ctx.currentTime;
  const bed = ctx.createGain();
  bed.gain.setValueAtTime(0.0001, t);
  bed.gain.linearRampToValueAtTime(0.085, t + 5);
  bed.connect(master);

  // Detuned sub-bass drone (two sines + one low saw)
  [[55, 0.5], [55.8, 0.42], [110.4, 0.06]].forEach(([f, g]) => {
    const o = ctx.createOscillator();
    o.type = f > 100 ? "sawtooth" : "sine";
    o.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;
    const og = ctx.createGain();
    og.gain.value = g;
    o.connect(lp).connect(og).connect(bed);
    o.start(t);
  });

  // Starfield: gentle filtered noise, shimmer LFO
  const src = ctx.createBufferSource();
  src.buffer = noise();
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 5200;
  bp.Q.value = 0.4;
  const ng = ctx.createGain();
  ng.gain.value = 0.008;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.005;
  lfo.connect(lfoG).connect(ng.gain);
  src.connect(bp).connect(ng).connect(bed);
  src.start(t);
  lfo.start(t);
}

function unlock() {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  startAmbient();
}

/* ---------- one-shots ---------- */
function env(param, t0, peak, dur) {
  param.setValueAtTime(0.0001, t0);
  param.exponentialRampToValueAtTime(peak, t0 + 0.02);
  param.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

export function whoosh() {
  if (!ready() || !ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise();
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(3600, t + 0.45);
  const g = ctx.createGain();
  env(g.gain, t, 0.14, 0.5);
  src.connect(bp).connect(g).connect(master);
  src.start(t);
  src.stop(t + 0.55);
}

export function blip() {
  if (!ready() || !ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(1400, t);
  o.frequency.exponentialRampToValueAtTime(1900, t + 0.06);
  const g = ctx.createGain();
  env(g.gain, t, 0.05, 0.09);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.1);
}

export function chime() {
  if (!ready() || !ctx) return;
  const t = ctx.currentTime;
  [880, 1318.5].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.04);
    g.gain.exponentialRampToValueAtTime(0.04, t + i * 0.04 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.04 + 0.5);
    o.connect(g).connect(master);
    o.start(t + i * 0.04);
    o.stop(t + i * 0.04 + 0.55);
  });
}

export function thump() {
  if (!ready() || !ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.4);
  const g = ctx.createGain();
  env(g.gain, t, 0.16, 0.5);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.55);
}

export function sting() {
  if (!ready() || !ctx) return;
  const t = ctx.currentTime;
  [523.25, 659.25, 784, 1046.5].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    const s = t + i * 0.18;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.06, s + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 1.4);
    o.connect(g).connect(master);
    o.start(s);
    o.stop(s + 1.5);
  });
}

/* ---------- controls ---------- */
export function duck() {
  if (!master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0.03, t + 0.25);
}

export function toggle() {
  muted = !muted;
  try { sessionStorage.setItem("pf.sfxMuted", muted ? "1" : "0"); } catch {}
  const t = ctx?.currentTime ?? 0;
  if (master) {
    master.gain.cancelScheduledValues(t);
    master.gain.linearRampToValueAtTime(muted ? 0.0001 : 0.5, t + 0.2);
  }
  return soundOn();
}

export function soundOn() {
  return !hardDisabled && !muted;
}
export function enabled() {
  return soundOn();
}

export function init() {
  if (hardDisabled) return;
  const arm = () => {
    unlock();
    window.removeEventListener("pointerdown", arm);
    window.removeEventListener("keydown", arm);
    window.removeEventListener("wheel", arm, true);
  };
  window.addEventListener("pointerdown", arm, { passive: true });
  window.addEventListener("keydown", arm, { passive: true });
  window.addEventListener("wheel", arm, { passive: true, capture: true });
}
