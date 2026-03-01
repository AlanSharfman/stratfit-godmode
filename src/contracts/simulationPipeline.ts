// src/contracts/simulationPipeline.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — GOD MODE WIRING v1: Canonical Simulation Pipeline Contract
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  WIRING MAP                                                            │
// │                                                                        │
// │  Initiate (BaselineInputs)                                             │
// │      ↓  InputsStore.setBaseline()                                      │
// │  Decision (DecisionInputs)                                             │
// │      ↓  InputsStore.setDecision()                                      │
// │  buildScenarioConfig(baseline, decision) → ScenarioConfig              │
// │      ↓  configHash = stableHash(scenarioConfig)                        │
// │  SimulationStore.runScenario(scenarioConfig)                           │
// │      ↓  runId generated, status → running                             │
// │  runSimulation(scenarioConfig) → EngineResults                         │
// │      ↓  resultsHash = stableHash(engineResults)                        │
// │      ↓  status → completed, lastCompletedRunId set                     │
// │  Selectors (TRUTH SURFACE — only read interface for UI):               │
// │      selectKpis(engineResults)                                         │
// │      selectProbabilitySignals(engineResults)                           │
// │      selectDrivers(baselineKpis, scenarioKpis, deltas)                 │
// │      selectRiskSummary(engineResults)                                  │
// │      selectValuationSummary(kpis)                                      │
// │      selectNarrativeBlocks(signals, drivers, valuation, risk)          │
// │  ↓                                                                     │
// │  UI (KPI Rail, Terrain, Intelligence Panel, Command Centre)            │
// │                                                                        │
// │  CI GUARD: UI must NOT read engineResults directly.                    │
// │  All simulation data flows through selectors.                          │
// │  simulationResults → selectors → UI                                    │
// │  Violation = architecture break.                                       │
// └─────────────────────────────────────────────────────────────────────────┘
//
// No stores. No side effects. Pure types + deterministic selectors.
// ═══════════════════════════════════════════════════════════════════════════

import type { SelectedKpis } from "@/selectors/kpiSelectors"
import type { DriverSignal } from "@/selectors/driverSelectors"
import type { ProbabilitySignal as RawProbabilitySignal } from "@/selectors/probabilitySelectors"
import type { BaselineInputs } from "@/state/baselineStore"

// ── Re-export for barrel convenience ──
export type { SelectedKpis, DriverSignal, RawProbabilitySignal }

// ═════════════════════════════════════════════════════════════════
// CANONICAL INPUT CONTRACT (Initiate → Simulation Engine)
// ═════════════════════════════════════════════════════════════════

/**
 * Decision deltas — optional overrides applied to baseline inputs
 * during scenario simulation. Produced by the Decision page.
 */
export interface DecisionDeltas {
  /** Free-text decision query */
  decision: string
  /** Deterministic intent classification */
  intentType?: string
  intentLabel?: string
}

/**
 * ScenarioConfig — the ONLY input consumed by the simulation engine.
 * Combines baseline snapshot + decision deltas + engine parameters.
 * Built by phase1ScenarioStore.runSimulation().
 */
export interface ScenarioConfig {
  /** Baseline financial snapshot */
  baseline: BaselineInputs
  /** Decision text + intent classification */
  decision: DecisionDeltas
  /** Projection horizon */
  horizonMonths: number
  /** Deterministic seed (derived from decision hash) */
  seed: number
}

// ═════════════════════════════════════════════════════════════════
// VALUATION SUMMARY (v1 — ARR × revenue multiple, deterministic)
// ═════════════════════════════════════════════════════════════════

export interface ValuationSummary {
  /** Enterprise value (P50 heuristic) */
  ev: number
  /** Revenue multiple used */
  multiple: number
  /** Probability band label for UI */
  probabilityBand: string
  /** Methodology label */
  method: string
  /** Formatted EV range string (P25–P75 estimate) */
  rangeLabel: string
}

/**
 * Deterministic valuation selector (v1).
 *
 * EV = ARR × revenueMultiple
 * Multiple is bounded by growth + risk signals.
 * Returns null when ARR is zero (no revenue to value).
 */
export function selectValuationSummary(
  kpis: SelectedKpis | null,
  riskScore: number,
): ValuationSummary | null {
  if (!kpis || kpis.arr <= 0) return null

  const growth = kpis.growthRate
  // Base multiple = 3x, scales with growth (capped 1x–20x)
  let multiple = 3 + (growth * 100) / 10
  // Risk discount: lower risk score → lower multiple
  if (riskScore < 50) multiple *= 0.7
  else if (riskScore < 65) multiple *= 0.85
  multiple = Math.max(1, Math.min(20, multiple))

  const ev = kpis.arr * multiple

  // Probability bands: ±30% asymmetric spread for P25–P75
  const p25 = ev * 0.7
  const p75 = ev * 1.3

  const probabilityBand =
    riskScore >= 75 ? "Likely (72%+)"
    : riskScore >= 55 ? "Mixed (45–72%)"
    : "Unlikely (<45%)"

  return {
    ev,
    multiple: Math.round(multiple * 10) / 10,
    probabilityBand,
    method: "Revenue multiple (v1)",
    rangeLabel: `${fmtValuation(p25)} – ${fmtValuation(p75)}`,
  }
}

// ═════════════════════════════════════════════════════════════════
// RISK SUMMARY (wraps selectRiskScore with structured output)
// ═════════════════════════════════════════════════════════════════

export interface RiskSummary {
  /** 0–100 risk score (higher = healthier) */
  riskScore: number
  /** Stress probability: 0–1 (inverse of survival) */
  stressProbability: number
  /** Human-readable risk band */
  riskBand: string
  /** Probability percentage label */
  probabilityLabel: string
}

export function selectRiskSummary(riskScore: number): RiskSummary {
  const stressProbability = Math.max(0, Math.min(1, 1 - riskScore / 100))

  const riskBand =
    riskScore >= 75 ? "Stable"
    : riskScore >= 55 ? "Watch"
    : riskScore >= 40 ? "Elevated"
    : "Critical"

  const probabilityLabel = `${riskScore}% survival probability`

  return { riskScore, stressProbability, riskBand, probabilityLabel }
}

// ═════════════════════════════════════════════════════════════════
// NARRATIVE BLOCKS (composed from selectors, no freehand text)
// ═════════════════════════════════════════════════════════════════

export interface NarrativeBlock {
  section: "probability_outlook" | "key_drivers" | "valuation_signal" | "action_options"
  title: string
  body: string
  probabilityPct: number | null
}

/**
 * Compose narrative blocks purely from selector outputs.
 * No freehand text — every sentence maps to a signal.
 *
 * Terminology: uses "Probability Outlook", "Likelihood Signal",
 * "Scenario Probability" — never "recommendation" or "advice".
 */
export function selectNarrativeBlocks(
  signals: RawProbabilitySignal[],
  drivers: DriverSignal[],
  valuation: ValuationSummary | null,
  risk: RiskSummary,
): NarrativeBlock[] {
  const blocks: NarrativeBlock[] = []

  // 1 — Probability Outlook
  blocks.push({
    section: "probability_outlook",
    title: "Probability Outlook",
    body: `Survival probability is ${risk.riskScore}% (${risk.riskBand}). ` +
      `Stress probability: ${(risk.stressProbability * 100).toFixed(0)}%. ` +
      signals
        .filter((s) => s.tone === "negative")
        .map((s) => `${s.label}: ${s.value} (${s.tone})`)
        .join(". ") || "No material stress signals detected.",
    probabilityPct: risk.riskScore,
  })

  // 2 — Key Drivers
  const driverLines = drivers.slice(0, 3).map((d) => {
    const pct = d.pctDelta != null ? ` (${d.pctDelta > 0 ? "+" : ""}${d.pctDelta.toFixed(1)}%)` : ""
    return `${d.label}${pct}: ${d.direction === "up" ? "strengthening" : d.direction === "down" ? "contracting" : "stable"}`
  })
  blocks.push({
    section: "key_drivers",
    title: "Key Drivers",
    body: driverLines.join(". ") + "." || "No material driver deltas detected.",
    probabilityPct: null,
  })

  // 3 — Valuation Signal
  if (valuation) {
    blocks.push({
      section: "valuation_signal",
      title: "Indicative Valuation (v1)",
      body: `Enterprise value: ${fmtValuation(valuation.ev)} at ${valuation.multiple}x revenue multiple. ` +
        `Range (P25–P75): ${valuation.rangeLabel}. ` +
        `Probability band: ${valuation.probabilityBand}. ` +
        `Method: ${valuation.method}.`,
      probabilityPct: null,
    })
  }

  // 4 — Action Options (probability-framed, never "recommendations")
  const actions: string[] = []
  if (risk.riskScore < 50) {
    actions.push(`Liquidity action: ${risk.riskScore}% probability that current trajectory sustains operations beyond near-term`)
  }
  const negSignals = signals.filter((s) => s.tone === "negative")
  for (const s of negSignals.slice(0, 2)) {
    actions.push(`${s.label} option: scenario indicates ${s.value} — monitoring or intervention may shift trajectory`)
  }
  if (actions.length === 0) {
    actions.push("No material action options indicated by current probability signals")
  }
  blocks.push({
    section: "action_options",
    title: "Probability-Based Action Options",
    body: actions.join(". ") + ".",
    probabilityPct: null,
  })

  return blocks
}

// ═════════════════════════════════════════════════════════════════
// PROBABILITY BAND HELPERS (replaces confidence low/med/high)
// ═════════════════════════════════════════════════════════════════

export type ProbabilityBand = "Likely" | "Mixed" | "Unlikely"

export function probabilityBandFromPct(pct: number): ProbabilityBand {
  if (pct >= 72) return "Likely"
  if (pct >= 45) return "Mixed"
  return "Unlikely"
}

export function probabilityBandLabel(pct: number): string {
  const band = probabilityBandFromPct(pct)
  return `Probability: ${pct}% (${band})`
}

// ═════════════════════════════════════════════════════════════════
// STABLE HASH (deterministic, for config/results traceability)
// ═════════════════════════════════════════════════════════════════

/**
 * DJB2 hash of a sorted-JSON-serialized object.
 * Deterministic: same input always produces same output.
 * NOT cryptographic — for traceability/debugging only.
 */
export function stableHash(obj: unknown): string {
  const s = JSON.stringify(obj, Object.keys(obj as object).sort())
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

// ── Formatting helpers ──

function fmtValuation(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n)}`
}
