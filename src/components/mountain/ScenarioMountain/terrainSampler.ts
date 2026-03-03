// src/components/mountain/ScenarioMountain/terrainSampler.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Height Sampler (lightweight, CPU-only)
//
// Replicates the height computation used by ScenarioMountainImpl's Terrain
// component so that path/marker systems can query terrain height at any (x, y)
// in mesh-local coordinates WITHOUT needing a geometry reference.
//
// This is a READ-ONLY projection. No mutation. No geometry creation.
// ═══════════════════════════════════════════════════════════════════════════

import { clamp01 } from "./helpers";

// ── Constants mirrored from ScenarioMountainImpl ──
const MESH_W = 50;
const ISLAND_RADIUS = 22;
const BASE_SCALE = 4.5;
const MASSIF_SCALE = 5.0;
const RIDGE_SHARPNESS = 1.4;
const CLIFF_BOOST = 1.15;
const SOFT_CEILING = 9.0;
const CEILING_START = 7.0;

// ── Noise (deterministic, matches ScenarioMountainImpl) ──
function noise2(x: number, z: number): number {
  const n1 = Math.sin(x * 0.7 + z * 0.35) * 0.2;
  const n2 = Math.cos(x * 1.2 - z * 0.6) * 0.15;
  const n3 = Math.sin(x * 2.1 + z * 1.8) * 0.08;
  return n1 + n2 + n3;
}

function gaussian1(x: number, c: number, s: number): number {
  const t = (x - c) / Math.max(0.1, s);
  return Math.exp(-0.5 * t * t);
}

function gaussian2(dx: number, dz: number, sx: number, sz: number): number {
  return Math.exp(-0.5 * ((dx * dx) / (sx * sx) + (dz * dz) / (sz * sz)));
}

function applySoftCeiling(h: number): number {
  if (h <= CEILING_START) return h;
  const excess = h - CEILING_START;
  const range = SOFT_CEILING - CEILING_START;
  return CEILING_START + range * (1 - Math.exp(-excess / range));
}

// ── Massif peaks (copied from ScenarioMountainImpl) ──
interface MassifPeak {
  x: number;
  z: number;
  amplitude: number;
  sigmaX: number;
  sigmaZ: number;
}

const MASSIF_PEAKS: MassifPeak[] = [
  { x: 0, z: -2, amplitude: 1.5, sigmaX: 2.8, sigmaZ: 2.4 },
  { x: -10, z: -1, amplitude: 1.2, sigmaX: 3.0, sigmaZ: 2.6 },
  { x: 11, z: -1.5, amplitude: 1.1, sigmaX: 2.8, sigmaZ: 2.5 },
  { x: -3, z: 3, amplitude: 0.85, sigmaX: 3.5, sigmaZ: 3.0 },
  { x: -16, z: 2, amplitude: 0.6, sigmaX: 4.0, sigmaZ: 3.5 },
  { x: 17, z: 1, amplitude: 0.55, sigmaX: 3.8, sigmaZ: 3.2 },
];

/**
 * Sample terrain height at a point (x, y) in mesh-local space.
 * Uses the same algorithm as ScenarioMountainImpl's Terrain component.
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
  dataPoints: number[] = [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35],
): number {
  const wHalf = MESH_W / 2;
  const dp = dataPoints.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];
  const kpiX = ((x + wHalf) / MESH_W) * 6;

  let ridge = 0;
  for (let idx = 0; idx < 7; idx++) {
    const v = clamp01(dp[idx]);
    const g = gaussian1(kpiX, idx, 0.48);
    ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
  }

  let h = ridge * BASE_SCALE;

  for (const m of MASSIF_PEAKS) {
    const g = gaussian2(x - m.x, y - m.z, m.sigmaX, m.sigmaZ);
    h += g * m.amplitude * MASSIF_SCALE;
  }

  const dist = Math.sqrt(x * x + y * y * 1.4);
  const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));

  const n = noise2(x, y) * 0.2;
  const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
  let finalH = Math.max(0, (h + n) * mask * cliff);
  finalH = applySoftCeiling(finalH);

  return finalH;
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
