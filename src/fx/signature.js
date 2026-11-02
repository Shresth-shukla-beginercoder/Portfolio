import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

/* Signature draws itself when the sign-off section scrolls into view. */
let armed = false;
export function initSignature() {
  if (armed) return;
  const root = document.querySelector("#sign-off");
  if (!root) return;
  armed = true;
  const paths = root.querySelectorAll(".sig-stroke");
  if (!paths.length) return;

  const pen = root.querySelector(".sig-pen");

  // Reduced motion: reveal the finished signature, no long draw choreography.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    paths.forEach((p) => { p.style.strokeDasharray = "none"; });
    if (pen) gsap.set(pen, { opacity: 0 });
    return;
  }

  paths.forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  });

  if (pen) gsap.set(pen, { opacity: 0 });

  // Start the draw the instant the signature itself scrolls into view,
  // so the viewer watches it happen rather than catching it mid-draw.
  const sig = root.querySelector(".signature-svg") || root;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: sig, start: "top 85%", once: true },
  });

  // "Very fast" sign-off: each stroke's pen tweens are anchored to the same
  // start as its draw so they overlap instead of appending — the whole
  // signature completes in ~1s rather than the old 12–18s.
  const BUDGET = 1.0;
  const N = paths.length;
  const dur = Math.max(0.015, BUDGET / Math.max(1, N));
  paths.forEach((p) => {
    const start = tl.duration();
    tl.to(p, { strokeDashoffset: 0, duration: dur, ease: "power1.inOut" }, start);
    if (pen) {
      tl.to(pen, { opacity: 1, duration: Math.min(0.05, dur) }, start);
      tl.to(pen, {
        motionPath: { path: p, align: p, alignOrigin: [0.5, 0.5] },
        duration: dur,
        ease: "power1.inOut",
      }, start);
    }
  });
  if (pen) tl.to(pen, { opacity: 0, duration: 0.2 });

  return tl;
}
