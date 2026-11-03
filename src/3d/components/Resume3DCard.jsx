import { memo, useRef, useEffect, useState } from "react";
import { prefersReducedMotion } from "../config";

/**
 * Resume3DCard — Premium 3D floating resume / document card.
 *
 * Construction synchronisation:
 *  - The front face carries `data-layer={layer}` so the 15-agent tour measures
 *    it and CSS-clips it (via html[data-intro] + .layer-built) until its worker
 *    builds it.
 *  - Sub-layers (`{layer}.preview`, `{layer}.actions`) let the Deck agent stage
 *    the build piece-by-piece.
 *  - The decorative depth/glow layers are nested children of the buildable face,
 *    so they hide naturally via the CSS clip. No React visibility gate needed —
 *    engine teardown removes [data-intro] and clears all clips automatically.
 */
function Resume3DCard({ layer, children }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Mouse-driven perspective tilt — armed after mount, disabled under reduced motion.
  useEffect(() => {
    if (!cardRef.current || prefersReducedMotion) return;
    const card = cardRef.current;

    function handleMouseMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltX = ((y - centerY) / centerY) * -12;
      const tiltY = ((x - centerX) / centerX) * 12;
      setTilt({ x: tiltX, y: tiltY });
    }
    function handleMouseLeave() {
      setTilt({ x: 0, y: 0 });
    }

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Subtle GPU-friendly floating loop, skipped under reduced motion.
  useEffect(() => {
    if (!cardRef.current || prefersReducedMotion) return;
    const el = cardRef.current;
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) * 0.001;
      el.style.setProperty("--float-y", `${Math.sin(t * 1.2) * 3}px`);
      el.style.setProperty("--float-rotate", `${Math.cos(t * 0.8) * 0.8}deg`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const baseTransform = `translateY(var(--float-y, 0px)) rotateX(calc(${tilt.x}deg + var(--float-rotate, 0deg))) rotateY(${tilt.y}deg)`;

  return (
    /* The whole card is a single clip target so the tour hides it as one unit
       (no empty shell). The plain wrapper sits OUTSIDE the 3D chain, so the
       clip-path never flattens the perspective/translateZ inside. */
    <div data-layer={layer} data-owner="12" data-kind="card" className="w-full">
      <div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full will-change-transform"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1200px",
        transform: baseTransform,
        transition: prefersReducedMotion
          ? "none"
          : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Main card container with depth */}
      <div className="relative" style={{ transformStyle: "preserve-3d" }}>
        {/* Back depth layers — create 3D volume. Gated with the frame (aria-hidden). */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              transform: `translateZ(-${(i + 1) * 3}px)`,
              background: `linear-gradient(135deg, rgba(16, 19, 27, ${1 - i * 0.1}), rgba(10, 12, 18, ${1 - i * 0.12}))`,
              boxShadow:
                i === 7
                  ? isHovered
                    ? "0 30px 70px -20px rgba(255, 90, 60, 0.6), 0 10px 40px -10px rgba(255, 90, 60, 0.4)"
                    : "0 20px 50px -15px rgba(255, 90, 60, 0.4), 0 8px 30px -8px rgba(0, 0, 0, 0.8)"
                  : "none",
            }}
          />
        ))}

        {/* Front face — visual surface of the card. The whole card is clipped as
            one unit by the outer data-layer wrapper; sub-layers ({layer}.preview,
            {layer}.actions) still stage inside it. */}
        <div
          className="relative bg-gradient-to-br from-[#10131b] via-[#0d0f17] to-[#0a0c12] rounded-lg overflow-hidden border border-[#ff5a3c]/30"
          style={{
            transform: "translateZ(0px)",
            boxShadow: isHovered
              ? "inset 0 0 30px -8px rgba(255, 90, 60, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.1)"
              : "inset 0 0 20px -10px rgba(255, 90, 60, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Top glass accent */}
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff5a3c]/60 to-transparent"
            style={{ transform: "translateZ(2px)", boxShadow: "0 4px 12px -2px rgba(255, 90, 60, 0.6)" }}
          />

          {/* Corner glass reflection */}
          <div
            aria-hidden
            className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
            style={{
              background: "radial-gradient(circle at top left, rgba(255, 255, 255, 0.08) 0%, transparent 60%)",
              transform: "translateZ(1px)",
            }}
          />

          {/* Content */}
          <div className="relative p-6 md:p-8" style={{ transform: "translateZ(4px)" }}>
            {children}
          </div>

          {/* Bottom lighting accent */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at bottom, rgba(255, 90, 60, 0.15) 0%, transparent 60%)",
              opacity: isHovered ? 1 : 0.6,
              transition: "opacity 0.3s ease",
            }}
          />
        </div>

        {/* Outer glow frame */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            transform: "translateZ(1px)",
            border: "1px solid rgba(255, 90, 60, 0.4)",
            boxShadow: isHovered
              ? "0 0 30px -5px rgba(255, 90, 60, 0.8), inset 0 0 20px -8px rgba(255, 90, 60, 0.4)"
              : "0 0 20px -8px rgba(255, 90, 60, 0.5), inset 0 0 15px -10px rgba(255, 90, 60, 0.3)",
            transition: "box-shadow 0.3s ease",
          }}
        />
      </div>
    </div>
    </div>
  );
}

export default memo(Resume3DCard);
