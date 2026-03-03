// src/components/mountain/RiskLightning.tsx
// ═══════════════════════════════════════════════════════════════════════════
// PHASE 230 — Lightning Events
//
// Triggered when riskIndex > 0.85.
// Renders a quick emissive bolt mesh — 120ms duration.
// Reports strikes to parent for camera shake.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants";

const LIGHTNING_THRESHOLD = 0.85;
const BOLT_DURATION = 0.12; // seconds
const MIN_INTERVAL = 1.5;   // minimum seconds between bolts
const BOLT_SEGMENTS = 8;
const BOLT_WIDTH = 1.2;

/** Generate a jagged bolt path from top to bottom */
function generateBoltPath(
  topY: number,
  bottomY: number,
  xCenter: number,
  zCenter: number,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const height = topY - bottomY;

  for (let i = 0; i <= BOLT_SEGMENTS; i++) {
    const t = i / BOLT_SEGMENTS;
    const y = topY - height * t;
    // Random lateral jitter, increasing toward middle
    const jitterScale = Math.sin(t * Math.PI) * 12;
    const x = xCenter + (Math.random() - 0.5) * jitterScale;
    const z = zCenter + (Math.random() - 0.5) * jitterScale * 0.6;
    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

interface RiskLightningProps {
  riskIndex: number;
  /** World X position for the bolt */
  worldX: number;
  /** World Z position for the bolt */
  worldZ: number;
  /** Callback when a strike occurs — for camera shake */
  onStrike?: () => void;
}

export default function RiskLightning({
  riskIndex,
  worldX,
  worldZ,
  onStrike,
}: RiskLightningProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const geoRef = useRef<THREE.TubeGeometry | null>(null);
  const timerRef = useRef(0);
  const cooldownRef = useRef(0);
  const [active, setActive] = useState(false);
  const boltPathRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  const topY = 70;
  const bottomY = 5;

  // Generate new bolt geometry
  const regenerateBolt = () => {
    const path = generateBoltPath(topY, bottomY, worldX, worldZ);
    const curve = new THREE.CatmullRomCurve3(path);
    boltPathRef.current = curve;

    if (geoRef.current) geoRef.current.dispose();
    geoRef.current = new THREE.TubeGeometry(curve, 16, BOLT_WIDTH, 4, false);

    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = geoRef.current;
    }
  };

  useFrame((_state, delta) => {
    cooldownRef.current = Math.max(0, cooldownRef.current - delta);

    if (riskIndex > LIGHTNING_THRESHOLD && cooldownRef.current <= 0 && !active) {
      // Trigger strike
      regenerateBolt();
      setActive(true);
      timerRef.current = BOLT_DURATION;
      cooldownRef.current = MIN_INTERVAL + Math.random() * 2;
      onStrike?.();
    }

    if (active) {
      timerRef.current -= delta;
      if (timerRef.current <= 0) {
        setActive(false);
      }
    }

    // Bolt flash light
    if (lightRef.current) {
      if (active) {
        const flash = timerRef.current / BOLT_DURATION;
        lightRef.current.intensity = flash * 15;
      } else {
        lightRef.current.intensity *= 0.8;
        if (lightRef.current.intensity < 0.05) lightRef.current.intensity = 0;
      }
    }
  });

  // Cleanup geometry on unmount
  useEffect(() => {
    return () => {
      if (geoRef.current) geoRef.current.dispose();
    };
  }, []);

  return (
    <group>
      <mesh ref={meshRef} visible={active}>
        {/* Placeholder geometry — gets replaced by regenerateBolt */}
        <tubeGeometry args={[new THREE.LineCurve3(new THREE.Vector3(0, topY, 0), new THREE.Vector3(0, bottomY, 0)), 4, BOLT_WIDTH, 3, false]} />
        <meshBasicMaterial
          color={0xeeeeff}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[worldX, (topY + bottomY) / 2, worldZ]}
        color={0xccccff}
        intensity={0}
        distance={200}
        decay={2}
      />
    </group>
  );
}
