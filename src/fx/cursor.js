import gsap from "gsap";

/* Custom cursor: dot + trailing ring, scales on hoverables, magnetic pull. */
export function initCursor() {
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  if (!dot || !ring || window.matchMedia("(pointer: coarse)").matches) return;

  let rx = 0, ry = 0, tx = 0, ty = 0;

  const tick = () => {
    rx += (tx - rx) * 0.18;
    ry += (ty - ry) * 0.18;
    gsap.set(dot, { x: tx, y: ty });
    gsap.set(ring, { x: rx, y: ry });
    requestAnimationFrame(tick);
  };

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });
  requestAnimationFrame(tick);

  gsap.utils.toArray("a, button, [data-hoverable]").forEach((el) => {
    el.addEventListener("mouseenter", () => gsap.to(ring, { scale: 1.8, opacity: 0.9, duration: 0.3 }));
    el.addEventListener("mouseleave", () => gsap.to(ring, { scale: 1, opacity: 0.5, duration: 0.3 }));
  });
}
