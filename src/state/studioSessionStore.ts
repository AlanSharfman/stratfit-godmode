import type { QuestionContext } from "@/domain/question/questionContext";
import type { ScenarioDraft } from "@/domain/scenario/scenarioDraft";

export type StudioRuntime = {
  questionContext: QuestionContext;
  scenarioDraft: ScenarioDraft;
};

const SESSION_KEY = "sf.studio.runtime.v1";

type Listener = (rt: StudioRuntime | null) => void;

let runtime: StudioRuntime | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l(runtime);
}

function persist(rt: StudioRuntime | null) {
  try {
    if (!rt) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(rt));
  } catch {
    // ignore storage failures
  }
}

function restoreFromSession(): StudioRuntime | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudioRuntime;

    // Minimal deterministic shape validation
    if (
      !parsed?.questionContext?.id ||
      !parsed?.questionContext?.question ||
      !parsed?.scenarioDraft?.id ||
      !parsed?.scenarioDraft?.name
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export const studioSessionStore = {
  get(): StudioRuntime | null {
    if (runtime) return runtime;
    const restored = restoreFromSession();
    runtime = restored;
    return runtime;
  },

  seed(next: StudioRuntime) {
    runtime = next;
    persist(next);
    notify();
  },

  clear() {
    runtime = null;
    persist(null);
    notify();
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
