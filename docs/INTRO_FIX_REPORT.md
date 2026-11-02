# Intro Fix Report — Root-Cause Audit

Audited: `src/intro/engine.js` (agent tour), `src/main.jsx` (boot), `src/scenes/sections.js`
(scroll reveals), `index.html` (static overlay), `src/styles.css` (tokens + overlay styles),
and the live DOM (`?intro=0` render → 47 `[data-layer]` elements, 8 sections).

## Root causes (why agents "wander on a black screen" and the site appears at the end)

### RC-1 — Measurement ran before React mounted the site
`startIntro()` scheduled `measure()` on the **first `requestAnimationFrame`**. The module
executes at top level right after `createRoot().render()`, and React 18's commit had not
happened yet, so `document.querySelectorAll("[data-layer]")` returned **0 elements**.
The engine's guard `if (!layers.length) finish()` then fired **immediately** (traced:
`rAF @ … layers=0 → finish`). Result: no tour, no agents on elements, instant handover.
**Fix:** poll for `[data-layer]` (cap ~3 s) + `document.fonts.ready` + portrait decode
before building the timeline.

### RC-2 — The legacy static `#intro-overlay` was never hidden
`index.html` ships an opaque, full-viewport `#intro-overlay` (dark radial gradient, z-100,
old HUD + `#intro-stage`). The old `scenes/intro.js` hid it on completion; the new engine
never touches it. So during and after the new tour, the **opaque black layer sat on top of
the real site** — the agent SVG (z-200) was literally moving over black, and after the tour
the handover "wiped" black away to reveal the whole site at once. This single element
produced both reported symptoms: "agents wander on a black screen" **and** "the entire
website simply appears".
**Fix:** remove the static overlay from `index.html`; the engine builds its own overlay.

### RC-3 — Layers were never concealed, so "reveal" meant nothing
No CSS keyed on the intro state existed, so every element was fully visible from the
first frame. The per-layer clip-path wipe then just re-wiped already-visible content, and
nothing looked "under construction".
**Fix:** `[data-intro=active] [data-layer]:not(.layer-built) { clip-path: inset(0 100% 0 0) }`
→ the real page structure (backgrounds, spacing, type scale) stays in flow — zero layout
shift — while content is clipped away. Each reveal animates the clip back, adds
`.layer-built` and `clearProps`, so released layers stay released and previously built
sections remain visible when the tour scrolls on.

### RC-4 — Planned-scroll model was fake
`scrollAt(t)` returned `window.scrollY` **at build time** (always 0 on a fresh load)
instead of the tour's planned scroll, and `plan[].from` used the build-time `window.scrollY`
instead of the previous section's target. Agent trajectories therefore aimed at stale
viewport coordinates; later sections landed off-target.
**Fix:** real `scrollPlan` (`from` = previous target, cumulative) + piecewise
interpolation `scrollAt(t)`; `flyTo()` retargets every frame with `viewportY = docY −
plannedScrollY(t)`.

### RC-5 — No coordination, so "15 agents" read as 1 agent + 14 ghosts
Every layer's flight was solo: same owner for consecutive layers, same start time, so
agents stacked on one path. No sweep, pairing, divide or handoff existed, and the panel
had no component-level activity label.
**Fix:** per-section sweep by agents 1–3 (staggered corners of the *actual* section box),
corner-pairing on key elements, grid divide (cards cycled across agents 12/10/8),
per-layer activity label ("04 GLYPH → CONSTRUCTING hero.headline"), per-agent speed
multipliers and alternating bow offsets (yield).

### RC-6 — Lenis was never paused
The smooth-scroll driver ran the whole tour, fighting `ScrollToPlugin`.
**Fix:** expose the Lenis instance (`window.__lenis`); engine stops it for the tour,
re-arms it at handover.

### RC-7 — Post-intro reveals re-hid the constructed site
`initHero()`/`initSections()` (booted after handover) set `opacity:0` on
`[data-hero-reveal]`/`[data-section-title]` then fade them — a second, conflicting reveal
over the already-constructed hero.
**Fix:** after a real tour only the ambient pieces boot (Ken Burns portrait, cursor FX);
the full reveal path runs only on skip/reduced-motion loads.

### RC-8 — Intro did not replay (now superseded by the reload rule)
The `sessionStorage pf.introDone` skip meant reloads skipped the build entirely.
**Fix:** the tour now runs on **every reload**; only `?intro=0` or
`prefers-reduced-motion` skips it.

## Not deleted, understood
`src/scenes/intro.js` (the old blueprint-building intro) is no longer imported by
`main.jsx`; it is retained on disk as a reference, dead code, and can be deleted once the
new tour is confirmed.

## Verification protocol (docs/VERIFICATION.md)
Per brief §8: Playwright drives the real tour and asserts agent→element targeting,
progressive section construction, no full-site reveal, clean handover DOM, and zero
console errors; screenshots at each construction moment, inspected by eye.

## Second audit — "outlines but no website" (tested build)

Symptom: agents + chips + blue boxes + panel visible, but the real portfolio stays in
empty space and only appears at the end. Exact root causes:

### RC-10 — `opacity: 0` layer hiding killed all child visibility
`src/intro/intro-layers.css` hid every `[data-layer]` with `opacity: 0` (releasing via
`.layer-built { opacity: 1 !important }`). Parent opacity multiplies down the subtree,
so nested/child content stayed invisible even after the parent was "built", and — more
importantly — the clip-path wipes ran while the element itself was at opacity 0.
Result: **no progressive wipe is ever visible**; each layer only pops in when
`.layer-built` flips opacity at the very end of its reveal.
**Fix:** deleted `intro-layers.css`. Hiding now happens ONLY via
`html[data-intro="active"] [data-layer]:not(.layer-built) { clip-path: inset(0 100% 0 0) }`
— clip-path keeps layout (zero shift) and never crushes descendants; reveals animate the
clip and `clearProps`, so built content is genuinely visible mid-tour.

### RC-11 — Opaque legacy overlay sheet over the real site
The static `#intro-overlay` in `index.html` (z-100, opaque dark radial gradient, old HUD)
was never touched by the new engine — the whole tour ran over a dark sheet while the real
site sat hidden underneath.
**Fix:** removed the legacy overlay markup from `index.html` and its dead CSS. The tour's
own `#agent-overlay` is fully transparent (agents + boxes + panel only).

### RC-12 — Lenis scroll driver fought the tour
`window.__lenis` was never assigned in `main.jsx`, so `__lenis?.stop?.()` was a no-op.
Lenis's rAF loop kept writing `window.scroll` every frame, cancelling the tour's
`ScrollToPlugin` steps — the page couldn't travel through the eight sections, so all the
construction "happened" while the viewport never left the hero.
**Fix:** `main.jsx` publishes `window.__lenis`; the engine stops it for the tour,
re-arms it at handover (and while the visitor is paused in control).

### RC-13 — Orphaned `nav.*` layers
Navbar elements (`nav.logo`, `nav.link.N`) were `[data-layer]` but no tour section
ever claimed them, so the navbar stayed clip-hidden for the entire tour and was released
only at the final teardown.
**Fix:** the Hero tour now builds `nav.*` first (document order), then the hero proper.

### RC-14 — Cards revealed as one wipe, serially
Project/certification cards had no inner layers, so "card construction" was a single
frame wipe; and card grids built one-after-another, so you never saw a finished card
next to one under construction.
**Fix:** cards expose real sub-layers (image, year badge, title, description, tags, link)
and cert cards (image, issuer block). In a grid, **different Deck agents build
different cards simultaneously**, staggered ~0.4 s so a finished card visibly sits beside
a half-built one. The tour also draws the skill-bar proficiency fills, and the
Contact tour now constructs the footer.

### RC-15 — Post-handover re-hides fought the constructed site
After a natural completion, `initHero()` re-set `[data-hero-reveal]` to opacity 0 and
`initSections()` registered scroll-triggered re-reveals over an already-built site —
a second, conflicting animation pass that could hide completed sections again.
**Fix:** after a real tour only ambient pieces boot (Ken Burns portrait, cursor FX).
The full scroll-reveal path runs exclusively on the skip/reduced-motion boot.

