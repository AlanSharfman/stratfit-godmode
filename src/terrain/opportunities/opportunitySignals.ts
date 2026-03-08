import type { PositionKpis } from "@/pages/position/overlays/positionState"

export interface OpportunitySignal {
  id: string
  title: string
  description: string
  potentialImpact: "Low" | "Medium" | "High" | "Very High"
  /** 0–100 confidence score */
  confidence: number
  /** Normalized terrain X position 0–1 (maps via zone layout) */
  cx: number
  /** Terrain Z offset to separate from KPI markers at z=0 */
  cz: number
  /** Internal ranking score 0–1 */
  strength: number
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

function impactLabel(score: number): OpportunitySignal["potentialImpact"] {
  if (score > 0.75) return "Very High"
  if (score > 0.6) return "High"
  if (score > 0.4) return "Medium"
  return "Low"
}

/**
 * Analyse current KPI state and surface the top 3 strategic opportunities.
 * Each opportunity maps to a terrain zone so the beacon sits near the
 * relevant part of the mountain.
 */
export function deriveOpportunitySignals(
  kpis: PositionKpis | null | undefined,
): OpportunitySignal[] {
  if (!kpis) return []

  const candidates: OpportunitySignal[] = []

  const marginStr = clamp01(kpis.grossMarginPct / 80)
  const growthStr = clamp01(kpis.growthRatePct / 50)

  // ── Pricing Leverage ────────────────────────────────────────────
  // Strong margin + growth = room to capture more value
  const pricingScore = marginStr * 0.6 + growthStr * 0.4
  if (pricingScore > 0.45) {
    candidates.push({
      id: "pricing-leverage",
      title: "Pricing Leverage",
      description: `Gross margin at ${kpis.grossMarginPct.toFixed(0)}% with ${kpis.growthRatePct.toFixed(0)}% growth suggests room to capture more value through strategic pricing.`,
      potentialImpact: impactLabel(pricingScore),
      confidence: Math.round(pricingScore * 100),
      cx: 0.73,
      cz: 18,
      strength: pricingScore,
    })
  }

  // ── Sales Efficiency ────────────────────────────────────────────
  // High revenue/head + team scale = scaling opportunity
  const effScore = clamp01(kpis.efficiencyRatio / 300_000)
  const teamScale = clamp01(kpis.headcount / 50)
  const salesScore = effScore * 0.5 + teamScale * 0.3 + growthStr * 0.2
  if (salesScore > 0.35) {
    candidates.push({
      id: "sales-efficiency",
      title: "Sales Efficiency",
      description: `Revenue per head at $${Math.round(kpis.efficiencyRatio / 1000)}K with ${kpis.headcount} staff. Scaling this ratio could accelerate growth without proportional cost.`,
      potentialImpact: impactLabel(salesScore),
      confidence: Math.round(salesScore * 90),
      cx: 0.45,
      cz: 22,
      strength: salesScore,
    })
  }

  // ── Cost Optimisation ───────────────────────────────────────────
  // High burn relative to revenue with reasonable margin = cost reduction upside
  const burnRatio = kpis.revenueMonthly > 0 ? kpis.burnMonthly / kpis.revenueMonthly : 1
  const costScore = clamp01(burnRatio - 0.5) * 0.6 + clamp01(1 - kpis.runwayMonths / 36) * 0.4
  if (costScore > 0.3 && kpis.grossMarginPct > 30) {
    candidates.push({
      id: "cost-optimisation",
      title: "Cost Optimisation",
      description: `Burn-to-revenue ratio of ${(burnRatio * 100).toFixed(0)}% with ${kpis.runwayMonths.toFixed(0)} months runway. Targeted reductions could materially extend runway.`,
      potentialImpact: impactLabel(costScore),
      confidence: Math.round(clamp01(costScore + 0.15) * 85),
      cx: 0.55,
      cz: -20,
      strength: costScore,
    })
  }

  // ── Growth Acceleration ─────────────────────────────────────────
  // Strong retention + low churn = compounding engine ready to push
  const retentionStr = clamp01((kpis.nrrPct - 90) / 40)
  const lowChurn = clamp01(1 - kpis.churnPct / 8)
  const accelScore = retentionStr * 0.5 + lowChurn * 0.3 + growthStr * 0.2
  if (accelScore > 0.5) {
    candidates.push({
      id: "growth-acceleration",
      title: "Growth Acceleration",
      description: `NRR at ${kpis.nrrPct.toFixed(0)}% with ${kpis.churnPct.toFixed(1)}% churn. Strong retention creates a compounding growth engine ready for investment.`,
      potentialImpact: impactLabel(accelScore),
      confidence: Math.round(accelScore * 95),
      cx: 0.25,
      cz: 16,
      strength: accelScore,
    })
  }

  // ── Capital Deployment ──────────────────────────────────────────
  // High cash + long runway = strategic investment capacity
  const cashStr = clamp01(kpis.cashOnHand / 5_000_000)
  const runwayStr = clamp01(kpis.runwayMonths / 24)
  const capitalScore = cashStr * 0.5 + runwayStr * 0.3 + marginStr * 0.2
  if (capitalScore > 0.5) {
    candidates.push({
      id: "capital-deployment",
      title: "Capital Deployment",
      description: `$${(kpis.cashOnHand / 1_000_000).toFixed(1)}M cash with ${kpis.runwayMonths.toFixed(0)} months runway. Strong position for strategic investment or acquisition.`,
      potentialImpact: impactLabel(capitalScore),
      confidence: Math.round(capitalScore * 90),
      cx: 0.08,
      cz: -18,
      strength: capitalScore,
    })
  }

  return candidates.sort((a, b) => b.strength - a.strength).slice(0, 3)
}
