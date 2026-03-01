// src/constants/decisionTypes.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Decision Type Catalogue (15 + Other)
//
// Each entry maps to a DecisionIntentType for lever/assumption wiring.
// UI-only config — does not affect simulation logic.
// ═══════════════════════════════════════════════════════════════════════════

import type { DecisionIntentType } from "@/state/phase1ScenarioStore"

export interface DecisionType {
  /** Stable kebab-case identifier */
  id: string
  /** Display label */
  label: string
  /** One-line investor-grade microcopy */
  description: string
  /** Maps to the lever/assumption system */
  intentType: DecisionIntentType
}

export const DECISION_TYPES: DecisionType[] = [
  {
    id: "pricing-change",
    label: "Pricing Change",
    description: "Assess revenue elasticity and margin impact",
    intentType: "pricing",
  },
  {
    id: "new-market-entry",
    label: "New Market Entry",
    description: "Model growth potential vs capital risk",
    intentType: "growth_investment",
  },
  {
    id: "hiring-expansion",
    label: "Hiring Expansion",
    description: "Balance productivity gains against burn increase",
    intentType: "hiring",
  },
  {
    id: "cost-reduction",
    label: "Cost Reduction Program",
    description: "Evaluate savings versus operational risk",
    intentType: "cost_reduction",
  },
  {
    id: "product-launch",
    label: "Product Launch",
    description: "Forecast adoption, revenue upside and spend",
    intentType: "growth_investment",
  },
  {
    id: "capital-raise",
    label: "Capital Raise",
    description: "Simulate runway extension and dilution impact",
    intentType: "fundraising",
  },
  {
    id: "acquisition",
    label: "Acquisition",
    description: "Estimate synergies, ROI and integration risk",
    intentType: "growth_investment",
  },
  {
    id: "marketing-spend",
    label: "Marketing Spend Increase",
    description: "Test growth acceleration and CAC efficiency",
    intentType: "growth_investment",
  },
  {
    id: "pricing-model-change",
    label: "Pricing Model Change",
    description: "Analyse cash flow timing and churn dynamics",
    intentType: "pricing",
  },
  {
    id: "automation-investment",
    label: "Automation Investment",
    description: "Measure efficiency gains versus upfront cost",
    intentType: "cost_reduction",
  },
  {
    id: "debt-financing",
    label: "Debt Financing",
    description: "Assess leverage impact and repayment pressure",
    intentType: "fundraising",
  },
  {
    id: "geographic-expansion",
    label: "Geographic Expansion",
    description: "Project scaling potential and execution risk",
    intentType: "growth_investment",
  },
  {
    id: "strategic-partnership",
    label: "Strategic Partnership",
    description: "Evaluate revenue uplift and dependency risk",
    intentType: "growth_investment",
  },
  {
    id: "capacity-expansion",
    label: "Capacity Expansion",
    description: "Model demand fulfilment and capital intensity",
    intentType: "growth_investment",
  },
  {
    id: "inventory-strategy",
    label: "Inventory Strategy",
    description: "Optimise working capital and service levels",
    intentType: "cost_reduction",
  },
  {
    id: "other",
    label: "Other",
    description: "Define a custom strategic scenario",
    intentType: "other",
  },
]
