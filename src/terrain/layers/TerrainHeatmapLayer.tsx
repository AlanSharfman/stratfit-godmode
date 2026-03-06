// src/terrain/layers/TerrainHeatmapLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Heatmap Layer (Red → Yellow → Green)
//
// Vertex-colored overlay mesh that drapes directly onto the terrain surface.
// Clones the terrain geometry and applies a height-based color gradient:
//   Low   (valleys)  → Red    (structural risk)
//   Mid   (slopes)   → Yellow (transition)
//   High  (peaks)    → Green  (structural strength)
//
// Toggled via heatmapEnabled flag. Semi-transparent so terrain detail shows.
// No render loops. No Canvas re-mounting. Pure geometry overlay.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { baselineReliefScalar, baselineSeedString, createSeed } from "@/terrain/seed";
import { buildTerrainWithMetrics } from "@/terrain/buildTerrain";
import { TERRAIN_CONSTANTS, TERRAIN_WORLD_SCALE } from "@/terrain/terrainConstants";
import type { MetricsInput } from "@/terrain/buildTerrain";

// ────────────────────────────────────────────────────────────────────────────
// COLOR STOPS — institutional red → amber → green
// ────────────────────────────────────────────────────────────────────────────

const COLOR_LOW = new THREE.Color(0.85, 0.12, 0.10);   // #d91e1a  – deep red
const COLOR_MID = new THREE.Color(0.92, 0.72, 0.10);   // #ebb81a  – warm amber
const COLOR_HIGH = new THREE.Color(0.10, 0.75, 0.30);  // #1abf4d  – strong green

function lerpHeatColor(t: number, out: THREE.Color): void {
  // t: 0 = lowest, 1 = highest
  const tc = Math.max(0, Math.min(1, t));
  if (tc < 0.5) {
    out.lerpColors(COLOR_LOW, COLOR_MID, tc * 2);
  } else {
    out.lerpColors(COLOR_MID, COLOR_HIGH, (tc - 0.5) * 2);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface TerrainHeatmapLayerProps {
  enabled: boolean;
  terrainMetrics?: MetricsInput;
  opacity?: number;
}

const TerrainHeatmapLayer: React.FC<TerrainHeatmapLayerProps> = memo(
  ({ enabled, terrainMetrics, opacity = 0.45 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { baseline } = useSystemBaseline();
    const baselineAny = baseline as any;

    const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny]);
    const seed = useMemo(() => createSeed(seedStr), [seedStr]);
    const relief = useMemo(() => baselineReliefScalar(baselineAny), [baselineAny]);

    // Build identical geometry to terrain surface
    const heatGeo = useMemo(() => {
      if (!enabled) return null;
      const geo = buildTerrainWithMetrics(260, seed, relief, terrainMetrics);

      // Read Z values (height) from position attribute to determine color
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const count = pos.count;

      // Find height range
      let minH = Infinity;
      let maxH = -Infinity;
      for (let i = 0; i < count; i++) {
        const z = pos.getZ(i);
        minH = Math.min(minH, z);
        maxH = Math.max(maxH, z);
      }

      const range = maxH - minH || 1;

      // Build vertex colors
      const colors = new Float32Array(count * 3);
      const tmp = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const z = pos.getZ(i);
        const t = (z - minH) / range;
        lerpHeatColor(t, tmp);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }

      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      return geo;
    }, [enabled, seed, relief, terrainMetrics]);

    // Dispose geometry on unmount / change
    useEffect(() => {
      return () => {
        heatGeo?.dispose();
      };
    }, [heatGeo]);

    // Match terrain transform
    useEffect(() => {
      if (!meshRef.current) return;
      meshRef.current.rotation.x = -Math.PI / 2;
      meshRef.current.position.set(0, TERRAIN_CONSTANTS.yOffset, 0);
      meshRef.current.scale.set(TERRAIN_WORLD_SCALE.x, TERRAIN_WORLD_SCALE.y, TERRAIN_WORLD_SCALE.z);
      meshRef.current.frustumCulled = false;
    }, [heatGeo]);

    if (!enabled || !heatGeo) return null;

    return (
      <mesh
        ref={meshRef}
        geometry={heatGeo}
        renderOrder={5}
        name="terrain-heatmap"
      >
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={opacity}
          depthWrite={false}
          depthTest={true}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
          toneMapped={false}
        />
      </mesh>
    );
  }
);

TerrainHeatmapLayer.displayName = "TerrainHeatmapLayer";
export default TerrainHeatmapLayer;
