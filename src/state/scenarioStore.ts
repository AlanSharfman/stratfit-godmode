// src/state/scenarioStore.ts
// STRATFIT — Deterministic Engine State
// Two Views, One Engine, Same Truth

import { create } from "zustand";
import type { LeverId } from "@/logic/mountainPeakModel";
import type { Delta } from "@/engine";

// ============================================================================
// TYPES
// ============================================================================

export type ScenarioId = "base" | "upside" | "downside" | "extreme";
export type ViewMode = "operator" | "investor";

// KPI Keys aligned to specification
type KPIKey =
  | "runway"
  | "cashPosition"
  | "momentum"
  | "burnQuality"
  | "riskIndex"
  | "earningsPower"
  | "enterpriseValue";

interface KPIValue {
  value: number;
  display: string;
  trend?: number; // -1 to 1 for micro-widget direction
}

// ============================================================================
// LEVERS (UI SCALE: 0–100)
// ============================================================================

export type LeverState = {
  demandStrength: number;
  pricingPower: number;
  expansionVelocity: number;

  costDiscipline: number;
  hiringIntensity: number;
  operatingDrag: number;

  marketVolatility: number;
  executionRisk: number;
};

// ============================================================================
// SCENARIO PRESETS (DETERMINISTIC, UI SCALE)
// ============================================================================

export const SCENARIO_PRESETS: Record<ScenarioId, LeverState> = {
  base: {
    demandStrength: 50,
    pricingPower: 50,
    expansionVelocity: 50,
    costDiscipline: 50,
    hiringIntensity: 50,
    operatingDrag: 50,
    marketVolatility: 50,
    executionRisk: 50,
  },
  upside: {
    demandStrength: 70,
    pricingPower: 65,
    expansionVelocity: 70,
    costDiscipline: 55,
    hiringIntensity: 60,
    operatingDrag: 45,
    marketVolatility: 45,
    executionRisk: 45,
  },
  downside: {
    demandStrength: 35,
    pricingPower: 40,
    expansionVelocity: 35,
    costDiscipline: 45,
    hiringIntensity: 40,
    operatingDrag: 60,
    marketVolatility: 65,
    executionRisk: 60,
  },
  extreme: {
    demandStrength: 25,
    pricingPower: 30,
    expansionVelocity: 20,
    costDiscipline: 35,
    hiringIntensity: 30,
    operatingDrag: 75,
    marketVolatility: 80,
    executionRisk: 80,
  },
};

// ============================================================================
// SCENARIO COLORS
// ============================================================================

export const SCENARIO_COLORS: Record<
  ScenarioId,
  { primary: string; secondary: string; glow: string }
> = {
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
  // View
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  // Scenario selection
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;

  // Authoritative lever state (UI scale 0–100)
  levers: LeverState;
  setLever: (key: keyof LeverState, value: number) => void;

  // Visual / interaction state
  dataPoints: number[];
  setDataPoints: (dp: number[]) => void;

  hoveredKpiIndex: number | null;
  setHoveredKpiIndex: (i: number | null) => void;

  activeLeverId: LeverId | null;
  leverIntensity01: number;
  setActiveLever: (id: LeverId | null, intensity01: number) => void;

  // KPI values + baseline
  kpiValues: Partial<Record<KPIKey, KPIValue>>;
  setKpiValues: (vals: Partial<Record<KPIKey, KPIValue>>) => void;

  baselineValues: Partial<Record<KPIKey, KPIValue>> | null;
  captureBaseline: () => void;

  // Scenario deltas (engine truth)
  scenarioDeltas: Delta[];
  setScenarioDeltas: (deltas: Delta[]) => void;

  // Helpers
  getScenarioColors: () => { primary: string; secondary: string; glow: string };
  getMotionAmplitude: () => number;

  // Scenario Impact toggle
  showScenarioImpact: boolean;
  setShowScenarioImpact: (show: boolean) => void;
  toggleScenarioImpact: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useScenarioStore = create<ScenarioStoreState>((set, get) => ({
  // View
  viewMode: "operator",
  setViewMode: (v) => set({ viewMode: v }),

  // Scenario
  scenario: "base",

  // Levers (initialised from Base Case)
  levers: { ...SCENARIO_PRESETS.base },

  setScenario: (s) =>
    set({
      scenario: s,
      levers: { ...SCENARIO_PRESETS[s] },
    }),

  setLever: (key, value) =>
    set((state) => ({
      levers: {
        ...state.levers,
        [key]: Math.max(0, Math.min(100, value)),
      },
    })),

  // Visual state
  dataPoints: [],
  setDataPoints: (dp) => set({ dataPoints: Array.isArray(dp) ? dp : [] }),

  hoveredKpiIndex: null,
  setHoveredKpiIndex: (i) => set({ hoveredKpiIndex: i }),

  activeLeverId: null,
  leverIntensity01: 0,
  setActiveLever: (id, intensity01) =>
    set({
      activeLeverId: id,
      leverIntensity01: Math.max(0, Math.min(1, intensity01)),
    }),

  // KPI values
  kpiValues: {},
  baselineValues: null,

  setKpiValues: (vals) => {
    const state = get();
    if (!state.baselineValues) {
      set({
        kpiValues: { ...state.kpiValues, ...vals },
        baselineValues: { ...state.kpiValues, ...vals },
      });
    } else {
      set({ kpiValues: { ...state.kpiValues, ...vals } });
    }
  },

  captureBaseline: () => {
    const state = get();
    set({ baselineValues: { ...state.kpiValues } });
  },

  // Deltas
  scenarioDeltas: [],
  setScenarioDeltas: (deltas) => set({ scenarioDeltas: deltas }),

  // Helpers
  getScenarioColors: () => SCENARIO_COLORS[get().scenario],

  getMotionAmplitude: () =>
    get().viewMode === "operator" ? 1.0 : 0.6,

  // Scenario Impact toggle
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

  toggleScenarioImpact: () =>
    set((state) => {
      const next = !state.showScenarioImpact;
      try {
        localStorage.setItem("stratfit_showScenarioImpact", String(next));
      } catch {}
      return { showScenarioImpact: next };
    }),
}));

// ============================================================================
// SELECTORS
// ============================================================================

export const useScenario = () => useScenarioStore((s) => s.scenario);
export const useViewMode = () => useScenarioStore((s) => s.viewMode);
export const useLevers = () => useScenarioStore((s) => s.levers);
export const useScenarioColors = () =>
  SCENARIO_COLORS[useScenarioStore((s) => s.scenario)];
