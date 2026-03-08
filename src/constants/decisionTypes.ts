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
  /** Category icon glyph */
  icon: string
  /** Accent colour for icon badge */
  accent: string
}

export const DECISION_TYPES: DecisionType[] = [
  {
    id: "pricing-change",
    label: "Pricing Change",
    description: "Assess revenue elasticity and margin impact",
    intentType: "pricing",
    icon: "◈",
    accent: "#22d3ee",
  },
  {
    id: "new-market-entry",
    label: "New Market Entry",
    description: "Model growth potential vs capital risk",
    intentType: "market_entry",
    icon: "◎",
    accent: "#34d399",
  },
  {
    id: "hiring-expansion",
    label: "Hiring Expansion",
    description: "Balance productivity gains against burn increase",
    intentType: "hiring",
    icon: "⬡",
    accent: "#a78bfa",
  },
  {
    id: "cost-reduction",
    label: "Cost Reduction Program",
    description: "Evaluate savings versus operational risk",
    intentType: "cost_reduction",
    icon: "▽",
    accent: "#f87171",
  },
  {
    id: "product-launch",
    label: "Product Launch",
    description: "Forecast adoption, revenue upside and spend",
    intentType: "product_launch",
    icon: "◆",
    accent: "#fbbf24",
  },
  {
    id: "capital-raise",
    label: "Capital Raise",
    description: "Simulate runway extension and dilution impact",
    intentType: "fundraising",
    icon: "△",
    accent: "#34d399",
  },
  {
    id: "acquisition",
    label: "Acquisition",
    description: "Estimate synergies, ROI and integration risk",
    intentType: "acquisition",
    icon: "⬢",
    accent: "#f472b6",
  },
  {
    id: "marketing-spend",
    label: "Marketing Spend Increase",
    description: "Test growth acceleration and CAC efficiency",
    intentType: "growth_investment",
    icon: "◇",
    accent: "#fb923c",
  },
  {
    id: "pricing-model-change",
    label: "Pricing Model Change",
    description: "Analyse cash flow timing and churn dynamics",
    intentType: "pricing",
    icon: "◈",
    accent: "#22d3ee",
  },
  {
    id: "automation-investment",
    label: "Automation Investment",
    description: "Measure efficiency gains versus upfront cost",
    intentType: "cost_reduction",
    icon: "⚙",
    accent: "#94a3b8",
  },
  {
    id: "debt-financing",
    label: "Debt Financing",
    description: "Assess leverage impact and repayment pressure",
    intentType: "fundraising",
    icon: "▣",
    accent: "#c084fc",
  },
  {
    id: "geographic-expansion",
    label: "Geographic Expansion",
    description: "Project scaling potential and execution risk",
    intentType: "growth_investment",
    icon: "◎",
    accent: "#2dd4bf",
  },
  {
    id: "strategic-partnership",
    label: "Strategic Partnership",
    description: "Evaluate revenue uplift and dependency risk",
    intentType: "growth_investment",
    icon: "⬡",
    accent: "#818cf8",
  },
  {
    id: "capacity-expansion",
    label: "Capacity Expansion",
    description: "Model demand fulfilment and capital intensity",
    intentType: "growth_investment",
    icon: "▲",
    accent: "#4ade80",
  },
  {
    id: "inventory-strategy",
    label: "Inventory Strategy",
    description: "Optimise working capital and service levels",
    intentType: "cost_reduction",
    icon: "▤",
    accent: "#fca5a5",
  },
  {
    id: "other",
    label: "Other",
    description: "Define a custom strategic scenario",
    intentType: "other",
    icon: "⬥",
    accent: "#64748b",
  },
]
