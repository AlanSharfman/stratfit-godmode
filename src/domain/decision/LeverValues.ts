// src/domain/decision/LeverValues.ts
// ═══════════════════════════════════════════════════════════════
// Canonical lever values type + normalization utility.
// Used by phase1ScenarioStore, DecisionPage, and simulation engine.
// ═══════════════════════════════════════════════════════════════

/** Map of lever ID → numeric value */
export type LeverValues = Record<string, number>

/**
 * Normalize lever values — ensure all values are finite numbers.
 * Returns {} if input is undefined/null.
 * Replaces NaN/Infinity with 0.
 */
export function normalizeLeverValues(input?: LeverValues | null): LeverValues {
  if (!input) return {}
  const out: LeverValues = {}
  for (const [key, val] of Object.entries(input)) {
    out[key] = Number.isFinite(val) ? val : 0
  }
  return out
}

/**
 * Stable-stringify lever values for deterministic hashing.
 * Keys sorted alphabetically, formatted as "key=value" joined by ";".
 */
export function stableStringifyLevers(levers: LeverValues): string {
  const keys = Object.keys(levers).sort()
  if (keys.length === 0) return ""
  return keys.map((k) => `${k}=${levers[k]}`).join(";")
}
