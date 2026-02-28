// src/engine/intentTemplates.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intent-Aware Intelligence Templates
//
// Deterministic reorder of intelligence rows based on decisionIntentType.
// NO content modification. NO AI classification. Formatting/ordering only.
//
// Each row from extractRows() is tagged with a semantic RowTag.
// Templates define display priority per intent type.
// ═══════════════════════════════════════════════════════════════════════════

import type { DecisionIntentType } from "@/state/phase1ScenarioStore"

/* ── Row tags — semantic labels for each row type ── */

export type RowTag =
  | "executive_summary"
  | "driver_revenue"
  | "driver_burn"
  | "driver_capital"
  | "driver_generic"
  | "risk_narrative"
  | "signal_revenue"
  | "signal_burn"
  | "signal_capital"
  | "signal_generic"

export interface TaggedRow {
  tag: RowTag
  text: string
}

/* ── Tag assignment heuristics — match row content to semantic tag ── */

const BURN_KEYWORDS = /burn|cost|expense|margin|efficiency/i
const REVENUE_KEYWORDS = /revenue|arr|growth|pricing|arpa|momentum/i
const CAPITAL_KEYWORDS = /runway|capital|cash|survival|funding|contingency/i

function classifyDriverTag(text: string): RowTag {
  if (BURN_KEYWORDS.test(text)) return "driver_burn"
  if (REVENUE_KEYWORDS.test(text)) return "driver_revenue"
  if (CAPITAL_KEYWORDS.test(text)) return "driver_capital"
  return "driver_generic"
}

function classifySignalTag(text: string): RowTag {
  if (BURN_KEYWORDS.test(text)) return "signal_burn"
  if (REVENUE_KEYWORDS.test(text)) return "signal_revenue"
  if (CAPITAL_KEYWORDS.test(text)) return "signal_capital"
  return "signal_generic"
}

/**
 * Tag raw rows from extractRows() with semantic labels.
 * Positional convention: idx 0 = summary, 1..n-2 = drivers, n-1 = risk, last = signal
 */
export function tagRows(rows: string[]): TaggedRow[] {
  if (rows.length === 0) return []

  const tagged: TaggedRow[] = []

  for (let i = 0; i < rows.length; i++) {
    const text = rows[i]

    if (i === 0) {
      // Executive summary — always first in raw output
      tagged.push({ tag: "executive_summary", text })
    } else if (i === rows.length - 2) {
      // Risk narrative — second to last
      tagged.push({ tag: "risk_narrative", text })
    } else if (i === rows.length - 1) {
      // Probability signal — last
      tagged.push({ tag: classifySignalTag(text), text })
    } else {
      // Driver rows — middle section
      tagged.push({ tag: classifyDriverTag(text), text })
    }
  }

  return tagged
}

/* ── Template priority maps ── */
// Each template defines the preferred tag order.
// Rows matching earlier tags appear first. Unmatched rows keep relative order at the end.

type TemplatePriority = RowTag[]

const TEMPLATE_PRIORITIES: Record<DecisionIntentType, TemplatePriority> = {
  hiring: [
    "executive_summary",
    "driver_capital",    // Runway shift
    "driver_burn",       // Burn impact
    "signal_capital",    // Execution risk / capacity
    "driver_revenue",    // Growth signal
    "risk_narrative",
    "signal_generic",
  ],
  pricing: [
    "executive_summary",
    "driver_revenue",    // ARR sensitivity
    "driver_burn",       // Margin effect
    "signal_revenue",    // Churn / revenue dispersion
    "risk_narrative",
    "signal_burn",
    "signal_generic",
  ],
  cost_reduction: [
    "executive_summary",
    "driver_burn",       // Burn reduction
    "driver_capital",    // Runway extension
    "signal_burn",       // Efficiency signal
    "risk_narrative",
    "driver_revenue",
    "signal_generic",
  ],
  fundraising: [
    "executive_summary",
    "signal_capital",    // Survival distribution
    "driver_capital",    // Runway buffer
    "risk_narrative",    // Downside protection
    "driver_burn",       // Stability signal
    "signal_generic",
    "driver_revenue",
  ],
  growth_investment: [
    "executive_summary",
    "driver_revenue",    // Growth uplift
    "driver_burn",       // Burn tradeoff
    "signal_revenue",    // Payback signal
    "risk_narrative",    // Risk envelope
    "signal_generic",
  ],
  other: [
    // Default ordering — no reorder, keep as-is
    "executive_summary",
    "driver_revenue",
    "driver_burn",
    "driver_capital",
    "driver_generic",
    "risk_narrative",
    "signal_revenue",
    "signal_burn",
    "signal_capital",
    "signal_generic",
  ],
}

/**
 * Reorder intelligence rows based on decisionIntentType template.
 *
 * Rules:
 * - Does NOT modify text content — reorder only
 * - Falls back safely if rows missing (returns whatever exists)
 * - Max 7 rows output
 * - "other" / undefined → preserve original order
 */
export function selectIntentOrderedRows(
  intentType: DecisionIntentType | undefined,
  rows: string[],
): string[] {
  if (rows.length === 0) return rows
  if (!intentType || intentType === "other") return rows.slice(0, 7)

  const tagged = tagRows(rows)
  const priority = TEMPLATE_PRIORITIES[intentType]

  const used = new Set<number>()
  const ordered: string[] = []

  // Place rows in template priority order
  for (const targetTag of priority) {
    for (let i = 0; i < tagged.length; i++) {
      if (!used.has(i) && tagged[i].tag === targetTag) {
        ordered.push(tagged[i].text)
        used.add(i)
        break // one row per tag slot
      }
    }
  }

  // Append any remaining rows not yet placed (preserves relative order)
  for (let i = 0; i < tagged.length; i++) {
    if (!used.has(i)) {
      ordered.push(tagged[i].text)
    }
  }

  return ordered.slice(0, 7)
}
