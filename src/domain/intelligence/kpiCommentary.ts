// src/domain/intelligence/kpiCommentary.ts
// Hybrid AI commentary templates for Position page KPI cards.

import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "./kpiZoneMapping"

function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString()}`
}

function cashCommentary(k: PositionKpis): string {
  const rw = k.runwayMonths
  if (rw < 6)
    return `At ${fmt(k.cashOnHand)} with ${fmt(k.burnMonthly)}/mo burn, you have ${rw.toFixed(1)} months of runway. The terrain reflects this as a low-elevation pressure zone — liquidity intervention is likely needed.`
  if (rw < 12)
    return `${fmt(k.cashOnHand)} gives you ${rw.toFixed(1)} months of operational space. The terrain shows moderate elevation — not critical, but the slope is descending.`
  return `With ${rw.toFixed(1)} months runway at ${fmt(k.cashOnHand)}, your liquidity position is strong. The terrain rises here, reflecting capital stability.`
}

function runwayCommentary(k: PositionKpis): string {
  const rw = k.runwayMonths
  if (!Number.isFinite(rw) || rw > 36)
    return "Runway extends beyond the visible horizon — you have substantial operational freedom. Focus shifts from survival to strategic allocation."
  if (rw < 6)
    return `${rw.toFixed(1)} months remaining. The terrain drops sharply in this zone — the probability of needing emergency action is elevated. Every decision impacts survival.`
  if (rw < 12)
    return `${rw.toFixed(1)} months of runway. The terrain slope is descending but manageable — this is the zone where strategic decisions about capital and efficiency become urgent.`
  return `${rw.toFixed(1)} months gives you breathing room. The terrain shows stable ground ahead, but monitoring burn rate remains important.`
}

function arrCommentary(k: PositionKpis): string {
  if (k.arr < 500_000)
    return `ARR at ${fmt(k.arr)} — early traction phase. The revenue engine zone on the terrain is still forming, with high variance in trajectory.`
  if (k.arr < 2_000_000)
    return `${fmt(k.arr)} ARR indicates meaningful product-market signal. The terrain elevation is building — growth consistency will determine the peak height.`
  return `${fmt(k.arr)} ARR represents significant revenue momentum. The terrain rises steeply through this zone, reflecting the compound effect of recurring revenue.`
}

function revenueCommentary(k: PositionKpis): string {
  if (k.revenueMonthly < 30_000)
    return `Monthly revenue at ${fmt(k.revenueMonthly)} — the revenue flow zone shows minimal altitude. This is typical pre-scale, but the terrain needs growth signals to build elevation.`
  if (k.revenueMonthly < 100_000)
    return `${fmt(k.revenueMonthly)}/mo revenue is building momentum. The terrain shows moderate flow through this zone — scaling decisions will steepen the gradient.`
  return `${fmt(k.revenueMonthly)}/mo indicates strong revenue flow. The terrain reflects this with sustained elevation and positive slope through the growth corridor.`
}

function burnCommentary(k: PositionKpis): string {
  if (k.burnMonthly > 200_000)
    return `Burn at ${fmt(k.burnMonthly)}/mo is creating significant terrain roughness — high operational intensity is compressing runway and increasing the probability of funding dependency.`
  if (k.burnMonthly > 100_000)
    return `${fmt(k.burnMonthly)}/mo burn rate creates moderate terrain friction. The efficiency zone shows some turbulence — ratio of burn to revenue growth is the key indicator.`
  return `${fmt(k.burnMonthly)}/mo burn is well-controlled. The terrain shows smooth gradients through the efficiency zone, indicating disciplined capital deployment.`
}

function grossMarginCommentary(k: PositionKpis): string {
  if (k.grossMarginPct < 30)
    return `Gross margin at ${k.grossMarginPct.toFixed(0)}% is below sustainable thresholds. The margin ridge on the terrain is thin — unit economics need to improve before scaling.`
  if (k.grossMarginPct < 60)
    return `${k.grossMarginPct.toFixed(0)}% gross margin is developing. The terrain ridge is building width — continued improvement unlocks better valuation multiples and operational resilience.`
  return `${k.grossMarginPct.toFixed(0)}% gross margin represents strong unit economics. The terrain forms a wide, stable ridge — this is the foundation for scalable growth.`
}

function valuationCommentary(k: PositionKpis): string {
  if (k.valuationEstimate < 1_000_000)
    return "Enterprise value is in early formation. The value summit on the terrain has not yet formed a distinct peak — ARR growth and margin improvement are the primary building forces."
  if (k.valuationEstimate < 5_000_000)
    return `${fmt(k.valuationEstimate)} enterprise value shows the summit beginning to form. Multiple expansion is driven by revenue consistency and risk reduction.`
  return `${fmt(k.valuationEstimate)} enterprise value — the terrain peak is well-defined. Sustaining this elevation requires maintaining growth rate, margin, and risk profile simultaneously.`
}

function growthCommentary(k: PositionKpis): string {
  const gr = k.growthRatePct ?? 0
  if (gr < 2)
    return `Growth rate at ${gr.toFixed(1)}% MoM — the growth gradient on the terrain is nearly flat. Without acceleration, compounding effects remain negligible and valuation multiples compress.`
  if (gr < 8)
    return `${gr.toFixed(1)}% MoM growth is building momentum but below the inflection threshold. The terrain slope is gradual here — sustainable acceleration above 10% would significantly reshape the landscape.`
  if (gr < 20)
    return `${gr.toFixed(1)}% MoM growth — the growth gradient rises sharply. The terrain reflects healthy compounding dynamics. Maintaining this rate meaningfully improves all downstream zones.`
  return `${gr.toFixed(1)}% MoM growth is exceptional. The terrain peaks in this zone — compounding at this rate reshapes valuation within quarters, not years.`
}

function churnCommentary(k: PositionKpis): string {
  const ch = k.churnPct ?? 0
  if (ch > 10)
    return `Churn at ${ch.toFixed(1)}% monthly is critically high. The retention wall on the terrain has collapsed — net revenue retention is likely negative, meaning growth is fighting attrition. Immediate focus on retention mechanics is essential.`
  if (ch > 5)
    return `${ch.toFixed(1)}% monthly churn creates significant drag. The retention wall shows erosion — every new customer acquired must compensate for departures before contributing to growth.`
  if (ch > 2)
    return `${ch.toFixed(1)}% monthly churn is manageable but worth monitoring. The retention wall stands firm — small improvements here compound powerfully over 12-month horizons.`
  return `${ch.toFixed(1)}% monthly churn is excellent. The retention wall on the terrain is solid — this is a durable foundation for ARR compounding and valuation expansion.`
}

function efficiencyCommentary(k: PositionKpis): string {
  const eff = k.efficiencyRatio ?? 0
  const fmtEff = eff >= 1000 ? `$${(eff / 1000).toFixed(0)}K` : `$${Math.round(eff)}`
  if (eff < 50_000)
    return `Revenue per employee at ${fmtEff} — the leverage plateau on the terrain is low. Operational intensity is high relative to output, compressing margins and limiting scalability.`
  if (eff < 100_000)
    return `${fmtEff} revenue per employee shows developing operational leverage. The terrain plateau is forming — further automation and process optimization will steepen the gradient.`
  if (eff < 200_000)
    return `${fmtEff} per employee reflects solid operational leverage. The plateau is elevated and stable — this supports sustainable scaling without proportional headcount growth.`
  return `${fmtEff} per employee is exceptional leverage. The terrain plateau reaches peak elevation here — operational efficiency is a structural advantage.`
}

const COMMENTARY: Record<KpiKey, (k: PositionKpis) => string> = {
  cash:            cashCommentary,
  runway:          runwayCommentary,
  growth:          growthCommentary,
  arr:             arrCommentary,
  revenue:         revenueCommentary,
  burn:            burnCommentary,
  churn:           churnCommentary,
  grossMargin:     grossMarginCommentary,
  efficiency:      efficiencyCommentary,
  enterpriseValue: valuationCommentary,
}

export function getKpiCommentary(key: KpiKey, kpis: PositionKpis): string {
  return COMMENTARY[key]?.(kpis) ?? ""
}

export function getExecutiveSummary(kpis: PositionKpis, revealedCount = 10): {
  label: string
  tone: "critical" | "challenging" | "stable" | "strong"
  narrative: string
} {
  const sp = kpis.riskIndex
  const rw = kpis.runwayMonths

  let label: string
  let tone: "critical" | "challenging" | "stable" | "strong"
  if (sp < 30 || rw < 4) { label = "CRITICAL"; tone = "critical" }
  else if (sp < 50 || rw < 8) { label = "CHALLENGING"; tone = "challenging" }
  else if (sp < 75 || rw < 14) { label = "STABLE"; tone = "stable" }
  else { label = "STRONG"; tone = "strong" }

  if (revealedCount < 10) {
    return {
      label: `${revealedCount}/10`,
      tone,
      narrative: revealedCount === 0
        ? "Focus each KPI below to reveal its terrain zone and build the mountain of your business."
        : `${revealedCount} of 10 zones revealed. Continue exploring to complete your position terrain.`,
    }
  }

  const strengths: string[] = []
  const risks: string[] = []
  if (rw >= 12) strengths.push("healthy runway"); else if (rw < 6) risks.push("runway under 6 months")
  if (kpis.arr >= 1_000_000) strengths.push("ARR above $1M"); else if (kpis.arr < 300_000) risks.push("ARR below $300K")
  if (kpis.grossMarginPct >= 60) strengths.push("strong margins"); else if (kpis.grossMarginPct < 30) risks.push("low gross margin")
  if (kpis.burnMonthly < 80_000) strengths.push("controlled burn"); else if (kpis.burnMonthly > 150_000) risks.push("elevated burn rate")
  if ((kpis.churnPct ?? 0) <= 2) strengths.push("low churn"); else if ((kpis.churnPct ?? 0) > 8) risks.push("high churn")
  if ((kpis.growthRatePct ?? 0) >= 10) strengths.push("strong growth"); else if ((kpis.growthRatePct ?? 0) < 3) risks.push("slow growth")

  const parts: string[] = [
    `Position assessment: ${label.toLowerCase()}.`,
    `Survival probability stands at ${sp.toFixed(0)}% with ${Number.isFinite(rw) ? `${rw.toFixed(1)} months` : "extended"} runway.`,
  ]
  if (strengths.length > 0) parts.push(`Key strengths: ${strengths.join(", ")}.`)
  if (risks.length > 0) parts.push(`Areas of concern: ${risks.join(", ")}.`)
  parts.push("All 10 zones revealed — your business terrain is complete. Stress-test any area that needs attention.")

  return { label, tone, narrative: parts.join(" ") }
}
