# 3D Hero Arrow Plan

## Goal
Implement a 3D sculptural arrow cursor using React Three Fiber.

## Scope
- Procedural geometry (THREE.Shape).
- Material: MeshPhysicalMaterial (obsidian-black glass, red edge glow).
- Interactions: idle float, mouse-parallax, scroll-linked rotation.
- Integration: Lazy-loaded after construction intro, desktop-only bloomed effect.
- Fallback: static WebP poster.

## Risks & Mitigations
- Performance: Lazy load, dispose on unmount, intersection observer.
- Layout: Absolute positioning with fixed aspect ratio.
- Overlap: Z-index layering with existing hero elements.

## File List
- `src/components/ThreeArrow.jsx` (Core 3D component)
- `src/components/ThreeArrow.poster.webp` (Fallback image)
- `src/fx/arrow-config.js` (Constants: colors, speed, tilt)

## Steps
1. Install dependencies (three, r3f, drei).
2. Create config file `src/fx/arrow-config.js`.
3. Create `ThreeArrow.jsx` with basic geometry.
4. Add Environment/Lightformers.
5. Implement interactions (parallax/scroll).
6. Implement `Suspense` and lazy loading in `App.jsx`.
7. Verify with Playwright.
