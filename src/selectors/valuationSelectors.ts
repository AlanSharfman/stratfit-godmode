// src/selectors/valuationSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Selectors (Phase V-1 + V-2A + V-4)
//
// Thin selector layer over the deterministic valuation engine.
// V-1:  selectValuation(engineResults) — direct EngineResults path
// V-2A: selectValuationFromSimulation(simResults) — canonical bridge
//       Converts SimulationResults (phase1ScenarioStore) → EngineResults
//       so pages wired to the canonical store can use the V-1 engine.
// V-4:  selectWaterfallFromSimulation(simResults, baseline) — waterfall
//       Computes baseline vs scenario EV and sequential marginal
//       attribution across 5 drivers. All math here, never in UI.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineResults, EngineTimelinePoint, EngineSummary } from "@/core/engine/types"
import type { ValuationResults, WaterfallPayload, WaterfallStep, ValuationNarrativePayload, NarrativeSection } from "@/valuation/valuationTypes"
import type { SimulationResults, SimulationKpis } from "@/state/phase1ScenarioStore"
import type { Baseline } from "@/types/baseline"
import { computeValuation } from "@/valuation/valuationEngine"

/**
 * Select valuation results from engine output.
 *
 * Pure function — no store access, no side effects.
 * Intended to be called by UI components or hooks that already
 * hold a reference to engineResults.
 */
export function selectValuation(engineResults: EngineResults): ValuationResults {
  return computeValuation(engineResults)
}

// ═══════════════════════════════════════════════════════════════════════════
// V-2A BRIDGE — SimulationResults → EngineResults → ValuationResults
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bridge from canonical SimulationResults (phase1ScenarioStore)
 * to EngineResults consumed by computeValuation.
 *
 * Synthesises a single-point timeline from SimulationKpis.
 * This is a best-effort projection — when the engine exposes
 * a full timeline, this bridge becomes unnecessary.
 */
function buildEngineResultsFromKpis(
  kpis: SimulationKpis,
  horizonMonths: number,
): EngineResults {
  const annualRevenue = kpis.revenue * 12 // kpis.revenue is monthly
  const grossMarginFrac = kpis.grossMargin / 100
  const growthFrac = kpis.growthRate / 100
  const ebitda = annualRevenue * grossMarginFrac

  // Risk heuristic: higher churn + lower runway → higher risk
  const churnRisk = Math.min(1, (kpis.churnRate / 100) * 2)
  const runwayRisk = kpis.runway != null && kpis.runway > 0
    ? Math.max(0, 1 - kpis.runway / 24)
    : 0.5
  const riskIndex = Math.min(1, (churnRisk + runwayRisk) / 2)

  // Build a minimal timeline (one step per horizon year)
  const years = Math.max(1, Math.round(horizonMonths / 12))
  const timeline: EngineTimelinePoint[] = []

  for (let y = 0; y < years; y++) {
    const projectedRevenue = annualRevenue * Math.pow(1 + growthFrac, y)
    const projectedEbitda = projectedRevenue * grossMarginFrac
    timeline.push({
      timeIndex: y,
      revenue: projectedRevenue,
      ebitda: projectedEbitda,
      riskIndex,
      enterpriseValue: 0, // placeholder — computed by valuation engine
    })
  }

  const lastRev = timeline[timeline.length - 1].revenue
  const summary: EngineSummary = {
    peakRevenue: lastRev,
    peakEV: 0,
    avgRiskIndex: riskIndex,
    terminalEbitda: lastRev * grossMarginFrac,
    cagr: growthFrac,
  }

  return { timeline, summary }
}

/**
 * Select valuation from canonical SimulationResults (phase1ScenarioStore).
 *
 * Returns null when no simulation data is available.
 * Pure function — no store access, no side effects.
 */
export function selectValuationFromSimulation(
  simResults: SimulationResults | null | undefined,
): ValuationResults | null {
  if (!simResults?.kpis) return null
  const engineResults = buildEngineResultsFromKpis(
    simResults.kpis,
    simResults.horizonMonths ?? 24,
  )
  return computeValuation(engineResults)
}

// ═══════════════════════════════════════════════════════════════════════════
// V-4 — WATERFALL ATTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════
//
// Sequential marginal attribution:
//   1. Start with baseline KPIs → compute baselineEV
//   2. Mutate one driver group at a time (revenue → margin → capex → risk → terminal)
//   3. Each step's delta = newEV − previousEV after mutation
//   4. Final step absorbs residual so Σ deltas = scenarioEV − baselineEV exactly
//
// All computation happens here. UI receives the payload and renders only.
// ═══════════════════════════════════════════════════════════════════════════

/** Derive direction from delta value */
function stepDirection(delta: number): "up" | "down" | "flat" {
  if (delta > 0) return "up"
  if (delta < 0) return "down"
  return "flat"
}

/** Convert Baseline (8 fields) → SimulationKpis (8 fields + runway) */
function baselineToKpis(baseline: Baseline): SimulationKpis {
  return {
    cash: baseline.cash,
    monthlyBurn: baseline.monthlyBurn,
    revenue: baseline.revenue,
    grossMargin: baseline.grossMargin,
    growthRate: baseline.growthRate,
    churnRate: baseline.churnRate,
    headcount: baseline.headcount,
    arpa: baseline.arpa,
    runway: baseline.monthlyBurn > 0 ? baseline.cash / baseline.monthlyBurn : null,
  }
}

/**
 * Select waterfall attribution from simulation results + baseline.
 *
 * Returns null when insufficient data to compute.
 * Pure function — no store access, no side effects.
 *
 * Sequential driver groups:
 *   1. Revenue Growth — revenue + growthRate
 *   2. Margin Expansion — grossMargin
 *   3. Capital Efficiency — cash + monthlyBurn
 *   4. Risk Adjustment — churnRate (affects risk index → EBITDA multiple)
 *   5. Terminal Growth — headcount + arpa + runway (residual catch-all)
 */
export function selectWaterfallFromSimulation(
  simResults: SimulationResults | null | undefined,
  baseline: Baseline | null | undefined,
): WaterfallPayload | null {
  if (!simResults?.kpis || !baseline) return null

  const horizonMonths = simResults.horizonMonths ?? 24
  const scenKpis = simResults.kpis

  // ── Baseline EV ──
  const baseKpis = baselineToKpis(baseline)
  const baseER = buildEngineResultsFromKpis(baseKpis, horizonMonths)
  const baseVal = computeValuation(baseER)
  const baselineEV = baseVal.blendedValue

  // ── Scenario EV (final target) ──
  const scenER = buildEngineResultsFromKpis(scenKpis, horizonMonths)
  const scenVal = computeValuation(scenER)
  const scenarioEV = scenVal.blendedValue

  // ── Sequential marginal attribution ──
  let currentKpis = { ...baseKpis }
  let currentEV = baselineEV
  const steps: WaterfallStep[] = []

  // Step 1: Revenue Growth (revenue + growthRate)
  currentKpis = { ...currentKpis, revenue: scenKpis.revenue, growthRate: scenKpis.growthRate }
  let er = buildEngineResultsFromKpis(currentKpis, horizonMonths)
  let ev = computeValuation(er).blendedValue
  let delta = ev - currentEV
  steps.push({ id: "revenue_growth", label: "Revenue Growth", delta, direction: stepDirection(delta) })
  currentEV = ev

  // Step 2: Margin Expansion (grossMargin)
  currentKpis = { ...currentKpis, grossMargin: scenKpis.grossMargin }
  er = buildEngineResultsFromKpis(currentKpis, horizonMonths)
  ev = computeValuation(er).blendedValue
  delta = ev - currentEV
  steps.push({ id: "margin_expansion", label: "Margin Expansion", delta, direction: stepDirection(delta) })
  currentEV = ev

  // Step 3: Capital Efficiency (cash + monthlyBurn)
  currentKpis = { ...currentKpis, cash: scenKpis.cash, monthlyBurn: scenKpis.monthlyBurn }
  // Recalculate runway since it depends on cash/burn
  currentKpis.runway = currentKpis.monthlyBurn > 0 ? currentKpis.cash / currentKpis.monthlyBurn : null
  er = buildEngineResultsFromKpis(currentKpis, horizonMonths)
  ev = computeValuation(er).blendedValue
  delta = ev - currentEV
  steps.push({ id: "capital_efficiency", label: "Capital Efficiency", delta, direction: stepDirection(delta) })
  currentEV = ev

  // Step 4: Risk Adjustment (churnRate)
  currentKpis = { ...currentKpis, churnRate: scenKpis.churnRate }
  currentKpis.runway = currentKpis.monthlyBurn > 0 ? currentKpis.cash / currentKpis.monthlyBurn : null
  er = buildEngineResultsFromKpis(currentKpis, horizonMonths)
  ev = computeValuation(er).blendedValue
  delta = ev - currentEV
  steps.push({ id: "risk_adjustment", label: "Risk Adjustment", delta, direction: stepDirection(delta) })
  currentEV = ev

  // Step 5: Terminal Growth (remaining: headcount, arpa + residual)
  // Use actual scenarioEV so Σ deltas = scenarioEV − baselineEV exactly
  delta = scenarioEV - currentEV
  steps.push({ id: "terminal_growth", label: "Terminal Growth", delta, direction: stepDirection(delta) })

  return {
    baselineEV,
    scenarioEV,
    steps,
    notes: {
      method: "DCF + REV + EBITDA (blended)",
      horizonYears: Math.max(1, Math.round(horizonMonths / 12)),
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// V-5 — STRATEGIC NARRATIVE GENERATION
// ═══════════════════════════════════════════════════════════════════════════
//
// Deterministic, board-ready narrative derived from:
//   - ValuationResults (method EVs, blended, probabilities)
//   - WaterfallPayload (baseline→scenario attribution)
//   - Scenario decision text
//
// Uses probabilistic language only — no "recommend", "guarantee", "certain".
// All text generation here. UI receives payload and renders only.
// ═══════════════════════════════════════════════════════════════════════════

const FORBIDDEN_NARRATIVE = /\b(recommend|guarantee|certain|definite|will\s+achieve|assured|should\s+invest)\b/gi

/** Format currency for narrative prose */
function narrativeFmtM(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return `$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`
  return `$${abs.toFixed(0)}`
}

function narrativePct(v: number): string {
  return `${(Math.abs(v) * 100).toFixed(1)}%`
}

function narrativeTone(delta: number): "positive" | "negative" | "neutral" {
  if (delta > 0) return "positive"
  if (delta < 0) return "negative"
  return "neutral"
}

function sanitiseNarrative(text: string): string {
  return text.replace(FORBIDDEN_NARRATIVE, "modelled estimate")
}

/**
 * Select strategic narrative from valuation + waterfall data.
 *
 * Returns null when insufficient data.
 * Pure function — no store access, no side effects.
 */
export function selectValuationNarrative(
  valuation: ValuationResults | null,
  waterfall: WaterfallPayload | null,
  decisionLabel?: string,
): ValuationNarrativePayload | null {
  if (!valuation || !waterfall || waterfall.baselineEV == null || waterfall.scenarioEV == null) {
    return null
  }

  const { baselineEV, scenarioEV, steps } = waterfall
  const totalDelta = scenarioEV - baselineEV
  const totalDeltaPct = baselineEV !== 0 ? totalDelta / Math.abs(baselineEV) : 0
  const direction = totalDelta > 0 ? "upside" : totalDelta < 0 ? "downside" : "neutral"

  // ── Identify top driver and key risk ──
  const sortedByAbsDelta = [...steps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  const topDriver = sortedByAbsDelta[0] ?? null
  const positiveDrivers = steps.filter((s) => s.direction === "up")
  const negativeDrivers = steps.filter((s) => s.direction === "down")
  const topRisk = negativeDrivers.length > 0 
    ? negativeDrivers.sort((a, b) => a.delta - b.delta)[0] 
    : null

  // ── Method agreement ──
  const { dcf, revenueMultiple, ebitdaMultiple, blendedValue, probabilities } = valuation
  const methodEVs = [dcf.enterpriseValue, revenueMultiple.enterpriseValue, ebitdaMultiple.enterpriseValue]
  const methodSpread = Math.max(...methodEVs) - Math.min(...methodEVs)
  const spreadPct = blendedValue > 0 ? methodSpread / blendedValue : 0
  const methodAgreement = spreadPct < 0.2 ? "strong" : spreadPct < 0.5 ? "moderate" : "weak"

  // ═══ Build Sections ═══
  const sections: NarrativeSection[] = []

  // 1. Valuation Summary
  const dirLabel = direction === "upside" ? "upside potential" : direction === "downside" ? "downside risk" : "neutral positioning"
  const scenarioCtx = decisionLabel ? ` under the "${decisionLabel}" scenario` : ""
  sections.push({
    id: "valuation_summary",
    title: "Valuation Summary",
    body: sanitiseNarrative(
      `The modelled enterprise value${scenarioCtx} is ${narrativeFmtM(scenarioEV)} (blended), ` +
      `representing ${narrativePct(Math.abs(totalDeltaPct))} ${dirLabel} relative to the ${narrativeFmtM(baselineEV)} baseline. ` +
      `Cross-method agreement is ${methodAgreement} — DCF at ${narrativeFmtM(dcf.enterpriseValue)}, ` +
      `revenue multiple at ${narrativeFmtM(revenueMultiple.enterpriseValue)}, ` +
      `and EBITDA multiple at ${narrativeFmtM(ebitdaMultiple.enterpriseValue)}.`
    ),
    tone: narrativeTone(totalDelta),
  })

  // 2. Key Driver Attribution
  if (topDriver) {
    const driverDir = topDriver.direction === "up" ? "contributes" : "reduces"
    const driverCountText = positiveDrivers.length > 1
      ? ` ${positiveDrivers.length} of ${steps.length} modelled drivers contribute positively.`
      : ""
    sections.push({
      id: "key_drivers",
      title: "Key Driver Attribution",
      body: sanitiseNarrative(
        `The largest modelled driver is ${topDriver.label.toLowerCase()}, which ${driverDir} ` +
        `${narrativeFmtM(Math.abs(topDriver.delta))} to enterprise value.${driverCountText}` +
        (topRisk
          ? ` The primary headwind is ${topRisk.label.toLowerCase()}, accounting for a ${narrativeFmtM(Math.abs(topRisk.delta))} reduction.`
          : " No significant headwinds were identified in the modelled drivers." )
      ),
      tone: topDriver.direction === "up" ? "positive" : "negative",
    })
  }

  // 3. Risk Profile
  const riskTone = negativeDrivers.length === 0 ? "positive"
    : negativeDrivers.length <= 1 ? "caution"
    : "negative"
  const totalNegative = negativeDrivers.reduce((sum, d) => sum + Math.abs(d.delta), 0)
  sections.push({
    id: "risk_profile",
    title: "Risk Profile",
    body: sanitiseNarrative(
      negativeDrivers.length === 0
        ? "No modelled drivers exhibit downside pressure in this scenario. " +
          "The valuation profile appears constructive across all attribution dimensions."
        : `${negativeDrivers.length} of ${steps.length} modelled drivers exhibit downside pressure, ` +
          `representing a combined ${narrativeFmtM(totalNegative)} drag on enterprise value. ` +
          (methodAgreement === "weak"
            ? "Cross-method divergence is elevated, suggesting material sensitivity to input assumptions."
            : "Cross-method convergence is supportive of the modelled range." )
    ),
    tone: riskTone as NarrativeSection["tone"],
  })

  // 4. Probability Assessment
  sections.push({
    id: "probability",
    title: "Probability Assessment",
    body: sanitiseNarrative(
      `Based on cross-method analysis, ${narrativePct(probabilities.valueCreate)} of modelled approaches ` +
      `indicate positive value creation. ` +
      `${narrativePct(probabilities.target)} of methods produce valuations at or above the blended estimate. ` +
      `The modelled probability of value loss is ${narrativePct(probabilities.valueLoss)}.`
    ),
    tone: probabilities.valueCreate >= 0.67 ? "positive" : probabilities.valueLoss >= 0.67 ? "negative" : "neutral",
  })

  // 5. Board Recommendation Context
  sections.push({
    id: "board_context",
    title: "Board Context",
    body: sanitiseNarrative(
      direction === "upside"
        ? `The scenario exhibits constructive valuation dynamics. The modelled ${narrativePct(Math.abs(totalDeltaPct))} ` +
          `uplift is concentrated in ${topDriver ? topDriver.label.toLowerCase() : "operational improvements"}, ` +
          `which may warrant strategic prioritisation. All estimates are subject to model assumptions and input sensitivity.`
        : direction === "downside"
        ? `The scenario indicates valuation compression of ${narrativePct(Math.abs(totalDeltaPct))}. ` +
          `Board attention may be warranted on ${topRisk ? topRisk.label.toLowerCase() : "operational headwinds"}. ` +
          `Mitigation pathways could be explored through scenario iteration. All estimates are modelled projections.`
        : `The scenario produces near-neutral valuation impact. The strategic decision does not materially ` +
          `alter the modelled enterprise value within current assumptions.`
    ),
    tone: direction === "upside" ? "positive" : direction === "downside" ? "caution" : "neutral",
  })

  // ── Headline ──
  const headline = direction === "upside"
    ? `Scenario projects ${narrativePct(Math.abs(totalDeltaPct))} valuation uplift to ${narrativeFmtM(scenarioEV)}`
    : direction === "downside"
    ? `Scenario indicates ${narrativePct(Math.abs(totalDeltaPct))} valuation compression to ${narrativeFmtM(scenarioEV)}`
    : `Scenario produces neutral valuation impact at ${narrativeFmtM(scenarioEV)}`

  return {
    headline: sanitiseNarrative(headline),
    sections,
    disclaimer: "All valuations reflect probability-weighted modelled outputs and are subject to input sensitivity. " +
      "These are modelled estimates, not predictions or financial advice.",
  }
}
