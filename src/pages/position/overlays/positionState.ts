import type { BaselineV1 } from "@/onboard/baseline"
import { computeBaselineCompleteness } from "@/logic/confidence/baselineCompleteness"

export type StatusTone = "strong" | "watch" | "risk"
export type PositionState = "Stable" | "Growth" | "Pressured" | "Fragile"

export interface PositionKpis {
  arr: number
  burnMonthly: number
  runwayMonths: number
  ebitdaMonthly: number
  riskIndex: number
}

export interface DiagnosticCardVM {
  key: "liquidity" | "growthQuality" | "costPressure" | "capitalEfficiency"
  title: string
  tone: StatusTone
  text: string
  metricLine: string
}

export interface PositionViewModel {
  kpis: PositionKpis
  state: PositionState
  stateTone: StatusTone
  bullets: string[]
  confidenceBand: "Low" | "Medium" | "High"
  confidencePct: number
  diagnostics: DiagnosticCardVM[]
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)) }
function safeNum(n: unknown, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback
}

function runwayMonths(b: BaselineV1): number {
  const burn = safeNum(b.financial.monthlyBurn, 0)
  const cash = safeNum(b.financial.cashOnHand, 0)
  if (burn <= 0) return 999
  return cash / burn
}

function ebitdaMonthlyApprox(b: BaselineV1): number {
  const arr = safeNum(b.financial.arr, 0)
  const gm = clamp(safeNum(b.financial.grossMarginPct, 0) / 100, 0, 2)
  const grossProfitMonthly = (arr / 12) * gm
  const payroll = safeNum(b.financial.payroll, 0)
  const sm = safeNum(b.financial.salesMarketingSpend, 0)
  const rd = safeNum(b.financial.rdSpend, 0)
  const ga = safeNum(b.financial.gaSpend, 0)
  return grossProfitMonthly - (payroll + sm + rd + ga)
}

function riskFromRunway(runway: number): number {
  if (!Number.isFinite(runway)) return 60
  if (runway >= 24) return 85
  if (runway >= 18) return 78
  if (runway >= 12) return 68
  if (runway >= 6)  return 52
  return 34
}

function confidenceFromCompleteness01(c01: number): { band: "Low" | "Medium" | "High"; pct: number } {
  const pct = clamp(Math.round(c01 * 100), 0, 100)
  if (c01 >= 0.85) return { band: "High", pct }
  if (c01 >= 0.65) return { band: "Medium", pct }
  return { band: "Low", pct }
}

function toneFromRiskIndex(riskIndex: number): StatusTone {
  if (riskIndex >= 75) return "strong"
  if (riskIndex >= 55) return "watch"
  return "risk"
}

function stateFromRunwayAndGrowth(runway: number, growthPct: number): PositionState {
  if (runway < 6)  return "Fragile"
  if (runway < 12) return "Pressured"
  if (growthPct >= 25) return "Growth"
  return "Stable"
}

function bulletsForState(b: BaselineV1, k: PositionKpis): string[] {
  const growth = safeNum(b.financial.growthRatePct, 0)
  const gm     = safeNum(b.financial.grossMarginPct, 0)
  const churn  = safeNum(b.operating.churnPct, 0)
  const nrr    = safeNum(b.financial.nrrPct, 0)
  const bullets: string[] = []
  if (k.runwayMonths < 6)       bullets.push("Runway is compressed — liquidity actions required.")
  else if (k.runwayMonths < 12) bullets.push("Runway is under 12 months — capital timing becomes critical.")
  else                          bullets.push("Liquidity is currently supportive of execution horizon.")
  if (growth >= 25 && nrr >= 100) bullets.push("Growth is strong with expansion support (NRR ≥ 100%).")
  else if (growth >= 20)          bullets.push("Growth is positive — monitor retention and efficiency.")
  else                            bullets.push("Growth is modest — focus on core engine strengthening.")
  if (gm < 50)      bullets.push("Gross margin is constrained — pricing / COGS leverage likely.")
  else              bullets.push("Gross margin is within workable band for scaling.")
  if (churn >= 5)   bullets.push("Churn is elevated — retention risk signal present.")
  else              bullets.push("Churn is within controlled range.")
  return bullets.slice(0, 3)
}

function buildDiagnostics(b: BaselineV1, k: PositionKpis): DiagnosticCardVM[] {
  const growth = safeNum(b.financial.growthRatePct, 0)
  const gm     = safeNum(b.financial.grossMarginPct, 0)
  const churn  = safeNum(b.operating.churnPct, 0)
  const nrr    = safeNum(b.financial.nrrPct, 0)

  const liqTone: StatusTone = k.runwayMonths >= 18 ? "strong" : k.runwayMonths >= 12 ? "watch" : "risk"
  const liquidity: DiagnosticCardVM = {
    key: "liquidity", title: "Liquidity Health", tone: liqTone,
    text: k.runwayMonths >= 18
      ? "Runway supports strategic execution without immediate capital pressure."
      : k.runwayMonths >= 12
        ? "Runway is tightening — funding window discipline advised."
        : "Runway is short — prioritise liquidity actions and de-risk timeline.",
    metricLine: `Runway: ${Number.isFinite(k.runwayMonths) ? k.runwayMonths.toFixed(1) : "—"} months`,
  }

  const growthTone: StatusTone = growth >= 25 && nrr >= 100 ? "strong" : growth >= 15 ? "watch" : "risk"
  const growthQuality: DiagnosticCardVM = {
    key: "growthQuality", title: "Growth Quality", tone: growthTone,
    text: growth >= 25 && nrr >= 100
      ? "Expansion-led growth signal present; scaling posture is credible."
      : growth >= 15
        ? "Growth present; ensure retention + margin remain supportive."
        : "Growth is soft; strengthen acquisition and retention drivers.",
    metricLine: `Growth: ${growth.toFixed(1)}% · NRR: ${nrr.toFixed(0)}%`,
  }

  const burn = safeNum(b.financial.monthlyBurn, 0)
  const payroll = safeNum(b.financial.payroll, 0)
  const payrollShare = burn > 0 ? clamp(payroll / burn, 0, 2) : 0
  const costTone: StatusTone = payrollShare <= 0.45 ? "strong" : payrollShare <= 0.65 ? "watch" : "risk"
  const costPressure: DiagnosticCardVM = {
    key: "costPressure", title: "Cost Pressure", tone: costTone,
    text: payrollShare <= 0.45
      ? "Cost base appears flexible relative to burn profile."
      : payrollShare <= 0.65
        ? "Cost structure is becoming less flexible — monitor hiring and fixed commitments."
        : "Cost structure is rigid — high fixed load relative to burn.",
    metricLine: `Payroll/Burn: ${(payrollShare * 100).toFixed(0)}% · Burn: ${burn.toFixed(0)}/mo`,
  }

  const cac     = safeNum(b.customerEngine.cac, 0)
  const ltv     = safeNum(b.customerEngine.ltv, 0)
  const payback = safeNum(b.customerEngine.paybackPeriodMonths, 0)
  const ltvCac  = cac > 0 ? ltv / cac : 0
  const capTone: StatusTone =
    (payback > 0 && payback <= 12 && ltvCac >= 3) ? "strong" :
    (payback > 0 && payback <= 18 && ltvCac >= 2) ? "watch" : "risk"
  const capitalEfficiency: DiagnosticCardVM = {
    key: "capitalEfficiency", title: "Capital Efficiency", tone: capTone,
    text: capTone === "strong"
      ? "Unit economics support scaling; reinvestment posture credible."
      : capTone === "watch"
        ? "Economics workable; improve payback and retention leverage."
        : "Efficiency is strained; tighten acquisition spend and improve conversion/retention.",
    metricLine: `Payback: ${payback ? payback.toFixed(0) : "—"}m · LTV/CAC: ${ltvCac ? ltvCac.toFixed(1) : "—"}`,
  }

  if (gm < 45 && churn >= 5 && growthQuality.tone !== "strong") {
    growthQuality.tone = "risk"
    growthQuality.text = "Growth signal is weak under margin + retention pressure."
  }

  return [liquidity, growthQuality, costPressure, capitalEfficiency]
}

export function buildPositionViewModel(
  baseline: BaselineV1,
  opts?: { riskIndexFromEngine?: number | null },
): PositionViewModel {
  const runway   = runwayMonths(baseline)
  const arr      = safeNum(baseline.financial.arr, 0)
  const burn     = safeNum(baseline.financial.monthlyBurn, 0)
  const ebitda   = ebitdaMonthlyApprox(baseline)
  const growthPct = safeNum(baseline.financial.growthRatePct, 0)
  const riskIndex = typeof opts?.riskIndexFromEngine === "number"
    ? clamp(opts.riskIndexFromEngine, 0, 100)
    : riskFromRunway(runway)
  const completeness = computeBaselineCompleteness(baseline)
  const conf = confidenceFromCompleteness01(completeness.completeness01)
  const kpis: PositionKpis = { arr, burnMonthly: burn, runwayMonths: runway, ebitdaMonthly: ebitda, riskIndex }
  return {
    kpis,
    state:           stateFromRunwayAndGrowth(runway, growthPct),
    stateTone:       toneFromRiskIndex(riskIndex),
    bullets:         bulletsForState(baseline, kpis),
    confidenceBand:  conf.band,
    confidencePct:   conf.pct,
    diagnostics:     buildDiagnostics(baseline, kpis),
  }
}
