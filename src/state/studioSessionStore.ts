import type { QuestionContext } from "@/domain/question/questionContext";
import type { ScenarioDraft } from "@/domain/scenario/scenarioDraft";

export type StudioRuntime = {
  questionContext: QuestionContext;
  scenarios: ScenarioDraft[];
};

const SESSION_KEY = "sf.studio.runtime.v2";

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
  } catch {}
}

function restoreFromSession(): StudioRuntime | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const studioSessionStore = {
  get(): StudioRuntime | null {
    if (runtime) return runtime;
    runtime = restoreFromSession();
    return runtime;
  },

  seed(initial: { questionContext: QuestionContext; scenarioA: ScenarioDraft }) {
    runtime = {
      questionContext: initial.questionContext,
      scenarios: [initial.scenarioA],
    };
    persist(runtime);
    notify();
  },

  addScenario(s: ScenarioDraft) {
    if (!runtime) return;
    runtime = {
      ...runtime,
      scenarios: [...runtime.scenarios, s],
    };
    persist(runtime);
    notify();
  },

  isCompareReady(): boolean {
    return !!runtime && runtime.scenarios.length > 1;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  clear() {
    runtime = null;
    persist(null);
    notify();
  },
};
