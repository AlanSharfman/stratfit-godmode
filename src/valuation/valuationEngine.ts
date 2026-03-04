// src/valuation/valuationEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Deterministic Valuation Engine (Phase V-1)
//
// Pure computation layer. Reads from EngineResults, returns ValuationResults.
// Does NOT modify simulation engine, terrain, or stores.
//
// Methodologies:
//   1) DCF — discounted cash flows + terminal value
//   2) Revenue multiple — growth-derived multiple × revenue
//   3) EBITDA multiple — profitability/risk-derived multiple × EBITDA
//   4) Blended — equal-weight average of the three EV estimates
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineResults } from "@/core/engine/types"
import type { ValuationResults } from "./valuationTypes"

/* ── Constants ── */

/** WACC / discount rate (MVP default) */
const DISCOUNT_RATE = 0.12

/** Long-run terminal growth rate */
const TERMINAL_GROWTH = 0.03

/** Revenue multiple floor / ceiling */
const REV_MULTIPLE_MIN = 1.0
const REV_MULTIPLE_MAX = 20.0

/** EBITDA multiple floor / ceiling */
const EBITDA_MULTIPLE_MIN = 4.0
const EBITDA_MULTIPLE_MAX = 25.0

/* ── Helpers ── */

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Derive a revenue multiple from growth rate (CAGR).
 * Higher growth → higher multiple, capped within institutional range.
 *
 * Heuristic: base 3x + 40× CAGR (e.g. 30% CAGR → 3 + 12 = 15x)
 */
function deriveRevenueMultiple(cagr: number): number {
  const raw = 3 + 40 * Math.max(0, cagr)
  return clamp(raw, REV_MULTIPLE_MIN, REV_MULTIPLE_MAX)
}

/**
 * Derive an EBITDA multiple from profitability margin and risk index.
 * Higher margin + lower risk → higher multiple.
 *
 * Heuristic: base 8x + 20× margin − 10× avgRisk
 */
function deriveEbitdaMultiple(ebitdaMargin: number, avgRiskIndex: number): number {
  const raw = 8 + 20 * Math.max(0, ebitdaMargin) - 10 * clamp(avgRiskIndex, 0, 1)
  return clamp(raw, EBITDA_MULTIPLE_MIN, EBITDA_MULTIPLE_MAX)
}

/* ── Main computation ── */

/**
 * Compute a deterministic valuation from engine results.
 *
 * Uses the canonical EngineResults timeline + summary.
 * Returns structured ValuationResults with DCF, revenue multiple,
 * EBITDA multiple, and blended enterprise value.
 */
export function computeValuation(engineResults: EngineResults): ValuationResults {
  const { timeline, summary } = engineResults

  // Guard: empty timeline → zero valuation
  if (!timeline || timeline.length === 0) {
    return {
      dcf: { enterpriseValue: 0, equityValue: 0, terminalValue: 0 },
      revenueMultiple: { enterpriseValue: 0, multiple: 0 },
      ebitdaMultiple: { enterpriseValue: 0, multiple: 0 },
      blendedValue: 0,
    }
  }

  // ── Extract key metrics ──
  const lastPoint = timeline[timeline.length - 1]
  const firstPoint = timeline[0]

  const finalRevenue = lastPoint.revenue
  const finalEbitda = lastPoint.ebitda
  const terminalEbitda = summary.terminalEbitda ?? finalEbitda
  const cagr = summary.cagr ?? 0
  const avgRiskIndex = summary.avgRiskIndex ?? 0

  // EBITDA margin proxy (final EBITDA / final revenue, guarded)
  const ebitdaMargin = finalRevenue > 0 ? finalEbitda / finalRevenue : 0

  // ── 1) DCF ──
  // Discount each period's EBITDA as a cash-flow proxy
  let dcfPV = 0
  for (let i = 0; i < timeline.length; i++) {
    const cf = timeline[i].ebitda
    // Each timeline index represents one period (annual equivalent)
    // Discount at mid-year convention: period = (i + 0.5) / periodsPerYear
    // For MVP: treat timeline indices as annual steps
    const discountFactor = 1 / Math.pow(1 + DISCOUNT_RATE, i + 1)
    dcfPV += cf * discountFactor
  }

  // Terminal value (Gordon Growth Model on terminal EBITDA)
  const denominator = DISCOUNT_RATE - TERMINAL_GROWTH
  const terminalValue = denominator > 0
    ? (terminalEbitda * (1 + TERMINAL_GROWTH)) / denominator
    : 0

  // Discount terminal value back to present
  const tvDiscountFactor = 1 / Math.pow(1 + DISCOUNT_RATE, timeline.length)
  const pvTerminalValue = terminalValue * tvDiscountFactor

  const dcfEnterpriseValue = Math.max(0, dcfPV + pvTerminalValue)
  // Equity value = EV for MVP (no debt modelling)
  const dcfEquityValue = dcfEnterpriseValue

  // ── 2) Revenue Multiple ──
  const revMultiple = deriveRevenueMultiple(cagr)
  const revEV = Math.max(0, finalRevenue * revMultiple)

  // ── 3) EBITDA Multiple ──
  const ebitdaMultiple = deriveEbitdaMultiple(ebitdaMargin, avgRiskIndex)
  const ebitdaEV = Math.max(0, finalEbitda * ebitdaMultiple)

  // ── 4) Blended Value ──
  const methodCount = 3
  const blendedValue = (dcfEnterpriseValue + revEV + ebitdaEV) / methodCount

  return {
    dcf: {
      enterpriseValue: dcfEnterpriseValue,
      equityValue: dcfEquityValue,
      terminalValue: pvTerminalValue,
    },
    revenueMultiple: {
      enterpriseValue: revEV,
      multiple: revMultiple,
    },
    ebitdaMultiple: {
      enterpriseValue: ebitdaEV,
      multiple: ebitdaMultiple,
    },
    blendedValue,
  }
}
