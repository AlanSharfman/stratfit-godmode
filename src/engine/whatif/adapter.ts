// src/engine/whatif/adapter.ts
// STRATFIT — What-If Answer → Terrain Force Adapter
// Converts structured WhatIfAnswer into force vectors that the existing
// WhatIfPage terrain/propagation system can consume.

import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { ScenarioTemplate } from "@/engine/scenarioTemplates"
import type { WhatIfAnswer, WhatIfKpiLabel, WhatIfKpiImpact } from "./types"

const LABEL_TO_KPI: Record<WhatIfKpiLabel, KpiKey> = {
  Liquidity: "cash",
  Runway: "runway",
  Growth: "growth",
  Revenue: "revenue",
  Burn: "burn",
  Value: "enterpriseValue",
}

const MAGNITUDE_SCALE: Record<string, number> = {
  small: 0.3,
  medium: 0.6,
  large: 1.0,
}

function impactToForceValue(impact: WhatIfKpiImpact): number {
  const kpi = LABEL_TO_KPI[impact.kpi]
  if (!kpi) return 0

  if (impact.delta_value !== undefined && impact.delta_value !== null) {
    return impact.direction === "down" ? -Math.abs(impact.delta_value) : Math.abs(impact.delta_value)
  }

  const scale = MAGNITUDE_SCALE[impact.magnitude ?? "medium"] ?? 0.6
  const sign = impact.direction === "down" ? -1 : impact.direction === "flat" ? 0 : 1

  const defaults: Partial<Record<KpiKey, number>> = {
    cash: 200_000,
    runway: 3,
    growth: 10,
    revenue: 20_000,
    burn: 15_000,
    enterpriseValue: 500_000,
  }

  return sign * (defaults[kpi] ?? 10_000) * scale
}

export function whatIfAnswerToForces(answer: WhatIfAnswer): Partial<Record<KpiKey, number>> {
  const forces: Partial<Record<KpiKey, number>> = {}
  for (const impact of answer.kpi_impacts) {
    const kpi = LABEL_TO_KPI[impact.kpi]
    if (!kpi) continue
    const val = impactToForceValue(impact)
    if (val !== 0) {
      forces[kpi] = (forces[kpi] ?? 0) + val
    }
  }
  return forces
}

export function whatIfAnswerToTemplate(answer: WhatIfAnswer, question: string): ScenarioTemplate {
  return {
    id: `ai-${Date.now()}`,
    question,
    category: answer.intent === "simulate_change" ? "efficiency"
      : answer.intent === "forecast" ? "market"
      : "growth",
    forces: whatIfAnswerToForces(answer),
    description: answer.summary,
  }
}

export function kpiLabelToKey(label: WhatIfKpiLabel): KpiKey {
  return LABEL_TO_KPI[label]
}
