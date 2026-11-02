# 3D Interactive Experience Implementation Plan

**Branch:** `feat/interactive-3d-experience`  
**Date:** 2026-11-02  
**Status:** Planning → Implementation

---

## Executive Summary

Transform the existing portfolio into a premium, cinematic 3D interactive experience while **preserving the beloved 15-agent construction animation system**. This is an enhancement, not a redesign—every existing feature, link, and animation must remain functional.

### Key Constraints
- ✅ Preserve all 15 construction agents and their building sequences
- ✅ Maintain existing hero design, portrait, signature, and navbar
- ✅ Keep all GitHub links, live project URLs, and contact functionality
- ✅ No horizontal overflow, no broken links, no console errors
- ✅ Target 55-60 FPS desktop, ~45 FPS mobile (where hardware permits)
- ✅ Respect `prefers-reduced-motion`
- ✅ React StrictMode compatible

---

## Current Architecture Analysis

### Existing Tech Stack
- **Framework:** React 18.3.1 + Vite
- **Animation:** GSAP 3.12.0 (with ScrollTrigger, CustomEase)
- **Styling:** Tailwind CSS 3.4.0
- **3D Libraries:** ❌ **None installed yet**

### Current 3D Infrastructure
**NONE.** The `docs/3D_PLAN.md` was never implemented. We start from scratch.

### Existing Construction System
- **Location:** `src/intro/engine.js` (~948 lines)
- **Architecture:** 
  - 15 agents with unique colors, trails, roles
  - Master GSAP timeline drives scroll + flights + reveals
  - Layers registered via `data-layer`, `data-owner`, `data-kind` attributes
  - Construction happens in phases: sweep → scan → reveal
  - Finale: agents gather into S formation, then exit
- **Integration Points:**
  - Layers registry: `src/intro/engine.js` line 190-213 (`measure()`)
  - Section timeline factory: lines 541-649 (`buildTimeline()`)
  - Agent task scheduler: lines 689-738 (`scheduleAgentFlights()`)

---

## Proposed 3D Architecture

### Dependencies to Install
```json
{
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.92.0",
  "three": "^0.159.0"
}
```

### Core 3D Infrastructure

#### 1. Shared Canvas System
**File:** `src/3d/SceneCanvas.jsx`
- Single `<Canvas>` wrapping the entire app
- Performance optimizations: `frameloop="demand"`, `dpr={[1, 2]}`
- Intersection observer pauses rendering when offscreen
- Tab visibility API pauses when hidden

#### 2. 3D Component Library
```
src/3d/
├── SceneCanvas.jsx          # Root canvas wrapper
├── components/
│   ├── Card3D.jsx           # Elevated card with depth, tilt, parallax
│   ├── SkillTile3D.jsx      # Floating skill tile with glass material
│   ├── ProjectCard3D.jsx    # Premium project showcase card
│   ├── Timeline3D.jsx       # Dimensional experience timeline spine
│   ├── CertificateFrame3D.jsx  # Floating certificate frame
│   ├── Achievement3D.jsx    # Dimensional achievement panel
│   ├── ContactCard3D.jsx    # Elevated contact element
│   └── PortraitParticles.jsx  # Portrait disintegration/assembly
├── materials/
│   ├── GlassMaterial.jsx    # Premium glass shader
│   └── MetallicMaterial.jsx # Red-edge metallic material
├── hooks/
│   ├── use3DCard.js         # Card tilt + hover logic
│   ├── useScrollReveal3D.js # Scroll-based 3D reveals
│   └── usePerformance.js    # Performance monitoring
└── config.js                # 3D constants, quality settings
```

#### 3. Construction Integration Strategy
**Critical:** 3D elements must be built by the 15 agents, not appear independently.

**Approach:**
1. **Phase 1 (During Construction):** 3D objects start at `opacity: 0`, `scale: 0`
2. **Phase 2 (Agent Reveals Layer):** GSAP animates `opacity: 1`, `scale: 1`, plus 3D entry animation
3. **Phase 3 (Post-Construction):** 3D interactivity activates (hover, tilt, parallax)

**Implementation:**
- Each 3D component accepts `constructionState` prop: `"hidden" | "revealing" | "active"`
- Construction engine sets state via React context or direct prop drilling
- GSAP `reveal()` function in `engine.js` triggers 3D state transitions

---

## Component-by-Component 3D Plan

### 1. About Cards (6 cards)

**Current State:**
- Flat 2D cards with border, dark background
- No depth or interactivity beyond hover border color

**3D Enhancement:**
```jsx
<Card3D
  depth={20}              // 20px visual depth
  tiltMax={8}             // 8° max tilt on pointer move
  glowColor="#ff5a3c"     // Red emissive edge
  elevationOnHover={12}   // Lift 12px on hover
  constructionState={state}
>
  {/* Existing card content */}
</Card3D>
```

**Visual Effects:**
- Layered background: base layer + glass top layer
- Subtle floating animation (2px amplitude, 3s duration)
- Pointer-based perspective tilt (3D CSS transforms)
- Red emissive glow on edges (CSS `box-shadow` or shader)
- Smooth parallax on title/body text (layered depth)

**Construction Integration:**
- Agents 4, 5, 6 build these cards (existing owners preserved)
- During reveal: card scales from 0.8 → 1.0, rotates from Y: -15° → 0°
- After reveal: activate tilt + hover interactivity

**Files Modified:**
- `src/components/About.jsx` (wrap cards in `<Card3D>`)
- New: `src/3d/components/Card3D.jsx`

---

### 2. Skills Section (7 skill bars)

**Current State:**
- Horizontal bars with animated fill
- Flat 2D layout

**3D Enhancement:**
```jsx
<SkillTile3D
  skill={skill}
  index={i}
  floatDelay={i * 0.15}
  constructionState={state}
/>
```

**Visual Effects:**
- Each skill becomes a floating 3D tile
- Glass material with subtle metallic edges
- Tiles arranged in 3D space (staggered Z-depth)
- Gentle floating motion (offset per tile)
- Hover: tile moves forward 20px, others move back 10px
- Skill icons rendered as small 3D symbols (optional, HTML fallback)

**Construction Integration:**
- Agent 12 (Deck) builds skill tiles one by one
- During reveal: tiles fly in from edges, land in formation
- After reveal: activate floating + hover depth effects

**Files Modified:**
- `src/components/Skills.jsx`
- New: `src/3d/components/SkillTile3D.jsx`

---

### 3. Projects Section (4 project cards)

**Current State:**
- Grid of 4 project cards with image, title, tags, links

**3D Enhancement:**
```jsx
<ProjectCard3D
  project={project}
  index={i}
  constructionState={state}
>
  {/* Image, title, description, tags, links */}
</ProjectCard3D>
```

**Visual Effects:**
- Premium card with realistic depth and shadows
- Image layer has separate parallax depth
- Tilt based on pointer position (3D rotation)
- Hover: card elevates, image zooms slightly, info panel slides up
- Red edge lighting intensifies on hover
- Realistic drop shadow beneath card

**Construction Integration:**
- Agent 12 builds each card frame
- Agent 8 reveals the project image
- Agent 4 reveals title, Agent 5 reveals description
- Tags and links construct last
- During reveal: card rotates into view (Y-axis rotation)

**Files Modified:**
- `src/components/Projects.jsx`
- New: `src/3d/components/ProjectCard3D.jsx`

**Link Preservation:**
- `View Repository` → actual GitHub repo
- `Live Demo` → actual deployed project
- Never mix or swap URLs

---

### 4. Experience Section (3 entries)

**Current State:**
- Vertical timeline with left border, text entries

**3D Enhancement:**
```jsx
<Timeline3D entries={EXPERIENCE} constructionState={state}>
  {EXPERIENCE.map((entry, i) => (
    <TimelineEntry3D key={i} entry={entry} index={i} />
  ))}
</Timeline3D>
```

**Visual Effects:**
- Central 3D spine (thin metallic rod with red glow)
- Experience cards positioned along spine with depth separation
- Cards enter from alternating sides (left/right)
- Spine illuminates progressively as visitor scrolls
- Connection points glow red when card enters viewport

**Construction Integration:**
- Agent 12 builds the timeline spine
- Agent 5 reveals each experience entry
- Spine construction: draws from top to bottom
- Cards construct one by one, alternating sides

**Files Modified:**
- `src/components/Experience.jsx`
- New: `src/3d/components/Timeline3D.jsx`

---

### 5. Certifications Section (3 certificates)

**Current State:**
- Grid of certificate cards with thumbnail + click to open lightbox

**3D Enhancement:**
```jsx
<CertificateFrame3D
  cert={cert}
  index={i}
  onClick={() => setSelectedCert(cert)}
  constructionState={state}
/>
```

**Visual Effects:**
- Floating frame with glass/metallic border
- Slight perspective rotation (certificate appears dimensional)
- Hover: frame elevates, subtle glow appears
- Click: smooth zoom transition to lightbox

**Construction Integration:**
- Agent 12 builds certificate frames
- Agent 8 reveals certificate images
- During reveal: frames fade in + rotate into position

**Files Modified:**
- `src/components/Certifications.jsx`
- New: `src/3d/components/CertificateFrame3D.jsx`

**Lightbox Preservation:**
- Existing `CertificateLightbox.jsx` remains unchanged
- Click still opens full certificate image
- ESC and close button still work

---

### 6. Achievements Section (4 items)

**Current State:**
- Simple list with trophy icons, horizontal lines

**3D Enhancement:**
```jsx
<Achievement3D
  achievement={achievement}
  index={i}
  constructionState={state}
/>
```

**Visual Effects:**
- Dimensional panels with layered typography
- Large 3D numbers (if numeric data exists)
- Floating achievement cards with subtle depth
- Scroll-based reveal with staggered entry
- Red illuminated dividers between achievements

**Construction Integration:**
- Agent 13 (Atmos) builds achievement panels
- During reveal: panels slide in from left with depth

**Files Modified:**
- `src/components/Achievements.jsx`
- New: `src/3d/components/Achievement3D.jsx`

---

### 7. Contact Section

**Current State:**
- Text lead, email/GitHub/LinkedIn buttons, signature animation

**3D Enhancement:**
```jsx
<ContactCard3D constructionState={state}>
  {/* Email, social links */}
</ContactCard3D>
```

**Visual Effects:**
- Elevated contact card with premium depth
- 3D social link tiles with hover elevation
- Dimensional CTA button with red glow
- Subtle floating motion on all elements

**Construction Integration:**
- Agent 11 builds contact buttons
- Agent 10 builds social nav links
- During reveal: elements construct in sequence

**Files Modified:**
- `src/components/Contact.jsx`
- New: `src/3d/components/ContactCard3D.jsx`

---

### 8. Portrait Particle Disintegration (SIGNATURE EFFECT)

**Location:** Hero section, portrait image

**Current State:**
- Static portrait with grayscale filter, vignette gradient
- Ken Burns breathing animation (subtle scale 1.0 → 1.06)

**3D Enhancement:**
```jsx
<PortraitParticles
  imageSrc={PROFILE.photo}
  viewport="intersection"
  constructionState={state}
/>
```

**Visual Strategy:**

**Particle System:**
- Divide portrait into ~2000-4000 fragments (balance quality/performance)
- Use Three.js `InstancedMesh` + `BufferGeometry` for efficiency
- Each fragment: small quad with correct UV coordinates
- Texture: original portrait image
- ShaderMaterial for per-particle control

**Animations:**

1. **Initial Assembly (on viewport enter):**
   - Fragments start scattered (random positions around image bounds)
   - Fly toward correct positions (Bézier curves)
   - Settle into complete portrait
   - Duration: ~2.5s
   - Easing: Expo.out

2. **Disintegration (on scroll away):**
   - Fragments separate in coordinated pattern
   - Move outward with subtle rotation
   - Gradually fade opacity to 0
   - Duration: ~2.0s
   - Easing: Power2.in

3. **Reassembly (on scroll back):**
   - Reverse disintegration
   - Fragments return to original positions
   - Portrait becomes sharp and stable

4. **Hover/Focus:**
   - Slight depth movement (parallax)
   - Gentle lighting changes
   - Face remains completely recognizable

**Technical Requirements:**
- Intersection Observer tracks viewport presence
- ScrollTrigger tracks scroll position
- State machine: `"scattered" | "assembling" | "complete" | "disintegrating"`
- Portrait must remain stable when fully in view (no continuous loop)
- Original photograph must never be permanently distorted
- Face must always be recognizable

**Construction Integration:**
- Agent 7 (Lens) builds the portrait
- During construction: particles assemble from scattered state
- After construction: portrait remains stable
- Post-intro: scroll-based disintegration activates

**Performance Considerations:**
- Desktop: 3000-4000 particles
- Mobile: 1500-2000 particles (detected via `window.innerWidth`)
- Pause particle updates when portrait is offscreen
- Reuse particle geometry and material

**Files Modified:**
- `src/components/Hero.jsx` (wrap portrait in particle component)
- New: `src/3d/components/PortraitParticles.jsx`
- New: `src/3d/shaders/particleVertex.glsl` (optional custom shader)
- New: `src/3d/shaders/particleFragment.glsl` (optional custom shader)

**CRITICAL:**
- Use original `PROFILE.photo` as texture source
- Never regenerate, retouch, or change the face
- Maintain correct fragment-to-image UV mapping
- Avoid random permanent distortion
- Keep effect reversible and scroll-progress-aware

---

## Construction Integration Architecture

### Current Construction Flow
1. **Measure:** `engine.js` scans DOM, finds all `[data-layer]` elements
2. **Build Timeline:** Creates GSAP timeline with scroll + agent flights
3. **Reveal Layers:** Agents fly to elements, animate clip-path reveals
4. **Finale:** Agents gather into S, exit

### New 3D Construction Flow
1. **Measure:** Scan DOM (unchanged)
2. **Build Timeline:** Create timeline (add 3D state transitions)
3. **Reveal Layers:** 
   - Agent flies to element (unchanged)
   - GSAP reveals clip-path (unchanged)
   - **NEW:** Trigger 3D component state: `"hidden"` → `"revealing"`
   - **NEW:** 3D component animates entry (scale, rotate, position)
   - Mark layer complete, set state to `"active"`
4. **Finale:** Agents gather into S, exit (unchanged)

### Implementation Strategy

**Option A: React Context (Recommended)**
```jsx
// src/3d/ConstructionContext.jsx
export const ConstructionContext = createContext({
  layerStates: {},  // { "about.s1": "active", "about.s2": "revealing", ... }
  setLayerState: () => {}
});

// In App.jsx
const [layerStates, setLayerStates] = useState({});
<ConstructionContext.Provider value={{ layerStates, setLayerStates }}>
  <About />
  {/* ... */}
</ConstructionContext.Provider>

// In engine.js reveal()
function reveal(layer, at, dur) {
  // Existing clip-path animation
  tl.fromTo(el, { clipPath: "..." }, { clipPath: "...", duration: dur }, at);
  
  // NEW: Trigger 3D state transition
  tl.call(() => {
    window.__set3DLayerState?.(layer.id, "revealing");
  }, null, at);
  
  tl.call(() => {
    window.__set3DLayerState?.(layer.id, "active");
    el.classList.add("layer-built");
    gsap.set(el, { clearProps: "clip-path" });
  }, null, at + dur);
}

// In main.jsx (after React renders)
window.__set3DLayerState = (layerId, state) => {
  // Call React setState here (needs proper ref/callback setup)
};
```

**Option B: Direct DOM Attributes**
```jsx
// In engine.js reveal()
function reveal(layer, at, dur) {
  tl.call(() => {
    layer.el.setAttribute("data-3d-state", "revealing");
  }, null, at);
  
  tl.call(() => {
    layer.el.setAttribute("data-3d-state", "active");
  }, null, at + dur);
}

// In Card3D component
const el = useRef();
const [state, setState] = useState("hidden");

useEffect(() => {
  const observer = new MutationObserver(() => {
    const newState = el.current?.getAttribute("data-3d-state");
    if (newState) setState(newState);
  });
  observer.observe(el.current, { attributes: true, attributeFilter: ["data-3d-state"] });
  return () => observer.disconnect();
}, []);
```

**Decision:** Use **Option A (React Context)** for cleaner React integration.

### Modified Files for Integration
- `src/intro/engine.js` → Add 3D state transition calls in `reveal()`
- `src/main.jsx` → Wire up context bridge
- New: `src/3d/ConstructionContext.jsx`

---

## Performance Strategy

### Target Metrics
- **Desktop (1440×900):** 55-60 FPS
- **Mobile (390×844):** ~45 FPS (where hardware permits)

### Optimization Techniques

#### 1. Lazy Loading
```jsx
const PortraitParticles = lazy(() => import("./3d/components/PortraitParticles"));
```
- Load 3D components only after construction intro completes
- Use React `Suspense` with loading fallback

#### 2. Canvas Management
- Single shared `<Canvas>` for entire app
- `frameloop="demand"` → render only when needed
- Intersection Observer pauses rendering when offscreen
- Tab visibility API pauses when hidden

#### 3. Geometry & Material Reuse
```jsx
// src/3d/config.js
export const SHARED_GEOMETRIES = {
  card: new PlaneGeometry(1, 1, 1, 1),
  tile: new BoxGeometry(1, 1, 0.1),
};

export const SHARED_MATERIALS = {
  glass: new MeshPhysicalMaterial({
    transmission: 0.9,
    roughness: 0.1,
    metalness: 0,
    color: "#ff5a3c",
  }),
};
```
- Reuse geometries across all instances
- Reuse materials with different uniforms

#### 4. InstancedMesh for Particles
- Portrait particles: single `InstancedMesh` for all fragments
- Update instance matrices, not individual meshes

#### 5. Mobile Quality Settings
```jsx
// src/3d/config.js
export const QUALITY = {
  particles: window.innerWidth < 768 ? 1500 : 3000,
  shadows: window.innerWidth >= 1024,
  postProcessing: window.innerWidth >= 1024,
  dpr: window.devicePixelRatio > 1 ? [1, 2] : 1,
};
```

#### 6. React Optimizations
- `useMemo` for expensive 3D calculations
- `React.memo` for 3D components
- Avoid re-renders during animations (use refs, not state)

#### 7. Dispose Cleanup
```jsx
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };
}, []);
```

#### 8. Reduced Motion
```jsx
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  // Show static 3D objects or flat 2D fallback
  // Disable particle disintegration
  // Disable automatic rotations
}
```

### Performance Monitoring
```jsx
// src/3d/hooks/usePerformance.js
export function usePerformance() {
  const [fps, setFps] = useState(60);
  
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    
    function measure() {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(measure);
    }
    
    measure();
  }, []);
  
  return fps;
}
```

---

## Responsive Design

### Breakpoints
- **Desktop:** ≥1024px → Full 3D effects, all particles, shadows
- **Tablet:** 768px-1023px → Reduced particles, simplified shadows
- **Mobile:** <768px → Minimal particles, CSS-only depth effects

### Mobile Adaptations
- Reduce portrait particles: 1500 (vs 3000 desktop)
- Disable expensive lighting effects
- Simplify 3D depth (use CSS transforms instead of Three.js where possible)
- **Preserve all 15 construction agents** (intro is essential)
- Preserve essential card interactions
- No horizontal overflow (strict `overflow-x: hidden`)

### Accessibility
- All 3D elements are decorative → `aria-hidden="true"` on Canvas
- Interactive controls (buttons, links) remain outside Canvas
- `prefers-reduced-motion` → show stable 3D objects or static alternatives
- Keyboard navigation unaffected by 3D effects

---

## Implementation Phases

### Phase 1: Infrastructure (Day 1)
- [ ] Install dependencies: `three`, `@react-three/fiber`, `@react-three/drei`
- [ ] Create `src/3d/` directory structure
- [ ] Build `SceneCanvas.jsx` with performance optimizations
- [ ] Create `ConstructionContext.jsx`
- [ ] Create `src/3d/config.js` with quality settings
- [ ] Write `usePerformance.js` hook
- [ ] Wire up context in `App.jsx`
- [ ] Modify `engine.js` to trigger 3D state transitions

**Verification:**
- [ ] Run dev server, no errors
- [ ] Canvas renders (empty scene)
- [ ] Construction intro still works
- [ ] Context state updates correctly

**Commit:** `feat(3d): add Three.js infrastructure and construction integration`

---

### Phase 2: About Cards & Skills (Day 2)
- [ ] Build `Card3D.jsx` component
- [ ] Build `SkillTile3D.jsx` component
- [ ] Integrate in `About.jsx`
- [ ] Integrate in `Skills.jsx`
- [ ] Test construction agent reveals
- [ ] Test hover interactions
- [ ] Test mobile responsiveness

**Verification:**
- [ ] Agents 4, 5, 6 build About cards correctly
- [ ] Agent 12 builds skill tiles correctly
- [ ] Cards have depth, tilt, and hover effects
- [ ] No console errors
- [ ] FPS ≥55 on desktop

**Commit:** `feat(3d): add 3D About cards and skill tiles with construction integration`

---

### Phase 3: Projects (Day 3)
- [ ] Build `ProjectCard3D.jsx` component
- [ ] Integrate in `Projects.jsx`
- [ ] Test construction reveals (card frame, image, text, tags, links)
- [ ] Test hover elevation and image zoom
- [ ] Verify GitHub and live demo links work correctly
- [ ] Test mobile layout

**Verification:**
- [ ] All 4 project cards have 3D depth
- [ ] Hover effects work smoothly
- [ ] "View Repository" links to correct GitHub repo
- [ ] "Live Demo" links to correct deployed project
- [ ] No mixed URLs

**Commit:** `feat(3d): add 3D project showcase cards with premium depth effects`

---

### Phase 4: Experience, Certifications, Achievements (Day 4)
- [ ] Build `Timeline3D.jsx` + `TimelineEntry3D.jsx`
- [ ] Build `CertificateFrame3D.jsx`
- [ ] Build `Achievement3D.jsx`
- [ ] Integrate in respective components
- [ ] Test construction reveals
- [ ] Test certificate lightbox still works
- [ ] Test mobile responsiveness

**Verification:**
- [ ] Experience timeline spine draws correctly
- [ ] Certificates open in lightbox on click
- [ ] Achievements have dimensional appearance
- [ ] All construction agents build correctly

**Commit:** `feat(3d): add 3D timeline, certificates, and achievements`

---

### Phase 5: Portrait Particle System (Day 5-6)
- [ ] Build `PortraitParticles.jsx`
- [ ] Implement particle system with InstancedMesh
- [ ] Create assembly animation
- [ ] Create disintegration animation
- [ ] Wire up IntersectionObserver + ScrollTrigger
- [ ] Test viewport enter/exit transitions
- [ ] Integrate with Agent 7 construction
- [ ] Test hover parallax
- [ ] Optimize particle count for mobile

**Verification:**
- [ ] Portrait assembles smoothly on viewport enter
- [ ] Portrait disintegrates when scrolling away
- [ ] Portrait reassembles when scrolling back
- [ ] Portrait remains stable when fully visible (no continuous loop)
- [ ] Face is always recognizable
- [ ] Original photo is preserved
- [ ] Agent 7 builds portrait during construction

**Commit:** `feat(3d): add signature portrait particle disintegration effect`

---

### Phase 6: Contact Section (Day 7)
- [ ] Build `ContactCard3D.jsx`
- [ ] Integrate in `Contact.jsx`
- [ ] Test construction reveals
- [ ] Test button/link functionality
- [ ] Verify email, GitHub, LinkedIn links work

**Verification:**
- [ ] Contact elements have 3D depth
- [ ] All links functional
- [ ] Signature animation still works

**Commit:** `feat(3d): add 3D contact section elements`

---

### Phase 7: Performance, Mobile, Accessibility (Day 8)
- [ ] Add Intersection Observer to pause offscreen canvases
- [ ] Add tab visibility listener
- [ ] Implement mobile quality settings
- [ ] Test on 390×844 mobile viewport
- [ ] Test on 768×1024 tablet viewport
- [ ] Implement `prefers-reduced-motion` fallbacks
- [ ] Add FPS monitor (dev only)
- [ ] Optimize particle counts
- [ ] Test disposal/cleanup (no memory leaks)

**Verification:**
- [ ] Desktop FPS: 55-60
- [ ] Mobile FPS: ~45 (where possible)
- [ ] No horizontal overflow on mobile
- [ ] Reduced motion preference respected
- [ ] No memory leaks (check Chrome DevTools)

**Commit:** `perf(3d): optimize for mobile, accessibility, and performance`

---

### Phase 8: Final Verification (Day 9)
- [ ] Run Playwright verification suite
- [ ] Capture screenshots (desktop, tablet, mobile)
- [ ] Manual testing: construction intro → full site tour
- [ ] Verify all links (GitHub repos, live demos, email, socials)
- [ ] Check console for errors
- [ ] Test certificate lightbox
- [ ] Test signature animation
- [ ] Verify S monogram loading
- [ ] Verify final S formation
- [ ] Verify 15 agents construct all sections
- [ ] Update `docs/VERIFICATION.md`

**Commit:** `docs(3d): add verification report for 3D experience`

---

## Files Created (New)

```
src/3d/
├── SceneCanvas.jsx
├── ConstructionContext.jsx
├── config.js
├── components/
│   ├── Card3D.jsx
│   ├── SkillTile3D.jsx
│   ├── ProjectCard3D.jsx
│   ├── Timeline3D.jsx
│   ├── TimelineEntry3D.jsx
│   ├── CertificateFrame3D.jsx
│   ├── Achievement3D.jsx
│   ├── ContactCard3D.jsx
│   └── PortraitParticles.jsx
├── materials/
│   ├── GlassMaterial.jsx
│   └── MetallicMaterial.jsx
├── hooks/
│   ├── use3DCard.js
│   ├── useScrollReveal3D.js
│   └── usePerformance.js
└── shaders/
    ├── particleVertex.glsl (optional)
    └── particleFragment.glsl (optional)

scripts/
└── verify-3d-experience.mjs

docs/
└── 3D_IMPLEMENTATION_REPORT.md
```

## Files Modified (Existing)

```
package.json                         # Add three, r3f, drei
src/App.jsx                          # Wrap in SceneCanvas + Context
src/main.jsx                         # Bridge context to engine.js
src/intro/engine.js                  # Add 3D state transitions
src/components/About.jsx             # Wrap cards in Card3D
src/components/Skills.jsx            # Wrap skills in SkillTile3D
src/components/Projects.jsx          # Wrap projects in ProjectCard3D
src/components/Experience.jsx        # Wrap in Timeline3D
src/components/Certifications.jsx    # Wrap in CertificateFrame3D
src/components/Achievements.jsx      # Wrap in Achievement3D
src/components/Contact.jsx           # Wrap in ContactCard3D
src/components/Hero.jsx              # Wrap portrait in PortraitParticles
docs/VERIFICATION.md                 # Add 3D verification results
```

## Files Preserved (Unchanged)

```
src/components/Navbar.jsx
src/components/Footer.jsx
src/components/CertificateLightbox.jsx
src/components/SignatureAnimation.jsx
src/intro/trails.js
src/intro/sfx.js
src/intro/intro-config.js
src/scenes/intro.js
src/scenes/sections.js
src/fx/cursor.js
src/fx/signature.js
src/data/agents.js
src/data/content.js
src/data/about.js
All existing images and assets
```

---

## Definition of Done

### Must Have
- ✅ Premium 3D About cards with depth, tilt, hover effects
- ✅ Interactive 3D technical skill tiles (floating, glass material)
- ✅ 3D project showcase cards with image parallax
- ✅ Dimensional experience timeline with 3D spine
- ✅ 3D certificate gallery with floating frames
- ✅ 3D achievement presentation with layered panels
- ✅ 3D contact elements with elevated cards
- ✅ Portrait particle disintegration/reassembly (signature effect)
- ✅ All 15 construction agents build 3D elements visibly
- ✅ Original S-monogram loading experience preserved
- ✅ Final S formation and agent exit preserved
- ✅ All GitHub links functional
- ✅ All live project links functional
- ✅ Certificate lightbox functional
- ✅ Email/social links functional
- ✅ No horizontal overflow
- ✅ No console errors
- ✅ No broken links
- ✅ Desktop FPS: 55-60
- ✅ Mobile FPS: ~45 (where hardware permits)

### Final Report Must Include
1. What was implemented (all 8 sections)
2. Files created and modified (with line counts)
3. 3D components implemented (with descriptions)
4. Construction agent integration (how each section is built)
5. Performance measurements (desktop + mobile FPS)
6. Verified functionality (all features working)
7. Known issues (if any)

---

## Risk Mitigation

### Risk 1: Performance Degradation
**Mitigation:**
- Monitor FPS continuously during development
- Implement quality settings early
- Use mobile device testing frequently
- Fallback to CSS-only 3D on low-end devices

### Risk 2: Construction Integration Breakage
**Mitigation:**
- Test construction intro after every phase
- Commit frequently with working states
- Keep construction engine changes minimal and isolated
- Verify agent ownership for every layer

### Risk 3: Link/Functionality Breakage
**Mitigation:**
- Never modify link URLs during 3D wrapping
- Test every link manually before committing
- Preserve all existing event handlers
- Keep lightbox/modal logic unchanged

### Risk 4: Scope Creep
**Mitigation:**
- Follow the 8-phase plan strictly
- No additional features beyond spec
- No redesigns of existing components
- Enhancement only, not replacement

---

## Next Steps

1. ✅ Create this plan document
2. ⏳ Begin Phase 1: Install dependencies + infrastructure
3. ⏳ Proceed through phases 2-8 sequentially
4. ⏳ Verify, test, commit after each phase
5. ⏳ Create final implementation report
6. ⏳ Merge to main (after user approval)

---

**This plan is comprehensive and ambitious. The implementation will take significant effort, but the result will be a premium, cinematic, interactive 3D portfolio that preserves everything the user loves about the existing design.**
