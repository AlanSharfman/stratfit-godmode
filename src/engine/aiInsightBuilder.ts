// src/engine/aiInsightBuilder.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — AI Insight Builder
//
// Pure deterministic "strategic CFO" engine.
// Input:  baseline + scenario KPIs, deltas, risk, drivers, decision
// Output: executiveSummary, keyDrivers, riskNarrative, recommendations
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
  recommendations: Recommendation[]
}

export interface KeyDriverInsight {
  label: string
  impact: string
  tone: "positive" | "negative" | "neutral"
}

export interface Recommendation {
  rank: number
  action: string
  rationale: string
  impactLevel: "high" | "medium" | "low"
}

/* ── Builder ── */

export function buildAIInsight(input: AIInsightInput): AIInsightOutput {
  const { decisionQuestion, baselineKpis, scenarioKpis, deltaKpis, riskScore, drivers } = input

  return {
    executiveSummary: buildExecutiveSummary(input),
    keyDrivers: buildKeyDriverInsights(drivers, deltaKpis),
    riskNarrative: buildRiskNarrative(riskScore, scenarioKpis, deltaKpis),
    recommendations: buildRecommendations(scenarioKpis, deltaKpis, riskScore),
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
  if (riskScore >= 78) riskPhrase = "The overall risk posture remains strong."
  else if (riskScore >= 60) riskPhrase = "Risk levels are manageable but warrant monitoring."
  else if (riskScore >= 45) riskPhrase = "Structural risk is elevated and requires active attention."
  else riskPhrase = "The risk profile indicates material stress across multiple dimensions."

  return (
    `Implementing "${decisionClip}" ${revDir} revenue trajectory and ${burnDir} burn intensity, ` +
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
      "Probability of financial stress is low under this scenario. " +
      "The capital base supports multi-quarter execution with margin for deviation. " +
      "Maintain current trajectory while monitoring burn proportionality."
    )
  }

  if (riskScore >= 60) {
    const runwayNote = runway != null && runway < 18
      ? `Runway of ${runway.toFixed(0)} months provides adequate but narrowing headroom. `
      : ""
    return (
      `${runwayNote}Risk is contained but sensitive to execution velocity. ` +
      "A sustained shortfall in revenue growth or unexpected cost escalation could compress optionality. " +
      "Recommend pre-positioning contingency measures within 1–2 quarters."
    )
  }

  if (riskScore >= 45) {
    return (
      "Elevated risk profile detected. Multiple pressure vectors are converging: " +
      `${runway != null ? `runway at ${runway.toFixed(0)} months, ` : ""}` +
      `burn${deltas.burnDelta > 0 ? " escalating" : " compressing"} relative to baseline. ` +
      "Without intervention, probability of financial stress increases materially within 2 quarters."
    )
  }

  return (
    "Critical risk zone. The modelled scenario produces a capital trajectory that does not support " +
    "sustained operations beyond the near term. Immediate corrective action is required across " +
    "burn management, revenue acceleration, or capital injection to avoid structural failure."
  )
}

/* ── Recommendations ── */

function buildRecommendations(
  kpis: SelectedKpis,
  deltas: KpiDeltas,
  riskScore: number,
): Recommendation[] {
  const recs: Recommendation[] = []
  const runway = kpis.runwayMonths

  // 1 — Revenue-side recommendation
  if (deltas.revenueDelta < 0) {
    recs.push({
      rank: 1,
      action: "Accelerate revenue pipeline",
      rationale: "Revenue contraction is the primary drag on forward trajectory. Prioritise pipeline conversion and expansion motions.",
      impactLevel: "high",
    })
  } else if (deltas.growthRateDelta > 0) {
    recs.push({
      rank: 1,
      action: "Sustain growth momentum",
      rationale: "Positive growth acceleration is the most material value driver. Protect the resources fuelling this trajectory.",
      impactLevel: "high",
    })
  } else {
    recs.push({
      rank: 1,
      action: "Invest in growth catalysts",
      rationale: "Revenue trajectory is flat. Identify and fund 1–2 scalable growth levers to shift the compounding curve.",
      impactLevel: "high",
    })
  }

  // 2 — Burn / efficiency recommendation
  if (deltas.burnDelta > 0) {
    recs.push({
      rank: 2,
      action: "Tighten burn discipline",
      rationale: "Escalating burn is compressing runway faster than revenue can compensate. Review discretionary spend and hiring velocity.",
      impactLevel: riskScore < 60 ? "high" : "medium",
    })
  } else {
    recs.push({
      rank: 2,
      action: "Maintain cost structure",
      rationale: "Burn is well managed. Hold current operating envelope and reinvest savings into highest-ROI initiatives.",
      impactLevel: "medium",
    })
  }

  // 3 — Capital / runway recommendation
  if (runway != null && runway < 12) {
    recs.push({
      rank: 3,
      action: "Initiate capital contingency planning",
      rationale: `Runway of ${runway.toFixed(0)} months is below institutional safety threshold. Begin bridge or extension discussions proactively.`,
      impactLevel: "high",
    })
  } else if (riskScore < 50) {
    recs.push({
      rank: 3,
      action: "Stress-test downside scenarios",
      rationale: "Risk profile warrants pessimistic scenario modelling to identify earliest intervention triggers.",
      impactLevel: "medium",
    })
  } else {
    recs.push({
      rank: 3,
      action: "Optimise capital deployment",
      rationale: "Capital position supports strategic investment. Evaluate highest-leverage deployment opportunities.",
      impactLevel: "low",
    })
  }

  return recs
}
