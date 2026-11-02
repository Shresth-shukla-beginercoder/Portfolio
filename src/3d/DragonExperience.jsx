import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useConstructionState } from './ConstructionContext';

/**
 * DragonExperience — The living crimson dragon component.
 * Injected into SceneCanvas after construction completes.
 */
export function DragonExperience({ constructionState }) {
  if (constructionState !== 'active') return null;

  return (
    <group>
      <SerpentineBody />
      {/* <MorphController /> */}
      {/* <InteractionManager /> */}
    </group>
  );
}

/**
 * Procedural Serpentine Body using a spline path follow system.
 */
function SerpentineBody() {
  // Implementation: Procedural articulated segments following a path
  return (
    <group>
      {/* Dragon Head */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>

      {/* Body Segments (Instanced) */}
      <instancedMesh args={[null, null, 20]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#8B0000" />
      </instancedMesh>
    </group>
  );
}
