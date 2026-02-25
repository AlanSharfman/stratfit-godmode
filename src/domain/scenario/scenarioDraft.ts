import { QuestionContext } from "@/domain/question/questionContext";

export interface ScenarioDraft {
  id: string;
  name: string;
  createdAtISO: string;
  questionContext: QuestionContext;

  // Minimal stub fields for MVP wiring (expanded later in Scenario model step-ups)
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

function stableScenarioIdFromQuestion(qid: string) {
  return `sA_${qid}`;
}

export function buildScenarioADraft(
  questionContext: QuestionContext,
  nowMs: number = Date.now()
): ScenarioDraft {
  return {
    id: stableScenarioIdFromQuestion(questionContext.id),
    name: "Scenario A",
    createdAtISO: new Date(nowMs).toISOString(),
    questionContext,
    inputs: {},
    outputs: {},
  };
}
