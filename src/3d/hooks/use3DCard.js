import { useRef, useState, useEffect } from 'react';
import { CARD_3D } from '../config';

/**
 * Hook for 3D card interactions: tilt, hover, floating
 * Returns refs and styles for card element
 */
export function use3DCard(constructionState) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!cardRef.current || constructionState !== 'active') return;

    const card = cardRef.current;

    function handleMouseMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt based on mouse position
      const tiltX = ((y - centerY) / centerY) * -CARD_3D.tiltMax;
      const tiltY = ((x - centerX) / centerX) * CARD_3D.tiltMax;

      setTilt({ x: tiltX, y: tiltY });
    }

    function handleMouseEnter() {
      setIsHovered(true);
    }

    function handleMouseLeave() {
      setIsHovered(false);
      setTilt({ x: 0, y: 0 });
    }

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [constructionState]);

  // Generate transform style
  const transform = constructionState === 'active'
    ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${isHovered ? CARD_3D.elevationOnHover : 0}px)`
    : constructionState === 'revealing'
    ? 'perspective(1000px) rotateY(0deg) scale(1)'
    : 'perspective(1000px) rotateY(-15deg) scale(0.8)';

  return {
    cardRef,
    isHovered,
    style: {
      transform,
      transition: constructionState === 'active'
        ? `transform ${CARD_3D.transitionSpeed}s cubic-bezier(0.16, 1, 0.3, 1)`
        : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    },
  };
}
