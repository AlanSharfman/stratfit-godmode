import { QuestionCategory } from "@/domain/question/questionClassifier";

export interface QuestionContext {
  id: string;
  question: string;
  category: QuestionCategory;
  createdAtISO: string;
}

function stableIdFromTime(nowMs: number) {
  // Deterministic within runtime: based on timestamp only (no randomness).
  return `q_${nowMs}`;
}

export function buildQuestionContext(
  question: string,
  category: QuestionCategory,
  nowMs: number = Date.now()
): QuestionContext {
  return {
    id: stableIdFromTime(nowMs),
    question,
    category,
    createdAtISO: new Date(nowMs).toISOString(),
  };
}
