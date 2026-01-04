// src/state/scenarioStore.ts
// STRATFIT — Deterministic Engine State
// Two Views, One Engine, Same Truth

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { LeverId } from "@/logic/leverDefinitions";
import type { ScenarioId } from "@/types/domain";

export type { ScenarioId } from "@/types/domain";

// ============================================================================
// SCENARIO COLORS (leave as-is for now; restore later if you have canonical palette)
// ============================================================================
export const SCENARIO_COLORS: Record<
  ScenarioId,
  { primary: string; secondary: string; glow: string }
> = {
  base: { primary: "#000", secondary: "#000", glow: "#000" },
  upside: { primary: "#000", secondary: "#000", glow: "#000" },
  downside: { primary: "#000", secondary: "#000", glow: "#000" },
};

// ============================================================================
// CANONICAL LEVER -> DATAPOINTS INDEX MAP (single source of truth)
// MUST match the order used by useLevers() below.
// ============================================================================
export const LEVER_INDEX: Record<LeverId, number> = {
  revenueGrowth: 0,
  pricingAdjustment: 1,
  marketingSpend: 2,
  operatingExpenses: 3,
  headcount: 4,
  cashSensitivity: 5,
  churnSensitivity: 6,
  fundingInjection: 7,
} as const;

// ============================================================================
// TYPES
// ============================================================================
export type ViewMode = "operator" | "investor";

export interface EngineResult {
  kpis: Record<string, { value: number; display: string }>;
}

export type ScenarioStoreState = {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;

  dataPoints: number[];
  setDataPoints: (dp: number[]) => void;

  // Canonical per-lever writer (index-safe)
  setLeverValue: (id: LeverId, value: number) => void;

  hoveredKpiIndex: number | null;
  setHoveredKpiIndex: (i: number | null) => void;

  activeLeverId: LeverId | null;
  leverIntensity01: number;
  setActiveLever: (id: LeverId | null, intensity01: number) => void;

  getScenarioColors: () => { primary: string; secondary: string; glow: string };
  getMotionAmplitude: () => number;

  showScenarioImpact: boolean;
  setShowScenarioImpact: (show: boolean) => void;
  toggleScenarioImpact: () => void;

  activeScenarioId: ScenarioId;
  comparisonTargetScenarioId: ScenarioId | null;

  engineResults: Record<ScenarioId, EngineResult>;
  setEngineResult: (scenarioId: ScenarioId, result: EngineResult) => void;
};

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

  setLeverValue: (id, value) =>
    set((state) => {
      const idx = LEVER_INDEX[id];
      const current = Array.isArray(state.dataPoints) ? state.dataPoints : [];
      const next =
        current.length >= 8
          ? [...current]
          : Array.from({ length: 8 }, (_, i) => current[i] ?? 50);

      next[idx] = value;
      return { dataPoints: next };
    }),

  hoveredKpiIndex: null,
  setHoveredKpiIndex: (i) => set({ hoveredKpiIndex: i }),

  activeLeverId: null,
  leverIntensity01: 0,
  setActiveLever: (id, intensity01) =>
    set({
      activeLeverId: id,
      leverIntensity01: Math.max(0, Math.min(1, intensity01)),
    }),

  getScenarioColors: () => {
    const scenario = get().scenario;
    return SCENARIO_COLORS[scenario];
  },

  getMotionAmplitude: () => {
    const viewMode = get().viewMode;
    return viewMode === "operator" ? 1.0 : 0.6;
  },

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
  useScenarioStore(
    useShallow((s) => ({
      revenueGrowth: s.dataPoints?.[0] ?? 50,
      pricingAdjustment: s.dataPoints?.[1] ?? 50,
      marketingSpend: s.dataPoints?.[2] ?? 50,
      operatingExpenses: s.dataPoints?.[3] ?? 50,
      headcount: s.dataPoints?.[4] ?? 50,
      cashSensitivity: s.dataPoints?.[5] ?? 50,
      churnSensitivity: s.dataPoints?.[6] ?? 50,
      fundingInjection: s.dataPoints?.[7] ?? 50,
    }))
  );

export const useHoveredKpiIndex = () =>
  useScenarioStore((s) => s.hoveredKpiIndex);

export const useScenarioColors = () => {
  const scenario = useScenarioStore((s) => s.scenario);
  return SCENARIO_COLORS[scenario];
};
