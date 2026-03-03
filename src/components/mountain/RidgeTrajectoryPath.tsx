// src/components/mountain/RidgeTrajectoryPath.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Strategic Ridge Trajectory Path
//
// Renders the main strategic trajectory using THREE.Line2 (fat lines)
// with LineMaterial for premium linewidth + dashed pulse animation.
// Path derived from engineResults.timeline — EV normalized to terrain height.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

import type { EngineTimelinePoint } from "@/core/engine/types";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

/** Terrain mapping — spread path across terrain width */
const TERRAIN_HALF_W = 560 * 3.0 * 0.5; // from TERRAIN_CONSTANTS
const PATH_Z_OFFSET = 0;                 // centered on terrain
const PATH_Y_LIFT = 2.5;                 // lift above terrain surface
const LINE_WIDTH = 0.006;                // world-space linewidth
const LINE_COLOR = 0x22d3ee;             // cyan
const DASH_SIZE = 1.2;
const GAP_SIZE = 0.6;
const PULSE_SPEED = 0.3;                 // dash offset drift speed

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  timeline: EngineTimelinePoint[];
  peakEV: number;
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const RidgeTrajectoryPath: React.FC<Props> = memo(({ timeline, peakEV, terrainRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<LineMaterial | null>(null);
  const { scene } = useThree();

  // Build Line2 object
  const { line, material } = useMemo(() => {
    if (timeline.length < 2 || peakEV <= 0) return { line: null, material: null };

    const positions: number[] = [];
    const terrain = terrainRef.current;

    for (let i = 0; i < timeline.length; i++) {
      const t = i / (timeline.length - 1);
      const x = (t - 0.5) * TERRAIN_HALF_W * 1.4; // spread across terrain
      const evNorm = timeline[i].enterpriseValue / peakEV;
      const baseY = terrain ? terrain.getHeightAt(x, PATH_Z_OFFSET) : evNorm * 40;
      const y = baseY + PATH_Y_LIFT + evNorm * 8; // EV-proportional lift
      positions.push(x, y, PATH_Z_OFFSET);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const mat = new LineMaterial({
      color: LINE_COLOR,
      linewidth: LINE_WIDTH,
      dashed: true,
      dashScale: 1,
      dashSize: DASH_SIZE,
      gapSize: GAP_SIZE,
      transparent: true,
      opacity: 0.95,
    });
    mat.toneMapped = false;

    const l = new Line2(geometry, mat);
    l.computeLineDistances();
    l.frustumCulled = false;

    return { line: l, material: mat };
  }, [timeline, peakEV, terrainRef]);

  // Mount/unmount from scene
  useEffect(() => {
    if (!line) return;
    scene.add(line);
    matRef.current = material;

    return () => {
      scene.remove(line);
      line.geometry.dispose();
      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      }
    };
  }, [line, material, scene]);

  // Animate dash pulse + keep resolution synced
  useFrame(({ clock, size }) => {
    if (!matRef.current) return;
    matRef.current.resolution.set(size.width, size.height);
    matRef.current.dashOffset = -clock.getElapsedTime() * PULSE_SPEED;
  });

  return null;
});

RidgeTrajectoryPath.displayName = "RidgeTrajectoryPath";
export default RidgeTrajectoryPath;
