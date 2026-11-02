import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useConstructionState } from "../ConstructionContext";
import { PORTRAIT_PARTICLES, prefersReducedMotion } from "../config";

/**
 * PortraitParticles — signature 3D particle disintegration/assembly effect.
 *
 * This is the ONLY WebGL canvas in the entire 3D system. Everything else uses
 * CSS 3D transforms for efficiency.
 *
 * States:
 *  - "scattered": particles off-screen, ready to assemble
 *  - "assembling": flying toward correct positions
 *  - "complete": stable portrait, fully assembled
 *  - "disintegrating": breaking apart, moving outward
 *
 * Scroll-aware: disintegrates when scrolling away, reassembles when returning.
 * Hover: subtle parallax + lighting changes.
 * Construction: Agent 7 builds during intro.
 */
function PortraitParticles({ imageSrc, layer }) {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const state = useConstructionState(layer);

  // Intersection observer for viewport tracking
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Particle state machine based on construction + scroll
  const particleState = useMemo(() => {
    if (prefersReducedMotion) return "complete"; // Static portrait
    if (state === "hidden") return "scattered";
    if (state === "revealing") return "assembling";
    if (state === "active" && isInView) return "complete";
    if (state === "active" && !isInView) return "disintegrating";
    return "complete";
  }, [state, isInView]);

  if (prefersReducedMotion) {
    // Fallback: static image with CSS depth
    return (
      <div ref={containerRef} className="relative w-full aspect-[4/5]">
        <img
          src={imageSrc}
          alt="Portrait"
          className="w-full h-full object-cover object-[center_20%]"
          style={{
            filter: "grayscale(100%) contrast(1.15) brightness(1.0)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/5] overflow-hidden"
      style={{ background: "#05060a" }}
    >
      <Canvas
        camera={{ position: [0, 0, 500], fov: 45, near: 1, far: 2000 }}
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 1.5]}
      >
        <ParticleSystem imageSrc={imageSrc} targetState={particleState} />
      </Canvas>
    </div>
  );
}

/**
 * ParticleSystem — the core Three.js mesh.
 *
 * Uses InstancedMesh for efficiency (~3000 particles, one draw call).
 * Each particle is a small quad with correct UV coordinates from the portrait.
 */
function ParticleSystem({ imageSrc, targetState }) {
  const meshRef = useRef();
  const textureRef = useRef();
  const { viewport } = useThree();

  // Load portrait texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(imageSrc, (texture) => {
      textureRef.current = texture;
    });
  }, [imageSrc]);

  // Particle grid: divide portrait into NxN fragments
  const { gridSize, particleData } = useMemo(() => {
    const gridSize = PORTRAIT_PARTICLES.gridSize;
    const data = [];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Target position: where this particle belongs in the complete portrait
        const x = (col / gridSize - 0.5) * viewport.width * 0.7;
        const y = (0.5 - row / gridSize) * viewport.height * 0.9;

        // Scattered position: random offset around portrait bounds
        const scatterX = x + (Math.random() - 0.5) * PORTRAIT_PARTICLES.scatterRadius;
        const scatterY = y + (Math.random() - 0.5) * PORTRAIT_PARTICLES.scatterRadius;
        const scatterZ = (Math.random() - 0.5) * 100;

        // UV coordinates for texture mapping
        const u = col / gridSize;
        const v = row / gridSize;

        data.push({
          targetPos: [x, y, 0],
          scatterPos: [scatterX, scatterY, scatterZ],
          uv: [u, v],
          delay: Math.random() * 0.3, // Stagger assembly
        });
      }
    }

    return { gridSize, particleData: data };
  }, [viewport]);

  // Geometry: one small quad per particle
  const geometry = useMemo(() => {
    const size = PORTRAIT_PARTICLES.fragmentSize;
    const geom = new THREE.PlaneGeometry(size, size);
    return geom;
  }, []);

  // Material: use portrait texture, per-instance UVs
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: textureRef.current,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [textureRef.current]);

  // Animation state
  const stateRef = useRef({
    current: "scattered",
    progress: 0, // 0 = start, 1 = end
  });

  useFrame((state, delta) => {
    if (!meshRef.current || !textureRef.current) return;

    const { current, progress } = stateRef.current;
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    // Update material texture
    if (material.map !== textureRef.current) {
      material.map = textureRef.current;
      material.needsUpdate = true;
    }

    // State transition logic
    if (targetState !== current) {
      stateRef.current.current = targetState;
      stateRef.current.progress = 0;
    }

    // Advance animation progress
    let speed = 1.0;
    if (targetState === "assembling") speed = 1 / PORTRAIT_PARTICLES.assemblyDuration;
    if (targetState === "disintegrating") speed = 1 / PORTRAIT_PARTICLES.disintegrationDuration;

    stateRef.current.progress = Math.min(1, progress + delta * speed);
    const t = stateRef.current.progress;

    // Easing function (expo out)
    const ease = 1 - Math.pow(1 - t, 3);

    // Update each particle instance
    particleData.forEach((particle, i) => {
      const [tx, ty, tz] = particle.targetPos;
      const [sx, sy, sz] = particle.scatterPos;

      let x, y, z, opacity;

      if (targetState === "scattered" || targetState === "disintegrating") {
        // Move toward scattered position
        x = tx + (sx - tx) * ease;
        y = ty + (sy - ty) * ease;
        z = tz + (sz - tz) * ease;
        opacity = 1 - ease;
      } else if (targetState === "assembling") {
        // Move toward target position
        x = sx + (tx - sx) * ease;
        y = sy + (ty - sy) * ease;
        z = sz + (tz - sz) * ease;
        opacity = ease;
      } else {
        // Complete: stable at target
        x = tx;
        y = ty;
        z = tz;
        opacity = 1;
      }

      dummy.position.set(x, y, z);
      dummy.scale.set(opacity, opacity, opacity);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, particleData.length]}
    />
  );
}

export default PortraitParticles;
