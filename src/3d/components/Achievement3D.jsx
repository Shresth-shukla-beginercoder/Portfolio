import { memo, useRef, useEffect } from "react";
import { useConstructionState } from "../ConstructionContext";
import { prefersReducedMotion } from "../config";

/**
 * Achievement3D — dimensional achievement panel.
 *
 * CSS 3D transforms. Panels have:
 *  - layered typography with depth
 *  - scroll-based reveal with staggered entry
 *  - subtle floating motion
 */
function Achievement3D({ achievement, index, layer, children }) {
  const state = useConstructionState(layer);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!panelRef.current || state !== "active" || prefersReducedMotion) return;
    const el = panelRef.current;
    let raf = 0;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) * 0.001 + index * 0.6;
      const x = Math.sin(t * 1.2) * 1.5;
      el.style.transform = `translateX(${x}px) translateZ(12px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, index]);

  const visible = state === "active";
  const revealing = state === "revealing";
  const hidden = state === "hidden";

  return (
    <div
      ref={panelRef}
      className="relative will-change-transform"
      style={{
        transformStyle: "preserve-3d",
        transform: hidden ? "translateX(-80px) translateZ(0px)" : "translateZ(12px)",
        opacity: hidden ? 0 : 1,
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Back layer */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          transform: "translateZ(-10px)",
          background: "linear-gradient(90deg, rgba(255,90,60,0.05), transparent)",
          borderRadius: 2,
        }}
      />
      {/* Red illuminated divider */}
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{
          background: "#ff5a3c",
          boxShadow: "0 0 8px 2px rgba(255,90,60,0.5)",
          transform: "translateZ(6px)",
        }}
      />
      {/* Content */}
      <div style={{ transform: "translateZ(8px)" }}>{children}</div>
    </div>
  );
}

export default memo(Achievement3D);
