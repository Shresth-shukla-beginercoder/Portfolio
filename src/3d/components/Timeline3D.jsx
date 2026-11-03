import { memo, useRef, useEffect } from "react";
import { useConstructionState } from "../ConstructionContext";
import { TIMELINE_3D, prefersReducedMotion } from "../config";

/**
 * Timeline3D — dimensional experience timeline with 3D spine.
 *
 * CSS 3D transforms. The spine is a metallic rod with red illumination,
 * and experience cards are positioned with depth separation.
 */
function Timeline3D({ entries, children }) {
  const spineRef = useRef(null);

  return (
    <div className="relative" style={{ transformStyle: "preserve-3d" }}>
      {/* Central spine */}
      <div
        ref={spineRef}
        aria-hidden
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: TIMELINE_3D.spineWidth,
          background: "linear-gradient(180deg, #ff5a3c, #cc4830, #ff5a3c)",
          boxShadow: `0 0 ${TIMELINE_3D.spineGlowIntensity * 16}px ${TIMELINE_3D.spineGlowIntensity * 4}px rgba(255,90,60,0.6)`,
          transform: "translateZ(10px)",
        }}
      />
      {/* Timeline entries */}
      <div className="space-y-10">{children}</div>
    </div>
  );
}

/**
 * TimelineEntry3D — individual experience card along the timeline.
 */
function TimelineEntry3D({ entry, index, layer, children }) {
  const state = useConstructionState(layer);
  const entryRef = useRef(null);

  useEffect(() => {
    if (!entryRef.current || state !== "active" || prefersReducedMotion) return;
    const el = entryRef.current;
    let raf = 0;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) * 0.001;
      const y = Math.sin(t * 1.5 + index) * 1.5;
      el.style.transform = `translateY(${y}px) translateZ(${TIMELINE_3D.cardDepthSeparation}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, index]);

  const visible = state === "active";
  const revealing = state === "revealing";
  const hidden = state === "hidden";
  const side = index % 2 === 0 ? -1 : 1;

  return (
    <div
      ref={entryRef}
      className="relative will-change-transform"
      style={{
        transformStyle: "preserve-3d",
        transform: hidden
          ? `translateX(${side * 100}px) translateZ(0px)`
          : `translateZ(${TIMELINE_3D.cardDepthSeparation}px)`,
        opacity: hidden ? 0 : 1,
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Connection point glow */}
      <div
        aria-hidden
        className="absolute left-0 top-4 w-3 h-3 rounded-full"
        style={{
          background: "#ff5a3c",
          boxShadow: "0 0 12px 3px rgba(255,90,60,0.7)",
          transform: "translateZ(8px)",
        }}
      />
      {/* Content. The construction-controlled node (data-layer) is passed as
          children by Experience.jsx; without it the entry would mount outside
          the construction registry and stay visible before its agent builds it.
          Falls back to the inline card when no children are provided. */}
      {children || entry.children || (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 border-l-2 border-[#ff5a3c]/40 pl-6">
          <div>
            <p className="font-mono text-xs text-[#ff5a3c]">{entry.period}</p>
            <p className="text-gray-500 text-sm mt-1">{entry.org}</p>
          </div>
          <div>
            <h3 className="text-xl font-bold">{entry.role}</h3>
            <p className="text-gray-400 mt-2">{entry.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export { Timeline3D, TimelineEntry3D };
export default memo(Timeline3D);
