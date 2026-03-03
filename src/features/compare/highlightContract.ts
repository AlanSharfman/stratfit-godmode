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
 * Used as fallback when engine KPI values are not available.
 * When KPI values are present, prefer `deriveAnchorTargets(kpis)`.
 */
export const CANONICAL_TARGETS: Record<string, HighlightTarget> = {
  runwayHorizon:    { kind: "terrainUV", u: 0.75, v: 0.55, label: "Runway Horizon" },
  fundingRisk:      { kind: "terrainUV", u: 0.60, v: 0.35, label: "Funding Risk" },
  demandVolatility: { kind: "terrainUV", u: 0.40, v: 0.60, label: "Demand Volatility" },
  revenueGrowth:    { kind: "terrainUV", u: 0.55, v: 0.50, label: "Revenue Growth" },
  burnEfficiency:   { kind: "terrainUV", u: 0.30, v: 0.42, label: "Burn Efficiency" },
}

/**
 * Derive insight-to-terrain highlight anchors from live engine KPI values.
 *
 * Mapping rationale:
 *  - U axis  ≈ time / revenue trajectory (0 = start, 1 = horizon)
 *  - V axis  ≈ risk/safety elevation   (0 = dangerous low, 1 = safe high)
 *
 * All inputs are normalised 0-1 before mapping. Falls back to CANONICAL_TARGETS
 * for any missing key.
 */
export function deriveAnchorTargets(
  kpis: Partial<{
    runway: number        // months (0-36)
    riskIndex: number     // 0-100 (higher = safer)
    burnQuality: number   // 0-100 (higher = more efficient)
    enterpriseValue: number // raw dollar value
    growthRate: number    // 0-100
  }>
): Record<string, HighlightTarget> {
  const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))

  // Normalise each KPI to 0-1
  const runway01 = clamp((kpis.runway ?? 18) / 36)
  const safety01 = clamp((kpis.riskIndex ?? 50) / 100)
  const burn01   = clamp((kpis.burnQuality ?? 50) / 100)
  const growth01 = clamp((kpis.growthRate ?? 50) / 100)

  return {
    runwayHorizon: {
      kind: "terrainUV",
      u: clamp(0.3 + runway01 * 0.6),      // longer runway → further right
      v: clamp(0.45 + safety01 * 0.2),     // safer → higher on terrain
      label: "Runway Horizon",
    },
    fundingRisk: {
      kind: "terrainUV",
      u: clamp(0.45 + runway01 * 0.25),
      v: clamp(0.25 + safety01 * 0.25),    // riskier → lower terrain position
      label: "Funding Risk",
    },
    demandVolatility: {
      kind: "terrainUV",
      u: clamp(0.25 + growth01 * 0.35),
      v: clamp(0.45 + growth01 * 0.2),
      label: "Demand Volatility",
    },
    revenueGrowth: {
      kind: "terrainUV",
      u: clamp(0.4 + growth01 * 0.35),
      v: clamp(0.4 + growth01 * 0.2),
      label: "Revenue Growth",
    },
    burnEfficiency: {
      kind: "terrainUV",
      u: clamp(0.15 + burn01 * 0.35),
      v: clamp(0.3 + burn01 * 0.25),
      label: "Burn Efficiency",
    },
  }
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
