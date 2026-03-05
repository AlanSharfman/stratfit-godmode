import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { SCENARIO_TEMPLATES, type ScenarioTemplate } from "./scenarioTemplates"

export interface ParsedIntent {
  question: string
  matchedTemplate: ScenarioTemplate | null
  forces: Partial<Record<KpiKey, number>>
  confidence: number
  reasoning: string
}

interface KeywordRule {
  patterns: RegExp[]
  forces: Partial<Record<KpiKey, number>>
  reasoning: string
}

const KEYWORD_RULES: KeywordRule[] = [
  { patterns: [/raise\s+\$?(\d+\.?\d*)\s*(m|million)/i], forces: {}, reasoning: "Capital raise detected" },
  { patterns: [/lose\s+.*biggest\s+client/i, /lose\s+.*largest\s+customer/i, /biggest\s+client\s+leaves/i], forces: { revenue: -30_000, arr: -360_000, churn: 8, growth: -10 }, reasoning: "Major client loss: significant revenue impact, churn spike, growth deceleration" },
  { patterns: [/lose\s+.*(\d+)%?\s+.*revenue/i, /revenue\s+drops?\s+(\d+)/i], forces: {}, reasoning: "Revenue decline detected" },
  { patterns: [/double\s+.*marketing/i, /2x\s+marketing/i], forces: { burn: 25_000, growth: 15, revenue: 20_000 }, reasoning: "Marketing spend doubled: increased burn offset by growth acceleration" },
  { patterns: [/cut\s+burn/i, /reduce\s+spend/i, /cut\s+costs?/i, /reduce\s+burn/i], forces: { burn: -30_000, growth: -5, efficiency: 0.1 }, reasoning: "Cost reduction: lower burn improves runway, modest growth impact" },
  { patterns: [/hire\s+(\d+)/i, /add\s+(\d+)\s+people/i], forces: {}, reasoning: "Hiring detected" },
  { patterns: [/raise\s+prices?/i, /increase\s+prices?/i, /price\s+increase/i], forces: { revenue: 15_000, churn: 2, grossMargin: 5 }, reasoning: "Price increase: higher ARPU with churn risk" },
  { patterns: [/lower\s+prices?/i, /decrease\s+prices?/i, /discount/i], forces: { revenue: -10_000, growth: 8, churn: -2 }, reasoning: "Price reduction: volume play, lower churn" },
  { patterns: [/churn\s+increase/i, /churn\s+doubles/i, /churn\s+goes\s+up/i], forces: { churn: 5, revenue: -15_000, growth: -5 }, reasoning: "Churn increase: revenue pressure, growth slowdown" },
  { patterns: [/reduce\s+churn/i, /improve\s+retention/i, /lower\s+churn/i, /cut\s+churn/i], forces: { churn: -3, burn: 10_000, revenue: 8_000 }, reasoning: "Churn reduction investment: spend on CS, improved retention" },
  { patterns: [/go\s+international/i, /expand\s+.*market/i, /new\s+market/i, /international/i], forces: { burn: 40_000, growth: 10, revenue: 15_000 }, reasoning: "International expansion: significant investment, gradual revenue" },
  { patterns: [/recession/i, /downturn/i, /economic\s+crisis/i, /market\s+crash/i], forces: { growth: -15, revenue: -20_000, churn: 5, enterpriseValue: -500_000 }, reasoning: "Economic downturn: broad pressure across growth, revenue, retention" },
  { patterns: [/competitor\s+.*dies/i, /competitor\s+.*exits/i, /competitor\s+.*fails/i, /competitor\s+.*shuts?\s*down/i], forces: { growth: 15, revenue: 25_000, churn: -3 }, reasoning: "Competitor exit: market share opportunity" },
  { patterns: [/run\s+out\s+of\s+money/i, /cash\s+runs?\s+out/i, /zero\s+cash/i], forces: { cash: -500_000, runway: -6 }, reasoning: "Cash crisis scenario" },
  { patterns: [/pivot/i, /change\s+direction/i, /new\s+product/i], forces: { burn: 20_000, growth: -10, revenue: -15_000, efficiency: -0.1 }, reasoning: "Pivot: short-term disruption across all metrics" },
  { patterns: [/automate/i, /ai\s+.*support/i, /implement\s+ai/i], forces: { burn: -5_000, efficiency: 0.12, churn: -1 }, reasoning: "Automation investment: cost reduction, efficiency gains" },
  { patterns: [/freemium/i, /free\s+tier/i, /free\s+plan/i], forces: { growth: 20, burn: 5_000, churn: 3, grossMargin: -8 }, reasoning: "Freemium model: massive top-of-funnel, conversion challenge" },
  { patterns: [/partnership/i, /partner\s+with/i, /distribution\s+deal/i], forces: { growth: 12, revenue: 20_000, grossMargin: -3 }, reasoning: "Strategic partnership: channel growth with margin share" },
  { patterns: [/viral/i, /goes?\s+viral/i, /blow\s+up/i], forces: { growth: 40, burn: 10_000 }, reasoning: "Viral growth: demand spike requiring rapid scaling" },
  { patterns: [/lay\s*off/i, /fire\s+.*staff/i, /reduce\s+headcount/i, /cut\s+team/i], forces: { burn: -40_000, growth: -10, efficiency: -0.1 }, reasoning: "Layoffs: significant cost reduction with velocity impact" },
]

function extractAmount(text: string): number | null {
  const match = text.match(/\$?\s*(\d+\.?\d*)\s*(k|m|million|thousand|b|billion)?/i)
  if (!match) return null
  let val = parseFloat(match[1])
  const unit = (match[2] || "").toLowerCase()
  if (unit === "k" || unit === "thousand") val *= 1_000
  if (unit === "m" || unit === "million") val *= 1_000_000
  if (unit === "b" || unit === "billion") val *= 1_000_000_000
  return val
}

function extractPercentage(text: string): number | null {
  const match = text.match(/(\d+\.?\d*)\s*%/)
  if (!match) return null
  return parseFloat(match[1])
}

function fuzzyMatchTemplate(query: string): ScenarioTemplate | null {
  const q = query.toLowerCase()
  let best: ScenarioTemplate | null = null
  let bestScore = 0

  for (const t of SCENARIO_TEMPLATES) {
    const words = t.question.toLowerCase().split(/\s+/)
    let score = 0
    for (const w of words) {
      if (w.length > 3 && q.includes(w)) score += 1
    }
    const descWords = t.description.toLowerCase().split(/\s+/)
    for (const w of descWords) {
      if (w.length > 3 && q.includes(w)) score += 0.5
    }
    if (score > bestScore) {
      bestScore = score
      best = t
    }
  }

  return bestScore >= 2 ? best : null
}

export function parseNaturalLanguage(query: string): ParsedIntent {
  const q = query.trim()
  if (!q) return { question: q, matchedTemplate: null, forces: {}, confidence: 0, reasoning: "Empty query" }

  const templateMatch = fuzzyMatchTemplate(q)
  if (templateMatch) {
    return {
      question: q,
      matchedTemplate: templateMatch,
      forces: { ...templateMatch.forces },
      confidence: 0.85,
      reasoning: `Matched template: "${templateMatch.question}" — ${templateMatch.description}`,
    }
  }

  for (const rule of KEYWORD_RULES) {
    for (const pattern of rule.patterns) {
      const match = q.match(pattern)
      if (match) {
        const forces = { ...rule.forces }

        if (pattern.source.includes("raise") && pattern.source.includes("million")) {
          const amount = extractAmount(q)
          if (amount) {
            forces.cash = amount
            forces.burn = Math.round(amount * 0.015)
            forces.growth = Math.round(Math.log10(amount) * 3)
          }
        }

        if (pattern.source.includes("hire") && match[1]) {
          const count = parseInt(match[1])
          forces.burn = count * 12_000
          forces.growth = count * 3
          forces.efficiency = count * 0.02
        }

        if (pattern.source.includes("revenue") && pattern.source.includes("drop")) {
          const pct = extractPercentage(q) ?? 20
          forces.revenue = -Math.round(pct * 500)
          forces.growth = -Math.round(pct * 0.5)
        }

        return {
          question: q,
          matchedTemplate: null,
          forces,
          confidence: 0.7,
          reasoning: rule.reasoning,
        }
      }
    }
  }

  const amount = extractAmount(q)
  const pct = extractPercentage(q)
  const isNegative = /lose|drop|decrease|reduce|cut|fall|decline|crash|worst/i.test(q)
  const isPositive = /gain|grow|increase|raise|improve|boost|double|triple/i.test(q)

  if (amount || pct) {
    const forces: Partial<Record<KpiKey, number>> = {}
    const sign = isNegative ? -1 : 1

    if (/revenue|sales|income/i.test(q)) forces.revenue = sign * (amount ?? (pct ? pct * 500 : 10_000))
    else if (/cash|money|capital|funding/i.test(q)) forces.cash = sign * (amount ?? 100_000)
    else if (/burn|spend|cost|expense/i.test(q)) forces.burn = sign * (amount ?? 10_000)
    else if (/churn|attrition|retention/i.test(q)) forces.churn = sign * (pct ?? 3)
    else if (/growth|grow/i.test(q)) forces.growth = sign * (pct ?? 10)
    else if (/margin/i.test(q)) forces.grossMargin = sign * (pct ?? 5)
    else if (/valuation|value|worth/i.test(q)) forces.enterpriseValue = sign * (amount ?? 500_000)
    else forces.revenue = sign * (amount ?? 10_000)

    return {
      question: q,
      matchedTemplate: null,
      forces,
      confidence: 0.5,
      reasoning: `Extracted ${isNegative ? "negative" : "positive"} force from quantitative signal`,
    }
  }

  if (isNegative || isPositive) {
    const sign = isNegative ? -1 : 1
    return {
      question: q,
      matchedTemplate: null,
      forces: { growth: sign * 8, revenue: sign * 10_000 },
      confidence: 0.3,
      reasoning: `Low confidence: detected ${isNegative ? "negative" : "positive"} sentiment, applied general growth/revenue force`,
    }
  }

  return {
    question: q,
    matchedTemplate: null,
    forces: {},
    confidence: 0,
    reasoning: "Could not parse intent. Try phrasing as a specific business decision or scenario.",
  }
}
