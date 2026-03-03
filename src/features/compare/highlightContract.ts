// src/features/compare/highlightContract.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Highlight Contract
//
// Shared types for insight-to-terrain linking.
// InsightPanel sets active target; terrain area renders the FX.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Where on the terrain to draw the highlight.
 *
 * - terrainUV: normalised [0,1] coordinates on the terrain plane.
 *              Converted to world XZ by the terrain area wrapper.
 * - worldXZ:  already in R3F world space.
 * - ridgeT:   parametric position along the P50 ridge (future use).
 */
export type HighlightTarget =
  | { kind: "terrainUV"; u: number; v: number; label?: string }
  | { kind: "worldXZ"; x: number; z: number; label?: string }
  | { kind: "ridgeT"; t: number; label?: string }

/**
 * Current highlight state passed from ComparePage → Terrain.
 */
export interface HighlightState {
  active?: HighlightTarget
  sourceId?: string
  /** Timestamp of last change — used to re-trigger one-shot FX */
  ts?: number
}

/**
 * Canonical highlight targets for deterministic insight-to-terrain linking.
 * TODO: replace with real scenario anchor derivation once engine exposes
 *       terrain-mapped coordinates per KPI.
 */
export const CANONICAL_TARGETS: Record<string, HighlightTarget> = {
  runwayHorizon:    { kind: "terrainUV", u: 0.75, v: 0.55, label: "Runway Horizon" },
  fundingRisk:      { kind: "terrainUV", u: 0.60, v: 0.35, label: "Funding Risk" },
  demandVolatility: { kind: "terrainUV", u: 0.40, v: 0.60, label: "Demand Volatility" },
  revenueGrowth:    { kind: "terrainUV", u: 0.55, v: 0.50, label: "Revenue Growth" },
  burnEfficiency:   { kind: "terrainUV", u: 0.30, v: 0.42, label: "Burn Efficiency" },
}

/**
 * Convert a terrainUV target to worldXZ coordinates using terrain constants.
 * PlaneGeometry: width=560, depth=360, centered at origin,
 * then scaled [3.0, 2.8, 2.6] and positioned [0, -6, 0] with -PI/2 rotation.
 * After rotation: PlaneGeometry X → world X, PlaneGeometry Y → world Z.
 */
export function uvToWorldXZ(u: number, v: number): { x: number; z: number } {
  // PlaneGeometry spans [-width/2..+width/2] x [-depth/2..+depth/2]
  // After scale [3.0, 2.8, _] and rotation -PI/2:
  //   world X = planeX * scaleX = (u * width - width/2) * 3.0
  //   world Z = planeY * scaleY = (v * depth - depth/2) * 2.8
  const WIDTH = 560
  const DEPTH = 360
  const SCALE_X = 3.0
  const SCALE_Y = 2.8
  const x = (u * WIDTH - WIDTH / 2) * SCALE_X
  const z = (v * DEPTH - DEPTH / 2) * SCALE_Y
  return { x, z }
}

/**
 * Resolve any HighlightTarget to a worldXZ pair.
 */
export function resolveTargetXZ(t: HighlightTarget): { x: number; z: number } {
  switch (t.kind) {
    case "worldXZ":
      return { x: t.x, z: t.z }
    case "terrainUV":
      return uvToWorldXZ(t.u, t.v)
    case "ridgeT":
      // Approximate: map t along the X axis, centered Z
      return uvToWorldXZ(t.t, 0.5)
  }
}
