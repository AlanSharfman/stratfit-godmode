// src/terrain/timeSeriesTerrainMetrics.ts
// Converts engine time-series data into a function (normalizedX) => TerrainMetrics
// so that the heightfield varies along the X axis (time).

import type { EngineTimelinePoint, EngineSummary } from "@/core/engine/types"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"

export type MetricsAtX = (normalizedX: number) => TerrainMetrics

/**
 * Given a timeline array and its summary, produce a function that maps
 * a normalised X value (0 = leftmost = month 0, 1 = rightmost = final month)
 * to interpolated TerrainMetrics derived from the time-series data at that position.
 */
export function buildTimeSeriesMetricsFn(
  timeline: EngineTimelinePoint[],
  summary: EngineSummary,
): MetricsAtX {
  const n = timeline.length
  if (n === 0) return () => DEFAULT_METRICS

  const peakEV = summary.peakEV || 1
  const peakRev = summary.peakRevenue || 1

  const perStep: TerrainMetrics[] = timeline.map((pt) => {
    const evNorm = pt.enterpriseValue / peakEV
    const revNorm = pt.revenue / peakRev
    return {
      elevationScale: 0.8 + evNorm * 2.2,
      roughness: 0.2 + pt.riskIndex * 0.6,
      ridgeIntensity: Math.min(1, revNorm * 0.8),
      volatility: pt.riskIndex,
      liquidityDepth: Math.max(0.2, 1 - pt.riskIndex * 0.8),
      growthSlope: pt.ebitda >= 0 ? Math.min(0.8, revNorm) : -0.1,
      valleyDepth: 0.2 + pt.riskIndex * 0.5,
      peakSoftness: 0.5 + (1 - pt.riskIndex) * 0.3,
      noiseFrequency: 0.8 + pt.riskIndex * 0.4,
      microDetailStrength: 0.15 + pt.riskIndex * 0.25,
    }
  })

  return (normX: number) => {
    const x = Math.max(0, Math.min(1, normX))
    const floatIdx = x * (n - 1)
    const lo = Math.floor(floatIdx)
    const hi = Math.min(lo + 1, n - 1)
    const frac = floatIdx - lo
    return lerpMetrics(perStep[lo], perStep[hi], frac)
  }
}

const DEFAULT_METRICS: TerrainMetrics = {
  elevationScale: 0.5,
  roughness: 0.5,
  liquidityDepth: 1,
  growthSlope: 0,
  volatility: 0.3,
}

function lerpMetrics(a: TerrainMetrics, b: TerrainMetrics, t: number): TerrainMetrics {
  const mix = (va: number | undefined, vb: number | undefined, fallback: number) =>
    (va ?? fallback) + ((vb ?? fallback) - (va ?? fallback)) * t

  return {
    elevationScale: mix(a.elevationScale, b.elevationScale, 0.5),
    roughness: mix(a.roughness, b.roughness, 0.5),
    ridgeIntensity: mix(a.ridgeIntensity, b.ridgeIntensity, 0.5),
    volatility: mix(a.volatility, b.volatility, 0.3),
    liquidityDepth: mix(a.liquidityDepth, b.liquidityDepth, 1),
    growthSlope: mix(a.growthSlope, b.growthSlope, 0),
    valleyDepth: mix(a.valleyDepth, b.valleyDepth, 0.45),
    peakSoftness: mix(a.peakSoftness, b.peakSoftness, 0.6),
    noiseFrequency: mix(a.noiseFrequency, b.noiseFrequency, 1.0),
    microDetailStrength: mix(a.microDetailStrength, b.microDetailStrength, 0.3),
  }
}
