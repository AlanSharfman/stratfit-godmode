/**
 * STRATFIT Context Builder
 * Assembles structured context from baseline, KPIs, and terrain state
 * for injection into the OpenAI user message.
 *
 * Reusable across WhatIfPage, PositionPage, ComparePage, BoardroomPage.
 */

import type { BaselineV1 } from "@/onboard/baseline"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { getHealthLevel, KPI_ZONE_MAP, type KpiKey } from "@/domain/intelligence/kpiZoneMapping"

const KPI_KEYS: KpiKey[] = [
  "cash", "runway", "growth", "arr", "revenue",
  "burn", "churn", "grossMargin", "headcount", "enterpriseValue",
]

export type CompanyStage =
  | "pre-revenue"
  | "seed"
  | "early"
  | "growth"
  | "scale"
  | "late"

export interface StratfitContext {
  companyStage: CompanyStage
  industry: string
  businessModel: string
  baseline: Record<string, unknown>
  kpiState: Record<string, unknown>
  terrainState: TerrainZoneState[]
  scenario?: ScenarioContext
}

export interface TerrainZoneState {
  kpi: string
  zone: string
  health: string
  terrainFeature: string
}

export interface ScenarioContext {
  question: string
  category?: string
  focusedKpi?: string
}

function deriveCompanyStage(baseline: BaselineV1): CompanyStage {
  const arr = baseline.financial.arr
  const growth = baseline.financial.growthRatePct

  if (arr <= 0) return "pre-revenue"
  if (arr < 500_000) return "seed"
  if (arr < 2_000_000) return "early"
  if (arr < 10_000_000) return growth > 50 ? "growth" : "early"
  if (arr < 50_000_000) return "scale"
  return "late"
}

function healthToTerrainFeature(health: string): string {
  switch (health) {
    case "strong": return "peak"
    case "healthy": return "ridge"
    case "watch": return "basin"
    case "critical": return "valley"
    default: return "plateau"
  }
}

function packBaseline(b: BaselineV1): Record<string, unknown> {
  return {
    company: b.company.legalName,
    industry: b.company.industry,
    businessModel: b.company.businessModel,
    primaryMarket: b.company.primaryMarket,
    arr: b.financial.arr,
    monthlyBurn: b.financial.monthlyBurn,
    cashOnHand: b.financial.cashOnHand,
    growthRatePct: b.financial.growthRatePct,
    grossMarginPct: b.financial.grossMarginPct,
    headcount: b.financial.headcount,
    churnPct: b.operating.churnPct,
    nrrPct: b.financial.nrrPct,
    totalDebt: b.capital.totalDebt,
    cac: b.customerEngine.cac,
    ltv: b.customerEngine.ltv,
    annualCapex: b.investment?.annualCapex ?? 0,
    arDays: b.investment?.arDays ?? 0,
    apDays: b.investment?.apDays ?? 0,
    lastRaiseAmount: b.capital.lastRaiseAmount,
  }
}

function packKpis(k: PositionKpis): Record<string, unknown> {
  return {
    arr: k.arr,
    burnMonthly: k.burnMonthly,
    runwayMonths: k.runwayMonths,
    cashOnHand: k.cashOnHand,
    revenueMonthly: k.revenueMonthly,
    grossMarginPct: k.grossMarginPct,
    growthRatePct: k.growthRatePct,
    churnPct: k.churnPct,
    headcount: k.headcount,
    valuationEstimate: k.valuationEstimate,
    riskIndex: k.riskIndex,
    survivalScore: k.survivalScore,
    nrrPct: k.nrrPct,
    efficiencyRatio: k.efficiencyRatio,
    ebitdaMonthly: k.ebitdaMonthly,
  }
}

function deriveTerrainZones(kpis: PositionKpis): TerrainZoneState[] {
  return KPI_KEYS.map((key) => {
    const health = getHealthLevel(key, kpis)
    return {
      kpi: key,
      zone: KPI_ZONE_MAP[key]?.stationName ?? key,
      health,
      terrainFeature: healthToTerrainFeature(health),
    }
  })
}

export function buildStratfitContext(
  baseline: BaselineV1 | null,
  kpis: PositionKpis | null,
  scenario?: ScenarioContext,
): StratfitContext {
  const stage = baseline ? deriveCompanyStage(baseline) : "early"
  const industry = baseline?.company.industry ?? "technology"
  const businessModel = baseline?.company.businessModel ?? "SaaS"

  return {
    companyStage: stage,
    industry,
    businessModel,
    baseline: baseline ? packBaseline(baseline) : {},
    kpiState: kpis ? packKpis(kpis) : {},
    terrainState: kpis ? deriveTerrainZones(kpis) : [],
    scenario,
  }
}

export function formatContextAsMessage(ctx: StratfitContext): string {
  const parts: string[] = []

  parts.push("═══ COMPANY PROFILE ═══")
  parts.push(`Stage: ${ctx.companyStage}`)
  parts.push(`Industry: ${ctx.industry}`)
  parts.push(`Business Model: ${ctx.businessModel}`)
  parts.push("")

  if (Object.keys(ctx.baseline).length > 0) {
    parts.push("═══ BASELINE INPUTS ═══")
    parts.push(JSON.stringify(ctx.baseline, null, 2))
    parts.push("")
  }

  if (Object.keys(ctx.kpiState).length > 0) {
    parts.push("═══ CURRENT KPI STATE ═══")
    parts.push(JSON.stringify(ctx.kpiState, null, 2))
    parts.push("")
  }

  if (ctx.terrainState.length > 0) {
    parts.push("═══ TERRAIN STATE ═══")
    for (const zone of ctx.terrainState) {
      parts.push(`  ${zone.zone}: ${zone.health} → ${zone.terrainFeature}`)
    }
    parts.push("")
  }

  if (ctx.scenario) {
    parts.push("═══ SCENARIO ═══")
    parts.push(`Question: "${ctx.scenario.question}"`)
    if (ctx.scenario.category) parts.push(`Category: ${ctx.scenario.category}`)
    if (ctx.scenario.focusedKpi) parts.push(`Focused KPI: ${ctx.scenario.focusedKpi}`)
    parts.push("")
  }

  parts.push("Return STRICT JSON matching the schema. No markdown wrapping. No extra text.")

  return parts.join("\n")
}
