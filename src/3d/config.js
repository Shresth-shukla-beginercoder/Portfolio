// 3D Experience Configuration
// Quality settings, shared constants, and device detection

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

export const QUALITY = {
  // Particle counts
  portraitParticles: isMobile ? 1500 : isTablet ? 2500 : 3500,

  // Rendering quality
  shadows: isDesktop,
  postProcessing: isDesktop,
  dpr: typeof window !== 'undefined' && window.devicePixelRatio > 1 ? [1, 2] : 1,

  // Performance
  antialias: !isMobile,
  pixelRatio: isMobile ? 1 : Math.min(window.devicePixelRatio, 2),
};

export const COLORS = {
  ink: '#05060a',
  accent: '#ff5a3c',
  accentDark: '#cc4830',
  accentLight: '#ff8568',
  charcoal: '#10131b',
  deepRed: '#8B0000',
};

export const CARD_3D = {
  depth: 20,              // Visual depth in pixels
  tiltMax: 8,             // Maximum tilt angle in degrees
  elevationOnHover: 12,   // Hover lift in pixels
  floatAmplitude: 2,      // Floating animation amplitude
  floatDuration: 3,       // Floating animation duration in seconds
  transitionSpeed: 0.3,   // Transition duration in seconds
};

export const SKILL_TILE_3D = {
  depth: 15,
  floatAmplitude: 3,
  floatDuration: 2.5,
  hoverForward: 20,
  hoverBackward: 10,
};

export const PROJECT_CARD_3D = {
  depth: 25,
  tiltMax: 10,
  elevationOnHover: 15,
  imageParallaxDepth: 8,
  shadowIntensity: 0.3,
};

export const TIMELINE_3D = {
  spineWidth: 2,
  spineGlowIntensity: 0.6,
  cardDepthSeparation: 30,
  entryStagger: 0.2,
};

export const PORTRAIT_PARTICLES = {
  gridSize: isMobile ? 40 : isTablet ? 50 : 60,  // Particles per side
  assemblyDuration: 2.5,
  disintegrationDuration: 2.0,
  scatterRadius: 200,
  fragmentSize: isMobile ? 1.2 : 1.0,
};

export const ANIMATION = {
  easing: {
    smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',      // Expo.out
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // Back.out
    power: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',     // Power2.out
  },
};

// Reduced motion detection
export const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Performance monitoring
export function getDeviceProfile() {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function shouldUse3D() {
  if (prefersReducedMotion) return false;
  if (typeof window === 'undefined') return true;

  // Detect low-end devices
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  return !isLowEnd;
}
