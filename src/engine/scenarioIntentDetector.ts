/**
 * STRATFIT — Pre-API Scenario Intent Detector
 *
 * Detects the type of strategic decision from a user prompt using keyword
 * matching BEFORE the OpenAI call. The result enriches the context sent
 * to the simulation engine and the AI prompt.
 */

import type { ScenarioCategory } from "./scenarioTemplates"

export interface DetectedIntent {
  scenarioType: ScenarioCategory
  action: string
  detectedKeywords: string[]
}

interface CategoryRule {
  category: ScenarioCategory
  action: string
  keywords: string[]
  patterns: RegExp[]
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "hiring",
    action: "Modify team composition",
    keywords: ["hire", "recruit", "headcount", "team", "staff", "onboard", "talent", "engineer", "sales rep", "cto", "cfo", "vp"],
    patterns: [/hire\b/i, /recruit/i, /add\s+\d+\s+(people|engineers|reps|staff)/i, /build\s+(a\s+)?team/i, /new\s+(cto|cfo|vp|head\s+of)/i, /grow\s+the\s+team/i, /headcount/i],
  },
  {
    category: "pricing",
    action: "Adjust pricing strategy",
    keywords: ["price", "pricing", "discount", "arpu", "monetise", "monetize", "freemium", "premium", "subscription", "tier"],
    patterns: [/price/i, /pricing/i, /raise\s+prices?/i, /increase\s+prices?/i, /lower\s+prices?/i, /discount/i, /freemium/i, /premium\s+tier/i, /arpu/i, /monetis/i, /monetiz/i],
  },
  {
    category: "capital",
    action: "Raise or deploy capital",
    keywords: ["raise", "fund", "funding", "seed", "series", "investment", "investor", "capital", "debt", "loan", "bridge", "convertible"],
    patterns: [/raise\b/i, /fund/i, /series\s+[a-d]/i, /seed\s+round/i, /investor/i, /capital/i, /bridge\s+(round|loan)/i, /convertible/i, /ipo/i, /venture/i],
  },
  {
    category: "growth",
    action: "Pursue growth initiative",
    keywords: ["expand", "launch", "enter", "market", "international", "product", "channel", "partner", "acquisition", "scale", "viral", "marketing"],
    patterns: [/expand/i, /launch/i, /enter\s+(a\s+)?new/i, /new\s+market/i, /international/i, /go\s+global/i, /product[\s-]led/i, /acquisition/i, /scale\b/i, /go\s+viral/i, /double\s+.*marketing/i, /partner/i],
  },
  {
    category: "efficiency",
    action: "Optimise operations",
    keywords: ["cut", "reduce", "optimise", "optimize", "automate", "streamline", "consolidate", "layoff", "restructure", "lean", "save", "renegotiate"],
    patterns: [/cut\b/i, /reduce/i, /optimis/i, /optimiz/i, /automate/i, /streamline/i, /consolidat/i, /lay\s*off/i, /restructur/i, /lean/i, /save\s+\$?\d/i, /renegotiat/i, /cut\s+(burn|costs?|spend)/i],
  },
  {
    category: "risk",
    action: "Assess risk scenario",
    keywords: ["lose", "risk", "churn", "recession", "downturn", "crisis", "competitor", "regulatory", "breach", "fail", "worst", "crash"],
    patterns: [/lose/i, /risk/i, /churn\s+(increase|spike|doubles?)/i, /recession/i, /downturn/i, /crisis/i, /competitor/i, /regulat/i, /breach/i, /fail/i, /worst\s+case/i, /crash/i, /what\s+if\s+we\s+lose/i],
  },
]

export function detectScenarioIntent(prompt: string): DetectedIntent | null {
  const text = prompt.trim().toLowerCase()
  if (!text) return null

  let bestMatch: { rule: CategoryRule; score: number; matched: string[] } | null = null

  for (const rule of CATEGORY_RULES) {
    const matched: string[] = []
    let score = 0

    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        score += 2
        const source = pattern.source.replace(/\\[bsi]/g, "").replace(/[^a-z\s]/gi, " ").trim().split(/\s+/)[0]
        if (source && !matched.includes(source)) matched.push(source)
      }
    }

    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        score += 1
        if (!matched.includes(kw)) matched.push(kw)
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { rule, score, matched }
    }
  }

  if (!bestMatch) return null

  return {
    scenarioType: bestMatch.rule.category,
    action: bestMatch.rule.action,
    detectedKeywords: bestMatch.matched,
  }
}

export default detectScenarioIntent
