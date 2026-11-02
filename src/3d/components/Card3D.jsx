import { memo, useRef, useEffect } from "react";
import { use3DCard } from "../hooks/use3DCard";
import { useConstructionState } from "../ConstructionContext";
import { prefersReducedMotion } from "../config";

/**
 * Card3D — premium dimensional card wrapper.
 *
 * Pure CSS 3D transforms (no WebGL canvas) so we can wrap hundreds of cards
 * with zero GPU-canvas overhead. Provides:
 *  - genuine visual depth (layered surfaces + drop shadow)
 *  - pointer-based perspective tilt
 *  - hover elevation toward the visitor
 *  - subtle red emissive edge glow
 *  - gentle floating motion (disabled under reduced-motion)
 *  - construction-state driven entry (hidden -> revealing -> active)
 *
 * The interactive/accessible content lives in `children` and stays a normal
 * DOM node, so keyboard navigation and screen readers are unaffected.
 */
function Card3D({
  layer,
  depth = 20,
  glow = true,
  float = true,
  className = "",
  children,
}) {
  const state = useConstructionState(layer);
  const { cardRef, isHovered, style } = use3DCard(state, float);
  const floatRef = useRef(null);

  // Gentle floating loop — only when active and motion is allowed.
  useEffect(() => {
    if (!floatRef.current || state !== "active" || prefersReducedMotion) return;
    const el = floatRef.current;
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) * 0.001;
      const y = Math.sin(t * 1.4) * 2;   // 2px vertical drift
      const r = Math.sin(t * 0.9) * 0.4; // 0.4deg sway
      el.style.transform = `translateY(${y}px) rotateX(${r}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, float]);

  // Construction-driven visibility
  const visible = state === "active";
  const revealing = state === "revealing";
  const hidden = state === "hidden";

  return (
    <div
      ref={cardRef}
      className={`relative will-change-transform ${className}`}
      style={{
        ...style,
        // Layered depth: a solid "back" plate + the content plane offset in Z.
        transformStyle: "preserve-3d",
        opacity: hidden ? 0 : 1,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Back plate — gives the surface real thickness */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          transform: `translateZ(-${depth}px)`,
          background: "linear-gradient(145deg, #0a0c12, #10131b)",
          borderRadius: 2,
          boxShadow: isHovered
            ? "0 30px 60px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,90,60,0.15)"
            : "0 18px 40px -24px rgba(0,0,0,0.8)",
        }}
      />
      {/* Emissive edge glow */}
      {glow && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translateZ(1px)`,
            borderRadius: 2,
            boxShadow: isHovered
              ? "inset 0 0 22px -6px rgba(255,90,60,0.5), 0 0 24px -6px rgba(255,90,60,0.35)"
              : "inset 0 0 12px -8px rgba(255,90,60,0.2)",
            transition: "box-shadow 0.4s ease",
          }}
        />
      )}
      {/* Content plane — parallax layer */}
      <div
        ref={floatRef}
        style={{
          transform: `translateZ(${depth * 0.4}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default memo(Card3D);
