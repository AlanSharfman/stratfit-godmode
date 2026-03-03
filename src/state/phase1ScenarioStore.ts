// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — CANONICAL Scenario Store (Phase 1)
//
// SINGLE SOURCE OF TRUTH for scenario state across all routed pages:
//   /position, /studio, /compare, /decision
//
// All terrain metrics, simulation results, KPIs, and events MUST flow
// through this store. Do NOT use the legacy scenarioStore for new features.
// ═══════════════════════════════════════════════════════════════════════════
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useBaselineStore } from "@/state/baselineStore"
import { buildScenarioIdentity, type ScenarioIdentity } from "@/domain/scenarioIdentity"
import { logDecisionFlow } from "@/dev/decisionFlowLog"
import { selectKpis } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"
import { selectTerrainMetrics } from "@/selectors/terrainSelectors"
import type { LeverValues } from "@/domain/decision/LeverValues"
import { normalizeLeverValues, stableStringifyLevers } from "@/domain/decision/LeverValues"
import { applyLeversToBaseline } from "@/domain/decision/applyLevers"
import { generateSimulationEvents } from "@/engine/analysis/generateSimulationEvents"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"

export type SimulationStatus = "draft" | "running" | "complete" | "error"

/* ── Decision intent types (MVP deterministic) ── */

export type DecisionIntentType =
  | "hiring"
  | "pricing"
  | "cost_reduction"
  | "fundraising"
  | "growth_investment"
  | "other"

export const DECISION_INTENT_OPTIONS: { value: DecisionIntentType; label: string }[] = [
  { value: "hiring",            label: "Hiring / Team expansion" },
  { value: "pricing",           label: "Pricing change" },
  { value: "cost_reduction",    label: "Reduce costs" },
  { value: "fundraising",       label: "Raise funding" },
  { value: "growth_investment", label: "Growth investment" },
  { value: "other",             label: "Other" },
]

/* ── Simulation result types ── */

export type SimulationKpis = {
  cash: number
  monthlyBurn: number
  revenue: number
  grossMargin: number
  growthRate: number
  churnRate: number
  headcount: number
  arpa: number
  runway: number | null
}

export type TerrainMultipliers = {
  cash: number
  burn: number
  growth: number
}

export type TerrainData = {
  seed: number
  multipliers: TerrainMultipliers
}

/** Engine-produced terrain shape metrics — replaces UI-side deriveTerrainMetrics */
export type EngineTerrainMetrics = {
  elevationScale: number
  roughness: number
  ridgeIntensity: number
  volatility: number
}

export type SimulationResults = {
  completedAt: number
  horizonMonths: number
  summary: string
  kpis: SimulationKpis
  terrain: TerrainData
  /** Engine-computed terrain metrics — canonical source for terrain shape */
  terrainMetrics?: EngineTerrainMetrics
  /** Engine-generated terrain events — deterministic from KPIs */
  events?: TerrainEvent[]
}

export type Phase1Scenario = {
  id: string
  createdAt: number
  decision: string
  intent?: unknown
  /** MVP deterministic intent classification */
  decisionIntentType?: DecisionIntentType
  decisionIntentLabel?: string
  /** Lever values used for this scenario — persisted for Position page access */
  leverValues?: LeverValues
  status: SimulationStatus
  simulationResults?: SimulationResults
  /** Decision identity — populated on creation */
  identity?: ScenarioIdentity
}

export type CreateScenarioInput = {
  createdAt?: number
  decision: string
  intent?: unknown
  decisionIntentType?: DecisionIntentType
  decisionIntentLabel?: string
  leverValues?: LeverValues
}

type Phase1ScenarioState = {
  isHydrated: boolean
  hydrate: () => void
  scenarios: Phase1Scenario[]
  activeScenarioId: string | null
  /** RunId of the most recently completed simulation (completedAt timestamp) */
  lastCompletedRunId: number | null
  setActiveScenarioId: (id: string | null) => void
  createScenario: (input: CreateScenarioInput) => string
  runSimulation: (scenarioId: string) => void
  addScenario: (scenario: Phase1Scenario) => void
}

function newId() {
  // crypto.randomUUID available in modern browsers; fallback for older
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `scn_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

/* ── Deterministic hash helpers ── */

function hashString(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return h >>> 0
}

function hashToMultiplier(hash: number, bits: number, lo: number, hi: number): number {
  const frac = ((hash >>> bits) & 0xff) / 255
  return lo + frac * (hi - lo)
}

function computeTerrainData(scenarioId: string, decision: string, leverValues?: LeverValues): TerrainData {
  // Seed from scenario_id + decision + lever values for full determinism
  const leverStr = leverValues ? stableStringifyLevers(leverValues) : ""
  const seed = hashString(`${scenarioId}::${decision}::${leverStr}`)
  return {
    seed,
    multipliers: {
      cash:   hashToMultiplier(seed, 0, 0.88, 1.12),
      burn:   hashToMultiplier(seed, 4, 0.90, 1.15),
      growth: hashToMultiplier(seed, 8, 0.85, 1.20),
    },
  }
}

/**
 * Derive terrain shape metrics from simulation KPIs.
 * Produces the same shape as TerrainMetrics but from engine output,
 * removing the need for UI-side deriveTerrainMetrics on scenario paths.
 */
function computeEngineTerrainMetrics(
  kpis: SimulationKpis,
  multipliers: TerrainMultipliers,
): EngineTerrainMetrics {
  const growthFactor = Math.abs(kpis.growthRate) <= 1
    ? kpis.growthRate
    : kpis.growthRate / 100
  const marginFactor = Math.abs(kpis.grossMargin) <= 1
    ? kpis.grossMargin
    : kpis.grossMargin / 100
  const burnPressure = kpis.revenue > 0 ? kpis.monthlyBurn / kpis.revenue : 0

  return {
    elevationScale: 1 + growthFactor * 2,
    roughness: Math.min(burnPressure * 2, 4),
    ridgeIntensity: Math.min(Math.abs(multipliers.growth - 1) * 5, 1),
    volatility: Math.abs(growthFactor - marginFactor),
  }
}

function computeKpis(
  baseline: { cash: number; monthlyBurn: number; revenue: number; grossMargin: number; growthRate: number; churnRate: number; headcount: number; arpa: number },
  multipliers: TerrainMultipliers,
): SimulationKpis {
  const cash = baseline.cash * multipliers.cash
  const burn = baseline.monthlyBurn * multipliers.burn
  const revenue = baseline.revenue * multipliers.growth
  const runway = burn > 0 ? Math.round(cash / burn) : null
  return {
    cash,
    monthlyBurn: burn,
    revenue,
    grossMargin: baseline.grossMargin,
    growthRate: baseline.growthRate * multipliers.growth,
    churnRate: baseline.churnRate,
    headcount: baseline.headcount,
    arpa: baseline.arpa,
    runway,
  }
}

export const usePhase1ScenarioStore = create<Phase1ScenarioState>()(
  persist(
    (set, get) => ({
      isHydrated: false,
      hydrate: () => set({ isHydrated: true }),

      scenarios: [],
      activeScenarioId: null,
      lastCompletedRunId: null,

      setActiveScenarioId: (id) => set({ activeScenarioId: id }),

      createScenario: (input) => {
        const id = newId()
        const baselineId = useBaselineStore.getState().baseline
          ? `bl_${Date.now()}`
          : "no-baseline"

        const identity = buildScenarioIdentity(
          id,
          input.decision,
          baselineId,
          input.createdAt,
        )

        const scenario: Phase1Scenario = {
          id,
          createdAt: identity.createdAt,
          decision: input.decision,
          intent: input.intent,
          decisionIntentType: input.decisionIntentType,
          decisionIntentLabel: input.decisionIntentLabel,
          leverValues: normalizeLeverValues(input.leverValues),
          status: "draft",
          identity,
        }

        set((s) => ({
          scenarios: [scenario, ...s.scenarios],
        }))

        // DEV: log decision → scenarioInputs linkage
        logDecisionFlow("createScenario", {
          scenarioId: id,
          decision: input.decision,
          identity,
          baselineId,
        })

        return id
      },

      runSimulation: (scenarioId) => {
        const scenario = get().scenarios.find((s) => s.id === scenarioId)
        if (!scenario) return

        const baseline = useBaselineStore.getState().baseline
        if (!baseline) {
          // Cannot simulate without baseline
          set((s) => ({
            scenarios: s.scenarios.map((sc) =>
              sc.id === scenarioId ? { ...sc, status: "error" as const } : sc
            ),
          }))
          return
        }

        // Compute terrain + KPIs deterministically from scenario_id + decision text + levers
        const levers = scenario.leverValues ?? {}
        const adjusted = applyLeversToBaseline(baseline, levers)
        const terrain = computeTerrainData(scenarioId, scenario.decision, levers)
        const kpis = computeKpis(adjusted, terrain.multipliers)
        const terrainMetrics = computeEngineTerrainMetrics(kpis, terrain.multipliers)

        // Set status → running, pre-store terrain so Position can morph immediately
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === scenarioId
              ? {
                  ...sc,
                  status: "running" as const,
                  simulationResults: {
                    completedAt: 0, // sentinel: not yet complete
                    horizonMonths: 24,
                    summary: "",
                    kpis,
                    terrain,
                    terrainMetrics,
                  },
                }
              : sc
          ),
        }))

        // Simulate with 1.4s delay → finalize with timestamp + summary
        setTimeout(() => {
          const completedAt = Date.now()
          // Engine-generated events — deterministic from KPIs
          const events = generateSimulationEvents(kpis, 24)
          set((s) => ({
            lastCompletedRunId: completedAt,
            scenarios: s.scenarios.map((sc) =>
              sc.id === scenarioId
                ? {
                    ...sc,
                    status: "complete" as const,
                    simulationResults: {
                      completedAt,
                      horizonMonths: 24,
                      summary: `Simulation complete \u2014 ${scenario.decision.slice(0, 60)}`,
                      kpis,
                      terrain,
                      terrainMetrics,
                      events,
                    },
                  }
                : sc
            ),
          }))
          // DEV: log decision → scenarioInputs → engineResults linkage
          logDecisionFlow("simulationComplete", {
            scenarioId,
            decision: scenario.decision,
            identity: scenario.identity,
            engineResults: { kpis, terrain },
          })


        }, 1400)
      },

      addScenario: (scenario) => {
        set((s) => ({
          scenarios: [scenario, ...s.scenarios],
        }))
      },
    }),
    {
      name: "phase1ScenarioStore",
      version: 2,
      partialize: (s) => ({
        scenarios: s.scenarios,
        activeScenarioId: s.activeScenarioId,
        lastCompletedRunId: s.lastCompletedRunId,
      }),
      onRehydrateStorage: () => (state) => {
        // mark hydrated after persist rehydrates
        state?.hydrate?.()
      },
    }
  )
)
