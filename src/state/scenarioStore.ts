// src/state/scenarioStore.ts
// STRATFIT — Deterministic Engine State
// Two Views, One Engine, Same Truth

import { create } from "zustand";
import type { LeverId } from "@/logic/mountainPeakModel";
import type { ScenarioId } from "@/types/domain";

export type { ScenarioId } from "@/types/domain";

// ============================================================================

// TYPES
// ============================================================================

export type ViewMode = "operator" | "investor";

export interface EngineResult {
  kpis: Record<string, { value: number; display: string }>;
}

// ============================================================================
// SCENARIO COLORS
// ============================================================================

export const SCENARIO_COLORS: Record<ScenarioId, { primary: string; secondary: string; glow: string }> = {
  base: {
    primary: "#22d3ee",
    secondary: "#7c3aed",
    glow: "rgba(34, 211, 238, 0.4)",
  },
  upside: {
    primary: "#34d399",
    secondary: "#22d3ee",
    glow: "rgba(52, 211, 153, 0.4)",
  },
  downside: {
    primary: "#fbbf24",
    secondary: "#f97316",
    glow: "rgba(251, 191, 36, 0.4)",
  },
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

export type ScenarioStoreState = {
  // View Mode: Operator or Investor
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;

  dataPoints: number[];
  setDataPoints: (dp: number[]) => void;

  hoveredKpiIndex: number | null;
  setHoveredKpiIndex: (i: number | null) => void;

  activeLeverId: LeverId | null;
  leverIntensity01: number;
  setActiveLever: (id: LeverId | null, intensity01: number) => void;

  getScenarioColors: () => { primary: string; secondary: string; glow: string };
  
  // Motion amplitude based on view
  getMotionAmplitude: () => number;

  // Scenario Delta Snapshot toggle (persisted to localStorage)
  showScenarioImpact: boolean;
  setShowScenarioImpact: (show: boolean) => void;
  toggleScenarioImpact: () => void;

  activeScenarioId: ScenarioId;
  comparisonTargetScenarioId: ScenarioId | null;
  engineResults: Record<ScenarioId, EngineResult>;
  setEngineResult: (scenarioId: ScenarioId, result: EngineResult) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useScenarioStore = create<ScenarioStoreState>((set, get) => ({
  viewMode: "operator",
  setViewMode: (v) => set({ viewMode: v }),

  scenario: "base",
  setScenario: (s) => set({ scenario: s }),

  dataPoints: [],
  setDataPoints: (dp) => set({ dataPoints: Array.isArray(dp) ? dp : [] }),

  hoveredKpiIndex: null,
  setHoveredKpiIndex: (i) => set({ hoveredKpiIndex: i }),

  activeLeverId: null,
  leverIntensity01: 0,
  setActiveLever: (id, intensity01) =>
    set({ activeLeverId: id, leverIntensity01: Math.max(0, Math.min(1, intensity01)) }),

  getScenarioColors: () => {
    const scenario = get().scenario;
    return SCENARIO_COLORS[scenario];
  },

  // Operator: full motion (1.0), Investor: restrained (0.6)
  getMotionAmplitude: () => {
    const viewMode = get().viewMode;
    return viewMode === "operator" ? 1.0 : 0.6;
  },

  // Scenario Delta Snapshot toggle - initialized from localStorage
  showScenarioImpact: (() => {
    try {
      return localStorage.getItem("stratfit_showScenarioImpact") === "true";
    } catch {
      return false;
    }
  })(),
  
  setShowScenarioImpact: (show) => {
    try {
      localStorage.setItem("stratfit_showScenarioImpact", String(show));
    } catch {}
    set({ showScenarioImpact: show });
  },
  
  toggleScenarioImpact: () => {
    const current = get().showScenarioImpact;
    const next = !current;
    try {
      localStorage.setItem("stratfit_showScenarioImpact", String(next));
    } catch {}
    set({ showScenarioImpact: next });
  },

  activeScenarioId: "base",
  comparisonTargetScenarioId: null,
  engineResults: {
    base: {} as EngineResult,
    upside: {} as EngineResult,
    downside: {} as EngineResult,
  },
  setEngineResult: (scenarioId, result) =>
    set((state) => ({
      engineResults: {
        ...state.engineResults,
        [scenarioId]: result,
      },
    })),
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useScenario = () => useScenarioStore((s) => s.scenario);
export const useViewMode = () => useScenarioStore((s) => s.viewMode);
export const useDataPoints = () => useScenarioStore((s) => s.dataPoints);

export const useLevers = () =>
  useScenarioStore((s) => s.leverState ?? s.levers ?? {});
export const useHoveredKpiIndex = () => useScenarioStore((s) => s.hoveredKpiIndex);
export const useScenarioColors = () => {
  const scenario = useScenarioStore((s) => s.scenario);
  return SCENARIO_COLORS[scenario];
};

// Expose levers via selector hook
