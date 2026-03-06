// src/engine/whatif/prompt.ts
// STRATFIT — What-If Prompt Builder (versioned, deterministic)
// Packs baseline + engine context into a strict OpenAI prompt.

import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { BaselineV1 } from "@/onboard/baseline"

export const PROMPT_VERSION = "whatif_v1"

// ── KPI anchor mapping (UI uses these anchor IDs for terrain overlays) ──

export const KPI_ANCHOR_MAP = {
  Liquidity: { anchorId: "cash", zone: "Liquidity Zone", color: "#22D3EE" },
  Runway:    { anchorId: "runway", zone: "Runway Horizon", color: "#38BDF8" },
  Growth:    { anchorId: "growth", zone: "Growth Gradient", color: "#34D399" },
  Revenue:   { anchorId: "revenue", zone: "Revenue Flow", color: "#A78BFA" },
  Burn:      { anchorId: "burn", zone: "Burn Zone", color: "#F59E0B" },
  Value:     { anchorId: "enterpriseValue", zone: "Value Summit", color: "#EC4899" },
} as const

export const ALLOWED_COLORS = [
  "#22D3EE", "#38BDF8", "#34D399", "#A78BFA", "#F59E0B", "#EC4899",
  "#F87171", "#10B981", "#8B5CF6", "#06B6D4",
]

// ── Context packer ──

export interface WhatIfContext {
  baseline: BaselineV1 | null
  kpis: PositionKpis | null
  selectedKpi?: string
}

function packBaseline(b: BaselineV1): Record<string, unknown> {
  return {
    company: b.company.legalName,
    industry: b.company.industry,
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
    capexIntensityPct: b.investment?.capexIntensityPct ?? 0,
    arDays: b.investment?.arDays ?? 0,
    apDays: b.investment?.apDays ?? 0,
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
  }
}

// ── System prompt ──

export function buildSystemPrompt(): string {
  return [
    "You are STRATFIT Scenario Operator — an AI embedded in a strategic financial terrain visualization system.",
    "",
    "STRICT RULES:",
    "1. Answer ONLY using the provided baseline and KPI context. NEVER invent numbers.",
    "2. Return valid JSON matching the provided schema. No markdown. No extra text. No preamble.",
    "3. Always populate kpi_impacts with at least one entry (even if 'flat' with low confidence).",
    "4. Map impacts to exactly these 6 KPI anchors: Liquidity, Runway, Growth, Revenue, Burn, Value.",
    "5. If asked a broad strategy question, translate it into measurable KPI impacts.",
    "6. If you cannot compute an answer due to missing data, set intent='data_missing' and populate missing_inputs.",
    "7. For terrain_overlays, use ONLY these colors: " + ALLOWED_COLORS.join(", "),
    "8. terrain_overlays must reference valid anchorId values: " + Object.values(KPI_ANCHOR_MAP).map(a => a.anchorId).join(", "),
    "",
    "KPI ANCHOR DEFINITIONS:",
    ...Object.entries(KPI_ANCHOR_MAP).map(([label, def]) =>
      `  ${label}: anchorId="${def.anchorId}", zone="${def.zone}", defaultColor="${def.color}"`
    ),
    "",
    "TERRAIN FEATURE RULES:",
    "  peak: KPI in 'strong' health → high elevation on terrain",
    "  valley: KPI in 'critical' health → deep trough",
    "  ridge: KPI in 'healthy' state → moderate elevated feature",
    "  basin: KPI in 'watch' state → shallow depression",
    "  plateau: KPI is flat/unchanged → level terrain",
    "",
    "POSITION RULES for overlays:",
    "  exact_peak: overlay sits at the highest point of the KPI's zone",
    "  exact_valley: overlay sits at the lowest point of the KPI's zone",
    "  inflection_point: overlay sits at the transition between rise/fall",
  ].join("\n")
}

// ── User message builder ──

export function buildUserMessage(question: string, ctx: WhatIfContext): string {
  const parts: string[] = [
    `USER QUESTION: "${question}"`,
    "",
  ]

  if (ctx.baseline) {
    parts.push("BASELINE INPUTS:")
    parts.push(JSON.stringify(packBaseline(ctx.baseline), null, 2))
    parts.push("")
  }

  if (ctx.kpis) {
    parts.push("CURRENT KPI STATE (engineResults):")
    parts.push(JSON.stringify(packKpis(ctx.kpis), null, 2))
    parts.push("")
  }

  if (ctx.selectedKpi) {
    parts.push(`FOCUSED KPI: ${ctx.selectedKpi}`)
    parts.push("")
  }

  parts.push("Return STRICT JSON matching the schema. No markdown wrapping. No extra text.")

  return parts.join("\n")
}
