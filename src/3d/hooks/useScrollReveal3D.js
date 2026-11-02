import { useEffect, useState, useRef } from 'react';

/**
 * Scroll-based 3D reveal hook
 * Tracks element visibility and scroll progress
 */
export function useScrollReveal3D(options = {}) {
  const {
    threshold = 0.2,
    triggerOnce = true,
  } = options;

  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);

          // Calculate scroll progress (0 to 1)
          const rect = entry.boundingClientRect;
          const windowHeight = window.innerHeight;
          const progress = 1 - Math.max(0, Math.min(1, rect.top / windowHeight));
          setScrollProgress(progress);

          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
          setScrollProgress(0);
        }
      },
      { threshold }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return { ref, isVisible, scrollProgress };
}
