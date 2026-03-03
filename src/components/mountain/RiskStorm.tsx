// src/components/mountain/RiskStorm.tsx
// ═══════════════════════════════════════════════════════════════════════════
// PHASE 230 — Storm Cells
//
// Spawn dark cloud meshes when riskIndex > 0.65.
// Positioned at timeline coordinates. Subtle lightning flicker inside.
// Performance limit: MAX 4 storm cells.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants";
import type { EngineTimelinePoint } from "@/core/engine/types";

const MAX_STORM_CELLS = 4;
const STORM_THRESHOLD = 0.65;
const CLOUD_RADIUS = 28;
const CLOUD_Y = 55;

// ── Internal flicker point light inside each cloud ──
interface StormCellData {
  stepIndex: number;
  riskIndex: number;
  worldX: number;
  worldZ: number;
}

function selectStormCells(
  timeline: EngineTimelinePoint[],
): StormCellData[] {
  const candidates: StormCellData[] = [];
  const len = timeline.length;
  if (len === 0) return candidates;

  for (let i = 0; i < len; i++) {
    const p = timeline[i];
    if (p.riskIndex > STORM_THRESHOLD) {
      const t = len > 1 ? i / (len - 1) : 0.5;
      candidates.push({
        stepIndex: i,
        riskIndex: p.riskIndex,
        worldX: (t - 0.5) * TERRAIN_CONSTANTS.width * 0.7,
        worldZ: (Math.sin(i * 1.3) * 0.3) * TERRAIN_CONSTANTS.depth,
      });
    }
  }

  // Sort by risk descending, cap at MAX
  candidates.sort((a, b) => b.riskIndex - a.riskIndex);
  return candidates.slice(0, MAX_STORM_CELLS);
}

// ── Cloud mesh — group of spheres to simulate a cloud ──
function StormCloud({
  position,
  riskIndex,
}: {
  position: [number, number, number];
  riskIndex: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const nextFlicker = useRef(Math.random() * 3 + 1);
  const flickerTimer = useRef(0);

  // Random cloud shape offsets (stable per mount)
  const offsets = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        x: (Math.random() - 0.5) * CLOUD_RADIUS * 0.8,
        y: (Math.random() - 0.3) * CLOUD_RADIUS * 0.3,
        z: (Math.random() - 0.5) * CLOUD_RADIUS * 0.6,
        scale: 0.5 + Math.random() * 0.7,
      })),
    [],
  );

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Slow rotation
    groupRef.current.rotation.y += delta * 0.05;

    // Lightning flicker logic
    flickerTimer.current += delta;
    if (lightRef.current) {
      if (flickerTimer.current >= nextFlicker.current) {
        // Flash!
        lightRef.current.intensity = 8 + riskIndex * 12;
        nextFlicker.current =
          flickerTimer.current + 0.08 + Math.random() * 0.12;
        // Double flash occasionally
        if (Math.random() > 0.6) {
          setTimeout(() => {
            if (lightRef.current) lightRef.current.intensity = 6 + riskIndex * 8;
          }, 60);
        }
      } else {
        // Decay
        lightRef.current.intensity *= 0.85;
        if (lightRef.current.intensity < 0.1) lightRef.current.intensity = 0;
      }

      // Reset timer periodically
      if (
        flickerTimer.current >
        nextFlicker.current + 2 + Math.random() * 4
      ) {
        flickerTimer.current = 0;
        nextFlicker.current = Math.random() * 3 + 1;
      }
    }
  });

  const opacity = 0.25 + riskIndex * 0.25;

  return (
    <group ref={groupRef} position={position}>
      {offsets.map((o, i) => (
        <mesh key={i} position={[o.x, o.y, o.z]} scale={o.scale}>
          <sphereGeometry args={[CLOUD_RADIUS * 0.45, 8, 6]} />
          <meshStandardMaterial
            color={0x1a1a2e}
            transparent
            opacity={opacity}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      ))}
      {/* Internal flicker light */}
      <pointLight
        ref={lightRef}
        color={0xc0c0ff}
        intensity={0}
        distance={CLOUD_RADIUS * 4}
        decay={2}
      />
    </group>
  );
}

interface RiskStormProps {
  timeline: EngineTimelinePoint[];
}

export default function RiskStorm({ timeline }: RiskStormProps) {
  const cells = useMemo(() => selectStormCells(timeline), [timeline]);

  if (cells.length === 0) return null;

  return (
    <group>
      {cells.map((cell) => (
        <StormCloud
          key={cell.stepIndex}
          position={[cell.worldX, CLOUD_Y, cell.worldZ]}
          riskIndex={cell.riskIndex}
        />
      ))}
    </group>
  );
}
