// src/domain/intelligence/decisionSuggestions.ts
// Generates contextual stress-test suggestions based on actual KPI values.

import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "./kpiZoneMapping"
import { getHealthLevel } from "./kpiZoneMapping"
import type { DecisionIntentType } from "@/state/phase1ScenarioStore"

export interface StressTestSuggestion {
  id: string
  kpiSource: KpiKey
  intent: DecisionIntentType
  headline: string
  prompt: string
  urgency: "critical" | "high" | "moderate" | "exploratory"
}

function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString()}`
}

export function generateSuggestions(kpis: PositionKpis): StressTestSuggestion[] {
  const suggestions: StressTestSuggestion[] = []
  const rw = kpis.runwayMonths

  // Cash / Runway suggestions
  const cashHealth = getHealthLevel("cash", kpis)
  const runwayHealth = getHealthLevel("runway", kpis)

  if (runwayHealth === "critical" || cashHealth === "critical") {
    suggestions.push({
      id: "bridge-round",
      kpiSource: "cash",
      intent: "fundraising",
      headline: `Raise a bridge round — ${rw.toFixed(1)} months runway remaining`,
      prompt: `Raise a $${Math.max(1, Math.round(kpis.burnMonthly * 12 / 1_000_000))}M bridge round to extend runway beyond 12 months at current burn rate of ${fmt(kpis.burnMonthly)}/mo.`,
      urgency: "critical",
    })
    suggestions.push({
      id: "emergency-burn-cut",
      kpiSource: "burn",
      intent: "cost_reduction",
      headline: `Emergency burn reduction — currently ${fmt(kpis.burnMonthly)}/mo`,
      prompt: `Cut monthly burn by 30% from ${fmt(kpis.burnMonthly)} to ${fmt(kpis.burnMonthly * 0.7)} through headcount and operational efficiency.`,
      urgency: "critical",
    })
  } else if (runwayHealth === "watch") {
    suggestions.push({
      id: "extend-runway",
      kpiSource: "runway",
      intent: "fundraising",
      headline: `Extend runway beyond 12 months — currently at ${rw.toFixed(1)}m`,
      prompt: `Raise $${Math.max(1, Math.round(kpis.burnMonthly * 8 / 1_000_000))}M to extend runway from ${rw.toFixed(1)} months to 18+ months.`,
      urgency: "high",
    })
  }

  // Burn suggestions
  const burnHealth = getHealthLevel("burn", kpis)
  if (burnHealth === "critical" || burnHealth === "watch") {
    suggestions.push({
      id: "reduce-burn",
      kpiSource: "burn",
      intent: "cost_reduction",
      headline: `Reduce operational burn — ${fmt(kpis.burnMonthly)}/mo is elevated`,
      prompt: `Reduce monthly burn by 20% from ${fmt(kpis.burnMonthly)} to ${fmt(kpis.burnMonthly * 0.8)} while maintaining growth momentum.`,
      urgency: burnHealth === "critical" ? "critical" : "high",
    })
  }

  // ARR / Revenue suggestions
  const arrHealth = getHealthLevel("arr", kpis)
  if (arrHealth === "watch" || arrHealth === "critical") {
    suggestions.push({
      id: "accelerate-growth",
      kpiSource: "arr",
      intent: "growth_investment",
      headline: `Accelerate revenue growth — ARR at ${fmt(kpis.arr)}`,
      prompt: `Invest additional ${fmt(Math.max(kpis.burnMonthly * 0.2, 30_000))}/mo in sales and marketing to accelerate ARR growth from ${fmt(kpis.arr)} toward $${Math.round(kpis.arr * 2 / 1_000_000)}M.`,
      urgency: "high",
    })
  }

  // Pricing
  if (kpis.grossMarginPct < 50) {
    suggestions.push({
      id: "pricing-increase",
      kpiSource: "grossMargin",
      intent: "pricing",
      headline: `Improve margins — gross margin at ${kpis.grossMarginPct.toFixed(0)}%`,
      prompt: `Increase pricing by 15% to improve gross margin from ${kpis.grossMarginPct.toFixed(0)}% toward 60%+. Model churn impact.`,
      urgency: "moderate",
    })
  }

  // Valuation
  const evHealth = getHealthLevel("enterpriseValue", kpis)
  if (evHealth === "healthy" || evHealth === "strong") {
    suggestions.push({
      id: "growth-for-valuation",
      kpiSource: "enterpriseValue",
      intent: "growth_investment",
      headline: `Capitalize on momentum — EV at ${fmt(kpis.valuationEstimate)}`,
      prompt: `Increase growth investment by ${fmt(Math.max(kpis.burnMonthly * 0.25, 40_000))}/mo to accelerate ARR growth and expand the revenue multiple.`,
      urgency: "exploratory",
    })
  }

  // Hiring (always available as exploratory)
  if (suggestions.length < 4) {
    suggestions.push({
      id: "hiring-plan",
      kpiSource: "burn",
      intent: "hiring",
      headline: "Scale the team — model headcount expansion impact",
      prompt: `Hire 5 additional team members over 3 months. Model the impact on burn rate, runway, and execution velocity.`,
      urgency: "exploratory",
    })
  }

  // Market expansion (always available as exploratory)
  if (suggestions.length < 5) {
    suggestions.push({
      id: "market-expansion",
      kpiSource: "revenue",
      intent: "market_entry",
      headline: "Expand into a new market segment",
      prompt: `Enter a new market segment with ${fmt(Math.max(kpis.burnMonthly * 0.3, 50_000))}/mo investment. Model ramp timeline and revenue contribution over 12 months.`,
      urgency: "exploratory",
    })
  }

  // Sort by urgency
  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, moderate: 2, exploratory: 3 }
  suggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

  return suggestions.slice(0, 5)
}

export function getZoneStripData(kpis: PositionKpis): Array<{
  key: KpiKey
  label: string
  health: "critical" | "watch" | "healthy" | "strong"
}> {
  const keys: Array<{ key: KpiKey; label: string }> = [
    { key: "cash", label: "Cash" },
    { key: "runway", label: "Runway" },
    { key: "arr", label: "ARR" },
    { key: "revenue", label: "Revenue" },
    { key: "burn", label: "Burn" },
    { key: "grossMargin", label: "Margin" },
    { key: "enterpriseValue", label: "Value" },
    { key: "survivalProbability", label: "Survival" },
  ]
  return keys.map(({ key, label }) => ({
    key,
    label,
    health: getHealthLevel(key, kpis),
  }))
}
