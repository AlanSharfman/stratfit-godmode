import type { QuestionContext } from "@/domain/question/questionContext";
import type { ScenarioDraft } from "@/domain/scenario/scenarioDraft";

export type StudioRuntime = {
  questionContext: QuestionContext;
  scenarioDraft: ScenarioDraft;
};

const SESSION_KEY = "sf.studio.runtime.v1";

// Module-scope runtime (in-memory)
let runtime: StudioRuntime | null = null;

export function setStudioRuntime(next: StudioRuntime) {
  runtime = next;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // ignore storage failures (private mode etc)
  }
}

export function getStudioRuntime(): StudioRuntime | null {
  if (runtime) return runtime;

  // Attempt restore from session storage (deterministic within session)
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudioRuntime;

    // Minimal shape check
    if (
      !parsed?.questionContext?.id ||
      !parsed?.questionContext?.question ||
      !parsed?.scenarioDraft?.id ||
      !parsed?.scenarioDraft?.name
    ) {
      return null;
    }

    runtime = parsed;
    return runtime;
  } catch {
    return null;
  }
}

export function clearStudioRuntime() {
  runtime = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
