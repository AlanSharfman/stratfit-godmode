// src/state/compareViewStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare View & Scenario Architecture Store
//
// Manages:
//   - Current Structure (read-only baseline reference)
//   - Up to 3 user scenarios (levers + metrics + simulation results)
//   - Active scenario selection
//   - Comparison dropdown target
//   - Compare View open/close state
//
// Demo cap: Current Structure + 3 scenarios max.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import type { LeverState, MetricsResult } from "@/logic/calculateMetrics";
import type { MonteCarloResult } from "@/logic/monteCarloEngine";

// ── Types ────────────────────────────────────────────────────────────────

export interface CompareScenario {
  id: string;
  name: string;
  levers: LeverState;
  metrics: MetricsResult | null;
  simulationResult: MonteCarloResult | null;
  dataPoints: number[];
}

const MAX_SCENARIOS = 3;

const INITIAL_LEVERS: LeverState = {
  demandStrength: 60,
  pricingPower: 50,
  expansionVelocity: 45,
  costDiscipline: 55,
  hiringIntensity: 40,
  operatingDrag: 35,
  marketVolatility: 30,
  executionRisk: 25,
  fundingPressure: 20,
};

function generateId(): string {
  return `scn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Store ────────────────────────────────────────────────────────────────

interface CompareViewState {
  // Whether Compare View is open
  isOpen: boolean;

  // Current Structure — read-only, never deleted
  currentStructure: CompareScenario;

  // User scenarios (max 3)
  scenarios: CompareScenario[];

  // Active scenario ID (being displayed/compared on right mountain)
  activeScenarioId: string;

  // Comparison dropdown target
  // "current" = compare to Current Structure (default)
  // or a scenario ID
  compareToId: string;

  // Actions
  open: () => void;
  close: () => void;

  setCurrentStructure: (updates: Partial<CompareScenario>) => void;

  addScenario: (scenario: CompareScenario) => CompareScenario;
  duplicateScenario: (id: string) => CompareScenario | null;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  updateScenario: (id: string, updates: Partial<CompareScenario>) => void;

  setActiveScenarioId: (id: string) => void;
  setCompareToId: (id: string) => void;

  // Convenience: get active scenario
  getActiveScenario: () => CompareScenario | null;
  getCompareTarget: () => CompareScenario | null;
}

export const useCompareViewStore = create<CompareViewState>()((set, get) => ({
  isOpen: false,

  currentStructure: {
    id: "current",
    name: "Current Structure",
    levers: { ...INITIAL_LEVERS },
    metrics: null,
    simulationResult: null,
    dataPoints: [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35],
  },

  scenarios: [],

  activeScenarioId: "",

  compareToId: "current",

  // ── Actions ──

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  setCurrentStructure: (updates) =>
    set((s) => ({
      currentStructure: { ...s.currentStructure, ...updates },
    })),

  addScenario: (scenario) => {
    const state = get();
    if (state.scenarios.length >= MAX_SCENARIOS) return scenario;
    const newScenario = { ...scenario, id: scenario.id || generateId() };
    set((s) => ({
      scenarios: [...s.scenarios, newScenario],
      activeScenarioId: s.activeScenarioId || newScenario.id,
    }));
    return newScenario;
  },

  duplicateScenario: (id) => {
    const state = get();
    if (state.scenarios.length >= MAX_SCENARIOS) return null;
    const source = state.scenarios.find((s) => s.id === id);
    if (!source) return null;

    const newScenario: CompareScenario = {
      ...source,
      id: generateId(),
      name: `${source.name} (Copy)`,
      simulationResult: null, // Don't copy sim results
    };

    set((s) => ({
      scenarios: [...s.scenarios, newScenario],
    }));
    return newScenario;
  },

  renameScenario: (id, name) =>
    set((s) => ({
      scenarios: s.scenarios.map((sc) =>
        sc.id === id ? { ...sc, name } : sc
      ),
    })),

  deleteScenario: (id) => {
    set((s) => {
      const filtered = s.scenarios.filter((sc) => sc.id !== id);
      let newActive = s.activeScenarioId;
      if (newActive === id) {
        newActive = filtered[0]?.id ?? "";
      }
      let newCompareTo = s.compareToId;
      if (newCompareTo === id) {
        newCompareTo = "current";
      }
      return {
        scenarios: filtered,
        activeScenarioId: newActive,
        compareToId: newCompareTo,
      };
    });
  },

  updateScenario: (id, updates) =>
    set((s) => ({
      scenarios: s.scenarios.map((sc) =>
        sc.id === id ? { ...sc, ...updates } : sc
      ),
    })),

  setActiveScenarioId: (id) => set({ activeScenarioId: id }),
  setCompareToId: (id) => set({ compareToId: id }),

  getActiveScenario: () => {
    const state = get();
    return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? null;
  },

  getCompareTarget: () => {
    const state = get();
    if (state.compareToId === "current") return state.currentStructure;
    return state.scenarios.find((s) => s.id === state.compareToId) ?? state.currentStructure;
  },
}));

export default useCompareViewStore;


