import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Maximize2, Download, FileWarning, RotateCcw } from "lucide-react";

const MIN = 0.5;
const MAX = 3;
const clamp = (s) => Math.max(MIN, Math.min(MAX, s));
// "100%" zoom = a comfortable fit for the portrait document. Everything else is
// a multiple of this. Using a calc() keeps it responsive (caps to 84vw on phones).
const FIT = "min(420px, 84vw)";

/**
 * ResumeViewer — full-screen, in-page document viewer.
 *
 * - Shows the actual resume PNG (never a placeholder).
 * - Zoom is layout-based (the image's CSS width scales), so the container
 *   genuinely scrolls: at 100% it fits, zoom in and it scrolls both axes,
 *   zoom out and it centres again. The centre-when-small / scroll-when-large
 *   behaviour comes from a flex box with `margin: auto` on the image.
 * - Zooming does NOT yank the scroll to the top — your position is kept, so
 *   you can zoom into a specific part of the resume.
 * - Pinch-to-zoom works on touch devices.
 * - Freezes the page behind it (stops Lenis + locks overflow) and restores the
 *   exact scroll position on close.
 * - Surfaces a loading state and a genuine error (with retry) — never blank.
 */
export default function ResumeViewer({ image, pdf, downloadName, onClose }) {
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [reloadKey, setReloadKey] = useState(0);
  const viewportRef = useRef(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // Freeze the page behind the viewer, remember position, restore on close.
  useEffect(() => {
    const lenis = window.__lenis;
    const savedY = window.scrollY;
    const prevOverflow = document.body.style.overflow;

    lenis?.stop?.();
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") setScale((s) => clamp(s + 0.25));
      else if (e.key === "-" || e.key === "_") setScale((s) => clamp(s - 0.25));
      else if (e.key === "0") {
        setScale(1);
        viewportRef.current?.scroll({ top: 0, left: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (lenis) {
        lenis.start?.();
        try {
          lenis.scrollTo?.(savedY, { immediate: true });
        } catch {
          /* Lenis may not expose scrollTo; the window fallback below covers it. */
        }
      }
      window.scrollTo(0, savedY);
    };
  }, [onClose]);

  // Pinch-to-zoom on the document viewport (two fingers).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let startDist = 0;
    let startScale = 1;
    const dist = (ts) =>
      ts.length === 2 ? Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY) : 0;
    const onStart = (e) => {
      const d = dist(e.touches);
      if (d) {
        startDist = d;
        startScale = scaleRef.current;
      }
    };
    const onMove = (e) => {
      const d = dist(e.touches);
      if (!d || !startDist) return;
      e.preventDefault();
      setScale(clamp(startScale * (d / startDist)));
    };
    const onEnd = () => {
      startDist = 0;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  // Change the zoom. `center` (used only by Reset) eases back to top-left;
  // plain zoom keeps the current scroll position so you can zoom into a spot.
  const zoomTo = (s, center = false) => {
    setScale(clamp(s));
    if (center) requestAnimationFrame(() => viewportRef.current?.scroll({ top: 0, left: 0, behavior: "smooth" }));
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = pdf;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const retry = () => {
    setStatus("loading");
    setReloadKey((k) => k + 1);
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#05060a]/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Resume viewer"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 p-4 md:p-6"
        style={{ background: "linear-gradient(to bottom, rgba(5,6,10,0.9), rgba(5,6,10,0))" }}
        onMouseDown={stop}
        onClick={stop}
      >
        <div className="min-w-0">
          <h3 className="text-white font-bold text-base md:text-xl truncate">
            {downloadName.replace(/\.pdf$/i, "").replace(/_/g, " ")} — Resume
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
            Scroll to read · {Math.round(scale * 100)}% · pinch / double-tap to zoom · Esc to close
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close viewer"
          className="p-2 text-gray-300 hover:text-[#ff5a3c] hover:bg-white/10 rounded-lg transition-colors shrink-0"
        >
          <X size={26} />
        </button>
      </div>

      {/* Scrollable document viewport — centers when it fits, scrolls when zoomed. */}
      <div
        ref={viewportRef}
        className="absolute inset-0 overflow-auto"
        onMouseDown={stop}
      >
        <div className="relative flex min-h-full min-w-full p-4 sm:p-6">
          {status === "error" ? (
            <div className="m-auto flex flex-col items-center justify-center gap-4 text-center border border-[#ff5a3c]/30 rounded-lg bg-[#10131b]/60 p-8 max-w-sm">
              <FileWarning className="text-[#ff5a3c]" size={40} />
              <div>
                <p className="text-white font-semibold">Could not load the resume</p>
                <p className="text-sm text-gray-400 mt-1">
                  The resume image failed to load from <code className="text-[#ff5a3c]">{image}</code>.
                </p>
              </div>
              <button
                onClick={(e) => {
                  stop(e);
                  retry();
                }}
                className="flex items-center gap-2 px-4 py-2 border border-[#ff5a3c]/60 text-white text-xs font-mono uppercase tracking-wider rounded hover:bg-[#ff5a3c]/10 transition-colors"
              >
                <RotateCcw size={15} /> Try again
              </button>
            </div>
          ) : (
            <>
              <img
                key={reloadKey}
                src={`${image}?v=${reloadKey}`}
                alt="Shresth Shukla resume"
                className="block m-auto shrink-0 select-none rounded-sm shadow-2xl shadow-black/60 ring-1 ring-[#ff5a3c]/20"
                style={{
                  width: `calc(${FIT} * ${scale})`,
                  height: "auto",
                  transition: "width 0.15s ease-out",
                  imageRendering: "auto",
                }}
                onDoubleClick={(e) => {
                  stop(e);
                  zoomTo(scale + 0.5);
                }}
                onClick={(e) => stop(e)}
                onLoad={() => setStatus("ready")}
                onError={() => setStatus("error")}
                draggable={false}
              />
              {status === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-[#ff5a3c]/30 border-t-[#ff5a3c]"
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    <span className="text-xs font-mono tracking-wider uppercase">Loading document…</span>
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6"
        style={{ background: "linear-gradient(to top, rgba(5,6,10,0.92), rgba(5,6,10,0))" }}
        onMouseDown={stop}
        onClick={stop}
      >
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => zoomTo(scale - 0.5)}
              disabled={scale <= MIN}
              aria-label="Zoom out"
              className="p-2.5 bg-[#10131b]/90 text-white border border-white/15 rounded-lg hover:border-[#ff5a3c]/60 hover:text-[#ff5a3c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomOut size={18} />
            </button>
            <span className="px-3 py-2.5 bg-[#10131b]/90 border border-white/15 rounded-lg text-xs font-mono text-[#ff5a3c] min-w-[64px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => zoomTo(scale + 0.5)}
              disabled={scale >= MAX}
              aria-label="Zoom in"
              className="p-2.5 bg-[#10131b]/90 text-white border border-white/15 rounded-lg hover:border-[#ff5a3c]/60 hover:text-[#ff5a3c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => zoomTo(1, true)}
              aria-label="Reset zoom"
              className="p-2.5 bg-[#10131b]/90 text-white border border-white/15 rounded-lg hover:border-[#ff5a3c]/60 hover:text-[#ff5a3c] transition-colors"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#ff5a3c] text-[#05060a] font-mono text-xs tracking-widest uppercase rounded-lg hover:bg-[#ff8568] transition-colors shadow-lg shadow-[#ff5a3c]/30"
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
