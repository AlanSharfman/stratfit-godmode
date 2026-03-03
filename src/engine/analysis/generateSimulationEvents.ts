// src/engine/analysis/generateSimulationEvents.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Deterministic Simulation Event Generator (Phase A7)
//
// FULL ENGINE OWNERSHIP — generates TerrainEvent[] from SimulationResults.
// No UI imports. No randomness. Uses deterministic formulas from
// Monte Carlo aggregate series (median/p10/p90 per month).
//
// When the engine provides flat KPIs (no time series), we project
// deterministic month-indexed series from the flat values + growth rate.
//
// Events carry monthIndex=t from the engine timeline — never "30% horizon"
// or hard-coded fractions.
//
// Formula spec: see PHASE A7 docs.
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainEvent, TerrainEventType } from "@/domain/events/terrainEventTypes"
import { clamp01, smooth3, eps } from "@/domain/events/terrainEvents"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"

// ── Terrain coordinate mapping (matches P50Path) ────────────────

const TERRAIN_WIDTH = 560
const PATH_X0 = -TERRAIN_WIDTH * 0.36
const PATH_X1 = TERRAIN_WIDTH * 0.36
const MEANDER_AMP1 = 22
const MEANDER_AMP2 = 9
const MEANDER_W1 = Math.PI * 2 * 1.05
const MEANDER_W2 = Math.PI * 2 * 2.35
const MEANDER_P1 = 0.75
const MEANDER_P2 = 1.9

function monthToTerrainXZ(month: number, horizonMonths: number): { x: number; z: number } {
  const t = Math.max(0, Math.min(1, month / Math.max(1, horizonMonths)))
  const x = PATH_X0 + t * (PATH_X1 - PATH_X0)
  const z =
    Math.sin(t * MEANDER_W1 + MEANDER_P1) * MEANDER_AMP1 +
    Math.sin(t * MEANDER_W2 + MEANDER_P2) * MEANDER_AMP2
  return { x, z }
}

function coords(month: number, horizonMonths: number): { x: number; y: number; z: number } {
  const { x, z } = monthToTerrainXZ(month, horizonMonths)
  return { x, y: 0, z }
}

// ── Time series projection from flat KPIs ───────────────────────
// When SimulationResults lacks Monte Carlo series, we project deterministic
// month-indexed arrays from the flat baseline values.

interface ProjectedSeries {
  riskIndex: number[]
  runwayMonths: number[]
  medianRevenue: number[]
  p10Revenue: number[]
  p90Revenue: number[]
  probSurvival: number[] | null
}

function projectTimeSeries(
  kpis: SimulationKpis,
  horizonMonths: number,
): ProjectedSeries {
  const T = horizonMonths
  const medianRevenue: number[] = new Array(T)
  const p10Revenue: number[] = new Array(T)
  const p90Revenue: number[] = new Array(T)
  const riskIndex: number[] = new Array(T)
  const runwayMonths: number[] = new Array(T)
  const probSurvival: number[] = new Array(T)

  const monthlyGrowth = Math.abs(kpis.growthRate) <= 1
    ? kpis.growthRate
    : kpis.growthRate / 100

  const monthlyChurn = Math.abs(kpis.churnRate) <= 1
    ? kpis.churnRate
    : kpis.churnRate / 100

  const grossMargin = Math.abs(kpis.grossMargin) <= 1
    ? kpis.grossMargin
    : kpis.grossMargin / 100

  let cash = kpis.cash
  const burn = kpis.monthlyBurn

  for (let t = 0; t < T; t++) {
    // Revenue projection with growth compounding + churn drag
    const netGrowth = monthlyGrowth - monthlyChurn
    const rev = kpis.revenue * Math.pow(1 + netGrowth, t)
    medianRevenue[t] = Math.max(rev, 0)

    // P10/P90 fan: widen with sqrt(t) to simulate uncertainty growth
    const dispersion = 0.15 * Math.sqrt(t + 1) // starts at 15%, widens
    p10Revenue[t] = Math.max(rev * (1 - dispersion), 0)
    p90Revenue[t] = rev * (1 + dispersion)

    // Cash: revenue * margin - burn, cumulative
    const netCashFlow = rev * grossMargin - burn
    cash = Math.max(cash + netCashFlow, 0)

    // Runway: cash / burn
    runwayMonths[t] = burn > eps ? cash / burn : T

    // Risk index: composite of burn pressure, margin weakness, churn
    const burnRatio = rev > eps ? burn / rev : 2
    const burnPressure = clamp01((burnRatio - 0.5) / 1.5)
    const marginRisk = clamp01((0.6 - grossMargin) / 0.4)
    const churnRisk = clamp01((monthlyChurn - 0.02) / 0.08)
    const runwayRisk = runwayMonths[t] < T ? clamp01((12 - runwayMonths[t]) / 12) : 0
    riskIndex[t] = clamp01(burnPressure * 0.35 + marginRisk * 0.2 + churnRisk * 0.2 + runwayRisk * 0.25)

    // Survival probability (simple model)
    probSurvival[t] = clamp01(1 - riskIndex[t] * 0.8)
  }

  return { riskIndex, runwayMonths, medianRevenue, p10Revenue, p90Revenue, probSurvival }
}

// ── Deterministic math helpers ──────────────────────────────────

/** Interquartile-ish dispersion range: p90 - p10 */
function idr(p90: number[], p10: number[]): number[] {
  return p90.map((v, i) => v - p10[i])
}

/** Relative dispersion: idr / |median| */
function relDisp(median: number[], p90: number[], p10: number[]): number[] {
  const range = idr(p90, p10)
  return range.map((r, i) => r / Math.max(Math.abs(median[i]), eps))
}

/** Central difference slope: (a[t+1] - a[t-1]) / 2 */
function slope(a: number[]): number[] {
  if (a.length < 3) return a.map(() => 0)
  const s = new Array(a.length).fill(0)
  for (let t = 1; t < a.length - 1; t++) {
    s[t] = (a[t + 1] - a[t - 1]) / 2
  }
  s[0] = s[1]
  s[a.length - 1] = s[a.length - 2]
  return s
}

/** Central difference acceleration: a[t+1] - 2*a[t] + a[t-1] */
function accel(a: number[]): number[] {
  if (a.length < 3) return a.map(() => 0)
  const acc = new Array(a.length).fill(0)
  for (let t = 1; t < a.length - 1; t++) {
    acc[t] = a[t + 1] - 2 * a[t] + a[t - 1]
  }
  acc[0] = acc[1]
  acc[a.length - 1] = acc[a.length - 2]
  return acc
}

// ── Anti-spam: cooldown & severity filter ────────────────────────

/** Same-month merge priority (lower = higher priority) */
const TYPE_PRIORITY: Record<TerrainEventType, number> = {
  liquidity_stress: 0,
  risk_spike: 1,
  downside_regime: 2,
  volatility_zone: 3,
  probability_shift: 4,
  growth_inflection: 5,
}

const MIN_SEVERITY = 0.35
const COOLDOWN_MONTHS = 2

interface RawEvent {
  type: TerrainEventType
  monthIndex: number
  severity: number
  probabilityImpact: number
  description: string
  metricSource: string
  category?: "risk" | "strategic" | "positive" | "info"
}

function applyAntiSpam(raw: RawEvent[]): RawEvent[] {
  // 1) Drop low severity
  let events = raw.filter((e) => e.severity >= MIN_SEVERITY)

  // 2) Sort by priority then month
  events.sort((a, b) => {
    if (a.monthIndex !== b.monthIndex) return a.monthIndex - b.monthIndex
    return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]
  })

  // 3) Cooldown per type: keep higher severity within window
  const lastEmitted: Map<TerrainEventType, { month: number; severity: number; idx: number }> = new Map()
  const keep: boolean[] = events.map(() => true)

  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const prev = lastEmitted.get(e.type)
    if (prev && e.monthIndex - prev.month < COOLDOWN_MONTHS) {
      // Within cooldown — keep the higher severity one
      if (e.severity > prev.severity) {
        keep[prev.idx] = false
        lastEmitted.set(e.type, { month: e.monthIndex, severity: e.severity, idx: i })
      } else {
        keep[i] = false
      }
    } else {
      lastEmitted.set(e.type, { month: e.monthIndex, severity: e.severity, idx: i })
    }
  }

  return events.filter((_, i) => keep[i])
}

// ═════════════════════════════════════════════════════════════════
// PUBLIC API
// ═════════════════════════════════════════════════════════════════

/**
 * Generate deterministic terrain events from simulation results.
 *
 * @param kpis         Flat KPIs from simulation
 * @param horizonMonths Simulation horizon (typically 24)
 * @param baselineKpis Optional baseline KPIs for relative detection
 * @returns TerrainEvent[] — engine-owned, ready for rendering
 */
export function generateSimulationEvents(
  kpis: SimulationKpis,
  horizonMonths: number,
  baselineKpis?: SimulationKpis | null,
): TerrainEvent[] {
  const T = horizonMonths
  if (T < 3) return []

  // Project time series
  const series = projectTimeSeries(kpis, T)
  const baseSeries = baselineKpis ? projectTimeSeries(baselineKpis, T) : null

  const rawEvents: RawEvent[] = []

  // Smooth key series
  const r = smooth3(series.riskIndex)
  const rw = smooth3(series.runwayMonths)
  const vdRaw = relDisp(series.medianRevenue, series.p90Revenue, series.p10Revenue)
  const vd = smooth3(vdRaw)

  const logMedRev = series.medianRevenue.map((v) => Math.log(Math.max(v, eps)))
  const g = slope(logMedRev)
  const a = accel(logMedRev)

  // Baseline series for relative detection
  const vdBase = baseSeries
    ? smooth3(relDisp(baseSeries.medianRevenue, baseSeries.p90Revenue, baseSeries.p10Revenue))
    : null
  const gBase = baseSeries
    ? slope(baseSeries.medianRevenue.map((v) => Math.log(Math.max(v, eps))))
    : null

  // ────────────────────────────────
  // EVENT 1: RISK_SPIKE
  // ────────────────────────────────
  for (let t = 1; t < T; t++) {
    const dr = r[t] - r[t - 1]

    // Trigger conditions
    const spike = dr >= 0.08
    const cliff = r[t] >= 0.75 && dr >= 0.05
    const sustained = t >= 2 && [t, t - 1, t - 2].filter((i) => i >= 1 && r[i] - r[i - 1] >= 0.05).length >= 2

    if (spike || cliff || sustained) {
      const sev = clamp01((dr - 0.05) / 0.10) * clamp01((r[t] - 0.55) / 0.35)

      let pImpact: number
      if (series.probSurvival && t >= 1) {
        pImpact = clamp01((series.probSurvival[t - 1] - series.probSurvival[t]) / 0.10)
      } else {
        pImpact = clamp01(dr / 0.12)
      }

      rawEvents.push({
        type: "risk_spike",
        monthIndex: t,
        severity: sev,
        probabilityImpact: -pImpact,
        description: "Downside risk rose materially this month; the risk index increased sharply.",
        metricSource: "riskIndex",
      })
    }
  }

  // ────────────────────────────────
  // EVENT 2: LIQUIDITY_STRESS
  // ────────────────────────────────
  for (let t = 1; t < T; t++) {
    const drw = rw[t] - rw[t - 1]

    const warning = rw[t] <= 6
    const critical = rw[t] <= 3
    const compression = drw <= -2

    if (warning || critical || compression) {
      const sevWarn = clamp01((6 - rw[t]) / 6)
      const sevComp = clamp01((-drw - 1) / 4)
      const sev = Math.max(sevWarn, sevComp, critical ? 0.9 : 0)

      let pImpact: number
      // No pCashOut series — use runway-based fallback
      pImpact = clamp01((6 - rw[t]) / 6)

      rawEvents.push({
        type: "liquidity_stress",
        monthIndex: t,
        severity: sev,
        probabilityImpact: -pImpact,
        description: "Liquidity coverage tightened; runway moved into the critical band.",
        metricSource: "runwayMonths",
      })
    }
  }

  // ────────────────────────────────
  // EVENT 3: VOLATILITY_ZONE
  // ────────────────────────────────
  for (let t = 1; t < T; t++) {
    const absolute = vd[t] >= 0.45
    const shock = t >= 1 && (vd[t] - vd[t - 1]) >= 0.12
    const relative = vdBase && (vd[t] - vdBase[t]) >= 0.15

    if (absolute || shock || relative) {
      const sevAbs = clamp01((vd[t] - 0.30) / 0.40)
      const sevJump = t >= 1 ? clamp01(((vd[t] - vd[t - 1]) - 0.06) / 0.20) : 0
      const sevRel = vdBase ? clamp01(((vd[t] - vdBase[t]) - 0.08) / 0.20) : 0
      const sev = Math.max(sevAbs, sevJump, sevRel)

      const pImpact = t >= 1 ? clamp01((vd[t] - vd[t - 1]) / 0.20) : 0

      rawEvents.push({
        type: "volatility_zone",
        monthIndex: t,
        severity: sev,
        probabilityImpact: -pImpact,
        description: "Outcome dispersion widened; predictability reduced versus prior months.",
        metricSource: "revenue(p10/median/p90)",
      })
    }
  }

  // ────────────────────────────────
  // EVENT 4: GROWTH_INFLECTION
  // ────────────────────────────────
  for (let t = 1; t < T - 1; t++) {
    const triggerUp = a[t] >= 0.035 && g[t] >= 0.01
    const triggerDown = a[t] <= -0.035 || g[t] <= -0.02

    if (triggerUp || triggerDown) {
      const sevUp = clamp01((a[t] - 0.02) / 0.06)
      const sevDn = clamp01((-a[t] - 0.02) / 0.08)
      const sev = Math.max(sevUp, sevDn)

      let pImpact: number
      if (gBase) {
        pImpact = clamp01((g[t] - gBase[t]) / 0.05)
      } else {
        pImpact = clamp01(Math.abs(a[t]) / 0.10)
      }

      rawEvents.push({
        type: "growth_inflection",
        monthIndex: t,
        severity: sev,
        probabilityImpact: triggerUp ? pImpact : -pImpact,
        description: "Median growth trajectory changed slope; momentum shifted.",
        metricSource: "medianRevenue",
        category: triggerUp ? "strategic" : "risk",
      })
    }
  }

  // ────────────────────────────────
  // EVENT 5: PROBABILITY_SHIFT
  // ────────────────────────────────
  const idrSeries = idr(series.p90Revenue, series.p10Revenue)
  for (let t = 0; t < T; t++) {
    let shift: number

    if (baseSeries) {
      // Baseline-relative
      const idrBase = baseSeries.p90Revenue[t] - baseSeries.p10Revenue[t]
      shift = Math.abs(series.medianRevenue[t] - baseSeries.medianRevenue[t]) / Math.max(idrBase, eps)
    } else {
      // Fallback: single-scenario internal shift
      if (t < 3) continue
      const idrPast = idrSeries[t - 3]
      shift = Math.abs(series.medianRevenue[t] - series.medianRevenue[t - 3]) / Math.max(idrPast, eps)
    }

    // Trigger: shift >= 0.75 OR sustained >= 0.50 for 2 months
    const triggered = shift >= 0.75
    const sustained = t >= 1 && shift >= 0.50 && (() => {
      // Check previous month
      let prevShift: number
      if (baseSeries) {
        const idrBasePrev = baseSeries.p90Revenue[t - 1] - baseSeries.p10Revenue[t - 1]
        prevShift = Math.abs(series.medianRevenue[t - 1] - baseSeries.medianRevenue[t - 1]) / Math.max(idrBasePrev, eps)
      } else {
        if (t - 1 < 3) return false
        prevShift = Math.abs(series.medianRevenue[t - 1] - series.medianRevenue[t - 4]) / Math.max(idrSeries[t - 4], eps)
      }
      return prevShift >= 0.50
    })()

    if (triggered || sustained) {
      const sev = clamp01((shift - 0.40) / 0.80)
      const pImpact = clamp01(shift / 1.2)

      rawEvents.push({
        type: "probability_shift",
        monthIndex: t,
        severity: sev,
        probabilityImpact: pImpact,
        description: "Scenario regime shifted; distribution centre moved materially versus reference.",
        metricSource: "medianRevenue,p10/p90",
      })
    }
  }

  // ────────────────────────────────
  // EVENT 6: DOWNSIDE_REGIME
  // ────────────────────────────────
  const tailGapRaw = series.medianRevenue.map((med, i) =>
    (med - series.p10Revenue[i]) / Math.max(Math.abs(med), eps),
  )
  const tailGap = smooth3(tailGapRaw)

  for (let t = 1; t < T; t++) {
    const dtail = tailGap[t] - tailGap[t - 1]

    if (tailGap[t] >= 0.35 || dtail >= 0.10) {
      const sev = Math.max(
        clamp01((tailGap[t] - 0.20) / 0.40),
        clamp01((dtail - 0.06) / 0.18),
      )

      const pImpact = clamp01(dtail / 0.18)

      rawEvents.push({
        type: "downside_regime",
        monthIndex: t,
        severity: sev,
        probabilityImpact: -pImpact,
        description: "Downside tail thickened; lower-percentile outcomes weakened.",
        metricSource: "p10Revenue/medianRevenue",
      })
    }
  }

  // ── Anti-spam ──
  const filtered = applyAntiSpam(rawEvents)

  // ── Convert to TerrainEvent[] with coordinates ──
  return filtered.map((raw, i) => ({
    id: `${raw.type}-t${raw.monthIndex}-${i}`,
    type: raw.type,
    severity: raw.severity,
    timestamp: raw.monthIndex,
    metricSource: raw.metricSource,
    description: raw.description,
    probabilityImpact: raw.probabilityImpact,
    coordinates: coords(raw.monthIndex, T),
  }))
}
