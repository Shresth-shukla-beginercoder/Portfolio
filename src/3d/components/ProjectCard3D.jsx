import { memo, useRef, useEffect, useState } from "react";
import { useConstructionState } from "../ConstructionContext";
import { PROJECT_CARD_3D, prefersReducedMotion } from "../config";

/**
 * ProjectCard3D — premium project showcase with dimensional depth.
 *
 * CSS 3D transforms only. Provides:
 *  - realistic depth and shadows
 *  - image layer with separate parallax depth
 *  - pointer-based perspective tilt
 *  - hover: card elevates, image zooms, info reveals
 *  - red edge lighting
 *  - construction-state driven entry
 */
function ProjectCard3D({ project, index, layer, children }) {
  const state = useConstructionState(layer);
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!cardRef.current || state !== "active") return;

    const card = cardRef.current;

    function handleMouseMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = ((y - centerY) / centerY) * -PROJECT_CARD_3D.tiltMax;
      const tiltY = ((x - centerX) / centerX) * PROJECT_CARD_3D.tiltMax;

      setTilt({ x: tiltX, y: tiltY });
    }

    function handleMouseEnter() {
      setIsHovered(true);
    }

    function handleMouseLeave() {
      setIsHovered(false);
      setTilt({ x: 0, y: 0 });
    }

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
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
        transform: state === "active"
          ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${
              isHovered ? PROJECT_CARD_3D.elevationOnHover : 0
            }px)`
          : hidden
          ? "perspective(1200px) rotateY(-20deg) scale(0.85)"
          : "perspective(1200px) rotateY(0deg) scale(1)",
        opacity: hidden ? 0 : 1,
        transition: state === "active"
          ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          : "all 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Back depth plate */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          transform: `translateZ(-${PROJECT_CARD_3D.depth}px)`,
          background: "linear-gradient(145deg, #0a0c12, #10131b)",
          borderRadius: 2,
          boxShadow: isHovered
            ? `0 40px 80px -20px rgba(0,0,0,${PROJECT_CARD_3D.shadowIntensity + 0.2}), 0 0 0 1px rgba(255,90,60,0.2)`
            : `0 24px 60px -24px rgba(0,0,0,${PROJECT_CARD_3D.shadowIntensity})`,
        }}
      />
      {/* Emissive edge */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: "translateZ(2px)",
          borderRadius: 2,
          boxShadow: isHovered
            ? "inset 0 0 28px -6px rgba(255,90,60,0.6), 0 0 32px -8px rgba(255,90,60,0.4)"
            : "inset 0 0 14px -8px rgba(255,90,60,0.25)",
          transition: "box-shadow 0.4s ease",
        }}
      />
      {/* Content — children from Projects.jsx */}
      <div
        style={{
          transform: `translateZ(${PROJECT_CARD_3D.depth * 0.5}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default memo(ProjectCard3D);
