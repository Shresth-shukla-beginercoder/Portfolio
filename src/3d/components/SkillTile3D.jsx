import { memo, useRef, useEffect, useState } from "react";
import { useConstructionState } from "../ConstructionContext";
import { SKILL_TILE_3D, prefersReducedMotion } from "../config";

/**
 * SkillTile3D — floating 3D skill tile with glass material.
 *
 * CSS 3D transforms only (no WebGL). Each skill becomes a dimensional tile
 * with:
 *  - layered glass surface (translucent + gradient)
 *  - staggered Z-depth in the grid
 *  - gentle floating motion
 *  - hover: tile moves forward, others stay back
 *  - construction-state driven entry
 */
function SkillTile3D({ skill, index, layer }) {
  const state = useConstructionState(layer);
  const tileRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Floating animation
  useEffect(() => {
    if (!tileRef.current || state !== "active" || prefersReducedMotion) return;
    const el = tileRef.current;
    let raf = 0;
    const start = performance.now();
    const offset = index * 0.5; // Phase offset per tile

    const tick = (now) => {
      const t = (now - start) * 0.001 + offset;
      const y = Math.sin(t * 1.2) * SKILL_TILE_3D.floatAmplitude;
      const r = Math.cos(t * 0.8) * 0.6;
      el.style.transform = `translateY(${y}px) rotateX(${r}deg) translateZ(${
        isHovered ? SKILL_TILE_3D.hoverForward : 0
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
      ref={tileRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative will-change-transform"
      style={{
        transformStyle: "preserve-3d",
        transform: hidden ? "scale(0.6) translateZ(-50px)" : "scale(1) translateZ(0px)",
        opacity: hidden ? 0 : 1,
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Glass back layer */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          transform: `translateZ(-${SKILL_TILE_3D.depth}px)`,
          background:
            "linear-gradient(135deg, rgba(255,90,60,0.08), rgba(16,19,27,0.6))",
          backdropFilter: "blur(8px)",
          borderRadius: 4,
          boxShadow: isHovered
            ? "0 12px 40px -12px rgba(255,90,60,0.4)"
            : "0 6px 24px -8px rgba(0,0,0,0.6)",
          transition: "box-shadow 0.3s ease",
        }}
      />
      {/* Metallic edge */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: "translateZ(1px)",
          border: "1px solid rgba(255,90,60,0.3)",
          borderRadius: 4,
          boxShadow: isHovered
            ? "inset 0 0 16px -4px rgba(255,90,60,0.4)"
            : "inset 0 0 8px -6px rgba(255,90,60,0.2)",
          transition: "box-shadow 0.3s ease",
        }}
      />
      {/* Content */}
      <div
        style={{
          transform: `translateZ(${SKILL_TILE_3D.depth * 0.5}px)`,
        }}
      >
        {/* Skill bar content from Skills.jsx will be slotted here */}
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-200 tracking-wide">{skill.name}</span>
          <span className="text-[#ff5a3c] font-mono">{skill.level}%</span>
        </div>
        <div className="h-[3px] bg-white/10 overflow-hidden">
          <div
            data-skill-bar
            style={{ width: `${skill.level}%` }}
            className="h-full bg-[#ff5a3c]"
          />
        </div>
      </div>
    </div>
  );
}

export default memo(SkillTile3D);
