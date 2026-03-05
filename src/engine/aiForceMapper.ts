import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

export interface AIForceResponse {
  forces: Partial<Record<KpiKey, number>>
  reasoning: string
  confidence: number
}

const SYSTEM_PROMPT = `You are STRATFIT's business physics engine. Given a natural language business scenario question and the company's current KPIs, map the scenario to quantitative force changes across the company's KPI zones.

Available KPI keys and their meanings:
- cash: Cash on hand (absolute dollar change)
- runway: Runway in months (absolute month change)
- growth: Growth rate percentage (percentage point change)
- arr: Annual Recurring Revenue (absolute dollar change)
- revenue: Monthly revenue (absolute dollar change)
- burn: Monthly burn rate (absolute dollar change, positive = more burn)
- churn: Monthly churn rate (percentage point change, positive = more churn)
- grossMargin: Gross margin percentage (percentage point change)
- efficiency: Efficiency ratio (absolute change, e.g. 0.1)
- enterpriseValue: Enterprise value (absolute dollar change)

Rules:
1. Only include KPIs that would actually be affected
2. Use realistic magnitudes based on the company's current scale
3. Consider second-order effects (e.g. losing revenue → shorter runway)
4. Return JSON with: forces (Record<KpiKey, number>), reasoning (string), confidence (0-1)

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`

export async function mapWithAI(
  question: string,
  kpis: PositionKpis,
  apiKey: string,
  endpoint = "https://api.openai.com/v1/chat/completions"
): Promise<AIForceResponse> {
  const kpiSummary = `Current KPIs: Cash $${kpis.cashOnHand.toLocaleString()}, Runway ${kpis.runwayMonths.toFixed(1)} months, Growth ${kpis.growthRatePct.toFixed(1)}%, ARR $${kpis.arr.toLocaleString()}, Monthly Revenue $${kpis.revenueMonthly.toLocaleString()}, Monthly Burn $${kpis.burnMonthly.toLocaleString()}, Churn ${kpis.churnPct.toFixed(1)}%, Gross Margin ${kpis.grossMarginPct.toFixed(1)}%, Efficiency ${kpis.efficiencyRatio.toFixed(2)}, EV ${kpis.valuationEstimate ? '$' + kpis.valuationEstimate.toLocaleString() : 'N/A'}`

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${kpiSummary}\n\nQuestion: "${question}"` },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? ""

  try {
    const parsed = JSON.parse(content)
    const forces: Partial<Record<KpiKey, number>> = {}
    for (const key of KPI_KEYS) {
      if (typeof parsed.forces?.[key] === "number") {
        forces[key] = parsed.forces[key]
      }
    }
    return {
      forces,
      reasoning: parsed.reasoning || "AI-generated force mapping",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
    }
  } catch {
    throw new Error("Failed to parse AI response")
  }
}

const AI_KEY_STORAGE = "stratfit-ai-key"

export function getStoredAIKey(): string | null {
  try { return localStorage.getItem(AI_KEY_STORAGE) } catch { return null }
}

export function storeAIKey(key: string): void {
  try { localStorage.setItem(AI_KEY_STORAGE, key) } catch { /* noop */ }
}

export function clearAIKey(): void {
  try { localStorage.removeItem(AI_KEY_STORAGE) } catch { /* noop */ }
}
