// src/state/objectiveStore.ts
// STRATFIT — Objective Store (Zustand)

import { create } from "zustand";
import {
  computeObjective,
  type ObjectiveMode,
  type ObjectiveTargets,
  type ObjectiveResult,
} from "@/logic/objectiveEngine";

// ---------------------------------------------------------------------------
// DEFAULTS
// ---------------------------------------------------------------------------

const DEFAULT_TARGETS: ObjectiveTargets = {
  arr: 10_000_000,
  growth: 50,
  grossMargin: 70,
  burn: 200_000,
  runway: 18,
  survival: 75,
};

const DEFAULT_HORIZON = 24;
const DEFAULT_MODE: ObjectiveMode = "base";

// ---------------------------------------------------------------------------
// STORE INTERFACE
// ---------------------------------------------------------------------------

export interface ObjectiveStoreState {
  // Inputs
  horizonMonths: number;
  targets: ObjectiveTargets;
  mode: ObjectiveMode;

  // Derived (recomputed on every input change)
  result: ObjectiveResult;

  // Actions
  setHorizon: (months: number) => void;
  setMode: (mode: ObjectiveMode) => void;
  setTarget: <K extends keyof ObjectiveTargets>(key: K, value: ObjectiveTargets[K]) => void;
  setTargets: (targets: Partial<ObjectiveTargets>) => void;
  reset: () => void;
}

function recompute(
  horizonMonths: number,
  targets: ObjectiveTargets,
  mode: ObjectiveMode,
): ObjectiveResult {
  return computeObjective({ horizonMonths, targets, mode });
}

// ---------------------------------------------------------------------------
// STORE
// ---------------------------------------------------------------------------

export const useObjectiveStore = create<ObjectiveStoreState>((set) => ({
  horizonMonths: DEFAULT_HORIZON,
  targets: { ...DEFAULT_TARGETS },
  mode: DEFAULT_MODE,
  result: recompute(DEFAULT_HORIZON, DEFAULT_TARGETS, DEFAULT_MODE),

  setHorizon: (months) =>
    set((s) => {
      const result = recompute(months, s.targets, s.mode);
      return { horizonMonths: months, result };
    }),

  setMode: (mode) =>
    set((s) => {
      const result = recompute(s.horizonMonths, s.targets, mode);
      return { mode, result };
    }),

  setTarget: (key, value) =>
    set((s) => {
      const targets = { ...s.targets, [key]: value };
      const result = recompute(s.horizonMonths, targets, s.mode);
      return { targets, result };
    }),

  setTargets: (partial) =>
    set((s) => {
      const targets = { ...s.targets, ...partial };
      const result = recompute(s.horizonMonths, targets, s.mode);
      return { targets, result };
    }),

  reset: () =>
    set(() => ({
      horizonMonths: DEFAULT_HORIZON,
      targets: { ...DEFAULT_TARGETS },
      mode: DEFAULT_MODE,
      result: recompute(DEFAULT_HORIZON, DEFAULT_TARGETS, DEFAULT_MODE),
    })),
}));
