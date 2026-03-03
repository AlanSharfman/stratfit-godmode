// src/stores/simulationPipelineStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Simulation Pipeline Store (REV 2)
//
// Tracks which analysis stages are actually executed in a given run.
// Only reflects real computation — never fabricates stages.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand";

// ────────────────────────────────────────────────────────────────────────────
// PIPELINE STAGES
// ────────────────────────────────────────────────────────────────────────────

export type PipelineStage =
  | "idle"
  | "baseline_ingestion"
  | "scenario_compilation"
  | "model_calibration"
  | "simulation_run"
  | "sensitivity_analysis"
  | "stress_testing"
  | "valuation_pass"
  | "probability_mapping"
  | "terrain_synthesis"
  | "render_complete";

/** Human-readable stage labels */
export const PIPELINE_LABELS: Record<PipelineStage, string> = {
  idle: "Idle",
  baseline_ingestion: "Baseline Ingestion",
  scenario_compilation: "Scenario Compilation",
  model_calibration: "Model Calibration",
  simulation_run: "Simulation Run",
  sensitivity_analysis: "Sensitivity Analysis",
  stress_testing: "Stress Testing",
  valuation_pass: "Valuation Pass",
  probability_mapping: "Probability Mapping",
  terrain_synthesis: "Terrain Synthesis",
  render_complete: "Render Complete",
};

// ────────────────────────────────────────────────────────────────────────────
// META
// ────────────────────────────────────────────────────────────────────────────

export interface PipelineMeta {
  /** Only if stochastic simulation used */
  paths?: number;
  /** Only if sensitivity analysis used */
  sensitivityVars?: number;
  /** Only if stress testing used */
  stressCases?: number;
  /** Only if valuation used */
  valuationMethods?: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────────────────────────

export interface PipelineState {
  runId: number;
  activeStages: PipelineStage[];
  currentStage: PipelineStage;
  startedAt: number | null;
  completedAt: number | null;
  meta: PipelineMeta;
}

export interface PipelineActions {
  startRun(config: { activeStages: PipelineStage[]; meta?: PipelineMeta }): void;
  setStage(stage: PipelineStage): void;
  completeRun(): void;
}

export type PipelineStore = PipelineState & PipelineActions;

// ────────────────────────────────────────────────────────────────────────────
// INITIAL
// ────────────────────────────────────────────────────────────────────────────

const INITIAL: PipelineState = {
  runId: 0,
  activeStages: [],
  currentStage: "idle",
  startedAt: null,
  completedAt: null,
  meta: {},
};

// ────────────────────────────────────────────────────────────────────────────
// STORE
// ────────────────────────────────────────────────────────────────────────────

export const useSimulationPipelineStore = create<PipelineStore>((set, get) => ({
  ...INITIAL,

  startRun: ({ activeStages, meta }) => {
    const nextId = get().runId + 1;
    set({
      runId: nextId,
      activeStages,
      currentStage: activeStages[0] ?? "idle",
      startedAt: performance.now(),
      completedAt: null,
      meta: meta ?? {},
    });
  },

  setStage: (stage) => {
    set({ currentStage: stage });
  },

  completeRun: () => {
    set({
      currentStage: "render_complete",
      completedAt: performance.now(),
    });
  },
}));

// ────────────────────────────────────────────────────────────────────────────
// NON-REACT ACCESS (for engine code outside React)
// ────────────────────────────────────────────────────────────────────────────

export const simulationPipeline = {
  start: (config: { activeStages: PipelineStage[]; meta?: PipelineMeta }) =>
    useSimulationPipelineStore.getState().startRun(config),
  setStage: (stage: PipelineStage) =>
    useSimulationPipelineStore.getState().setStage(stage),
  complete: () =>
    useSimulationPipelineStore.getState().completeRun(),
};
