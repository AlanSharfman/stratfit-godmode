// src/state/simulationStore.ts
// STRATFIT — Simulation Results Store
// Persists Monte Carlo results + deterministic simulation lifecycle (Execution Mode)

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LeverState, MonteCarloResult, SimulationConfig } from "@/logic/monteCarloEngine";
import { runMonteCarloSimulation } from "@/logic/monteCarloEngine";
import { generateVerdict, type Verdict } from "@/logic/verdictGenerator";
import { getBaselineSeedAndElasticity } from "@/logic/engineSeedAndElasticity";
import type { LeverConfig } from "@/strategicStudio/types";
import { loadScenarioResult, saveScenarioResult } from "@/strategy/scenarioResults";

// Simplified results for quick access
export interface SimulationSummary {
  survivalRate: number;
  survivalPercent: string;
  
  arrMedian: number;
  arrP10: number;
  arrP90: number;
  arrFormatted: {
    p10: string;
    p50: string;
    p90: string;
  };
  
  runwayMedian: number;
  runwayP10: number;
  runwayP90: number;
  
  cashMedian: number;
  cashP10: number;
  cashP90: number;
  
  overallScore: number;
  overallRating: string;
  
  primaryRisk: string;
  topRecommendation: string;
  confidenceLevel: string;
}

export type SimulationStatus = "idle" | "ready" | "running" | "complete" | "stale";

interface SimulationState {
  // Execution Mode lifecycle state (deterministic, scenario-tied)
  simulationStatus: SimulationStatus;
  lastRunAt: number | null;
  runId: string | null;
  seed: number;
  runs: number;
  isDeterministic: true;
  scenarioHash: string | null;
  activeScenarioId: string | null;

  // Status
  hasSimulated: boolean;
  isSimulating: boolean;
  lastSimulationTime: Date | null;
  simulationCount: number;
  
  // Full results (for detailed views)
  fullResult: MonteCarloResult | null;
  fullVerdict: Verdict | null;
  
  // Summary (for quick dashboard display)
  summary: SimulationSummary | null;
  
  // Lever snapshot (what levers were used for this simulation)
  leverSnapshot: Record<string, number> | null;
  
  // Actions
  startSimulation: () => void;
  setSimulationResult: (result: MonteCarloResult, verdict: Verdict, levers: Record<string, number>) => void;
  clearSimulation: () => void;

  // Execution Mode actions
  runSimulationForScenario: (args: { scenarioId: string; baseline: LeverConfig; scenario: LeverConfig }) => Promise<void>;
  markStale: (args: { scenarioId: string; scenarioHash: string }) => void;
  resetSimulation: () => void;
  
  // Helpers
  hasResultsForCurrentLevers: (currentLevers: Record<string, number>) => boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function hashString(input: string): string {
  // Small deterministic hash (djb2 variant) for scenario inputs.
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

function scenarioHashFromLeverConfig(levers: LeverConfig): string {
  // LeverConfig has stable keys; stringify order is stable for this object.
  return hashString(JSON.stringify(levers));
}

export function computeLeverConfigHash(levers: LeverConfig): string {
  return scenarioHashFromLeverConfig(levers);
}

function leverConfigToEngineLevers(args: { baseline: LeverConfig; scenario: LeverConfig }): LeverState {
  const { baseline, scenario } = args;

  const runwayMonths = scenario.monthlyNetBurn > 0 ? scenario.cashOnHand / scenario.monthlyNetBurn : 60;
  const baselineRunway = baseline.monthlyNetBurn > 0 ? baseline.cashOnHand / baseline.monthlyNetBurn : 60;

  const burnMultiple = scenario.currentARR > 0 ? scenario.monthlyNetBurn / (scenario.currentARR / 12) : 5;

  const demandStrength = clamp(50 + clamp(scenario.monthlyGrowthRate, 0, 1) * 220, 0, 100);
  const pricingPower = clamp(50 + clamp((scenario.netRevenueRetention - 1) * 120, -60, 60), 0, 100);
  const expansionVelocity = clamp(50 + clamp(scenario.monthlyGrowthRate, 0, 1) * 180, 0, 100);
  const costDiscipline = clamp(100 - clamp((burnMultiple - 1) * 18, 0, 100), 0, 100);
  const hiringIntensity = clamp(clamp(scenario.headcount, 0, 250) / 250 * 100, 0, 100);
  const operatingDrag = clamp(
    clamp(
      (scenario.salesMarketingSpendMonthly + scenario.rdSpendMonthly + scenario.operatingCostsMonthly) /
        Math.max(1, scenario.currentARR / 12),
      0,
      3
    ) * 30,
    0,
    100
  );
  const marketVolatility = clamp(45 + clamp(scenario.monthlyChurnRate, 0, 1) * 260, 0, 100);
  const executionRisk = clamp(40 + clamp(scenario.monthlyGrowthRate, 0, 1) * 220, 0, 100);
  const fundingPressure = clamp(40 + clamp((baselineRunway - runwayMonths) / 12, -2, 2) * 18 + clamp((12 - runwayMonths) / 12, 0, 1) * 55, 0, 100);

  return {
    demandStrength,
    pricingPower,
    expansionVelocity,
    costDiscipline,
    hiringIntensity,
    operatingDrag,
    marketVolatility,
    executionRisk,
    fundingPressure,
  };
}

// Format currency helper
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

// Create summary from full results
const createSummary = (result: MonteCarloResult, verdict: Verdict): SimulationSummary => {
  return {
    survivalRate: result.survivalRate,
    survivalPercent: `${Math.round(result.survivalRate * 100)}%`,
    
    arrMedian: result.arrPercentiles.p50,
    arrP10: result.arrPercentiles.p10,
    arrP90: result.arrPercentiles.p90,
    arrFormatted: {
      p10: formatCurrency(result.arrPercentiles.p10),
      p50: formatCurrency(result.arrPercentiles.p50),
      p90: formatCurrency(result.arrPercentiles.p90),
    },
    
    runwayMedian: result.runwayPercentiles.p50,
    runwayP10: result.runwayPercentiles.p10,
    runwayP90: result.runwayPercentiles.p90,
    
    cashMedian: result.cashPercentiles.p50,
    cashP10: result.cashPercentiles.p10,
    cashP90: result.cashPercentiles.p90,
    
    overallScore: verdict.overallScore,
    overallRating: verdict.overallRating,
    
    primaryRisk: verdict.primaryRisk,
    topRecommendation: verdict.recommendations[0]?.action ?? 'Continue current strategy',
    confidenceLevel: verdict.confidenceLevel,
  };
};

const STORAGE_KEY = "stratfit.simulation.lifecycle.v1";

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      // Execution Mode lifecycle (defaults)
      simulationStatus: "ready",
      lastRunAt: null,
      runId: null,
      seed: 42,
      runs: 10000,
      isDeterministic: true,
      scenarioHash: null,
      activeScenarioId: null,

      // Legacy/existing fields (kept for compatibility)
      hasSimulated: false,
      isSimulating: false,
      lastSimulationTime: null,
      simulationCount: 0,
      fullResult: null,
      fullVerdict: null,
      summary: null,
      leverSnapshot: null,

      startSimulation: () =>
        set({
          isSimulating: true,
          simulationStatus: "running",
        }),

      setSimulationResult: (result, verdict, levers) =>
        set({
          hasSimulated: true,
          isSimulating: false,
          lastSimulationTime: new Date(),
          simulationCount: get().simulationCount + 1,
          fullResult: result,
          fullVerdict: verdict,
          summary: createSummary(result, verdict),
          leverSnapshot: { ...levers },
          simulationStatus: "complete",
          lastRunAt: Date.now(),
          runId: `${Date.now()}`,
        }),

      clearSimulation: () =>
        set({
          hasSimulated: false,
          isSimulating: false,
          lastSimulationTime: null,
          fullResult: null,
          fullVerdict: null,
          summary: null,
          leverSnapshot: null,
          simulationStatus: "ready",
          lastRunAt: null,
          runId: null,
          scenarioHash: null,
          activeScenarioId: null,
        }),

      runSimulationForScenario: async ({ scenarioId, baseline, scenario }) => {
        if (get().simulationStatus === "running") return;

        const { seed: foundationSeed, elasticity } = getBaselineSeedAndElasticity();
        const seed = typeof foundationSeed === "number" && Number.isFinite(foundationSeed) ? foundationSeed : get().seed;
        const runs = get().runs;

        // Persist deterministic seed the first time we see a valid foundation seed.
        if (seed !== get().seed) set({ seed });

        const baselineHash = scenarioHashFromLeverConfig(baseline);
        const scnHash = scenarioHashFromLeverConfig(scenario);

        set({
          simulationStatus: "running",
          isSimulating: true,
          activeScenarioId: String(scenarioId),
          scenarioHash: scnHash,
          runId: `${Date.now()}`,
        });

        try {
          // Ensure baseline stored result exists (for Compare deltas).
          const hasBase = loadScenarioResult("base") != null;
          if (!hasBase) {
            const baseLevers = leverConfigToEngineLevers({ baseline, scenario: baseline });
            const baseCfg: SimulationConfig = {
              iterations: runs,
              timeHorizonMonths: 36,
              startingCash: Math.max(0, baseline.cashOnHand),
              startingARR: Math.max(0, baseline.currentARR),
              monthlyBurn: Math.max(0, baseline.monthlyNetBurn),
              seed,
              elasticity: elasticity ?? undefined,
            };
            const baseRes = runMonteCarloSimulation(baseLevers, baseCfg);
            saveScenarioResult("base", baseRes);
            try {
              window.dispatchEvent(new CustomEvent("sf:scenarioResultsUpdated", { detail: { scenarioId: "base" } }));
            } catch {
              // ignore
            }
          }

          // Scenario run
          const levers = leverConfigToEngineLevers({ baseline, scenario });
          const cfg: SimulationConfig = {
            iterations: runs,
            timeHorizonMonths: 36,
            startingCash: Math.max(0, scenario.cashOnHand),
            startingARR: Math.max(0, scenario.currentARR),
            monthlyBurn: Math.max(0, scenario.monthlyNetBurn),
            seed,
            elasticity: elasticity ?? undefined,
          };

          const result = runMonteCarloSimulation(levers, cfg);
          const verdict = generateVerdict(result);

          saveScenarioResult(String(scenarioId), result);
          try {
            window.dispatchEvent(new CustomEvent("sf:scenarioResultsUpdated", { detail: { scenarioId: String(scenarioId) } }));
          } catch {
            // ignore
          }

          // Update store for existing UI consumers.
          get().setSimulationResult(result, verdict, levers as any);

          // Keep lifecycle metadata coherent.
          set({
            simulationStatus: "complete",
            lastRunAt: Date.now(),
            scenarioHash: scnHash,
            activeScenarioId: String(scenarioId),
          });
        } catch (e) {
          console.error("[STRATFIT] Simulation run failed", e);
          set({ isSimulating: false, simulationStatus: "stale" });
        } finally {
          // If baseline inputs ever change (shouldn't), treat as stale.
          void baselineHash;
        }
      },

      markStale: ({ scenarioId, scenarioHash }) => {
        const st = get().simulationStatus;
        if (st === "running") return;

        const isSameScenario = get().activeScenarioId == null || String(get().activeScenarioId) === String(scenarioId);
        if (!isSameScenario) {
          set({
            simulationStatus: "ready",
            activeScenarioId: String(scenarioId),
            scenarioHash,
          });
          return;
        }

        const prev = get().scenarioHash;
        if (prev && prev !== scenarioHash) {
          set({ simulationStatus: "stale", scenarioHash, activeScenarioId: String(scenarioId) });
        } else if (!prev) {
          set({ simulationStatus: "ready", scenarioHash, activeScenarioId: String(scenarioId) });
        }
      },

      resetSimulation: () => {
        set({
          simulationStatus: "ready",
          lastRunAt: null,
          runId: null,
          scenarioHash: null,
          activeScenarioId: null,
          hasSimulated: false,
          isSimulating: false,
          lastSimulationTime: null,
          fullResult: null,
          fullVerdict: null,
          summary: null,
          leverSnapshot: null,
        });
      },

      hasResultsForCurrentLevers: (currentLevers) => {
        const snapshot = get().leverSnapshot;
        if (!snapshot) return false;
        for (const key of Object.keys(currentLevers)) {
          if (snapshot[key] !== currentLevers[key]) return false;
        }
        return true;
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({
        simulationStatus: s.simulationStatus,
        lastRunAt: s.lastRunAt,
        runId: s.runId,
        seed: s.seed,
        runs: s.runs,
        isDeterministic: s.isDeterministic,
        scenarioHash: s.scenarioHash,
        activeScenarioId: s.activeScenarioId,
      }),
    }
  )
);

// Selector hooks for specific data
export const useSimulationSummary = () => useSimulationStore((s) => s.summary);
export const useHasSimulated = () => useSimulationStore((s) => s.hasSimulated);
export const useIsSimulating = () => useSimulationStore((s) => s.isSimulating);
export const useSimulationVerdict = () => useSimulationStore((s) => s.fullVerdict);
export const useSimulationResult = () => useSimulationStore((s) => s.fullResult);

export default useSimulationStore;

