import React from "react";
import ReactDOM from "react-dom/client";
import { registerGSAP } from "./lib/gsap-setup.js";
import { startIntro, revealNow } from "./intro/engine.js";
import { initHero, initSections, initHeroAmbient } from "./scenes/sections.js";
import { initCursor } from "./fx/cursor.js";
import Lenis from "lenis";
import App from "./App.jsx";
import { useSetConstructionState } from "./3d/ConstructionContext.jsx";
import "./index.css";
import "./styles.css";

// Wrapper to expose the construction context to the intro engine
function AppWithBridge() {
  const setLayerState = useSetConstructionState();

  React.useEffect(() => {
    // Expose the 3D state setter globally so the construction engine can call it
    window.__set3DLayerState = setLayerState;

    return () => {
      window.__set3DLayerState = null;
    };
  }, [setLayerState]);

  return <App />;
}

const root = document.getElementById("root");
const params = new URLSearchParams(location.search);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== App (construction + intro + smooth scroll) =====
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppWithBridge />
  </React.StrictMode>
);

registerGSAP();

// Smooth scrolling (disabled for reduced motion or coarse pointers)
let lenis = null;
if (!reducedMotion) {
  lenis = new Lenis({ lerp: 0.09 });
  window.__lenis = lenis; // the construction tour stops/starts it as the single scroll driver
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

let booted = false;
// Skip path (reduced motion / ?intro=0): nothing was constructed, so run the
// full scroll-reveal scenes. Also activate all 3D layers immediately.
function bootAfterIntro() {
  if (booted) return;
  booted = true;

  // On skip path: set all 3D layers to "active" immediately (no construction animation)
  setTimeout(() => {
    const layers = document.querySelectorAll("[data-layer]");
    layers.forEach((el) => {
      const layerId = el.dataset.layer;
      if (window.__set3DLayerState) {
        window.__set3DLayerState(layerId, "active");
      }
    });
  }, 100); // Small delay to ensure React has rendered

  initHero();
  initSections();
  initCursor();
}
// Handover path: the tour already built every layer. Only ambient pieces run —
// re-hiding constructed sections would undo the build.
function bootAmbient() {
  if (booted) return;
  booted = true;
  initHeroAmbient();
  initCursor();
}

// The 15-agent build runs on every reload; only reduced-motion or ?intro=0 skip it.
if (reducedMotion || params.get("intro") === "0") {
  bootAfterIntro();
} else {
  window.__onIntroDone = () => bootAmbient();
  startIntro().catch((err) => {
    // Never trap the visitor: any failure reveals the full site.
    console.error("[construction] startIntro failed, revealing site", err);
    revealNow();
  });
}
