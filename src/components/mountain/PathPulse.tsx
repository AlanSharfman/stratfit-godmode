// src/components/mountain/PathPulse.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Path Pulse Particle
//
// Renders a moving light particle travelling along the ridge trajectory
// spline. Speed is synchronized to timeline playback position.
// Uses an animated mesh with emissive material + bloom interaction.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { EngineTimelinePoint } from "@/core/engine/types";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const TERRAIN_HALF_W = 560 * 3.0 * 0.5;
const PATH_Z_OFFSET = 0;
const PATH_Y_LIFT = 2.5;
const PARTICLE_SIZE = 3.5;
const PARTICLE_COLOR = "#22d3ee";
const GLOW_COLOR = "#00e5ff";
const AUTO_SPEED = 0.08; // normalized units/sec when not playing

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  timeline: EngineTimelinePoint[];
  peakEV: number;
  currentStep: number;
  isPlaying: boolean;
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const PathPulse: React.FC<Props> = memo(
  ({ timeline, peakEV, currentStep, isPlaying, terrainRef }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const autoT = useRef(0);

    // Build spline from timeline
    const spline = useMemo(() => {
      if (timeline.length < 2 || peakEV <= 0) return null;

      const terrain = terrainRef.current;
      const points: THREE.Vector3[] = [];

      for (let i = 0; i < timeline.length; i++) {
        const t = i / (timeline.length - 1);
        const x = (t - 0.5) * TERRAIN_HALF_W * 1.4;
        const evNorm = timeline[i].enterpriseValue / peakEV;
        const baseY = terrain ? terrain.getHeightAt(x, PATH_Z_OFFSET) : evNorm * 40;
        const y = baseY + PATH_Y_LIFT + evNorm * 8;
        points.push(new THREE.Vector3(x, y, PATH_Z_OFFSET));
      }

      return new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
    }, [timeline, peakEV, terrainRef]);

    useFrame((_, delta) => {
      if (!spline || !meshRef.current) return;

      let t: number;
      if (isPlaying) {
        // Follow playback position
        t = timeline.length > 1 ? currentStep / (timeline.length - 1) : 0;
      } else {
        // Auto-drift when idle
        autoT.current = (autoT.current + delta * AUTO_SPEED) % 1;
        t = autoT.current;
      }

      const pos = spline.getPoint(Math.max(0, Math.min(1, t)));
      meshRef.current.position.copy(pos);

      if (glowRef.current) {
        glowRef.current.position.copy(pos);
        // Pulsing glow scale
        const pulse = 1 + 0.3 * Math.sin(performance.now() * 0.004);
        glowRef.current.scale.setScalar(pulse);
      }
    });

    if (!spline) return null;

    return (
      <>
        {/* Core particle */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[PARTICLE_SIZE, 12, 12]} />
          <meshBasicMaterial
            color={PARTICLE_COLOR}
            transparent
            opacity={0.95}
            toneMapped={false}
          />
        </mesh>

        {/* Outer glow halo */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[PARTICLE_SIZE * 2.5, 8, 8]} />
          <meshBasicMaterial
            color={GLOW_COLOR}
            transparent
            opacity={0.15}
            toneMapped={false}
            side={THREE.BackSide}
          />
        </mesh>
      </>
    );
  },
);

PathPulse.displayName = "PathPulse";
export default PathPulse;
