import { DecisionIntent } from "../types/DecisionIntent"

export async function interpretDecision(
  decisionText: string
): Promise<DecisionIntent> {
  // TEMP deterministic interpretation
  // (LLM integration will replace this)

  return {
    category: "other",
    description: decisionText,
    deltas: {},
    timing: {
      startMonth: 0,
      durationMonths: null,
      isOneOff: true,
    },
    assumptions: [],
    confidence: 0.5,
  }
}
