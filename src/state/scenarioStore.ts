// src/state/scenarioStore.ts
// STRATFIT — Scenario Store with EXACTLY 7 KPIs

import { create } from "zustand";
import type { LeverId } from "@/logic/mountainPeakModel";

// ============================================================================
// TYPES
// ============================================================================

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

// EXACTLY 7 KPIs
type KPIKey = "mrr" | "grossProfit" | "cashBalance" | "burnRate" | "runway" | "cac" | "churnRate";

interface KPIValue {
  value: number;
  display: string;
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
  extreme: {
    primary: "#ef4444",
    secondary: "#fb7185",
    glow: "rgba(239, 68, 68, 0.4)",
  },
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface ScenarioStoreState {
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;

  dataPoints: number[];
  setDataPoints: (dp: number[]) => void;

  hoveredKpiIndex: number | null;
  setHoveredKpiIndex: (i: number | null) => void;

  activeLeverId: LeverId | null;
  leverIntensity01: number;
  setActiveLever: (id: LeverId | null, intensity01: number) => void;

  kpiValues: Partial<Record<KPIKey, KPIValue>>;
  setKpiValues: (vals: Partial<Record<KPIKey, KPIValue>>) => void;

  baselineValues: Partial<Record<KPIKey, KPIValue>> | null;
  setBaselineValues: (vals: Partial<Record<KPIKey, KPIValue>>) => void;
  captureBaseline: () => void;

  getScenarioColors: () => { primary: string; secondary: string; glow: string };
}

// ============================================================================
// STORE
// ============================================================================

export const useScenarioStore = create<ScenarioStoreState>((set, get) => ({
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

  kpiValues: {},
  setKpiValues: (vals) => {
    const state = get();
    if (!state.baselineValues) {
      set({ 
        kpiValues: { ...state.kpiValues, ...vals },
        baselineValues: { ...state.kpiValues, ...vals }
      });
    } else {
      set({ kpiValues: { ...state.kpiValues, ...vals } });
    }
  },

  baselineValues: null,
  setBaselineValues: (vals) => set({ baselineValues: vals }),
  captureBaseline: () => {
    const state = get();
    set({ baselineValues: { ...state.kpiValues } });
  },

  getScenarioColors: () => {
    const scenario = get().scenario;
    return SCENARIO_COLORS[scenario];
  },
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useScenario = () => useScenarioStore((s) => s.scenario);
export const useDataPoints = () => useScenarioStore((s) => s.dataPoints);
export const useHoveredKpiIndex = () => useScenarioStore((s) => s.hoveredKpiIndex);
export const useScenarioColors = () => {
  const scenario = useScenarioStore((s) => s.scenario);
  return SCENARIO_COLORS[scenario];
};
