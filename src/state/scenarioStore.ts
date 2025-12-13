// src/state/scenarioStore.ts
// STRATFIT — Scenario Store with Color Mapping

import { create } from "zustand";
import type { LeverId } from "@/logic/mountainPeakModel";

// ============================================================================
// TYPES
// ============================================================================

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

type KPIKey = "mrr" | "grossProfit" | "cashBalance" | "burnRate" | "runway" | "cac" | "churnRate";

interface KPIValue {
  value: number;
  display: string;
}

// ============================================================================
// SCENARIO COLORS (Mountain will use these!)
// ============================================================================

export const SCENARIO_COLORS: Record<ScenarioId, { primary: string; secondary: string; glow: string }> = {
  base: {
    primary: "#22d3ee",    // Cyan
    secondary: "#7c3aed",  // Purple
    glow: "rgba(34, 211, 238, 0.4)",
  },
  upside: {
    primary: "#34d399",    // Green
    secondary: "#22d3ee",  // Cyan
    glow: "rgba(52, 211, 153, 0.4)",
  },
  downside: {
    primary: "#fbbf24",    // Gold/Amber
    secondary: "#f97316",  // Orange
    glow: "rgba(251, 191, 36, 0.4)",
  },
  extreme: {
    primary: "#ef4444",    // Red
    secondary: "#fb7185",  // Pink
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

  // Helper to get current scenario colors
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
  setKpiValues: (vals) =>
    set((prev) => ({
      kpiValues: { ...prev.kpiValues, ...vals },
    })),

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
