// src/engine/aiInsightBuilder.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — AI Insight Builder
//
// Pure deterministic "strategic CFO" engine.
// Input:  baseline + scenario KPIs, deltas, risk, drivers, decision
// Output: executiveSummary, keyDrivers, riskNarrative, probabilitySignals
//
// No OpenAI calls. No side effects. Fully offline.
// ═══════════════════════════════════════════════════════════════════════════

import type { SelectedKpis, KpiDeltas } from "@/selectors/kpiSelectors"
import type { DriverSignal } from "@/selectors/driverSelectors"

/* ── Input contract ── */

export interface AIInsightInput {
  decisionQuestion: string
  baselineKpis: SelectedKpis
  scenarioKpis: SelectedKpis
  deltaKpis: KpiDeltas
  riskScore: number
  drivers: DriverSignal[]
}

/* ── Output contract ── */

export interface AIInsightOutput {
  executiveSummary: string
  keyDrivers: KeyDriverInsight[]
  riskNarrative: string
  probabilitySignals: ProbabilitySignal[]
}

export interface KeyDriverInsight {
  label: string
  impact: string
  tone: "positive" | "negative" | "neutral"
}

export interface ProbabilitySignal {
  rank: number
  title: string
  probability: number
  interpretation: string
  impactLevel: "high" | "medium" | "low"
}

/* ── Builder ── */

export function buildAIInsight(input: AIInsightInput): AIInsightOutput {
  const { decisionQuestion, baselineKpis, scenarioKpis, deltaKpis, riskScore, drivers } = input

  return {
    executiveSummary: buildExecutiveSummary(input),
    keyDrivers: buildKeyDriverInsights(drivers, deltaKpis),
    riskNarrative: buildRiskNarrative(riskScore, scenarioKpis, deltaKpis),
    probabilitySignals: buildProbabilitySignals(scenarioKpis, deltaKpis, riskScore),
  }
}

/* ── Executive Summary ── */

function buildExecutiveSummary(input: AIInsightInput): string {
  const { decisionQuestion, scenarioKpis, deltaKpis, riskScore } = input
  const decisionClip = decisionQuestion.length > 80
    ? decisionQuestion.slice(0, 77) + "..."
    : decisionQuestion

  const runwayStr = scenarioKpis.runwayMonths != null
    ? `${scenarioKpis.runwayMonths.toFixed(0)} months of runway`
    : "unconstrained runway"

  const revDir = deltaKpis.revenueDelta > 0 ? "accelerates" : deltaKpis.revenueDelta < 0 ? "contracts" : "maintains"
  const burnDir = deltaKpis.burnDelta > 0 ? "increases" : deltaKpis.burnDelta < 0 ? "improves" : "holds steady on"

  // Risk tone
  let riskPhrase: string
  if (riskScore >= 78) riskPhrase = "Simulation indicates the overall survival probability remains strong."
  else if (riskScore >= 60) riskPhrase = "Probability signals show manageable risk levels that warrant monitoring."
  else if (riskScore >= 45) riskPhrase = "Scenario likelihood suggests elevated structural risk requiring active attention."
  else riskPhrase = "Simulation indicates material stress across multiple dimensions."

  return (
    `Simulation indicates that implementing "${decisionClip}" ${revDir} revenue trajectory and ${burnDir} burn intensity, ` +
    `resulting in ${runwayStr} under the modelled scenario. ${riskPhrase}`
  )
}

/* ── Key Drivers ── */

function buildKeyDriverInsights(drivers: DriverSignal[], deltas: KpiDeltas): KeyDriverInsight[] {
  if (drivers.length === 0) {
    // Fallback when no measurable deltas
    return [
      { label: "Revenue momentum", impact: "No material change detected", tone: "neutral" },
      { label: "Burn trajectory", impact: "Stable relative to baseline", tone: "neutral" },
      { label: "Capital position", impact: "Unchanged", tone: "neutral" },
    ]
  }

  return drivers.slice(0, 3).map((d) => {
    const pct = d.pctDelta != null ? `${d.pctDelta > 0 ? "+" : ""}${d.pctDelta.toFixed(1)}%` : ""
    let impact: string
    let tone: "positive" | "negative" | "neutral"

    // Determine tone based on key + direction
    if (d.key === "burn") {
      // For burn, "down" is positive (lower costs)
      tone = d.direction === "up" ? "positive" : d.direction === "down" ? "negative" : "neutral"
      // But wait — the driver direction is already inverted for burn (dir(-delta))
      // So "up" means burn decreased, "down" means burn increased
      impact = d.direction === "up"
        ? `Cost discipline improving ${pct}`
        : d.direction === "down"
          ? `Burn increasing ${pct} — margin pressure`
          : "Burn rate holding steady"
    } else {
      tone = d.direction === "up" ? "positive" : d.direction === "down" ? "negative" : "neutral"
      impact = d.direction === "up"
        ? `${d.label} strengthening ${pct}`
        : d.direction === "down"
          ? `${d.label} contracting ${pct}`
          : `${d.label} holding steady`
    }

    return { label: d.label, impact, tone }
  })
}

/* ── Risk Narrative ── */

function buildRiskNarrative(
  riskScore: number,
  kpis: SelectedKpis,
  deltas: KpiDeltas,
): string {
  const runway = kpis.runwayMonths

  if (riskScore >= 78) {
    return (
      "Simulation indicates low probability of financial stress under this scenario. " +
      "The capital base supports multi-quarter execution with margin for deviation. " +
      "Current trajectory sustains burn proportionality."
    )
  }

  if (riskScore >= 60) {
    const runwayNote = runway != null && runway < 18
      ? `Runway of ${runway.toFixed(0)} months provides adequate but narrowing headroom. `
      : ""
    return (
      `${runwayNote}Probability signals show contained risk, sensitive to execution velocity. ` +
      "A sustained shortfall in revenue growth or unexpected cost escalation could compress optionality. " +
      "Pre-positioning contingency measures within 1–2 quarters is indicated."
    )
  }

  if (riskScore >= 45) {
    return (
      "Scenario likelihood suggests an elevated risk profile. Multiple pressure vectors are converging: " +
      `${runway != null ? `runway at ${runway.toFixed(0)} months, ` : ""}` +
      `burn${deltas.burnDelta > 0 ? " escalating" : " compressing"} relative to baseline. ` +
      "Without intervention, probability of financial stress increases materially within 2 quarters."
    )
  }

  return (
    "Simulation indicates a critical risk zone. The modelled scenario produces a capital trajectory that does not support " +
    "sustained operations beyond the near term. Immediate corrective action is required across " +
    "burn management, revenue acceleration, or capital injection to avoid structural failure."
  )
}

/* ── Probability Signals ── */

function buildProbabilitySignals(
  kpis: SelectedKpis,
  deltas: KpiDeltas,
  riskScore: number,
): ProbabilitySignal[] {
  const signals: ProbabilitySignal[] = []
  const runway = kpis.runwayMonths

  // 1 — Revenue-side signal
  if (deltas.revenueDelta < 0) {
    signals.push({
      rank: 1,
      title: "Revenue trajectory contraction",
      probability: Math.max(5, Math.min(95, 50 - Math.round(deltas.revenueDelta / 1000))),
      interpretation: "Revenue contraction is the primary drag on forward trajectory. Pipeline conversion and expansion motions are indicated.",
      impactLevel: "high",
    })
  } else if (deltas.growthRateDelta > 0) {
    signals.push({
      rank: 1,
      title: "Growth momentum sustaining",
      probability: Math.max(5, Math.min(95, 50 + Math.round(deltas.growthRateDelta * 10))),
      interpretation: "Positive growth acceleration is the most material value driver. Scenario likelihood suggests protecting the resources fuelling this trajectory.",
      impactLevel: "high",
    })
  } else {
    signals.push({
      rank: 1,
      title: "Revenue trajectory flat",
      probability: 45,
      interpretation: "Revenue trajectory is flat. Simulation indicates 1–2 scalable growth levers are needed to shift the compounding curve.",
      impactLevel: "high",
    })
  }

  // 2 — Burn / efficiency signal
  if (deltas.burnDelta > 0) {
    signals.push({
      rank: 2,
      title: "Burn escalation pressure",
      probability: Math.max(5, Math.min(95, 40 + Math.round(deltas.burnDelta / 500))),
      interpretation: "Escalating burn is compressing runway faster than revenue can compensate. Discretionary spend and hiring velocity warrant review.",
      impactLevel: riskScore < 60 ? "high" : "medium",
    })
  } else {
    signals.push({
      rank: 2,
      title: "Cost structure stability",
      probability: Math.max(5, Math.min(95, 70 + Math.round(riskScore / 10))),
      interpretation: "Burn is well managed. Current operating envelope holds; savings reinvestment into highest-ROI initiatives is indicated.",
      impactLevel: "medium",
    })
  }

  // 3 — Capital / runway signal
  if (runway != null && runway < 12) {
    signals.push({
      rank: 3,
      title: "Capital contingency threshold",
      probability: Math.max(5, Math.min(95, 30 + Math.round(runway * 3))),
      interpretation: `Runway of ${runway.toFixed(0)} months is below institutional safety threshold. Probability signals show bridge or extension discussions are warranted.`,
      impactLevel: "high",
    })
  } else if (riskScore < 50) {
    signals.push({
      rank: 3,
      title: "Downside stress exposure",
      probability: Math.max(5, Math.min(95, riskScore)),
      interpretation: "Scenario likelihood suggests pessimistic scenario modelling to identify earliest intervention triggers.",
      impactLevel: "medium",
    })
  } else {
    signals.push({
      rank: 3,
      title: "Capital deployment optionality",
      probability: Math.max(5, Math.min(95, 60 + Math.round(riskScore / 5))),
      interpretation: "Capital position supports strategic investment. Highest-leverage deployment opportunities are indicated.",
      impactLevel: "low",
    })
  }

  return signals
}
