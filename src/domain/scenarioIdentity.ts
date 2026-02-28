// src/domain/scenarioIdentity.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — ScenarioIdentity contract
// Canonical identity object generated when a decision is submitted.
// Flows into: scenarioStore → ScenarioContextPanel → AI panel → Compare layer
// ═══════════════════════════════════════════════════════════════════════════

export interface ScenarioIdentity {
  /** Unique scenario ID (UUID or prefixed random) */
  id: string;

  /** Human-readable scenario title (auto-generated from decision) */
  title: string;

  /** The decision question that spawned this scenario */
  decisionQuestion: string;

  /** Creation timestamp (ms since epoch) */
  createdAt: number;

  /** Reference to the baseline snapshot used for simulation */
  baselineId: string;

  /** Top 3 assumptions derived from the decision intent */
  assumptionsSummary: string[];
}

/**
 * Build a ScenarioIdentity from a decision question and baseline reference.
 *
 * Assumptions are derived from the decision text heuristically:
 *   - If decision mentions hiring → headcount assumption
 *   - If decision mentions pricing/revenue → unit economics assumption
 *   - If decision mentions fundraise/capital → runway assumption
 *   - Default fallback assumptions always included
 */
export function buildScenarioIdentity(
  id: string,
  decisionQuestion: string,
  baselineId: string,
  createdAt?: number,
): ScenarioIdentity {
  const ts = createdAt ?? Date.now();
  const lower = decisionQuestion.toLowerCase();

  // Generate a short title from the first 48 chars of the decision
  const title = decisionQuestion.length > 48
    ? `${decisionQuestion.slice(0, 45)}...`
    : decisionQuestion;

  // Derive top-3 assumptions heuristically from decision keywords
  const assumptions: string[] = [];

  if (/hire|headcount|team|staff|recruit/i.test(lower)) {
    assumptions.push("Headcount ramp follows linear hiring plan");
  }
  if (/price|pricing|revenue|arr|contract/i.test(lower)) {
    assumptions.push("Unit economics remain within baseline gross margin");
  }
  if (/raise|fund|capital|runway|invest/i.test(lower)) {
    assumptions.push("Capital deployment maintains current burn trajectory");
  }
  if (/cut|reduce|cost|efficiency|lean/i.test(lower)) {
    assumptions.push("Cost reduction does not impair revenue capacity");
  }
  if (/expand|market|geo|segment/i.test(lower)) {
    assumptions.push("Market expansion assumes baseline customer acquisition cost");
  }

  // Fill to 3 with defaults
  const defaults = [
    "Growth rate maintains baseline trajectory",
    "No external shocks to market conditions",
    "Operating leverage follows current model",
  ];
  for (const d of defaults) {
    if (assumptions.length >= 3) break;
    if (!assumptions.includes(d)) assumptions.push(d);
  }

  return {
    id,
    title,
    decisionQuestion,
    createdAt: ts,
    baselineId,
    assumptionsSummary: assumptions.slice(0, 3),
  };
}
