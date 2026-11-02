import { memo, useRef, useEffect, useState } from "react";
import { useConstructionState } from "../ConstructionContext";
import { prefersReducedMotion } from "../config";

/**
 * CertificateFrame3D — floating certificate frame with glass/metallic border.
 *
 * CSS 3D transforms. Frame has:
 *  - slight perspective rotation
 *  - hover elevation and glow
 *  - smooth transition to lightbox on click
 */
function CertificateFrame3D({ cert, index, layer, onClick, children }) {
  const state = useConstructionState(layer);
  const frameRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!frameRef.current || state !== "active" || prefersReducedMotion) return;
    const el = frameRef.current;
    let raf = 0;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) * 0.001 + index * 0.8;
      const y = Math.sin(t * 1.3) * 2;
      const r = Math.cos(t * 0.9) * 0.5;
      el.style.transform = `translateY(${y}px) rotateX(${r}deg) translateZ(${
        isHovered ? 16 : 0
      }px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, index, isHovered]);

  const visible = state === "active";
  const revealing = state === "revealing";
  const hidden = state === "hidden";

  return (
    <div
      ref={frameRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative will-change-transform cursor-pointer"
      style={{
        transformStyle: "preserve-3d",
        transform: hidden ? "rotateY(-15deg) scale(0.8)" : "rotateY(0deg) scale(1)",
        opacity: hidden ? 0 : 1,
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Frame back depth */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          transform: "translateZ(-18px)",
          background: "linear-gradient(135deg, #10131b, #0a0c12)",
          borderRadius: 2,
          boxShadow: isHovered
            ? "0 20px 50px -16px rgba(255,90,60,0.4)"
            : "0 12px 32px -12px rgba(0,0,0,0.7)",
        }}
      />
      {/* Glass/metallic border */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: "translateZ(1px)",
          border: "1px solid rgba(255,90,60,0.4)",
          borderRadius: 2,
          boxShadow: isHovered
            ? "inset 0 0 18px -4px rgba(255,90,60,0.5)"
            : "inset 0 0 10px -6px rgba(255,90,60,0.3)",
          transition: "box-shadow 0.3s ease",
        }}
      />
      {/* Content */}
      <div style={{ transform: "translateZ(10px)" }}>{children}</div>
    </div>
  );
}

export default memo(CertificateFrame3D);
