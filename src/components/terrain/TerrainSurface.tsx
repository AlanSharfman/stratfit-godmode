import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

type Props = {
  geometry: THREE.BufferGeometry; // your existing terrain geom (heightfield)
  stress?: Float32Array;          // optional per-vertex stress 0..1 (same vertex count)
  delta?: Float32Array;           // optional per-vertex delta offset (same vertex count) (strategy intervention)
  showStrategicOverlay?: boolean;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Calm + Clinical surface:
 * - subtle fill under wireframe (mass)
 * - stress is NOT lava: it is desaturation + controlled red tint
 * - strategic overlay is Indigo ghost delta (wireframe)
 */
export default function TerrainSurface({
  geometry,
  stress,
  delta,
  showStrategicOverlay = false,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ghostRef = useRef<THREE.Mesh>(null!);

  const material = useMemo(() => {
    // IMPORTANT: not neon. calm cyan.
    // Fill + wire feel without "glow".
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
        uFillOpacity: { value: 0.14 }, // subtle mass fill
        uWireOpacity: { value: 0.95 },
        uBaseCyan: { value: new THREE.Color("#39C6D9") },
        uStableTint: { value: new THREE.Color("#7FEAF2") },   // ice/cyan highlight
        uEmerald: { value: new THREE.Color("#29D39A") },      // strengthening
        uIndigo: { value: new THREE.Color("#7A5CFF") },       // strategic overlay usage (not in base)
        uStressRed: { value: new THREE.Color("#E04B4B") },    // controlled stress
      },
      vertexShader: `
        varying vec3 vPos;
        varying float vStress;
        varying vec3 vNormalW;

        attribute float aStress;

        void main() {
          vPos = position;
          vStress = aStress;

          vec4 wp = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);

          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uFillOpacity;
        uniform float uWireOpacity;
        uniform vec3 uBaseCyan;
        uniform vec3 uStableTint;
        uniform vec3 uEmerald;
        uniform vec3 uStressRed;

        varying vec3 vPos;
        varying float vStress;
        varying vec3 vNormalW;

        // tiny "micro fracture" hint (procedural), subtle
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f*f*(3.0-2.0*f);
          return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
        }

        void main() {
          // Lighting (clinical, restrained)
          vec3 N = normalize(vNormalW);
          vec3 L = normalize(vec3(-0.35, 0.75, 0.40)); // fixed lab key
          float ndl = clamp(dot(N, L), 0.0, 1.0);

          // Base cyan with gentle highlight
          vec3 base = uBaseCyan;
          base = mix(base, uStableTint, pow(ndl, 1.6) * 0.40);

          // Stress treatment: NOT glow. It's a controlled tint + desat.
          float s = clamp(vStress, 0.0, 1.0);
          float stressAmt = smoothstep(0.55, 1.0, s); // only shows when meaningful
          vec3 stressTint = mix(base, uStressRed, stressAmt * 0.35);

          // Micro-fracture hint only at high stress; extremely subtle.
          float n = noise(vPos.xz * 2.2);
          float crack = smoothstep(0.78, 0.92, n) * stressAmt;
          stressTint = mix(stressTint, uStressRed, crack * 0.10);

          // Gentle depth shading using Y (gives mass)
          float depth = clamp((vPos.y + 2.0) / 8.0, 0.0, 1.0);
          vec3 shaded = mix(vec3(0.05, 0.08, 0.11), stressTint, 0.55 + depth * 0.45);

          // Fill alpha (mass)
          float alpha = uFillOpacity + ndl * 0.08;

          gl_FragColor = vec4(shaded, alpha);
        }
      `,
    });

    return mat;
  }, []);

  const wireMaterial = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      color: "#39C6D9",
      wireframe: true,
      transparent: true,
      opacity: 0.55, // calmer wire
      depthWrite: false,
    });
    return m;
  }, []);

  const ghostMaterial = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      color: "#7A5CFF", // indigo
      wireframe: true,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    return m;
  }, []);

  // Ensure geometry has aStress attribute (0..1)
  const preparedGeometry = useMemo(() => {
    const g = geometry.clone();

    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const count = pos.count;

    const stressArr = new Float32Array(count);
    if (stress && stress.length === count) {
      stressArr.set(stress);
    } else {
      // Default: calm (no stress)
      for (let i = 0; i < count; i++) stressArr[i] = 0;
    }

    g.setAttribute("aStress", new THREE.BufferAttribute(stressArr, 1));

    return g;
  }, [geometry, stress]);

  const ghostGeometry = useMemo(() => {
    // Strategy overlay = baseline geometry + delta in Y (or along normal if you want later)
    const g = geometry.clone();
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const count = pos.count;

    if (delta && delta.length === count) {
      const arr = pos.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        arr[idx + 1] = arr[idx + 1] + delta[i];
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
    }

    return g;
  }, [geometry, delta]);

  useFrame((_, dt) => {
    (material.uniforms.uTime.value as number) += dt;

    // Calm motion: if you currently auto-spin, slow it drastically.
    // (If you don't auto-spin, leave this as-is.)
    if (meshRef.current) {
      // meshRef.current.rotation.y += dt * 0.03; // ultra-slow (optional)
    }
  });

  return (
    <group>
      {/* Filled mass */}
      <mesh ref={meshRef} geometry={preparedGeometry} material={material} castShadow />

      {/* Wireframe layer (calm, not neon) */}
      <mesh geometry={preparedGeometry} material={wireMaterial} />

      {/* Strategic delta overlay (indigo ghost) */}
      {showStrategicOverlay && (
        <mesh ref={ghostRef} geometry={ghostGeometry} material={ghostMaterial} />
      )}
    </group>
  );
}
