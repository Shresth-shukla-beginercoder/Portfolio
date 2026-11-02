import { memo, useRef, useEffect, useState } from "react";
import { useConstructionState } from "../ConstructionContext";
import { prefersReducedMotion } from "../config";

/**
 * ContactCard3D — elevated contact card with premium depth.
 *
 * CSS 3D transforms. Provides:
 *  - elevated card surface
 *  - subtle floating motion
 *  - red glow on CTA buttons
 */
function ContactCard3D({ layer, children }) {
  const state = useConstructionState(layer);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current || state !== "active" || prefersReducedMotion) return;
    const el = cardRef.current;
    let raf = 0;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) * 0.001;
      const y = Math.sin(t * 1.4) * 2;
      el.style.transform = `translateY(${y}px) translateZ(16px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const visible = state === "active";
  const revealing = state === "revealing";
  const hidden = state === "hidden";

  return (
    <div
      ref={cardRef}
      className="relative will-change-transform"
      style={{
        transformStyle: "preserve-3d",
        transform: hidden ? "scale(0.9) translateZ(0px)" : "translateZ(16px)",
        opacity: hidden ? 0 : 1,
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Back depth layer */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          transform: "translateZ(-14px)",
          background: "linear-gradient(145deg, #10131b, #0a0c12)",
          borderRadius: 4,
          boxShadow: "0 16px 48px -16px rgba(0,0,0,0.8)",
        }}
      />
      {/* Content */}
      <div style={{ transform: "translateZ(10px)" }}>{children}</div>
    </div>
  );
}

export default memo(ContactCard3D);
