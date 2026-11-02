import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useConstructionState } from "../ConstructionContext";
import { PORTRAIT_PARTICLES, prefersReducedMotion } from "../config";

/**
 * PortraitParticles — signature 3D particle disintegration/assembly effect.
 *
 * Architecture (robust):
 * 1. Base Layer: Real <img> in Hero.jsx (guaranteed visible).
 * 2. Overlay Layer: WebGL canvas that renders the disintegration/assembly animation.
 */
function PortraitParticles({ imageSrc, layer }) {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const state = useConstructionState(layer);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const particleState = useMemo(() => {
    if (prefersReducedMotion) return "complete";
    if (state === "hidden") return "scattered";
    if (state === "revealing") return "assembling";
    if (state === "active" && isInView) return "complete";
    if (state === "active" && !isInView) return "disintegrating";
    return "complete";
  }, [state, isInView]);

  // Overlay is visible only during a live transition; hidden when stable.
  const overlayVisible = particleState !== "complete";

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        opacity: overlayVisible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 500], fov: 45, near: 1, far: 2000 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ParticleSystem imageSrc={imageSrc} targetState={particleState} />
      </Canvas>
    </div>
  );
}

/**
 * ParticleSystem — InstancedMesh of texture quads tiling the canvas.
 * Now maps UVs precisely so each quad is a piece of the photo.
 */
function ParticleSystem({ imageSrc, targetState }) {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);
  const { viewport } = useThree();

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(imageSrc, (t) => {
      t.minFilter = THREE.LinearFilter;
      setTexture(t);
    });
  }, [imageSrc]);

  const gridSize = PORTRAIT_PARTICLES.gridSize;
  const particleData = useMemo(() => {
    const data = [];
    const pW = viewport.width / gridSize;
    const pH = viewport.height / gridSize;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Position
        const x = -viewport.width / 2 + (col + 0.5) * pW;
        const y = viewport.height / 2 - (row + 0.5) * pH;

        // Scatter
        const sx = x + (Math.random() - 0.5) * 500;
        const sy = y + (Math.random() - 0.5) * 500;
        const sz = (Math.random() - 0.5) * 300;

        // UV mapping - for the custom shader
        const uvX = col / gridSize;
        const uvY = 1 - (row + 1) / gridSize;

        data.push({
          targetPos: [x, y, 0],
          scatterPos: [sx, sy, sz],
          uvOffset: [uvX, uvY]
        });
      }
    }
    return data;
  }, [viewport, gridSize]);

  // Custom ShaderMaterial to handle per-instance UVs
  const material = useMemo(() => {
    if (!texture) return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        gridSize: { value: gridSize }
      },
      vertexShader: `
        attribute vec2 uvOffset;
        varying vec2 vUv;
        void main() {
          vUv = uv + uvOffset;
          // uv is standard plane UV [0,1], scale it down and offset
          // This shader is a bit simplified. In a real scenario we'd do more.
          vUv = (uv / float(${gridSize})) + uvOffset;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(map, vUv);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [texture, gridSize]);

  // Geometry + Instanced attributes
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(viewport.width / gridSize, viewport.height / gridSize);

    // Add UV offset attribute
    const uvOffsets = new Float32Array(particleData.length * 2);
    particleData.forEach((p, i) => {
      uvOffsets[i * 2] = p.uvOffset[0];
      uvOffsets[i * 2 + 1] = p.uvOffset[1];
    });
    g.setAttribute('uvOffset', new THREE.InstancedBufferAttribute(uvOffsets, 2));

    return g;
  }, [viewport, gridSize, particleData]);

  // State
  const stateRef = useRef({ current: "scattered", progress: 0 });

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !texture) return;

    if (targetState !== stateRef.current.current) {
      stateRef.current.current = targetState;
      stateRef.current.progress = 0;
    }

    const speed = targetState === "assembling" ? 1/2.5 : 1/2.0;
    stateRef.current.progress = Math.min(1, stateRef.current.progress + delta * speed);

    const t = stateRef.current.progress;
    const ease = 1 - Math.pow(1 - t, 3);

    const dummy = new THREE.Object3D();

    particleData.forEach((p, i) => {
      const [tx, ty, tz] = p.targetPos;
      const [sx, sy, sz] = p.scatterPos;

      let x, y, z, s;

      if (targetState === "assembling") {
        x = sx + (tx - sx) * ease;
        y = sy + (ty - sy) * ease;
        z = sz + (tz - sz) * ease;
        s = Math.max(0.0001, ease);
      } else {
        x = tx + (sx - tx) * ease;
        y = ty + (sy - ty) * ease;
        z = tz + (sz - tz) * ease;
        s = Math.max(0.0001, 1 - ease);
      }

      dummy.position.set(x, y, z);
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!texture || !material) return null;

  return <instancedMesh ref={meshRef} args={[geometry, material, particleData.length]} />;
}

export default PortraitParticles;
