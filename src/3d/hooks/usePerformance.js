import { useState, useEffect, useRef } from 'react';

/**
 * FPS monitoring hook for performance tracking
 * Reports current FPS and warns if below threshold
 */
export function usePerformance(threshold = 30) {
  const [fps, setFps] = useState(60);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef(null);

  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();

    function measure() {
      frames++;
      const now = performance.now();

      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frames * 1000) / (now - lastTime));
        setFps(currentFps);
        setIsLowPerformance(currentFps < threshold);
        frames = 0;
        lastTime = now;
      }

      rafRef.current = requestAnimationFrame(measure);
    }

    rafRef.current = requestAnimationFrame(measure);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [threshold]);

  return { fps, isLowPerformance };
}

/**
 * Intersection observer hook to pause rendering when offscreen
 */
export function useIntersectionPause(ref, callback) {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        callback(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, callback]);
}

/**
 * Tab visibility hook to pause when tab is hidden
 */
export function useTabVisibility(onVisibilityChange) {
  useEffect(() => {
    function handleVisibilityChange() {
      onVisibilityChange(!document.hidden);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisibilityChange]);
}
