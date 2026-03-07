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
    return `You have ${fmt(k.cashOnHand)} in the bank and ${rw.toFixed(1)} months of runway at the current burn. This is the part of the mountain where founders need to act fast: buy time, tighten focus, and avoid getting boxed into a desperate raise.`
  if (rw < 12)
    return `${fmt(k.cashOnHand)} gives you ${rw.toFixed(1)} months of room to work with. You're not in the danger zone yet, but you do need a plan for how this turns into momentum before the clock gets louder.`
  return `With ${rw.toFixed(1)} months of runway and ${fmt(k.cashOnHand)} in cash, you have real space to build. The mountain is higher here because you're making decisions from strength, not panic.`
}

function runwayCommentary(k: PositionKpis): string {
  const rw = k.runwayMonths
  if (!Number.isFinite(rw) || rw > 36)
    return "Runway stretches well beyond the horizon. This is founder freedom: you can think about building the company you want, not just surviving the next few months."
  if (rw < 6)
    return `${rw.toFixed(1)} months left. This is the steep part of the mountain where every decision matters and every distraction hurts. Focus has to shift to extending life and protecting the next move.`
  if (rw < 12)
    return `${rw.toFixed(1)} months of runway gives you a real shot, but not forever. This is the window where founders need to sharpen the story, tighten execution, and make sure burn is buying traction.`
  return `${rw.toFixed(1)} months gives you breathing room. The ground ahead looks steady, which means you can focus on building momentum instead of constantly looking over your shoulder.`
}

function arrCommentary(k: PositionKpis): string {
  if (k.arr < 500_000)
    return `At ${fmt(k.arr)} ARR, you're still in early traction territory. The shape is forming, but the story is not locked yet, so execution and customer pull matter more than polish.`
  if (k.arr < 2_000_000)
    return `${fmt(k.arr)} ARR says there is something real here. The mountain is starting to rise, and consistency now is what turns signal into a durable company.`
  return `${fmt(k.arr)} ARR shows real momentum. The mountain climbs hard in this zone because recurring revenue is starting to compound and give the business weight.`
}

function revenueCommentary(k: PositionKpis): string {
  if (k.revenueMonthly < 30_000)
    return `Monthly revenue is ${fmt(k.revenueMonthly)}. That's still early, which is fine, but the business needs stronger pull if you want this mountain to start lifting with confidence.`
  if (k.revenueMonthly < 100_000)
    return `${fmt(k.revenueMonthly)}/mo shows momentum building. You're in the stage where go-to-market choices really matter because the next moves can steepen the climb quickly.`
  return `${fmt(k.revenueMonthly)}/mo is strong revenue flow. The terrain holds its height here because the business is starting to move with real force, not just promise.`
}

function burnCommentary(k: PositionKpis): string {
  if (k.burnMonthly > 200_000)
    return `Burning ${fmt(k.burnMonthly)}/mo is making the mountain rough fast. You can grow through that if the output is there, but if not, this turns into a founder stress problem very quickly.`
  if (k.burnMonthly > 100_000)
    return `${fmt(k.burnMonthly)}/mo burn is workable, but it needs to be earning its keep. The question here is simple: is this spend helping the company break through, or just making the story more expensive?`
  return `${fmt(k.burnMonthly)}/mo burn looks controlled. The terrain stays smoother here because you're giving yourself a chance to grow without losing the plot.`
}

function grossMarginCommentary(k: PositionKpis): string {
  if (k.grossMarginPct < 30)
    return `Gross margin at ${k.grossMarginPct.toFixed(0)}% is too thin to scale comfortably. Founders feel this as every bit of growth getting heavier and harder to fund.`
  if (k.grossMarginPct < 60)
    return `${k.grossMarginPct.toFixed(0)}% gross margin is heading in the right direction. Keep improving it and the business gets easier to scale, easier to defend, and easier to believe in.`
  return `${k.grossMarginPct.toFixed(0)}% gross margin is strong. This is the kind of foundation that gives founders more options because growth is not fighting the core economics.`
}

function valuationCommentary(k: PositionKpis): string {
  if (k.valuationEstimate < 1_000_000)
    return "The company story is still early, and the peak has not formed yet. Right now, the biggest unlocks are proving demand, improving economics, and showing the business can keep climbing."
  if (k.valuationEstimate < 5_000_000)
    return `${fmt(k.valuationEstimate)} shows the summit starting to take shape. The next step is making the business feel more inevitable through consistency, focus, and fewer weak points.`
  return `${fmt(k.valuationEstimate)} means the peak is clearly formed. Keeping it there is about staying sharp on growth, margin, and execution all at once.`
}

function growthCommentary(k: PositionKpis): string {
  const gr = k.growthRatePct ?? 0
  if (gr < 2)
    return `Growth at ${gr.toFixed(1)}% MoM is basically flat. This is the part where founders need to ask what is not clicking yet: product pull, distribution, pricing, or focus.`
  if (gr < 8)
    return `${gr.toFixed(1)}% MoM growth is moving, but it has not hit breakout speed. You're seeing progress, just not enough yet to really reshape the company.`
  if (gr < 20)
    return `${gr.toFixed(1)}% MoM growth is strong. This is where compounding starts to do founder-level heavy lifting and a lot of other problems become easier to solve.`
  return `${gr.toFixed(1)}% MoM growth is exceptional. At this pace, the whole mountain changes fast and the company can look very different within a few quarters.`
}

function churnCommentary(k: PositionKpis): string {
  const ch = k.churnPct ?? 0
  if (ch > 10)
    return `Churn at ${ch.toFixed(1)}% monthly is a major problem. You're pouring energy into growth while customers leak out the other side, which makes everything harder than it should be.`
  if (ch > 5)
    return `${ch.toFixed(1)}% monthly churn is real drag. The team can hustle forever, but if retention does not improve, growth keeps getting eaten before it compounds.`
  if (ch > 2)
    return `${ch.toFixed(1)}% monthly churn is manageable. Tightening this up a little could have an outsized effect over the next year.`
  return `${ch.toFixed(1)}% monthly churn is excellent. This gives the business a strong base to compound from because customers are actually sticking around.`
}

function efficiencyCommentary(k: PositionKpis): string {
  const eff = k.efficiencyRatio ?? 0
  const fmtEff = eff >= 1000 ? `$${(eff / 1000).toFixed(0)}K` : `$${Math.round(eff)}`
  if (eff < 50_000)
    return `Revenue per employee at ${fmtEff} says the team is working hard for not enough output yet. Founders usually feel this as the company getting heavier before it gets stronger.`
  if (eff < 100_000)
    return `${fmtEff} per employee shows leverage starting to form. The next unlock is usually better systems, sharper priorities, and less drag on the team.`
  if (eff < 200_000)
    return `${fmtEff} per employee is solid. That's a good sign the company can keep scaling without every bit of growth requiring a matching jump in headcount.`
  return `${fmtEff} per employee is exceptional. This is what founder leverage looks like when the company is learning to do more without just adding bodies.`
}

function headcountCommentary(k: PositionKpis): string {
  const hc = k.headcount ?? 0
  if (hc < 5)
    return `A team of ${hc} means every person changes the company. Each hire matters a lot, and there is not much room for confusion or drift.`
  if (hc < 20)
    return `${hc} people gives you some depth, but this is the stage where clarity starts to matter. If roles blur or communication slips, execution slows quickly.`
  if (hc < 50)
    return `At ${hc} people, the team can run on multiple fronts. The challenge now is making sure more people actually create more momentum, not more noise.`
  return `${hc} people means the company has real organizational weight. At this point, the advantage comes from alignment and leverage, not just adding more hands.`
}

function nrrCommentary(k: PositionKpis): string {
  const n = k.nrrPct ?? 100
  if (n < 80)
    return `NRR at ${n.toFixed(0)}% means the base is shrinking. That's a tough founder problem because new sales are just filling the hole instead of building the business.`
  if (n < 100)
    return `${n.toFixed(0)}% NRR means expansion is not offsetting what you're losing. The company needs better retention, expansion, or product pull inside the existing base.`
  if (n < 120)
    return `${n.toFixed(0)}% NRR is healthy. Existing customers are helping carry growth, which is one of the strongest signals a founder can have.`
  return `${n.toFixed(0)}% NRR is exceptional. Your customer base is doing real compounding work for you, which makes the whole business stronger and more resilient.`
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
  headcount:       headcountCommentary,
  nrr:             nrrCommentary,
  efficiency:      efficiencyCommentary,
  enterpriseValue: valuationCommentary,
}

export function getKpiCommentary(key: KpiKey, kpis: PositionKpis): string {
  return COMMENTARY[key]?.(kpis) ?? ""
}

export function getExecutiveSummary(kpis: PositionKpis, revealedCount = 12): {
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

  const strengths: string[] = []
  const risks: string[] = []
  if (rw >= 12) strengths.push("healthy runway"); else if (rw < 6) risks.push("runway under 6 months")
  if (kpis.arr >= 1_000_000) strengths.push("ARR above $1M"); else if (kpis.arr < 300_000) risks.push("ARR below $300K")
  if (kpis.grossMarginPct >= 60) strengths.push("strong margins"); else if (kpis.grossMarginPct < 30) risks.push("low gross margin")
  if (kpis.burnMonthly < 80_000) strengths.push("controlled burn"); else if (kpis.burnMonthly > 150_000) risks.push("elevated burn rate")
  if ((kpis.churnPct ?? 0) <= 2) strengths.push("low churn"); else if ((kpis.churnPct ?? 0) > 8) risks.push("high churn")
  if ((kpis.growthRatePct ?? 0) >= 10) strengths.push("strong growth"); else if ((kpis.growthRatePct ?? 0) < 3) risks.push("slow growth")

  const parts: string[] = [
    `Founder read: ${label.toLowerCase()}.`,
    `Right now you have a ${sp.toFixed(0)}% survival score and ${Number.isFinite(rw) ? `${rw.toFixed(1)} months` : "extended"} of runway.`,
  ]
  if (strengths.length > 0) parts.push(`Key strengths: ${strengths.join(", ")}.`)
  if (risks.length > 0) parts.push(`What needs founder attention: ${risks.join(", ")}.`)
  parts.push("All 12 zones are now visible. Use the weak spots to decide what needs fixing first.")

  return { label, tone, narrative: parts.join(" ") }
}
