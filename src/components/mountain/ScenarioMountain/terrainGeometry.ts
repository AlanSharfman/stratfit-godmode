/**
 * Terrain geometry utilities extracted from ScenarioMountainImpl.
 * Constants, noise functions, and height computation for the mountain surface.
 */

import { clamp01, lerp } from "./helpers";

// ============================================================================
// CONSTANTS
// ============================================================================

export const GRID_W = 120;
export const GRID_D = 60;
export const MESH_W = 50;
export const MESH_D = 25;
export const ISLAND_RADIUS = 22;

export const BASE_SCALE = 7.0;
export const PEAK_SCALE = 5.5;
export const MASSIF_SCALE = 7.5;
export const RIDGE_SHARPNESS = 1.4;
export const CLIFF_BOOST = 1.2;

export const SOFT_CEILING = 14.0;
export const CEILING_START = 11.0;

// ============================================================================
// NOISE / GAUSSIAN HELPERS
// ============================================================================

export function noise2(x: number, z: number): number {
  const n1 = Math.sin(x * 0.7 + z * 0.35) * 0.2;
  const n2 = Math.cos(x * 1.2 - z * 0.6) * 0.15;
  const n3 = Math.sin(x * 2.1 + z * 1.8) * 0.08;
  return n1 + n2 + n3;
}

export function ridgeNoise(x: number, z: number): number {
  // ALL terms use Math.abs — eliminates the phase-dependent sign flip that was
  // making sin(x*0.5) negative at the camera-left massif (x≈11, sin(5.5)≈−0.71)
  // while positive at camera-right (x≈−10, sin(−5)≈+0.96), causing left-side
  // smoothness. Math.abs folds each wave into always-positive ridge crests.
  const fold   = Math.abs(Math.sin(x * 0.55 + z * 0.2));   // large folded ridges
  const ridgeA = Math.abs(Math.sin(x * 2.5  + z * 1.5));   // ↗ erosion gullies
  const ridgeB = Math.abs(Math.sin(x * 2.3  - z * 1.8));   // ↘ cross-cut gullies
  const scree  = Math.abs(Math.sin(x * 4.7  + z * 0.6));   // fine-grain debris
  return fold * 0.08 + ridgeA * 0.09 + ridgeB * 0.07 + scree * 0.03;
}

export function gaussian1(x: number, c: number, s: number): number {
  const t = (x - c) / Math.max(0.1, s);
  return Math.exp(-0.5 * t * t);
}

export function gaussian2(dx: number, dz: number, sx: number, sz: number): number {
  return Math.exp(-0.5 * ((dx * dx) / (sx * sx) + (dz * dz) / (sz * sz)));
}

export function applySoftCeiling(h: number): number {
  if (h <= CEILING_START) return h;
  const excess = h - CEILING_START;
  const range = SOFT_CEILING - CEILING_START;
  return CEILING_START + range * (1 - Math.exp(-excess / range));
}

// ============================================================================
// MASSIF PEAKS
// ============================================================================

export interface MassifPeak {
  x: number;
  z: number;
  amplitude: number;
  sigmaX: number;
  sigmaZ: number;
}

export const MASSIF_PEAKS: MassifPeak[] = [
  { x: 0,   z: -2,   amplitude: 1.5,  sigmaX: 3.6, sigmaZ: 3.2 },
  { x: -10, z: -1,   amplitude: 1.2,  sigmaX: 3.8, sigmaZ: 3.4 },
  { x: 11,  z: -1.5, amplitude: 1.1,  sigmaX: 3.6, sigmaZ: 3.2 },
  { x: -3,  z:  3,   amplitude: 0.85, sigmaX: 4.4, sigmaZ: 3.8 },
  { x: -16, z:  2,   amplitude: 0.6,  sigmaX: 5.0, sigmaZ: 4.4 },
  { x: 17,  z:  1,   amplitude: 0.55, sigmaX: 4.8, sigmaZ: 4.0 },
  // Near-centre spur on camera-left — mirrors the x=-3 secondary ridge on camera-right.
  // Placed at x=5 where ridgeNoise base is positive (sin(2.5)≈+0.60) so it naturally
  // acquires erosion channels and rugged texture matching the right side.
  { x: 5,   z: -1.5, amplitude: 0.85, sigmaX: 3.0, sigmaZ: 2.6 },
];

// ============================================================================
// HEIGHT COMPUTATION
// ============================================================================

/**
 * Compute terrain height at a specific (x, z) position using the SAME algorithm
 * as the Terrain component's useLayoutEffect. This MUST stay in sync.
 * Does not include peakModel dynamic peaks (activeKpi / activeLever) — only
 * the signature backbone + data-driven shape + massif + noise.
 */
export function computeStaticTerrainHeight(x: number, z: number, dp: number[]): number {
  const wHalf = MESH_W / 2;
  const kpiX = ((x + wHalf) / MESH_W) * 6;

  let ridge = 0;
  for (let idx = 0; idx < 7; idx++) {
    const v = clamp01(dp[idx]);
    const g = gaussian1(kpiX, idx, 0.48);
    ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
  }

  let h = ridge * BASE_SCALE;

  // Massif backdrop peaks
  for (const m of MASSIF_PEAKS) {
    const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
    h += g * m.amplitude * MASSIF_SCALE;
  }

  // Signature peakModel backbone (always present, even with no active KPI)
  const signaturePeaks = [
    { index: 3.1, amplitude: 0.55, sigma: 2.5 },
    { index: 2.0, amplitude: 0.38, sigma: 2.0 },
    { index: 4.3, amplitude: 0.38, sigma: 2.0 },
    { index: 1.0, amplitude: 0.25, sigma: 1.6 },
    { index: 5.2, amplitude: 0.25, sigma: 1.6 },
  ];
  for (const p of signaturePeaks) {
    const pidx = clamp01(p.index / 6);
    const peakX = lerp(-wHalf, wHalf, pidx);
    h += gaussian2(x - peakX, z + 1.5, 0.8 + p.sigma * 0.8, 0.7 + p.sigma * 0.8) * p.amplitude * PEAK_SCALE;
  }

  // Ruggedness + noise
  const rugged = ridgeNoise(x, z);
  h += rugged * (0.3 + h * 0.08);

  const dist = Math.sqrt(x * x + z * z * 1.4);
  const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));
  const n = noise2(x, z) * 0.2;
  const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
  let finalH = Math.max(0, (h + n) * mask * cliff);
  finalH = applySoftCeiling(finalH);

  return finalH;
}
