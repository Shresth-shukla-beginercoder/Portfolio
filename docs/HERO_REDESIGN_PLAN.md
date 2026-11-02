# HERO REDESIGN IMPLEMENTATION PLAN

## 1. Project Overview
Redesign the homepage hero section to achieve a premium, cinematic, editorial-style aesthetic while preserving existing functionality and the signature construction animation.

## 2. Analysis & Constraints
- **Preservation:** The 15-agent construction system (`src/intro/engine.js`) and existing 3D arrow object (`src/fx/cursor.js`) must be maintained and made compatible with new elements.
- **Identity:** Use the real portrait (`src/assets/images/portrait.jpg`) and existing design tokens (colors, fonts). No AI generation or external imagery.
- **Layers:** The navbar, hero headline (oversized name), intro paragraph, CTAs, and editorial labels must be registered for construction.

## 3. Implementation Steps

### Phase 1: Preparation
- [ ] Create a backup of `src/components/Hero.jsx` and `src/intro/engine.js`.
- [ ] Add the required new assets (grid lines, red accents) to `src/styles.css` if necessary.

### Phase 2: Hero Structure (HTML/JSX)
- [ ] Refactor `Hero.jsx` to match the new layout:
    - Background: Black, subtle grid, monochrome portrait (grayscale + high contrast + grain CSS filter).
    - Typography: Oversized name, sub-headlines, editorial labels (top-left, top-right, left side).
    - Floating Navbar: Integrate with the hero construction.
    - Buttons: Explore Work, Let's Connect (styled as premium CTAs).
    - 3D Arrow Container: Ensure position is compatible.

### Phase 3: Construction Intro Compatibility
- [ ] Update `src/intro/engine.js` (or related `data/agents.js` if necessary) to include the new hero components in the `[data-layer]` registry.
- [ ] Ensure agents interact with and "build" the new hero components.

### Phase 4: Styling (Tailwind/CSS)
- [ ] Apply premium editorial styling:
    - Typography (serif, high-contrast).
    - Glassmorphism for the navbar.
    - Monochrome photography treatment (CSS).
    - Grid and lighting accents.

### Phase 5: Verification & Testing
- [ ] Run `npm run dev` to verify the UI.
- [ ] Run existing Playwright tests to ensure no regressions.
- [ ] Update `docs/VERIFICATION.md` with new test screenshots.
- [ ] Commit on branch `feat/editorial-hero-redesign`.

## 4. Key Files to Modify
- `src/components/Navbar.jsx`
- `src/components/Hero.jsx`
- `src/intro/engine.js` (to register new layers)
- `src/index.css` / `src/styles.css` (for new layout/styling)
