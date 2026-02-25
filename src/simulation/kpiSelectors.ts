// src/simulation/kpiSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STEP 30 — Canonical KPI Selectors
//
// Single source of truth for KPI reads, formatting, and deltas.
// Everything in the Compare layer routes through here.
//
// No stores. No side effects. Deterministic.
// ═══════════════════════════════════════════════════════════════════════════

import type { KPIValue, EngineResult } from "@/state/scenarioStore"
import { formatKPIValue } from "@/logic/kpiTaxonomy"

// ── Public types ──────────────────────────────────────────────────────────

/** Engine results map: scenarioId → EngineResult */
export type EngineResults = Record<string, EngineResult>

/** KPI map: key → KPIValue */
export type KPIMap = Record<string, KPIValue>

// ── Constants ─────────────────────────────────────────────────────────────

export const BASELINE_ID = "base" as const

// ── Selectors ─────────────────────────────────────────────────────────────

/** Extract KPIMap for a scenario from engine results. */
export function selectKpis(
  engineResults: EngineResults | null | undefined,
  scenarioId: string
): KPIMap | undefined {
  if (!engineResults) return undefined
  const result = engineResults[scenarioId]
  if (!result?.kpis) return undefined
  return result.kpis
}

/** Numeric value for a single KPI key, or null. */
export function kpiNumber(
  kpis: KPIMap | null | undefined,
  key: string
): number | null {
  if (!kpis) return null
  const entry = kpis[key]
  if (!entry || typeof entry.value !== "number") return null
  return entry.value
}

/** Formatted display string for a single KPI key. */
export function kpiDisplay(
  kpis: KPIMap | null | undefined,
  key: string
): string {
  const v = kpiNumber(kpis, key)
  if (v === null) return "—"
  return formatKPIValue(key, v)
}

// ── Delta helpers ─────────────────────────────────────────────────────────

/** Absolute delta between two numeric KPI values. */
export function deltaAbs(
  a: number | null | undefined,
  b: number | null | undefined
): number | null {
  if (a == null || b == null) return null
  return b - a
}

/** Percentage delta: (b − a) / |a| × 100. */
export function deltaPct(
  a: number | null | undefined,
  b: number | null | undefined
): number | null {
  if (a == null || b == null) return null
  if (a === 0) return null
  return ((b - a) / Math.abs(a)) * 100
}

/** Format absolute delta as string. */
export function fmtDeltaAbs(n: number | null | undefined): string {
  if (n == null) return "—"
  const sign = n > 0 ? "+" : ""
  if (Math.abs(n) >= 1_000_000) return `${sign}${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${sign}${(n / 1_000).toFixed(0)}K`
  return `${sign}${n.toFixed(1)}`
}

/** Format percentage delta as string. */
export function fmtDeltaPct(n: number | null | undefined): string {
  if (n == null) return "—"
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

// ── Backward-compat (used by CompareKpiOverlay) ──────────────────────────

export type CanonicalKpis = {
  survivalProb: number | null
  runwayMonths: number | null
  burnMonthly: number | null
  evP50: number | null
  evP10: number | null
  evP90: number | null
}

export function selectKpisFromResults(results: any): CanonicalKpis {
  if (!results) {
    return {
      survivalProb: null,
      runwayMonths: null,
      burnMonthly: null,
      evP50: null,
      evP10: null,
      evP90: null,
    }
  }

  // Bridge: if results has kpis map, extract canonical fields
  const kpis: KPIMap | undefined = results?.kpis
  return {
    survivalProb: kpiNumber(kpis, "riskIndex"),
    runwayMonths: kpiNumber(kpis, "runway"),
    burnMonthly: kpiNumber(kpis, "burnQuality"),
    evP50: kpiNumber(kpis, "enterpriseValue"),
    evP10: null,
    evP90: null,
  }
}
