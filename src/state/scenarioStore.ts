// src/state/scenarioStore.ts
// STRATFIT — Deterministic Engine State
// Two Views, One Engine, Same Truth

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
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

  setDataPoints: (dp) => set({ dataPoints: Array.isArray(dp) ? dp : [] }),
// SCENARIO COLORS
// ============================================================================


export const SCENARIO_COLORS = {
  base: { primary: "#000", secondary: "#000", glow: "#000" },
  upside: { primary: "#000", secondary: "#000", glow: "#000" },
  downside: { primary: "#000", secondary: "#000", glow: "#000" },
};

type LeverId =
  | "revenueGrowth"
  | "pricingAdjustment"
  | "marketingSpend"
  | "operatingExpenses"
  | "headcount"
  | "cashSensitivity"
  | "churnSensitivity"
  | "fundingInjection";

const LEVER_INDEX: Record<LeverId, number> = {
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
// CANONICAL LEVER -> DATAPOINTS INDEX MAP (single source of truth)
// ============================================================================
type LeverId =
  | "revenueGrowth"
  | "pricingAdjustment"
  | "marketingSpend"
  | "operatingExpenses"
  | "headcount"
  | "cashSensitivity"
  | "churnSensitivity"
  | "fundingInjection";

const LEVER_INDEX: Record<LeverId, number> = {
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
  setLeverValue: (id: LeverId, value: number) => void;

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

  viewMode: "operator",
  setViewMode: (v) => set({ viewMode: v }),

  scenario: "base",
  setScenario: (s) => set({ scenario: s }),

  dataPoints: [],

  setDataPoints: (dp) => set({ dataPoints: Array.isArray(dp) ? dp : [] }),

  setLeverValue: (id, value) =>
    set((s) => {
      const idx = LEVER_INDEX[id];
      const current = Array.isArray(s.dataPoints) ? s.dataPoints : [];
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

// ============================================================================
// CANONICAL LEVER -> DATAPOINTS INDEX MAP (single source of truth)
// ============================================================================


// Canonical per-lever setter (foundation for migration)
export function setLeverValue(id: LeverId, value: number) {
  const idx = LEVER_INDEX[id];
  if (typeof idx !== 'number') return;
  const store = useScenarioStore.getState();
  const dp = Array.isArray(store.dataPoints) ? [...store.dataPoints] : [];
  // Ensure dp is long enough
  while (dp.length <= idx) dp.push(50);
  dp[idx] = value;
  store.setDataPoints(dp);
}

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
export const useHoveredKpiIndex = () => useScenarioStore((s) => s.hoveredKpiIndex);
export const useScenarioColors = () => {
  const scenario = useScenarioStore((s) => s.scenario);
  return SCENARIO_COLORS[scenario];
};


