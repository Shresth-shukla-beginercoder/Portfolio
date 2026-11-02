import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * DragonController — Manages the serpentine flight path and morphing state.
 * Uses a spline-based follow system for natural movement.
 */
export function DragonController() {
  const { viewport } = useThree();
  const dragonRef = useRef();

  // Dragon state
  const [target, setTarget] = useState(new THREE.Vector3(0, 0, 0));
  const [morphTarget, setMorphTarget] = useState(null); // e.g., 'postgresql', 'react'

  // Spline path logic (simplified procedural)
  useFrame(({ clock }) => {
    if (!dragonRef.current) return;

    // Smooth flight simulation
    const time = clock.getElapsedTime();
    const x = Math.sin(time * 0.5) * (viewport.width / 3);
    const y = Math.cos(time * 0.3) * (viewport.height / 4);

    dragonRef.current.position.lerp(new THREE.Vector3(x, y, 0), 0.05);
    dragonRef.current.lookAt(x + Math.cos(time), y + Math.sin(time), 0);
  });

  return (
    <group ref={dragonRef}>
      {/* Dragon model/geometry placeholder */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}
