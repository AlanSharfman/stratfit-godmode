// src/state/simulationStore.ts
// STRATFIT — Simulation Results Store (Module 1: Canonical Lifecycle + Cancellation)

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { MonteCarloResult } from "@/logic/monteCarloEngine"
import type { Verdict } from "@/logic/verdictGenerator"
import { safeLocalStoragePersist } from "./safePersistStorage"
import { runSimulationAndStore } from "@/core/bootstrap/simulationRunner"
import { engineActivity } from "@/state/engineActivityStore"

// ════════════════════════════════════════════════════════════════════════════
// SIMULATION RUN — contract shape consumed by UI (read-only)
// ════════════════════════════════════════════════════════════════════════════

export interface SimulationRun {
  id: string;
  timestamp: number;
  horizonMonths: number;
  iterations: number;
  results: {
    runway?: { p50: number; p90: number };
    probability?: number;  // 0–100
    suggestion?: string;
    drivers?: Array<{ name: string; impact: number }>;
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CANONICAL STATUS (Module 1)
// ════════════════════════════════════════════════════════════════════════════

export type SimulationStatus =
  | "idle"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

/** User-safe telemetry metadata (no engine internals exposed) */
export interface RunMeta {
  runId: string
  timeHorizonMonths: number
  paths: number
  seedLocked: boolean
  startedAt: number | null
  completedAt: number | null
  durationMs: number | null
  survivalDelta: number | null
  runwayDelta: number | null
  topDriverLabel: string | null
  inputsHash: string | null
}

/**
 * Minimal, assessment-safe payload derived from MonteCarloResult.
 * Persistable without freezing localStorage writes.
 */
export interface AssessmentPayload {
  survivalRate: number
  arrPercentiles: { p10: number; p50: number; p90: number }
  runwayPercentiles: { p10: number; p50: number; p90: number }
  cashPercentiles: any
  sensitivityFactors: Array<{
    lever: string
    label: string
    impact: number
    direction: "positive" | "negative"
  }>
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
  // Legacy convenience flags (keep for UI compat)
  hasSimulated: boolean
  isSimulating: boolean
  lastSimulationTime: Date | null
  simulationCount: number

  // Canonical status
  simulationStatus: SimulationStatus
  runMeta: RunMeta | null

  // Cancellation (NOT persisted)
  abortController: AbortController | null

  // Full results (NOT persisted)
  fullResult: MonteCarloResult | null
  fullVerdict: Verdict | null

  // Minimal persisted payload
  assessmentPayload: AssessmentPayload | null
  summary: SimulationSummary | null
  leverSnapshot: Record<string, number> | null

  // Active run surface for UI (optional / lightweight)
  activeRun: SimulationRun | null

  // Actions
  clearSimulation: () => void
  cancelSimulation: () => void

  // Legacy lifecycle shims — used by worker-based SimulateOverlayWired.
  // These bridge the old per-phase API into the new canonical status machine.
  startSimulation: () => void
  beginRun: (meta: Pick<RunMeta, 'timeHorizonMonths' | 'paths' | 'seedLocked'>) => void
  completeRun: (result: MonteCarloResult, verdict: Verdict) => void
  failRun: (errorMessage?: string) => void
  setSimulationResult: (result: MonteCarloResult, verdict: Verdict, levers: Record<string, number>) => void

  /**
   * PRIMARY DISPATCH — call from user action handlers only.
   * user action → runSimulation() → store updates → UI reads only
   */
  runSimulation: (payload: {
    inputs?: Record<string, unknown>
    horizonMonths?: number
    iterations?: number
  }) => Promise<void>

  // Helpers
  hasResultsForCurrentLevers: (currentLevers: Record<string, number>) => boolean
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

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
    topRecommendation: verdict.recommendations[0]?.action ?? "Continue current strategy",
    confidenceLevel: verdict.confidenceLevel,
  }
}

// Deterministic-ish hash (MVP; replace with stable-hash util later)
function inputsHashFn(inputs: Record<string, unknown> | undefined): string {
  try {
    return JSON.stringify(inputs ?? {})
  } catch {
    return "unhashable"
  }
}

function generateRunId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  return `run-${ts}-${rand}`
}

function resetEngineToIdle(message?: string) {
  // HARD RESET to avoid stale iterations/stage after cancel/clear
  engineActivity.reset()
  engineActivity.update({
    isRunning: false,
    stage: "IDLE",
    message: message ?? "Ready.",
    error: undefined,
    iterationsTarget: 0,
    iterationsCompleted: 0,
  })
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      hasSimulated: false,
      isSimulating: false,
      lastSimulationTime: null,
      simulationCount: 0,

      simulationStatus: "idle",
      runMeta: null,

      abortController: null,

      fullResult: null,
      fullVerdict: null,

      assessmentPayload: null,
      summary: null,
      leverSnapshot: null,

      activeRun: null,

      clearSimulation: () => {
        resetEngineToIdle("Cleared.")
        set({
          hasSimulated: false,
          isSimulating: false,
          lastSimulationTime: null,
          simulationStatus: "idle",
          runMeta: null,
          abortController: null,
          fullResult: null,
          fullVerdict: null,
          assessmentPayload: null,
          summary: null,
          leverSnapshot: null,
          activeRun: null,
        })
      },

      cancelSimulation: () => {
        const controller = get().abortController
        if (controller) controller.abort()

        resetEngineToIdle("Simulation cancelled.")

        set({
          abortController: null,
          isSimulating: false,
          simulationStatus: "cancelled",
        })
      },

      // ── Legacy lifecycle shims (worker-based SimulateOverlayWired) ──
      startSimulation: () => {
        engineActivity.start({ iterationsTarget: 0, modelType: "MonteCarlo" })
        engineActivity.update({ stage: "SAMPLING", message: "Running simulation…" })
        set({ isSimulating: true, simulationStatus: "running" })
      },

      beginRun: ({ timeHorizonMonths, paths, seedLocked }) => {
        engineActivity.start({ iterationsTarget: paths, modelType: "MonteCarlo" })
        engineActivity.update({ stage: "SAMPLING", message: "Running simulation…" })
        set({
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
            inputsHash: null,
          },
        })
      },

      completeRun: (result, verdict) => {
        engineActivity.complete()
        const prev = get()
        const now = performance.now()
        const startedAt = prev.runMeta?.startedAt ?? now
        const topDriver = result.sensitivityFactors
          ?.slice()
          .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0]?.label ?? null
        set({
          isSimulating: false,
          simulationStatus: "completed",
          fullResult: result,
          fullVerdict: verdict,
          summary: createSummary(result, verdict),
          runMeta: {
            ...(prev.runMeta ?? {
              runId: generateRunId(),
              timeHorizonMonths: result.timeHorizonMonths,
              paths: result.iterations,
              seedLocked: true,
              startedAt,
              inputsHash: null,
            }),
            completedAt: now,
            durationMs: Math.round(now - startedAt),
            survivalDelta: null,
            runwayDelta: null,
            topDriverLabel: topDriver,
          },
        })
      },

      failRun: (errorMessage?: string) => {
        const msg = errorMessage ?? "Simulation failed"
        engineActivity.fail(msg)
        set({ simulationStatus: "failed", isSimulating: false })
      },

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

      runSimulation: async ({ inputs = {}, horizonMonths = 24, iterations = 20000 } = {}) => {
        // Guard: do not start if already running
        const status = get().simulationStatus
        if (status === "queued" || status === "running") return

        const runId = generateRunId()
        const hash = inputsHashFn(inputs)

        // Create abort controller for real cancellation
        const abortController = new AbortController()

        // Transition: idle -> queued
        set({
          abortController,
          isSimulating: true,
          simulationStatus: "queued",
          runMeta: {
            runId,
            timeHorizonMonths: horizonMonths,
            paths: iterations,
            seedLocked: true,
            startedAt: performance.now(),
            completedAt: null,
            durationMs: null,
            survivalDelta: null,
            runwayDelta: null,
            topDriverLabel: null,
            inputsHash: hash,
          },
        })

        // Telemetry: start engine presence
        engineActivity.start({
          iterationsTarget: iterations,
          modelType: "MonteCarlo",
        })

        // Yield to React so queued/running renders before compute
        await new Promise<void>((resolve) => setTimeout(resolve, 0))

        // Transition: queued -> running
        set({ simulationStatus: "running" })
        engineActivity.update({ stage: "SAMPLING", message: "Running simulation…" })

        try {
          const output = await runSimulationAndStore({
            signal: abortController.signal,
            onProgress: (p) => {
              engineActivity.update({
                stage: p.stage,
                iterationsCompleted: p.iterationsCompleted,
                message: p.message,
              })
            },
          })

          // If user cancelled during run, do not commit results
          if (abortController.signal.aborted) {
            set({
              abortController: null,
              isSimulating: false,
              simulationStatus: "cancelled",
            })
            return
          }

          engineActivity.complete()

          // Build lightweight activeRun from output
          const run: SimulationRun = {
            id: output.runId,
            timestamp: output.meta.createdAt,
            horizonMonths,
            iterations,
            results: {
              runway: {
                p50: output.liquidity.runwayMonths,
                p90: output.liquidity.runwayMonths,
              },
              probability: Math.round(output.simulation.survivalProbability * 100),
              suggestion: output.commentary.bullets[0] ?? undefined,
            },
          }

          const now = performance.now()
          const startedAt = get().runMeta?.startedAt ?? now

          set({
            activeRun: run,
            isSimulating: false,
            simulationStatus: "completed",
            abortController: null,
            hasSimulated: true,
            simulationCount: get().simulationCount + 1,
            lastSimulationTime: new Date(),
            runMeta: get().runMeta
              ? {
                  ...get().runMeta!,
                  completedAt: now,
                  durationMs: Math.round(now - (startedAt ?? now)),
                }
              : null,
          })
        } catch (err: unknown) {
          if (abortController.signal.aborted) {
            engineActivity.update({ isRunning: false, stage: "IDLE", message: "Simulation cancelled." })
            set({
              abortController: null,
              isSimulating: false,
              simulationStatus: "cancelled",
            })
            return
          }

          const msg = err instanceof Error ? err.message : "Unknown error"
          engineActivity.fail(msg)

          set({
            abortController: null,
            isSimulating: false,
            simulationStatus: "failed",
          })
        }
      },

      hasResultsForCurrentLevers: (currentLevers) => {
        const snapshot = get().leverSnapshot
        if (!snapshot) return false
        for (const key of Object.keys(currentLevers)) {
          if (snapshot[key] !== currentLevers[key]) return false
        }
        return true
      },
    }),
    {
      name: "stratfit-simulation",
      version: 2,
      storage: safeLocalStoragePersist(),
      partialize: (s) => ({
        hasSimulated: s.hasSimulated,
        simulationCount: s.simulationCount,
        simulationStatus: s.simulationStatus,
        runMeta: s.runMeta,
        assessmentPayload: s.assessmentPayload,
        summary: s.summary,
        leverSnapshot: s.leverSnapshot,
        // do NOT persist abortController/isSimulating/lastSimulationTime/fullResult/fullVerdict/activeRun
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SimulationState>),
        isSimulating: false,
        lastSimulationTime: null,
        abortController: null,
        fullResult: null,
        fullVerdict: null,
        activeRun: null,
        // Never resurrect running/queued after reload
        simulationStatus:
          (persisted as any)?.simulationStatus === "running" ||
          (persisted as any)?.simulationStatus === "queued"
            ? "idle"
            : ((persisted as any)?.simulationStatus ?? current.simulationStatus),
      }),
    }
  )
)

// Primitive selectors only (avoid object selectors)
export const useSimulationStatus = () => useSimulationStore((s) => s.simulationStatus)
export const useRunMeta = () => useSimulationStore((s) => s.runMeta)
export const useIsSimulating = () => useSimulationStore((s) => s.isSimulating)
export const useHasSimulated = () => useSimulationStore((s) => s.hasSimulated)

// Backwards-compat named exports (consumed by existing components)
export const useSimulationSummary = () => useSimulationStore((s) => s.summary)
export const useSimulationVerdict = () => useSimulationStore((s) => s.fullVerdict)
export const useSimulationResult = () => useSimulationStore((s) => s.fullResult)

export default useSimulationStore

