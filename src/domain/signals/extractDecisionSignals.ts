// src/domain/signals/extractDecisionSignals.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Decision Signal Extraction
//
// Pure function. Deterministic. No side effects.
// Derives high-level decision signals from EngineResults.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineResults } from "@/domain/engine/EngineResults"
import type {
  DecisionSignals,
  ValueSignal,
  RiskSignal,
  StabilitySignal,
  ConfidenceSignal,
} from "./DecisionSignals"

// ── Helpers ─────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function mean(arr: readonly number[]): number {
  if (arr.length === 0) return 0
  let sum = 0
  for (let i = 0; i < arr.length; i++) sum += arr[i]
  return sum / arr.length
}

// ── Value Signal ────────────────────────────────────────────────

function deriveValueSignal(er: EngineResults): ValueSignal {
  const delta = er.signals.valueDeltaPct
  const direction: ValueSignal["direction"] =
    delta > 1 ? "increase" : delta < -1 ? "decrease" : "neutral"
  return { direction, magnitudePct: Math.abs(delta) }
}

// ── Risk Signal ─────────────────────────────────────────────────

function deriveRiskSignal(er: EngineResults): RiskSignal {
  const series = er.riskIndexSeries
  if (series.length === 0) {
    return { level: "moderate", changePct: 0 }
  }

  const baseline = series[0]
  const latest = series[series.length - 1]

  // Percentage change relative to baseline (guard against zero)
  const changePct = baseline !== 0
    ? ((latest - baseline) / Math.abs(baseline)) * 100
    : 0

  // Latest value scaled to 0–100 for level classification
  const latestScaled = latest * 100

  const level: RiskSignal["level"] =
    latestScaled < 20 ? "low" : latestScaled <= 50 ? "moderate" : "high"

  return { level, changePct: Math.round(changePct * 100) / 100 }
}

// ── Stability Signal ────────────────────────────────────────────

function deriveStabilitySignal(er: EngineResults): StabilitySignal {
  const series = er.varianceSeries
  if (series.length === 0) {
    return { score: 50, trend: "stable" }
  }

  // Inverse variance → stability score (0–100)
  // Higher variance = lower stability
  const avgVariance = mean(series)
  // Normalize: variance is typically 0–1; map inverse to 0–100
  const score = clamp(Math.round((1 - avgVariance) * 100), 0, 100)

  // Trend: compare first-half variance vs second-half variance
  const mid = Math.floor(series.length / 2)
  if (mid === 0) {
    return { score, trend: "stable" }
  }

  const firstHalf = mean(series.slice(0, mid))
  const secondHalf = mean(series.slice(mid))
  const delta = secondHalf - firstHalf

  // ±5% threshold for trend detection
  const threshold = Math.max(avgVariance * 0.05, 0.001)
  const trend: StabilitySignal["trend"] =
    delta < -threshold ? "improving" : delta > threshold ? "declining" : "stable"

  return { score, trend }
}

// ── Confidence Signal ───────────────────────────────────────────

function deriveConfidenceSignal(er: EngineResults): ConfidenceSignal {
  const { p10Series, p50Series, p90Series } = er

  if (!p10Series?.length || !p50Series?.length || !p90Series?.length) {
    return { score: 50, bandWidth: 0 }
  }

  const len = Math.min(p10Series.length, p50Series.length, p90Series.length)

  // Average band width (p90 − p10) normalized by p50
  let bandSum = 0
  let p50Sum = 0
  for (let i = 0; i < len; i++) {
    bandSum += p90Series[i] - p10Series[i]
    p50Sum += Math.abs(p50Series[i])
  }

  const avgBand = bandSum / len
  const avgP50 = p50Sum / len
  const bandWidth = avgP50 > 0 ? avgBand / avgP50 : 0

  // Score: inverse band width → 0–100
  // bandWidth near 0 → high confidence (100)
  // bandWidth near 1+ → low confidence (0)
  const score = clamp(Math.round((1 - Math.min(bandWidth, 1)) * 100), 0, 100)

  return { score, bandWidth: Math.round(bandWidth * 1000) / 1000 }
}

// ── Main Extraction ─────────────────────────────────────────────

/**
 * Extract high-level decision signals from EngineResults.
 *
 * Pure function — no side effects, fully deterministic.
 * All signals are derived exclusively from the EngineResults contract.
 */
export function extractDecisionSignals(engineResults: EngineResults): DecisionSignals {
  return {
    valueSignal: deriveValueSignal(engineResults),
    riskSignal: deriveRiskSignal(engineResults),
    stabilitySignal: deriveStabilitySignal(engineResults),
    confidenceSignal: deriveConfidenceSignal(engineResults),
  }
}
