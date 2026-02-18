// src/state/simulationStore.ts
// STRATFIT — Simulation Results Store
// Persists Monte Carlo results for use across the dashboard

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MonteCarloResult } from '@/logic/monteCarloEngine';
import type { Verdict } from '@/logic/verdictGenerator';
import { safeLocalStoragePersist } from './safePersistStorage';

// ════════════════════════════════════════════════════════════════════════════
// SIMULATION RUN STATUS — Single source of truth
// ════════════════════════════════════════════════════════════════════════════

export type SimulationStatus = "idle" | "running" | "complete" | "error";

/** User-safe telemetry metadata (no engine internals exposed) */
export interface RunMeta {
  runId: string;
  timeHorizonMonths: number;
  paths: number;
  seedLocked: boolean;        // True = seed is deterministic. Do NOT show seed number.
  startedAt: number | null;   // performance.now() timestamp
  completedAt: number | null;
  durationMs: number | null;
  // Safe delta summaries (populated on completion)
  survivalDelta: number | null;   // e.g., +3 (percentage points)
  runwayDelta: number | null;     // e.g., +2 (months)
  topDriverLabel: string | null;  // e.g., "Demand Strength"
}

/**
 * Minimal, assessment-safe payload derived from MonteCarloResult.
 * This is intentionally small so it can be persisted without freezing the UI.
 */
export interface AssessmentPayload {
  survivalRate: number;
  arrPercentiles: { p10: number; p50: number; p90: number };
  runwayPercentiles: { p10: number; p50: number; p90: number };
  cashPercentiles: { p10: number; p50: number; p90: number };
  sensitivityFactors: Array<{
    lever: string;
    label: string;
    impact: number;
    direction: "positive" | "negative";
  }>;
}

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

interface SimulationState {
  // Status
  hasSimulated: boolean;
  isSimulating: boolean;
  lastSimulationTime: Date | null;
  simulationCount: number;
  
  // ── Simulation run telemetry ──
  simulationStatus: SimulationStatus;
  runMeta: RunMeta | null;
  
  // Full results (for detailed views)
  fullResult: MonteCarloResult | null;
  fullVerdict: Verdict | null;

  // Minimal persisted payload for Strategic Assessment (survives navigation/reload)
  assessmentPayload: AssessmentPayload | null;
  
  // Summary (for quick dashboard display)
  summary: SimulationSummary | null;
  
  // Lever snapshot (what levers were used for this simulation)
  leverSnapshot: Record<string, number> | null;
  
  // Actions
  startSimulation: () => void;
  beginRun: (meta: Pick<RunMeta, 'timeHorizonMonths' | 'paths' | 'seedLocked'>) => void;
  completeRun: (result: MonteCarloResult, verdict: Verdict) => void;
  failRun: (errorMessage?: string) => void;
  setSimulationResult: (result: MonteCarloResult, verdict: Verdict, levers: Record<string, number>) => void;
  clearSimulation: () => void;
  
  // Helpers
  hasResultsForCurrentLevers: (currentLevers: Record<string, number>) => boolean;
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

/** Generate a short, unique run ID (non-sensitive) */
function generateRunId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `run-${ts}-${rand}`;
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      // Initial state
      hasSimulated: false,
      isSimulating: false,
      lastSimulationTime: null,
      simulationCount: 0,
      simulationStatus: "idle" as SimulationStatus,
      runMeta: null,
      fullResult: null,
      fullVerdict: null,
      assessmentPayload: null,
      summary: null,
      leverSnapshot: null,

      // Start simulation (for loading state — legacy compat)
      startSimulation: () => set({
        isSimulating: true,
        simulationStatus: "running",
      }),

      // ── Begin a new run (sets status + runMeta) ──
      beginRun: ({ timeHorizonMonths, paths, seedLocked }) => set({
        isSimulating: true,
        simulationStatus: "running",
        runMeta: {
          runId: generateRunId(),
          timeHorizonMonths,
          paths,
          seedLocked,
          startedAt: performance.now(),
          completedAt: null,
          durationMs: null,
          survivalDelta: null,
          runwayDelta: null,
          topDriverLabel: null,
        },
      }),

      // ── Complete run (populate safe deltas from previous run) ──
      completeRun: (result, verdict) => {
        const prev = get();
        const prevSurvival = prev.fullResult ? Math.round(prev.fullResult.survivalRate * 100) : null;
        const prevRunway = prev.fullResult ? prev.fullResult.runwayPercentiles.p50 : null;
        const newSurvival = Math.round(result.survivalRate * 100);
        const newRunway = result.runwayPercentiles.p50;

        const topDriver = result.sensitivityFactors
          ?.slice()
          .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0]?.label ?? null;

        const now = performance.now();
        const startedAt = prev.runMeta?.startedAt ?? now;

        set({
          isSimulating: false,
          simulationStatus: "complete",
          runMeta: {
            ...(prev.runMeta ?? {
              runId: generateRunId(),
              timeHorizonMonths: result.timeHorizonMonths,
              paths: result.iterations,
              seedLocked: true,
              startedAt,
            }),
            completedAt: now,
            durationMs: Math.round(now - startedAt),
            survivalDelta: prevSurvival !== null ? newSurvival - prevSurvival : null,
            runwayDelta: prevRunway !== null ? Math.round((newRunway - prevRunway) * 10) / 10 : null,
            topDriverLabel: topDriver,
          },
        });
      },

      // ── Mark run as failed ──
      failRun: (_errorMessage?: string) => set({
        simulationStatus: "error",
        isSimulating: false,
      }),

      // Save simulation results
      setSimulationResult: (result, verdict, levers) => set({
        hasSimulated: true,
        isSimulating: false,
        lastSimulationTime: new Date(),
        simulationCount: get().simulationCount + 1,
        fullResult: result,
        fullVerdict: verdict,
        assessmentPayload: {
          survivalRate: result.survivalRate,
          arrPercentiles: result.arrPercentiles,
          runwayPercentiles: result.runwayPercentiles,
          cashPercentiles: result.cashPercentiles,
          sensitivityFactors: result.sensitivityFactors ?? [],
        },
        summary: createSummary(result, verdict),
        leverSnapshot: { ...levers },
      }),

      // Clear simulation (when user wants fresh start)
      clearSimulation: () => set({
        hasSimulated: false,
        isSimulating: false,
        lastSimulationTime: null,
        simulationStatus: "idle",
        runMeta: null,
        fullResult: null,
        fullVerdict: null,
        assessmentPayload: null,
        summary: null,
        leverSnapshot: null,
      }),

      // Check if current levers match the simulated levers
      hasResultsForCurrentLevers: (currentLevers) => {
        const snapshot = get().leverSnapshot;
        if (!snapshot) return false;

        // Check if all lever values are the same
        for (const key of Object.keys(currentLevers)) {
          if (snapshot[key] !== currentLevers[key]) {
            return false;
          }
        }
        return true;
      },
    }),
    {
      name: 'stratfit-simulation',
      version: 1,
      storage: safeLocalStoragePersist(),
      partialize: (s) => ({
        hasSimulated: s.hasSimulated,
        simulationCount: s.simulationCount,
        simulationStatus: s.simulationStatus,
        runMeta: s.runMeta,
        // DO NOT persist fullResult/fullVerdict — they can be large and freeze localStorage writes.
        assessmentPayload: s.assessmentPayload,
        summary: s.summary,
        leverSnapshot: s.leverSnapshot,
        // We intentionally do NOT persist isSimulating or lastSimulationTime.
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SimulationState>),
        // Never resurrect a "running" sim after reload.
        isSimulating: false,
        lastSimulationTime: null,
        fullResult: null,
        fullVerdict: null,
        simulationStatus:
          (persisted as any)?.simulationStatus === "running"
            ? "idle"
            : ((persisted as any)?.simulationStatus ?? current.simulationStatus),
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
export const useSimulationStatus = () => useSimulationStore((s) => s.simulationStatus);
export const useRunMeta = () => useSimulationStore((s) => s.runMeta);

export default useSimulationStore;

