// src/components/mountain/ScenarioMountain/terrainSampler.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Height Sampler (lightweight, CPU-only)
//
// Delegates to computeStaticTerrainHeight (canonical source of truth) in
// terrainGeometry.ts so that path/marker systems query the EXACT same height
// algorithm used to build the rendered mesh.
//
// This is a READ-ONLY projection. No mutation. No geometry creation.
// ═══════════════════════════════════════════════════════════════════════════

import { computeStaticTerrainHeight } from "./terrainGeometry";

const DEFAULT_DP = [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

/**
 * Sample terrain height at a point (x, y) in mesh-local space.
 * Delegates to the canonical computeStaticTerrainHeight in terrainGeometry.ts.
 *
 * @param x  X position in mesh space (–25 to +25)
 * @param y  Y position in mesh space (–12.5 to +12.5)
 *           NOTE: In PlaneGeometry, Y is the forward axis before rotation.
 *           After rotating –π/2 around X, PlaneGeometry's Y → world Z.
 * @param dataPoints  Array of 7 KPI values (0–1 range)
 * @returns Height value (Z in PlaneGeometry / Y in world after rotation)
 */
export function sampleMountainHeight(
  x: number,
  y: number,
  dataPoints: number[] = DEFAULT_DP,
): number {
  const dp = dataPoints.length === 7 ? dataPoints : DEFAULT_DP;
  // computeStaticTerrainHeight(x, z, dp) — 'z' is PlaneGeometry Y (same axis as 'y' here)
  return computeStaticTerrainHeight(x, y, dp);
}

/**
 * Lift a world-space (x, y) point above the terrain surface.
 * Returns the terrain height plus a small hover offset.
 *
 * In ScenarioMountainImpl coordinates:
 *   - PlaneGeometry is rotated -π/2 around X
 *   - X → world X
 *   - PlaneGeometry Y → world -Z  (forward is negative Z)
 *   - PlaneGeometry Z (height) → world Y
 *
 * The StrategicPath uses:
 *   x = left/right, y = forward/back (depth), z = height (up)
 *
 * @param px  Path X (left–right)
 * @param py  Path Y (forward–back / depth) — maps to PlaneGeometry Y
 * @param dataPoints  KPI values
 * @param offset  Height lift above terrain surface (default 0.35)
 */
export function liftAboveTerrain(
  px: number,
  py: number,
  dataPoints?: number[],
  offset: number = 0.35,
): number {
  const terrainH = sampleMountainHeight(px, py, dataPoints);
  return terrainH + offset;
}
