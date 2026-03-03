// src/selectors/timelineTerrainSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline → Terrain Derivation Selectors
//
// Terrain MUST derive from engineResults.timeline[currentStep].
// No UI-side calculations. This is the single conversion layer.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineTimelinePoint } from "@/core/engine/types";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";

/**
 * Derive TerrainMetrics from a single engine timeline point.
 *
 * elevationScale: normalized enterprise value (higher EV → taller terrain)
 * roughness:      maps from risk index (higher risk → rougher surface)
 * ridgeIntensity: derived from revenue growth signal
 * volatility:     directly from riskIndex
 * liquidityDepth: inverse of risk (low risk = deep liquidity)
 * growthSlope:    revenue momentum indicator
 */
export function selectTimelineTerrainMetrics(
  point: EngineTimelinePoint | null,
  peakEV: number,
  peakRevenue: number,
): TerrainMetrics {
  if (!point) {
    return {
      elevationScale: 0.5,
      roughness: 0.5,
      ridgeIntensity: 0.5,
      volatility: 0.3,
      liquidityDepth: 1,
      growthSlope: 0,
    };
  }

  const evNorm = peakEV > 0 ? point.enterpriseValue / peakEV : 0.5;
  const revNorm = peakRevenue > 0 ? point.revenue / peakRevenue : 0.5;

  return {
    elevationScale: 0.3 + evNorm * 0.7,             // 0.3 → 1.0
    roughness: 0.2 + point.riskIndex * 0.6,          // 0.2 → 0.8
    ridgeIntensity: Math.min(1, revNorm * 0.8),      // 0 → 0.8
    volatility: point.riskIndex,                     // 0 → 1
    liquidityDepth: Math.max(0.2, 1 - point.riskIndex * 0.8), // 0.2 → 1
    growthSlope: point.ebitda >= 0 ? Math.min(0.8, revNorm) : -0.1,
  };
}

/**
 * Interpolate between two TerrainMetrics for smooth morphing.
 * Factor 0 = from, factor 1 = to.
 */
export function lerpTerrainMetrics(
  from: TerrainMetrics,
  to: TerrainMetrics,
  factor: number,
): TerrainMetrics {
  const t = Math.max(0, Math.min(1, factor));
  const mix = (a: number, b: number) => a + (b - a) * t;

  return {
    elevationScale: mix(from.elevationScale, to.elevationScale),
    roughness: mix(from.roughness, to.roughness),
    ridgeIntensity: mix(from.ridgeIntensity ?? 0.5, to.ridgeIntensity ?? 0.5),
    volatility: mix(from.volatility, to.volatility),
    liquidityDepth: mix(from.liquidityDepth, to.liquidityDepth),
    growthSlope: mix(from.growthSlope, to.growthSlope),
  };
}
