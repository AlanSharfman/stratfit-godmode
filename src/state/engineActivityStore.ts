// src/state/engineActivityStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Engine Activity Store
//
// Single source of truth for simulation activity telemetry.
// Driven by REAL engine state — never fakes data.
//
// Zustand store — consistent with architecture.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand";

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type EngineStage =
  | "IDLE"
  | "INITIALIZING"
  | "SAMPLING"
  | "AGGREGATING"
  | "CONVERGING"
  | "FINALIZING"
  | "COMPLETE"
  | "ERROR";

export interface EngineActivityState {
  isRunning: boolean;
  stage: EngineStage;
  iterationsTarget: number;
  iterationsCompleted: number;
  durationMs: number;
  startedAt?: number;
  seed?: number;
  modelType?: string;
  message?: string;
  error?: string;
}

export interface EngineActivityActions {
  start(payload: {
    iterationsTarget: number;
    seed?: number;
    modelType?: string;
  }): void;
  update(payload: Partial<EngineActivityState>): void;
  complete(): void;
  fail(error: string): void;
  reset(): void;
}

export type EngineActivityStore = EngineActivityState & EngineActivityActions;

// ────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ────────────────────────────────────────────────────────────────────────────

const INITIAL_STATE: EngineActivityState = {
  isRunning: false,
  stage: "IDLE",
  iterationsTarget: 0,
  iterationsCompleted: 0,
  durationMs: 0,
  startedAt: undefined,
  seed: undefined,
  modelType: undefined,
  message: undefined,
  error: undefined,
};

// ────────────────────────────────────────────────────────────────────────────
// STORE
// ────────────────────────────────────────────────────────────────────────────

export const useEngineActivityStore = create<EngineActivityStore>((set, get) => ({
  ...INITIAL_STATE,

  start: (payload) => {
    set({
      isRunning: true,
      stage: "INITIALIZING",
      iterationsTarget: payload.iterationsTarget,
      iterationsCompleted: 0,
      durationMs: 0,
      startedAt: performance.now(),
      seed: payload.seed,
      modelType: payload.modelType ?? "MonteCarlo",
      message: "Initializing simulation engine…",
      error: undefined,
    });
  },

  update: (payload) => {
    const state = get();
    const elapsed = state.startedAt != null ? performance.now() - state.startedAt : 0;
    set({
      ...payload,
      durationMs: elapsed,
    });
  },

  complete: () => {
    const state = get();
    const elapsed = state.startedAt != null ? performance.now() - state.startedAt : 0;
    set({
      isRunning: false,
      stage: "COMPLETE",
      iterationsCompleted: state.iterationsTarget,
      durationMs: elapsed,
      message: "Simulation complete.",
    });
  },

  fail: (error) => {
    const state = get();
    const elapsed = state.startedAt != null ? performance.now() - state.startedAt : 0;
    set({
      isRunning: false,
      stage: "ERROR",
      durationMs: elapsed,
      error,
      message: `Error: ${error}`,
    });
  },

  reset: () => {
    set(INITIAL_STATE);
  },
}));

// ────────────────────────────────────────────────────────────────────────────
// NON-REACT ACCESS (for use in engine code outside React)
// ────────────────────────────────────────────────────────────────────────────

export const engineActivity = {
  start: (payload: { iterationsTarget: number; seed?: number; modelType?: string }) =>
    useEngineActivityStore.getState().start(payload),
  update: (payload: Partial<EngineActivityState>) =>
    useEngineActivityStore.getState().update(payload),
  complete: () =>
    useEngineActivityStore.getState().complete(),
  fail: (error: string) =>
    useEngineActivityStore.getState().fail(error),
  reset: () =>
    useEngineActivityStore.getState().reset(),
};

