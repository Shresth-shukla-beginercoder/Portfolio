import React from "react";
import ReactDOM from "react-dom/client";
import { registerGSAP } from "./lib/gsap-setup.js";
import { startIntro, revealNow } from "./intro/engine.js";
import { initHero, initSections, initHeroAmbient } from "./scenes/sections.js";
import { initCursor } from "./fx/cursor.js";
import Lenis from "lenis";
import App from "./App.jsx";
import "./index.css";
import "./styles.css";

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerGSAP();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
// full scroll-reveal scenes.
function bootAfterIntro() {
  if (booted) return;
  booted = true;
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

const params = new URLSearchParams(location.search);
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
