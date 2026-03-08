/**
 * STRATFIT Delta Context Builder
 *
 * Assembles baseline metrics, scenario metrics, and computed deltas
 * into a structured user message for the delta interpretation prompt.
 */

import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ScenarioRunEngineResult } from "@/store/scenarioRunStore"
import {
  getHealthLevel,
  KPI_KEYS,
  KPI_ZONE_MAP,
  type KpiKey,
} from "@/domain/intelligence/kpiZoneMapping"

const DISPLAY_KPI_KEYS: readonly KpiKey[] = KPI_KEYS

function healthToFeature(health: string): string {
  switch (health) {
    case "strong":   return "peak"
    case "healthy":  return "ridge"
    case "watch":    return "basin"
    case "critical": return "valley"
    default:         return "plateau"
  }
}

export interface DeltaMetric {
  kpi: string
  zone: string
  baselineValue: number
  scenarioValue: number
  delta: number
  direction: "up" | "down" | "unchanged"
  baselineFeature: string
  scenarioFeature: string
}

export interface DeltaContext {
  scenarioPrompt: string
  scenarioType: string
  baselineMetrics: Record<string, number>
  scenarioMetrics: Record<string, number>
  deltaMetrics: DeltaMetric[]
  assumptions: string[]
  confidence: { level: string; score: number; reasons: string[] }
  clampWarnings: string[]
}

function kpiValue(kpis: PositionKpis, key: KpiKey): number {
  const map: Record<string, keyof PositionKpis> = {
    cash: "cashOnHand",
    runway: "runwayMonths",
    growth: "growthRatePct",
    arr: "arr",
    revenue: "revenueMonthly",
    burn: "burnMonthly",
    churn: "churnPct",
    grossMargin: "grossMarginPct",
    headcount: "headcount",
    enterpriseValue: "valuationEstimate",
  }
  const field = map[key]
  return field ? (kpis[field] as number) ?? 0 : 0
}

export function buildDeltaMetrics(
  baselineKpis: PositionKpis,
  scenarioKpis: PositionKpis,
): DeltaMetric[] {
  return DISPLAY_KPI_KEYS.map((key) => {
    const bv = kpiValue(baselineKpis, key)
    const sv = kpiValue(scenarioKpis, key)
    const d = sv - bv
    return {
      kpi: key,
      zone: KPI_ZONE_MAP[key]?.stationName ?? key,
      baselineValue: bv,
      scenarioValue: sv,
      delta: d,
      direction: d > 0 ? "up" : d < 0 ? "down" : "unchanged",
      baselineFeature: healthToFeature(getHealthLevel(key, baselineKpis)),
      scenarioFeature: healthToFeature(getHealthLevel(key, scenarioKpis)),
    }
  })
}

export function buildDeltaContext(
  prompt: string,
  scenarioType: string,
  baselineKpis: PositionKpis,
  scenarioKpis: PositionKpis,
  engineResult: ScenarioRunEngineResult,
): DeltaContext {
  const deltas = buildDeltaMetrics(baselineKpis, scenarioKpis)

  const baselineMetrics: Record<string, number> = {}
  const scenarioMetrics: Record<string, number> = {}
  for (const d of deltas) {
    baselineMetrics[d.kpi] = d.baselineValue
    scenarioMetrics[d.kpi] = d.scenarioValue
  }

  return {
    scenarioPrompt: prompt,
    scenarioType,
    baselineMetrics,
    scenarioMetrics,
    deltaMetrics: deltas,
    assumptions: engineResult.assumptions,
    confidence: engineResult.confidence,
    clampWarnings: engineResult.clampWarnings,
  }
}

export function formatDeltaAsMessage(ctx: DeltaContext): string {
  const parts: string[] = []

  parts.push("═══ SCENARIO ═══")
  parts.push(`Prompt: "${ctx.scenarioPrompt}"`)
  parts.push(`Category: ${ctx.scenarioType}`)
  parts.push("")

  parts.push("═══ BASELINE METRICS ═══")
  parts.push(JSON.stringify(ctx.baselineMetrics, null, 2))
  parts.push("")

  parts.push("═══ SCENARIO METRICS ═══")
  parts.push(JSON.stringify(ctx.scenarioMetrics, null, 2))
  parts.push("")

  parts.push("═══ DELTA METRICS ═══")
  for (const d of ctx.deltaMetrics) {
    const sign = d.delta > 0 ? "+" : ""
    const arrow = d.direction === "up" ? "▲" : d.direction === "down" ? "▼" : "—"
    parts.push(
      `  ${d.zone}: ${sign}${d.delta.toFixed(2)} ${arrow}  (${d.baselineFeature} → ${d.scenarioFeature})`,
    )
  }
  parts.push("")

  if (ctx.assumptions.length > 0) {
    parts.push("═══ ASSUMPTIONS ═══")
    for (const a of ctx.assumptions) {
      parts.push(`  • ${a}`)
    }
    parts.push("")
  }

  parts.push("═══ CONFIDENCE ═══")
  parts.push(`  Level: ${ctx.confidence.level}`)
  parts.push(`  Score: ${ctx.confidence.score}`)
  for (const r of ctx.confidence.reasons) {
    parts.push(`  • ${r}`)
  }
  parts.push("")

  if (ctx.clampWarnings.length > 0) {
    parts.push("═══ CLAMP WARNINGS ═══")
    for (const w of ctx.clampWarnings) {
      parts.push(`  ⚠ ${w}`)
    }
    parts.push("")
  }

  parts.push("Explain:")
  parts.push("• what improved")
  parts.push("• what deteriorated")
  parts.push("• key sensitivities")
  parts.push("• major strategic tradeoffs")
  parts.push("")
  parts.push("Do NOT invent numbers. Cite only the data above.")
  parts.push("Return STRICT JSON matching the schema. No markdown wrapping. No extra text.")

  return parts.join("\n")
}
