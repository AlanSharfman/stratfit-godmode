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
  /** constraint = core decision input (Decision + Studio), tuning = sensitivity/assumption (Studio only) */
  tier: "constraint" | "tuning"
  /** Optional impact dimension chips for UI presentation */
  impactChips?: ("Revenue" | "Cost" | "Capital" | "Risk" | "Time" | "Margin" | "Runway" | "Execution")[]
  /** Optional summary template for scenario strip rendering */
  summaryTemplate?: string
}

export const decisionLeverSchemas: Record<DecisionIntentType, LeverSchema[]> = {
  hiring: [
    { id: "headcount",   label: "Headcount change",          unit: "",   min: -5,  max: 20, step: 1, default: 0,  tier: "constraint" },
    { id: "salaryBand",  label: "Salary band impact",        unit: "%",  min: -20, max: 20, step: 1, default: 0,  tier: "tuning" },
    { id: "rampTime",    label: "Ramp time",                  unit: "mo", min: 0,   max: 12, step: 1, default: 3,  tier: "tuning" },
    { id: "revenueHead", label: "Revenue per head",           unit: "%",  min: -10, max: 30, step: 1, default: 0,  tier: "tuning" },
  ],
  pricing: [
    { id: "priceChange",      label: "Price change",          unit: "%",  min: -30, max: 50,  step: 1, default: 0,  tier: "constraint" },
    { id: "churnSensitivity", label: "Churn sensitivity",     unit: "%",  min: 0,   max: 100, step: 5, default: 20, tier: "tuning" },
    { id: "volumeImpact",     label: "Volume impact",         unit: "%",  min: -20, max: 20,  step: 1, default: 0,  tier: "tuning" },
    { id: "rolloutTimeline",  label: "Rollout timeline",      unit: "mo", min: 1,   max: 12,  step: 1, default: 3,  tier: "tuning" },
  ],
  cost_reduction: [
    { id: "opexReduction", label: "Opex reduction",           unit: "%",  min: 0,  max: 40, step: 1, default: 10, tier: "constraint" },
    { id: "headcountCut",  label: "Headcount change",         unit: "",   min: -20, max: 0, step: 1, default: 0,  tier: "constraint" },
    { id: "efficiencyGain", label: "Efficiency gain",         unit: "%",  min: 0,  max: 30, step: 1, default: 5,  tier: "tuning" },
    { id: "timeline",      label: "Implementation timeline",  unit: "mo", min: 1,  max: 12, step: 1, default: 3,  tier: "tuning" },
  ],
  fundraising: [
    { id: "capitalRaise",  label: "Capital raised",           unit: "$M", min: 0,  max: 50, step: 1, default: 10, tier: "constraint" },
    { id: "preMoneyVal",   label: "Pre-money valuation",      unit: "$M", min: 1,  max: 200, step: 1, default: 20, tier: "constraint" },
    { id: "useOfProceeds", label: "Growth allocation",        unit: "%",  min: 0,  max: 100, step: 5, default: 50, tier: "tuning" },
    { id: "closeTiming",   label: "Close timing",             unit: "mo", min: 1,  max: 18, step: 1, default: 6,  tier: "tuning" },
  ],
  growth_investment: [
    { id: "growthSpend",   label: "Growth spend increase",    unit: "%",  min: 0,  max: 50, step: 1, default: 15, tier: "constraint" },
    { id: "growthMulti",   label: "Growth multiplier",        unit: "x",  min: 1,  max: 5,  step: 0.1, default: 1.5, tier: "tuning" },
    { id: "roiTiming",     label: "ROI timing",               unit: "mo", min: 1,  max: 24, step: 1, default: 12, tier: "tuning" },
    { id: "channelMix",    label: "Channel concentration",    unit: "%",  min: 0,  max: 100, step: 5, default: 50, tier: "tuning" },
  ],
  acquisition: [
    { id: "acquisitionPrice",  label: "Acquisition price",     unit: "$M", min: 0,  max: 500, step: 5, default: 0,  tier: "constraint" },
    { id: "targetRevenue",     label: "Target revenue",        unit: "$M", min: 0,  max: 200, step: 5, default: 0,  tier: "constraint" },
    { id: "synergyLevel",      label: "Synergy level",         unit: "%",  min: 0,  max: 50,  step: 5, default: 0,  tier: "constraint" },
    { id: "integrationTime",   label: "Integration time",      unit: "mo", min: 1,  max: 24,  step: 1, default: 12, tier: "constraint" },
  ],
  market_entry: [
    { id: "marketSize",        label: "Market size",           unit: "$M", min: 0,  max: 500, step: 10, default: 0,  tier: "constraint" },
    { id: "entryCost",         label: "Entry cost",            unit: "$M", min: 0,  max: 100, step: 5,  default: 0,  tier: "constraint" },
    { id: "timeToScale",       label: "Time to scale",         unit: "mo", min: 1,  max: 36,  step: 1,  default: 12, tier: "constraint" },
    { id: "localCompetition",  label: "Local competition",     unit: "%",  min: 0,  max: 100, step: 5,  default: 50, tier: "constraint" },
  ],
  product_launch: [
    { id: "launchInvestment",  label: "Launch investment",      unit: "$M", min: 0,  max: 100, step: 5,  default: 0,  tier: "constraint" },
    { id: "expectedDemand",    label: "Expected demand",        unit: "%",  min: 0,  max: 100, step: 5,  default: 50, tier: "constraint" },
    { id: "timeToMarket",      label: "Time to market",         unit: "mo", min: 1,  max: 24,  step: 1,  default: 6,  tier: "constraint" },
    { id: "productMargin",     label: "Product margin",         unit: "%",  min: 0,  max: 80,  step: 5,  default: 40, tier: "constraint" },
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
