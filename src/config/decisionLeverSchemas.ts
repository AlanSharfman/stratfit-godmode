// src/config/decisionLeverSchemas.ts
// ═══════════════════════════════════════════════════════════════
// Deterministic lever schema mapping per DecisionIntentType.
// Feeds into simulation engine via applyLeversToBaseline().
// ═══════════════════════════════════════════════════════════════

import type { DecisionIntentType } from "@/state/phase1ScenarioStore"
import type { LeverValues } from "@/domain/decision/LeverValues"

export interface LeverSchema {
  id: string
  label: string
  unit: string      // display suffix: "%", "mo", "", "$M"
  min: number
  max: number
  step: number
  default: number
}

export const decisionLeverSchemas: Record<DecisionIntentType, LeverSchema[]> = {
  hiring: [
    { id: "headcount",   label: "Headcount change",          unit: "",   min: -5,  max: 20, step: 1, default: 0 },
    { id: "salaryBand",  label: "Salary band impact",        unit: "%",  min: -20, max: 20, step: 1, default: 0 },
    { id: "rampTime",    label: "Ramp time",                  unit: "mo", min: 0,   max: 12, step: 1, default: 3 },
    { id: "revenueHead", label: "Revenue per head",           unit: "%",  min: -10, max: 30, step: 1, default: 0 },
  ],
  pricing: [
    { id: "priceChange",      label: "Price change",          unit: "%",  min: -30, max: 50,  step: 1, default: 0 },
    { id: "churnSensitivity", label: "Churn sensitivity",     unit: "%",  min: 0,   max: 100, step: 5, default: 20 },
    { id: "volumeImpact",     label: "Volume impact",         unit: "%",  min: -20, max: 20,  step: 1, default: 0 },
    { id: "rolloutTimeline",  label: "Rollout timeline",      unit: "mo", min: 1,   max: 12,  step: 1, default: 3 },
  ],
  cost_reduction: [
    { id: "opexReduction", label: "Opex reduction",           unit: "%",  min: 0,  max: 40, step: 1, default: 10 },
    { id: "headcountCut",  label: "Headcount change",         unit: "",   min: -20, max: 0, step: 1, default: 0 },
    { id: "efficiencyGain", label: "Efficiency gain",         unit: "%",  min: 0,  max: 30, step: 1, default: 5 },
    { id: "timeline",      label: "Implementation timeline",  unit: "mo", min: 1,  max: 12, step: 1, default: 3 },
  ],
  fundraising: [
    { id: "capitalRaise",  label: "Capital raised",           unit: "$M", min: 0,  max: 50, step: 1, default: 10 },
    { id: "preMoneyVal",   label: "Pre-money valuation",      unit: "$M", min: 1,  max: 200, step: 1, default: 20 },
    { id: "useOfProceeds", label: "Growth allocation",        unit: "%",  min: 0,  max: 100, step: 5, default: 50 },
    { id: "closeTiming",   label: "Close timing",             unit: "mo", min: 1,  max: 18, step: 1, default: 6 },
  ],
  growth_investment: [
    { id: "growthSpend",   label: "Growth spend increase",    unit: "%",  min: 0,  max: 50, step: 1, default: 15 },
    { id: "growthMulti",   label: "Growth multiplier",        unit: "x",  min: 1,  max: 5,  step: 0.1, default: 1.5 },
    { id: "roiTiming",     label: "ROI timing",               unit: "mo", min: 1,  max: 24, step: 1, default: 12 },
    { id: "channelMix",    label: "Channel concentration",    unit: "%",  min: 0,  max: 100, step: 5, default: 50 },
  ],
  other: [],
}

/** Build default lever values for a given intent type */
export function defaultLeverValues(intent: DecisionIntentType): LeverValues {
  const schema = decisionLeverSchemas[intent]
  const values: LeverValues = {}
  for (const lever of schema) {
    values[lever.id] = lever.default
  }
  return values
}

/** Build default lever values across ALL intent types (global defaults) */
export function getAllDefaultLeverValues(): LeverValues {
  const values: LeverValues = {}
  for (const levers of Object.values(decisionLeverSchemas)) {
    for (const lever of levers) {
      if (!(lever.id in values)) {
        values[lever.id] = lever.default
      }
    }
  }
  return values
}
