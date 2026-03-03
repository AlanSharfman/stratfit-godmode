// src/components/mountain/RiskFogLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// PHASE 230 — Risk Fog Layer
//
// Semi-transparent volumetric plane hovering above terrain.
// Opacity and color driven by riskIndex (0..1).
//
// Color mapping:
//   low  (< 0.35) → cyan haze   #22d3ee
//   mid  (0.35–0.65) → violet   #a855f7
//   high (> 0.65) → red haze    #ef4444
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants";

// ── Color stops ──
const COLOR_LOW = new THREE.Color(0x22d3ee);   // cyan
const COLOR_MID = new THREE.Color(0xa855f7);   // violet
const COLOR_HIGH = new THREE.Color(0xef4444);  // red

const FOG_Y_LIFT = 4;
const MAX_OPACITY = 0.38;
const MIN_OPACITY = 0.04;

function riskToColor(risk: number, target: THREE.Color): void {
  if (risk < 0.35) {
    target.copy(COLOR_LOW).lerp(COLOR_MID, risk / 0.35);
  } else if (risk < 0.65) {
    target.copy(COLOR_MID).lerp(COLOR_HIGH, (risk - 0.35) / 0.3);
  } else {
    target.copy(COLOR_HIGH);
  }
}

interface RiskFogLayerProps {
  riskIndex: number; // 0..1
}

export default function RiskFogLayer({ riskIndex }: RiskFogLayerProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  // Smooth opacity + color
  const target = useRef({ opacity: 0, color: new THREE.Color() });

  useFrame((_state, delta) => {
    if (!matRef.current) return;

    // Compute targets
    const tOpacity = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * riskIndex;
    riskToColor(riskIndex, tmpColor);

    target.current.opacity = tOpacity;
    target.current.color.copy(tmpColor);

    // Lerp toward target
    const speed = 2.5 * delta;
    matRef.current.opacity += (target.current.opacity - matRef.current.opacity) * speed;
    matRef.current.color.lerp(target.current.color, speed);

    // Subtle vertical undulation
    if (meshRef.current) {
      const t = _state.clock.elapsedTime;
      meshRef.current.position.y = FOG_Y_LIFT + Math.sin(t * 0.4) * 0.8;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, FOG_Y_LIFT, 0]}
    >
      <planeGeometry args={[TERRAIN_CONSTANTS.width * 1.1, TERRAIN_CONSTANTS.depth * 1.1]} />
      <meshStandardMaterial
        ref={matRef}
        transparent
        opacity={MIN_OPACITY}
        color={COLOR_LOW}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
