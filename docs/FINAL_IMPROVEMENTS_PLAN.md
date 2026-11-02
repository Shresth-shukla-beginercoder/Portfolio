# Final Improvements Plan

Refinement task (not a redesign). The S monogram opening, 15-agent construction
tour, layer registry, SFX and site design are preserved and extended, never rebuilt.

Guiding rule for every phase: **the portfolio and the construction experience share
the same React components and data**. Anything new that is a visual element gets a
`data-layer` so the 15-agent tour constructs it automatically (the layer total is
computed dynamically from the DOM — nothing is hard-coded).

## Phase 1 — Project links (repo vs live)
`src/data/content.js`: normalize each project to explicit `repoUrl` + `liveUrl`
(`liveUrl: null` when no deployment exists — never invent one).
`src/components/Projects.jsx`:
- **View Repository** → `repoUrl` (`target="_blank"` + `rel="noopener noreferrer"`).
- **Live Demo** → `liveUrl` (only rendered when `liveUrl` exists).
- Card arrow → `repoUrl ?? liveUrl`, clickable `<a>`, stop event nesting (arrow is a
  sibling, not nested inside another anchor).
- Hover/focus states for all three.
New sub-layers: `projects.card.N.repo` / `.live` / `.arrow` → construction stays in sync.
Unknown URLs → `TODO(content)` marker, not guesses (CRUD Task Manager + YELPCAMP MCP
have no confirmed public URLs in this repo; they are referenced in About text without links).

## Phase 2 — Certificate lightbox
New `src/components/CertificateLightbox.jsx` + state in `Certifications.jsx`:
- Full-screen modal, dark translucent backdrop, original certificate image
  (the same asset the card uses — these assets have no separate high-res file),
  aspect-ratio preserved, max 90vh/90vw.
- Zoom in/out (1× → 3×), fit-to-screen, reset; drag-to-pan when zoomed.
- Close: button, `Esc`, backdrop click. Scroll lock while open. Keyboard accessible,
  focus trap + `aria-modal`, alt text from certificate title.
- Smooth open/close (scale + fade). "View certificate" affordance: hover zoom hint on card.
- No new fake content; uses existing `CERTIFICATIONS` data and images.

## Phase 3 — Expanded About
`src/data/about.js` (new): six first-person subsections exactly as specified —
1. Who I Am 2. My Technical Journey 3. What I Build 4. Projects & Practical Experience
5. Learning & Certifications 6. What I Am Working Towards.
Facts drawn only from existing repo data + user-confirmed bullets:
- B.Tech CSE (AI & ML), 4th year, ITM GIDA, Gorakhpur (already in `PROFILE`).
- No CGPA/rank/grad-year invented.
- Skills split: hands-on (React, JS, Python, Flask, REST, PostgreSQL, Docker, Git) vs
  learning-level (MCP, generative AI tooling, Node/Express via projects).
- Projects: MediTrack, YelpCamp, Sales Analytics, CRUD Task Manager (GitHub, no live
  URL → no link), YelpCamp MCP experiments — described from existing blurbs/repos only.
- Certifications: Web Developer Bootcamp 2026 (Udemy), Full Stack JS learning,
  EduSkills Java + GenAI/Deep-Learning virtual internships (labelled as course-based
  virtual internships, not jobs).
- Strengths + extracurriculars (chess, class representative, group projects, coding
  rounds) as given.
`About.jsx` renders the six blocks; every block registers
`data-layer="about.s1..s6 .title/.body"` + owners (4/5/6) so the construction tour
builds them. Skill bars, education, etc. unchanged.

## Phase 4 — Control panel: pause / resume / sound + interaction lock
`src/intro/engine.js`:
- **Pause** = `tl.pause()` only. Exact state preserved; resume = `tl.resume()`.
  Lenis hand-back during pause is removed (spec: no user scrolling during construction).
- **Interaction lock**: while the tour runs, window-level blockers for `wheel`,
  `touchmove`, scrollbar-independent key scroll (`Arrow/PageUp/PageDown/Home/End/Space`
  → `preventDefault`); `Escape` stays = skip; Tab/reduced keys still reach the panel.
  An invisible capture layer inside `#agent-overlay` blocks clicks to site content;
  panel buttons (Pause/Skip/Sound) remain clickable. All removed on finish/skip —
  site fully interactive afterwards.
- **Sound**: fix `SFX.env()` gain bug (crash was breaking the skip path), add
  `SFX.stopAll()` so the ambient bed cannot outlive the intro (finish **and** skip),
  keep gesture-gated autoplay + persisted mute + accurate button state.

## Phase 5 — Silky agents + light trails + performance
- Replace per-frame SVG polyline trails with a single pooled **canvas** layer
  (`src/intro/trails.js`): ring-buffer per agent, tapered luminous stroke in the
  agent's colour, DPR-aware, one draw per frame, no DOM churning.
- Flights: quadratic Bézier with `power3.inOut`/`power2.out`, lazy start-capture so
  flights chain (no teleports), alternating bow direction.
- Idle: gentle per-agent settle wobble (±3 px sine, staggered phase) when stationary —
  driven from the same GSAP ticker, never a separate loop.
- `setPanel` rewritten to only write the DOM when a value actually changes (kills the
  per-frame panel thrash that caused stutter).
- Measurement: Playwright with 4× CPU throttle, rAF sampler for 5 s → median/mean
  frame time + FPS, recorded in `docs/VERIFICATION.md` (no unmeasured claims).

## Phase 6 — Navbar
- Entrance: staggered link reveal + accent line (CSS keyframes gated on
  `.layer-built` so it runs **after** the tour constructs the nav — during the tour
  the nav stays clip-hidden exactly as today).
- Hover: animated underline slide; active section: red indicator + smooth
  `IntersectionObserver`-based active-state (post-handover only).
- Sticky glass surface on scroll (charcoal blur, contrast preserved, no layout jump).
- Mobile: hamburger sheet, smooth open/close, no horizontal overflow, functional links.
- All enhancements are inert during the tour (interaction lock) and fully active after.

## Phase 7 — Construction synchronization
- Re-audit `document.querySelectorAll("[data-layer]")` after Phases 1–6; every new
  element (about blocks, cert "view" affordance, project link sub-layers, nav polish
  elements) carries a layer id + owner; total stays dynamic.
- Verify tour reveal per new layer, agent assignment, and that the post-tour site is
  visually identical to `?intro=0` (same components, no divergent state).

## Phase 8 — Full verification + report
- Playwright at 1440×900, 768×1024, 390×844: project link destinations, certificate
  viewer (zoom/close/Esc/scroll-lock/mobile), About visibility & clipping, intro
  pause/resume/wheel/key-lock/skip-at-positions, 15 arrows, no console errors, FPS
  under 4× throttle, navbar link/active/hover/mobile, post-intro vs `?intro=0`
  consistency.
- Screenshots inspected by eye; results in `docs/VERIFICATION.md`; final report in
  `docs/FINAL_REPORT.md` (changes, files, verified, not-verified, known issues).
