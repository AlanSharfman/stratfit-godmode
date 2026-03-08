// src/state/simulationEngineStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Simulation Engine Pipeline Store
//
// Tracks fine-grained pipeline stages for the simulation engine lifecycle.
// Consumed by SimulationStatusWidget + SimulationRunOverlay.
// Zustand store — matches architecture.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand";

// ────────────────────────────────────────────────────────────────────────────
// PIPELINE STAGES
// ────────────────────────────────────────────────────────────────────────────

export type SimulationStage =
  | "idle"
  | "baseline_capture"
  | "scenario_construction"
  | "model_calibration"
  | "monte_carlo"
  | "probability_mapping"
  | "terrain_render"
  | "complete";

export const STAGE_LABELS: Record<SimulationStage, string> = {
  idle: "Idle",
  baseline_capture: "Baseline Capture",
  scenario_construction: "Scenario Construction",
  model_calibration: "Model Calibration",
  monte_carlo: "Monte Carlo Simulation",
  probability_mapping: "Probability Mapping",
  terrain_render: "Terrain Render",
  complete: "Complete",
};

export const STAGE_ORDER: SimulationStage[] = [
  "baseline_capture",
  "scenario_construction",
  "model_calibration",
  "monte_carlo",
  "probability_mapping",
  "terrain_render",
  "complete",
];

// ────────────────────────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────────────────────────

export interface SimulationEngineState {
  runId: string | null;
  stage: SimulationStage;
  progress: number; // 0–1
  startedAt: number | null;
  completedAt: number | null;
  simulationPaths: number;
  runCount: number;
}

export interface SimulationEngineActions {
  setStage(stage: SimulationStage): void;
  setProgress(progress: number): void;
  startSimulation(paths?: number): void;
  completeSimulation(): void;
  reset(): void;
}

export type SimulationEngineStore = SimulationEngineState & SimulationEngineActions;

// ────────────────────────────────────────────────────────────────────────────
// INITIAL
// ────────────────────────────────────────────────────────────────────────────

const INITIAL: SimulationEngineState = {
  runId: null,
  stage: "idle",
  progress: 0,
  startedAt: null,
  completedAt: null,
  simulationPaths: 0,
  runCount: 0,
};

function generateRunId(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

// ────────────────────────────────────────────────────────────────────────────
// STORE
// ────────────────────────────────────────────────────────────────────────────

export const useSimulationEngineStore = create<SimulationEngineStore>((set, get) => ({
  ...INITIAL,

  setStage: (stage) => {
    const idx = STAGE_ORDER.indexOf(stage);
    const progress = idx >= 0 ? idx / (STAGE_ORDER.length - 1) : 0;
    set({ stage, progress });
  },

  setProgress: (progress) => {
    set({ progress: Math.max(0, Math.min(1, progress)) });
  },

  startSimulation: (paths = 10_000) => {
    set({
      runId: generateRunId(),
      stage: "baseline_capture",
      progress: 0,
      startedAt: performance.now(),
      completedAt: null,
      simulationPaths: paths,
      runCount: get().runCount + 1,
    });
  },

  completeSimulation: () => {
    set({
      stage: "complete",
      progress: 1,
      completedAt: performance.now(),
    });
  },

  reset: () => {
    set(INITIAL);
  },
}));

// ────────────────────────────────────────────────────────────────────────────
// NON-REACT ACCESS (for engine code outside React)
// ────────────────────────────────────────────────────────────────────────────

export const simulationEngine = {
  start: (paths?: number) => useSimulationEngineStore.getState().startSimulation(paths),
  setStage: (s: SimulationStage) => useSimulationEngineStore.getState().setStage(s),
  setProgress: (p: number) => useSimulationEngineStore.getState().setProgress(p),
  complete: () => useSimulationEngineStore.getState().completeSimulation(),
  reset: () => useSimulationEngineStore.getState().reset(),
};
