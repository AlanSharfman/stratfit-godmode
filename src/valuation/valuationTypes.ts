// src/valuation/valuationTypes.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Engine Types (Phase V-1)
//
// Pure type definitions for the deterministic valuation computation layer.
// No UI. No store. Consumed by valuationEngine and valuationSelectors.
// ═══════════════════════════════════════════════════════════════════════════

export interface ValuationResults {
  dcf: {
    enterpriseValue: number
    equityValue: number
    terminalValue: number
  }

  revenueMultiple: {
    enterpriseValue: number
    multiple: number
  }

  ebitdaMultiple: {
    enterpriseValue: number
    multiple: number
  }

  blendedValue: number
}
