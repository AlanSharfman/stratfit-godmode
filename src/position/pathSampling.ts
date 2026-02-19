// src/position/pathSampling.ts
// STRATFIT — Shared P50 path geometry utilities.
// Single source of truth for meander formula — imported by TimelineTicks,
// LiquidityFlowLayer, MarkerLayer, and any future path-aware components.

import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

// ── Path extents ─────────────────────────────────────────────────────────────

export const PATH_X0 = -TERRAIN_CONSTANTS.width * 0.36  // ≈ -201.6
export const PATH_X1 =  TERRAIN_CONSTANTS.width * 0.36  // ≈  201.6

// ── Core helpers ──────────────────────────────────────────────────────────────

export function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/**
 * Sample X,Z world position at normalised path parameter t ∈ [0,1].
 * Deterministic dual-sinusoidal meander — must stay in sync with P50Path.tsx.
 */
export function samplePathXZ(t: number): { x: number; z: number } {
  const amp1 = 22, amp2 = 9
  const w1   = Math.PI * 2 * 1.05
  const w2   = Math.PI * 2 * 2.35
  const p1   = 0.75, p2 = 1.9
  return {
    x: lerpN(PATH_X0, PATH_X1, t),
    z: Math.sin(t * w1 + p1) * amp1 + Math.sin(t * w2 + p2) * amp2,
  }
}

/**
 * Unit perpendicular vector in XZ plane at path parameter t.
 * Returns { dx, dz } — rotated 90° from the tangent direction.
 */
export function perpAtT(t: number): { dx: number; dz: number } {
  const dt = 0.002
  const a  = samplePathXZ(Math.max(0, t - dt))
  const b  = samplePathXZ(Math.min(1, t + dt))
  const tx = b.x - a.x
  const tz = b.z - a.z
  const len = Math.sqrt(tx * tx + tz * tz) || 1
  return { dx: -tz / len, dz: tx / len }
}
