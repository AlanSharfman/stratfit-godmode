// src/components/mountain/RiskTurbulence.tsx
// ═══════════════════════════════════════════════════════════════════════════
// PHASE 230 — Turbulence Bands
//
// Animated semi-transparent bands that flow along the time axis.
// Speed proportional to riskIndex. Shader-driven noise distortion.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants";

const BAND_COUNT = 6;
const BAND_HEIGHT = 12;
const BAND_Y_BASE = 8;
const BAND_SPACING = 6;
const MAX_SPEED = 40; // world-units/sec at riskIndex 1.0

// Vertex shader — simple pass-through with wave distortion
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;
    // Sine-wave distortion along X
    float wave = sin(pos.x * 0.012 + uTime * 1.2) * uIntensity * 3.0;
    wave += sin(pos.x * 0.025 + uTime * 2.4) * uIntensity * 1.5;
    pos.y += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader — band pattern with soft edges
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    // Striped pattern along X
    float stripe = sin(vUv.x * 40.0 + uTime * 2.0) * 0.5 + 0.5;
    stripe = smoothstep(0.3, 0.7, stripe);

    // Soft vertical falloff
    float yFade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);

    // Horizontal edge fade
    float xFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);

    float alpha = stripe * yFade * xFade * uIntensity * 0.28;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

interface RiskTurbulenceProps {
  riskIndex: number; // 0..1
  enabled?: boolean;
}

export default function RiskTurbulence({ riskIndex, enabled = true }: RiskTurbulenceProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);

  const uniforms = useMemo(
    () =>
      Array.from({ length: BAND_COUNT }, () => ({
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uColor: { value: new THREE.Color(0xa855f7) },
      })),
    [],
  );

  useFrame((state, delta) => {
    if (!enabled) return;

    const speed = riskIndex * MAX_SPEED;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < BAND_COUNT; i++) {
      const u = uniforms[i];
      u.uTime.value = t + i * 1.7;

      // Lerp intensity
      const tgtIntensity = riskIndex;
      u.uIntensity.value += (tgtIntensity - u.uIntensity.value) * 2.0 * delta;

      // Color — shifts from cyan→violet→red with risk
      if (riskIndex < 0.4) {
        u.uColor.value.set(0x22d3ee);
      } else if (riskIndex < 0.7) {
        u.uColor.value.set(0xa855f7);
      } else {
        u.uColor.value.set(0xef4444);
      }
    }

    // Scroll bands along Z (time axis)
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        mesh.position.z =
          ((mesh.position.z + speed * delta) %
            (TERRAIN_CONSTANTS.depth * 1.2)) -
          TERRAIN_CONSTANTS.depth * 0.6;
      });
    }
  });

  if (!enabled) return null;

  return (
    <group ref={groupRef}>
      {Array.from({ length: BAND_COUNT }, (_, i) => {
        const z =
          -TERRAIN_CONSTANTS.depth * 0.6 +
          i * (TERRAIN_CONSTANTS.depth / BAND_COUNT) * 1.2;
        return (
          <mesh
            key={i}
            position={[0, BAND_Y_BASE + i * BAND_SPACING, z]}
            rotation={[0, 0, 0]}
          >
            <planeGeometry
              args={[TERRAIN_CONSTANTS.width * 1.1, BAND_HEIGHT, 64, 1]}
            />
            <shaderMaterial
              ref={(el) => {
                if (el) materialsRef.current[i] = el;
              }}
              uniforms={uniforms[i]}
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}
