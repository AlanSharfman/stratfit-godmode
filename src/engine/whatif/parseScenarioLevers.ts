// src/engine/whatif/parseScenarioLevers.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Scenario Lever Interpreter
//
// Converts a free-text scenario description into canonical lever values
// (0–100 scale) that drive the same simulation pipeline used by Studio.
//
// GUARANTEES:
//   - Only outputs fields in CANONICAL_LEVER_IDS — no invented fields
//   - All values clamped to [0, 100]
//   - Does not overwrite baseline inputs
//   - Pure function — no side effects, no API calls
//   - Deterministic: same input always produces same output
//   - Debug metadata included in every return value
// ═══════════════════════════════════════════════════════════════════════════

import type { LeverValues } from "@/domain/decision/LeverValues"
import type { DetectedIntent } from "@/engine/scenarioIntentDetector"

// ── Canonical lever IDs ───────────────────────────────────────────────────
// These are the ONLY fields this interpreter is allowed to populate.
// Any other field in a rule definition is a programming error — caught at runtime.

export const CANONICAL_LEVER_IDS = [
  "demandStrength",
  "pricingPower",
  "hiringIntensity",
  "costDiscipline",
  "operatingDrag",
  "marketVolatility",
  "executionRisk",
] as const

export type CanonicalLeverId = (typeof CANONICAL_LEVER_IDS)[number]

// ── Output contract ───────────────────────────────────────────────────────

export interface ParsedLeverOutput {
  /** Only the fields that deviated from neutral (50). Empty = no signal. */
  levers: Partial<LeverValues>
  /** All 7 canonical levers — neutral (50) for unmatched, parsed value otherwise. */
  allLevers: Record<CanonicalLeverId, number>
  /** 0–1. Highest confidence among matched rules, or 0 if default. */
  confidence: number
  /** Names of keyword rules that fired — empty = intent fallback or default. */
  matchedRules: string[]
  /** "keyword" | "intent_fallback" | "default" */
  source: "keyword" | "intent_fallback" | "default"
  /** Ambiguity warnings — e.g. conflicting rules, low-signal input. */
  warnings: string[]
  /** The original input text, for traceability. */
  inputText: string
}

// ── Neutral baseline ──────────────────────────────────────────────────────
// All levers start at 50 (midpoint). Rules move them up or down.
// This is separate from Studio's own defaults — the interpreter is neutral.

const NEUTRAL: Record<CanonicalLeverId, number> = {
  demandStrength:   50,
  pricingPower:     50,
  hiringIntensity:  50,
  costDiscipline:   50,
  operatingDrag:    50,
  marketVolatility: 50,
  executionRisk:    50,
}

// ── Rule definitions ──────────────────────────────────────────────────────

interface LeverRule {
  name: string
  /** ALL patterns test independently; any match triggers this rule. */
  patterns: RegExp[]
  /** Absolute lever values (0–100) for affected levers only. */
  levers: Partial<Record<CanonicalLeverId, number>>
  /** Blend weight when multiple rules fire. Higher = more authoritative. */
  confidence: number
}

const RULES: LeverRule[] = [
  // ── Hiring ──────────────────────────────────────────────────────────────
  {
    name: "hiring_expand",
    patterns: [
      /\bhire\b|\bhiring\b|headcount|recruit|\badd\s+\d+\s+(people|engineers?|reps?|staff)\b/i,
      /\bbuild\s+(a\s+)?team\b|grow\s+(the\s+)?team|expand\s+(the\s+)?team/i,
      /\bnew\s+(cto|cfo|vp|head\s+of)\b|onboard\s+\d+/i,
    ],
    levers: { hiringIntensity: 78, costDiscipline: 38, executionRisk: 58 },
    confidence: 0.85,
  },
  {
    name: "hiring_freeze",
    patterns: [
      /freez(e|ing)\s+(all\s+)?hiring|no\s+(new\s+)?hire|hiring\s+pause/i,
      /cut\s+headcount|reduc(e|ing)\s+headcount|lay\s*off|retrench|downsize/i,
      /\brestructur|redund(ancy|ancies)|workforce\s+reduc/i,
    ],
    levers: { hiringIntensity: 18, costDiscipline: 78, executionRisk: 52 },
    confidence: 0.90,
  },

  // ── Pricing ─────────────────────────────────────────────────────────────
  {
    name: "pricing_increase",
    patterns: [
      /rais(e|ing)\s+(our\s+)?(pric|rate|fee)|increas(e|ing)\s+(pric|rate|fee)|pric(e|ing)\s+(hike|increas)/i,
      /premium\s+(tier|pric|model)|move\s+(up-?market|upmarket)|charge\s+more/i,
      /price\s+increas|pric(e|ing)\s+up\b/i,
    ],
    levers: { pricingPower: 82, demandStrength: 40 },
    confidence: 0.85,
  },
  {
    name: "pricing_decrease",
    patterns: [
      /cut\s+(our\s+)?(pric|rate|fee)|reduc(e|ing)\s+(pric|rate|fee)|lower\s+(our\s+)?(pric|fee)/i,
      /discount|promotional\s+pric|pric(e|ing)\s+(war|cut|reduc)/i,
      /cheaper|more\s+affordable|freemium/i,
    ],
    levers: { pricingPower: 22, demandStrength: 68 },
    confidence: 0.82,
  },

  // ── Cost / burn ──────────────────────────────────────────────────────────
  {
    name: "cost_reduction",
    patterns: [
      /cut\s+(our\s+)?(cost|burn|spend|opex)|reduc(e|ing)\s+(burn|spend|opex|overhead)/i,
      /cost\s+(control|disciplin|reduc|cut|saving|efficienc)|lower\s+(our\s+)?burn/i,
      /\blean\s+operations?\b|\btighten\s+(our\s+)?belt\b/i,
    ],
    levers: { costDiscipline: 84, hiringIntensity: 28, operatingDrag: 30 },
    confidence: 0.88,
  },
  {
    name: "cost_invest",
    patterns: [
      /invest\s+in\s+(ops|operations|infrastructure|tooling|platform)/i,
      /scale\s+(our\s+)?(operations?|infrastructure|platform)/i,
    ],
    levers: { costDiscipline: 38, operatingDrag: 60, hiringIntensity: 62 },
    confidence: 0.70,
  },

  // ── Growth ───────────────────────────────────────────────────────────────
  {
    name: "growth_aggressive",
    patterns: [
      /aggress(ive|ively)\s+(growth|scaling?|expand)|hyper.?growth|hypergrowth/i,
      /scale\s+(fast|aggressively|hard|massively)|invest\s+heavily\s+in\s+growth/i,
      /double\s+(down\s+on\s+)?(growth|revenue|sales|marketing)\b/i,
      /full\s+(growth|scale|send)\s+mode|growth\s+at\s+all\s+costs?/i,
    ],
    levers: { demandStrength: 82, hiringIntensity: 72, executionRisk: 65, marketVolatility: 48 },
    confidence: 0.82,
  },
  {
    name: "growth_efficient",
    patterns: [
      /efficien(t|cy)\s+growth|sustainabl(e|y)\s+grow|profitable\s+growth/i,
      /unit\s+econom(ic|ics)|improve\s+unit\s+econom|better\s+unit\s+econom/i,
      /grow\s+without\s+(increasing\s+)?(burn|headcount|cost)/i,
    ],
    levers: { demandStrength: 68, costDiscipline: 72, executionRisk: 35, operatingDrag: 32 },
    confidence: 0.78,
  },

  // ── Market / demand ──────────────────────────────────────────────────────
  {
    name: "market_expansion",
    patterns: [
      /new\s+market|enter\s+(a\s+)?(new\s+)?market|market\s+expan|geographic\s+expan/i,
      /internation(al|alise|alize|ally)|go\s+global|expand\s+(to|into)\s+\w+/i,
      /launch\s+(in|into)\s+\w+\s+(market|region|country)/i,
    ],
    levers: { marketVolatility: 72, executionRisk: 68, demandStrength: 62, operatingDrag: 62 },
    confidence: 0.78,
  },
  {
    name: "market_downturn",
    patterns: [
      /recession|economic\s+(downturn|slow|contract|crisis)|macro\s+(risk|headwinds?)/i,
      /market\s+(crash|collapse|freeze|slowdown|contraction)|demand\s+(drop|fall|slow)/i,
      /customer\s+(cautiousness|pullback|delay)\s+(spend|budget|purchase)/i,
    ],
    levers: { marketVolatility: 85, demandStrength: 28, executionRisk: 62 },
    confidence: 0.90,
  },

  // ── Operations ───────────────────────────────────────────────────────────
  {
    name: "ops_streamline",
    patterns: [
      /streamlin(e|ing)|process\s+(improv|optim|efficien)|automat(e|ing|ion)/i,
      /reduc(e|ing)\s+(overhead|bureaucracy|complexity|friction)|simplif(y|ication)/i,
      /operationally\s+(leaner?|efficient|tight)|remove\s+(bloat|inefficien)/i,
    ],
    levers: { operatingDrag: 22, costDiscipline: 74 },
    confidence: 0.78,
  },
  {
    name: "ops_overload",
    patterns: [
      /too\s+much\s+(complexity|overhead|debt|drag)|technical\s+debt\s+(is\s+)?slowing/i,
      /organi(s|z)ational\s+(drag|overhead|bloat)|slow(er)?\s+execution/i,
    ],
    levers: { operatingDrag: 78, executionRisk: 72 },
    confidence: 0.72,
  },

  // ── Capital / fundraising ─────────────────────────────────────────────────
  {
    name: "fundraise",
    patterns: [
      /rais(e|ing)\s+(a\s+)?(round|fund|capital|money)|fundrais(e|ing)|series\s+[a-e]\b/i,
      /close\s+(our\s+)?(round|fund)|new\s+(funding|investors?|round)\b/i,
      /\bvc\s+fund|\bangelsinvestors?\s+commit|seed\s+round\b/i,
    ],
    levers: { demandStrength: 65, hiringIntensity: 68, executionRisk: 40, marketVolatility: 45 },
    confidence: 0.75,
  },

  // ── Product ───────────────────────────────────────────────────────────────
  {
    name: "product_launch",
    patterns: [
      /launch\s+(a\s+)?(new\s+)?(product|feature|module|tier|version)\b/i,
      /new\s+product\s+(line|launch|release)|ship\s+a?\s*(new\s+)?major\s+release/i,
      /go\s+to\s+market\s+with\s+(our\s+new|\w+\s+new)/i,
    ],
    levers: { executionRisk: 68, demandStrength: 65, operatingDrag: 58 },
    confidence: 0.72,
  },

  // ── De-risk / preserve ────────────────────────────────────────────────────
  {
    name: "de_risk",
    patterns: [
      /de.?risk|conserv(e|ative)|cautious(ly)?|capital\s+preserv|preserv(e|ing)\s+cash/i,
      /\bdefensive\s+(posture|mode|strateg)|slow\s+(down\s+spend|our\s+burn)/i,
      /extend\s+(our\s+)?runway|survive\s+(the\s+)?downturn/i,
    ],
    levers: {
      costDiscipline:   84,
      hiringIntensity:  22,
      executionRisk:    28,
      marketVolatility: 35,
      operatingDrag:    28,
    },
    confidence: 0.85,
  },

  // ── Execution / delivery ──────────────────────────────────────────────────
  {
    name: "execution_focus",
    patterns: [
      /execut(e|ion)\s+(focus|disciplin|rigor|faster)|deliver\s+(faster|more|better)/i,
      /operational\s+excellence|flawless\s+execut|tighten\s+(our\s+)?execution/i,
    ],
    levers: { executionRisk: 28, operatingDrag: 30, costDiscipline: 68 },
    confidence: 0.75,
  },
]

// ── Intent-category fallbacks ─────────────────────────────────────────────
// Used when no keyword rules fire but detectScenarioIntent returned a category.

const INTENT_FALLBACKS: Record<string, Partial<Record<CanonicalLeverId, number>>> = {
  hiring:            { hiringIntensity: 72, costDiscipline: 42 },
  pricing:           { pricingPower: 72 },
  cost_reduction:    { costDiscipline: 80, hiringIntensity: 28 },
  growth_investment: { demandStrength: 72, hiringIntensity: 62, executionRisk: 55 },
  efficiency:        { operatingDrag: 28, costDiscipline: 72 },
  risk:              { marketVolatility: 75, executionRisk: 70 },
  capital:           { demandStrength: 62, hiringIntensity: 62 },
  growth:            { demandStrength: 68, hiringIntensity: 60, executionRisk: 52 },
}

// ── Validator / clamper ───────────────────────────────────────────────────

const CANONICAL_SET = new Set<string>(CANONICAL_LEVER_IDS)

function validateAndClamp(
  raw: Partial<Record<string, number>>,
): { safe: Partial<Record<CanonicalLeverId, number>>; illegalFields: string[] } {
  const safe: Partial<Record<CanonicalLeverId, number>> = {}
  const illegalFields: string[] = []

  for (const [key, val] of Object.entries(raw)) {
    if (!CANONICAL_SET.has(key)) {
      illegalFields.push(key)
      continue
    }
    if (typeof val !== "number" || !Number.isFinite(val)) {
      illegalFields.push(`${key}(non-numeric)`)
      continue
    }
    safe[key as CanonicalLeverId] = Math.max(0, Math.min(100, Math.round(val)))
  }

  return { safe, illegalFields }
}

// ── Weighted blend of multiple rule outputs ────────────────────────────────

function blendLeverValues(
  hits: Array<{ levers: Partial<Record<CanonicalLeverId, number>>; confidence: number }>,
): Partial<Record<CanonicalLeverId, number>> {
  const sums: Partial<Record<CanonicalLeverId, number>> = {}
  const weights: Partial<Record<CanonicalLeverId, number>> = {}

  for (const { levers, confidence } of hits) {
    for (const [key, val] of Object.entries(levers) as [CanonicalLeverId, number][]) {
      sums[key]   = (sums[key]   ?? 0) + val * confidence
      weights[key] = (weights[key] ?? 0) + confidence
    }
  }

  const blended: Partial<Record<CanonicalLeverId, number>> = {}
  for (const key of CANONICAL_LEVER_IDS) {
    const w = weights[key]
    if (w && w > 0) {
      blended[key] = Math.round((sums[key] ?? 0) / w)
    }
  }
  return blended
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Parse a free-text scenario description into canonical lever values.
 *
 * @param text     Raw user input (scenario description)
 * @param intent   Optional pre-computed intent from detectScenarioIntent()
 * @returns        ParsedLeverOutput — deterministic, validated, clamped
 */
export function parseScenarioLevers(
  text: string,
  intent?: DetectedIntent | null,
): ParsedLeverOutput {
  const warnings: string[] = []
  const matchedRules: string[] = []

  // ── 1. Run keyword rules ───────────────────────────────────────────────
  const hits: Array<{ levers: Partial<Record<CanonicalLeverId, number>>; confidence: number }> = []

  for (const rule of RULES) {
    const fired = rule.patterns.some((p) => p.test(text))
    if (!fired) continue

    // Validate the rule's lever definitions (catches accidental non-canonical fields)
    const { safe, illegalFields } = validateAndClamp(rule.levers as Record<string, number>)
    if (illegalFields.length > 0) {
      warnings.push(`Rule "${rule.name}" contains illegal fields: ${illegalFields.join(", ")} — skipped`)
      continue
    }

    hits.push({ levers: safe, confidence: rule.confidence })
    matchedRules.push(rule.name)
  }

  // ── 2. Detect conflicting signals ─────────────────────────────────────
  if (matchedRules.includes("hiring_expand") && matchedRules.includes("hiring_freeze")) {
    warnings.push("Conflicting hiring signals detected — blending both rules.")
  }
  if (matchedRules.includes("pricing_increase") && matchedRules.includes("pricing_decrease")) {
    warnings.push("Conflicting pricing signals detected — blending both rules.")
  }
  if (matchedRules.includes("growth_aggressive") && matchedRules.includes("de_risk")) {
    warnings.push("Growth-vs-de-risk conflict — blending. Consider refining the scenario.")
  }

  // ── 3. Blend matched rules → raw lever values ─────────────────────────
  let source: ParsedLeverOutput["source"] = "keyword"
  let rawLevers: Partial<Record<CanonicalLeverId, number>> = {}

  if (hits.length > 0) {
    rawLevers = blendLeverValues(hits)
  } else if (intent?.scenarioType && INTENT_FALLBACKS[intent.scenarioType]) {
    // Intent-based fallback — lower confidence, broader strokes
    const fallback = INTENT_FALLBACKS[intent.scenarioType]!
    const { safe } = validateAndClamp(fallback as Record<string, number>)
    rawLevers = safe
    source = "intent_fallback"
    warnings.push(`No keyword rules fired. Using intent fallback for "${intent.scenarioType}".`)
  } else {
    source = "default"
    warnings.push("No patterns matched and no intent provided. Returning neutral lever values.")
  }

  // ── 4. Build allLevers: merge parsed values over neutral baseline ───────
  const allLevers: Record<CanonicalLeverId, number> = { ...NEUTRAL }
  for (const key of CANONICAL_LEVER_IDS) {
    if (rawLevers[key] !== undefined) {
      allLevers[key] = rawLevers[key]!
    }
  }

  // ── 5. Build levers: only fields that deviated from neutral ─────────────
  const levers: Partial<LeverValues> = {}
  for (const key of CANONICAL_LEVER_IDS) {
    if (allLevers[key] !== NEUTRAL[key]) {
      levers[key] = allLevers[key]
    }
  }

  // ── 6. Overall confidence ─────────────────────────────────────────────
  const confidence = hits.length > 0
    ? Math.max(...hits.map((h) => h.confidence))
    : source === "intent_fallback" ? 0.40 : 0.0

  return {
    levers,
    allLevers,
    confidence,
    matchedRules,
    source,
    warnings,
    inputText: text,
  }
}
