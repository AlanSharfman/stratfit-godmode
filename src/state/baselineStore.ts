// src/state/baselineStore.ts
export type BaselineStepId = "identity" | "financial" | "operating" | "intent";

export interface BaselineState {
  locked: boolean;
  activeStep: BaselineStepId;
  cash: number;
  monthlyBurn: number;
  arr: number;
  monthlyGrowth: number;
  monthlyChurn: number;
  nrr: number;
  headcount: number;
  avgCost: number;
  sm: number;
  rnd: number;
  ga: number;
}

const STORAGE_KEY = "stratfit:baseline:v1";

const defaultState: BaselineState = {
  locked: false,
  activeStep: "financial",
  cash: 500000,
  monthlyBurn: 75000,
  arr: 1200000,
  monthlyGrowth: 8,
  monthlyChurn: 3,
  nrr: 110,
  headcount: 18,
  avgCost: 140000,
  sm: 60000,
  rnd: 80000,
  ga: 40000,
};

type Listener = () => void;

function hasLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function load(): BaselineState {
  try {
    if (!hasLocalStorage()) return { ...defaultState };
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw) as Partial<BaselineState>;
    return { ...defaultState, ...parsed };
  } catch {
    return { ...defaultState };
  }
}

function persist(next: BaselineState) {
  try {
    if (!hasLocalStorage()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

let state: BaselineState = load();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function getBaselineState(): BaselineState {
  return state;
}

export function subscribeBaseline(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setBaselinePatch(patch: Partial<BaselineState>) {
  if (state.locked) {
    if (patch.locked === false) return;
    if (patch.activeStep && patch.activeStep !== state.activeStep) {
      state = { ...state, activeStep: patch.activeStep };
      persist(state);
      emit();
    }
    return;
  }
  state = { ...state, ...patch };
  persist(state);
  emit();
}

export function lockBaseline() {
  if (state.locked) return;
  state = { ...state, locked: true };
  persist(state);
  emit();
}

export function unlockBaseline_DEV_ONLY() {
  state = { ...state, locked: false };
  persist(state);
  emit();
}


