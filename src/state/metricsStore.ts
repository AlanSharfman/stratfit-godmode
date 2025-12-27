// src/state/metricsStore.ts
// STRATFIT — Metrics Store (Singleton, deterministic, safe with React 18)
//
// Guarantees:
// - Store is a SINGLETON (created once at module load)
// - No state updates during "getSnapshot" reads
// - recompute() is the only place that writes computed metrics/history/datapoints
// - No object/array recreation on reads (only on writes)

import { create } from "zustand";

import type { ScenarioId, MetricId, LeverId } from "../dashboardConfig";
import { METRICS, LEVERS } from "../dashboardConfig";

import type { MetricState, LeverState } from "../logic/metricsModel";
import {
  BASELINE_METRICS,
  getInitialLeverState,
  calculateMetrics,
  metricsToDataPoints,
} from "../logic/metricsModel";

export type MetricsStatus = "ready" | "loading" | "blocked";

export type HistoryState = Record<MetricId, number[]>;

// Save/Load Scenarios (Phase 3)
export interface SavedScenario {
  id: string;
  name: string;
  scenario: ScenarioId;
  levers: LeverState;
  createdAt: number;
}

export interface MetricsStoreState {
  // Inputs to the compute engine
  scenario: ScenarioId;
  levers: LeverState;

  // Outputs
  metrics: MetricState;
  dataPoints: number[];
  history: HistoryState;

  // State
  status: MetricsStatus;
  lastError: string | null;

  // Focus state (for KPI → Mountain interaction)
  focusedMetric: MetricId | null;

  // Scenario comparison (Phase 3)
  comparisonMode: boolean;
  comparisonScenarios: ScenarioId[];
  comparisonData: Partial<Record<ScenarioId, { metrics: MetricState; dataPoints: number[] }>>;

  // Save/Load Scenarios
  savedScenarios: SavedScenario[];

  // Actions
  setScenario: (scenario: ScenarioId) => void;
  setLever: (id: LeverId, value: number) => void;
  replaceLevers: (next: LeverState) => void;
  setFocusedMetric: (id: MetricId | null) => void;
  toggleComparisonMode: () => void;
  setComparisonScenarios: (scenarios: ScenarioId[]) => void;

  // Save/Load actions
  saveCurrentScenario: (name: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;

  recompute: () => void;
}

function initHistory(metrics: MetricState): HistoryState {
  const h: Partial<HistoryState> = {};
  METRICS.forEach((m) => {
    h[m.id] = [metrics[m.id]];
  });
  return h as HistoryState;
}

function clampLever(id: LeverId, value: number): number {
  const def = LEVERS.find((l) => l.id === id);
  if (!def) return value;
  const step = def.step ?? 1;
  const clamped = Math.max(def.min, Math.min(def.max, value));
  // step snap (avoid noisy decimals)
  const snapped = Math.round(clamped / step) * step;
  return snapped;
}

export const useMetricsStore = create<MetricsStoreState>((set, get) => {
  const levers0 = getInitialLeverState();
  const scenario0: ScenarioId = "base";
  const metrics0 = calculateMetrics(BASELINE_METRICS, levers0, scenario0);
  const data0 = metricsToDataPoints(metrics0);

  // Load saved scenarios from localStorage
  let savedScenarios0: SavedScenario[] = [];
  try {
    const stored = localStorage.getItem("stratfit_saved_scenarios");
    if (stored) {
      savedScenarios0 = JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load saved scenarios from localStorage", e);
  }

  return {
    scenario: scenario0,
    levers: levers0,

    metrics: metrics0,
    dataPoints: data0,
    history: initHistory(metrics0),

    status: "ready",
    lastError: null,

    focusedMetric: null,

    comparisonMode: false,
    comparisonScenarios: ["base", "upside", "downside"],
    comparisonData: {},

    savedScenarios: savedScenarios0,

    setScenario: (scenario) => {
      // Do NOT auto-recompute here. App layer decides when.
      set({ scenario });
    },

    setLever: (id, value) => {
      set((state) => ({
        levers: {
          ...state.levers,
          [id]: clampLever(id, value),
        },
      }));
    },

    replaceLevers: (next) => {
      // Normalise + snap
      const fixed: Partial<LeverState> = {};
      (Object.keys(next) as LeverId[]).forEach((k) => {
        fixed[k] = clampLever(k, next[k]);
      });
      set({ levers: fixed as LeverState });
    },

    setFocusedMetric: (id) => {
      set({ focusedMetric: id });
    },

    toggleComparisonMode: () => {
      const { comparisonMode, comparisonScenarios, levers } = get();
      const nextMode = !comparisonMode;
      
      if (nextMode) {
        // Compute all comparison scenarios
        const data: Partial<Record<ScenarioId, { metrics: MetricState; dataPoints: number[] }>> = {};
        comparisonScenarios.forEach((scen) => {
          const computed = calculateMetrics(BASELINE_METRICS, levers, scen);
          data[scen] = {
            metrics: computed,
            dataPoints: metricsToDataPoints(computed),
          };
        });
        set({ comparisonMode: nextMode, comparisonData: data });
      } else {
        set({ comparisonMode: nextMode, comparisonData: {} });
      }
    },

    setComparisonScenarios: (scenarios) => {
      set({ comparisonScenarios: scenarios });
      // If comparison mode is active, recompute
      if (get().comparisonMode) {
        get().toggleComparisonMode();
        get().toggleComparisonMode();
      }
    },

    saveCurrentScenario: (name) => {
      const { scenario, levers, savedScenarios } = get();
      const newScenario: SavedScenario = {
        id: Date.now().toString(),
        name: name || `Scenario ${savedScenarios.length + 1}`,
        scenario,
        levers: { ...levers },
        createdAt: Date.now(),
      };
      const updated = [...savedScenarios, newScenario];
      set({ savedScenarios: updated });
      // Optional: persist to localStorage
      try {
        localStorage.setItem("stratfit_saved_scenarios", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save to localStorage", e);
      }
    },

    loadScenario: (id) => {
      const { savedScenarios } = get();
      const found = savedScenarios.find((s) => s.id === id);
      if (!found) return;
      
      set({
        scenario: found.scenario,
        levers: { ...found.levers },
      });
      get().recompute();
    },

    deleteScenario: (id) => {
      const { savedScenarios } = get();
      const updated = savedScenarios.filter((s) => s.id !== id);
      set({ savedScenarios: updated });
      // Optional: persist to localStorage
      try {
        localStorage.setItem("stratfit_saved_scenarios", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to update localStorage", e);
      }
    },

    recompute: () => {
      const { scenario, levers, history } = get();

      try {
        const computed = calculateMetrics(BASELINE_METRICS, levers, scenario);
        const dp = metricsToDataPoints(computed);

        // Update history immutably
        const nextHistory: Partial<HistoryState> = { ...history };
        (Object.keys(computed) as MetricId[]).forEach((id) => {
          const prev = history[id] ?? [];
          const nextArr = prev.length > 40 ? prev.slice(prev.length - 40) : prev.slice();
          nextArr.push(computed[id]);
          nextHistory[id] = nextArr;
        });

        const updates: any = {
          metrics: computed,
          dataPoints: dp,
          history: nextHistory as HistoryState,
          status: "ready",
          lastError: null,
        };

        // Update comparison data if comparison mode is active
        if (get().comparisonMode) {
          const data: Partial<Record<ScenarioId, { metrics: MetricState; dataPoints: number[] }>> = {};
          get().comparisonScenarios.forEach((scen) => {
            const comp = calculateMetrics(BASELINE_METRICS, levers, scen);
            data[scen] = {
              metrics: comp,
              dataPoints: metricsToDataPoints(comp),
            };
          });
          updates.comparisonData = data;
        }

        set(updates);
      } catch (e: any) {
        set({
          status: "blocked",
          lastError: e?.message ?? "Unknown metrics error",
        });
      }
    },
  };
});
