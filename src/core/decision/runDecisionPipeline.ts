import { interpretDecision } from "./services/interpretDecision"
import { applyDecisionDelta } from "./services/applyDecisionDelta"
import { DecisionIntent } from "./types/DecisionIntent"

export interface DecisionPipelineResult<TBaseline> {
  intent: DecisionIntent
  modifiedBaseline: TBaseline
}

export async function runDecisionPipeline<TBaseline>(
  decisionText: string,
  baseline: TBaseline
): Promise<DecisionPipelineResult<TBaseline>> {
  const intent = await interpretDecision(decisionText)

  const modifiedBaseline = applyDecisionDelta(baseline, intent.deltas)

  return {
    intent,
    modifiedBaseline,
  }
}
