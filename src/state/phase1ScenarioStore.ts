import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useBaselineStore } from "@/state/baselineStore"

export type SimulationStatus = "draft" | "running" | "complete" | "error"

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

export type SimulationResults = {
  completedAt: number
  horizonMonths: number
  summary: string
  kpis: SimulationKpis
  terrain: TerrainData
}

export type Phase1Scenario = {
  id: string
  createdAt: number
  decision: string
  intent?: unknown
  status: SimulationStatus
  simulationResults?: SimulationResults
}

export type CreateScenarioInput = {
  createdAt?: number
  decision: string
  intent?: unknown
}

type Phase1ScenarioState = {
  isHydrated: boolean
  hydrate: () => void
  scenarios: Phase1Scenario[]
  activeScenarioId: string | null
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

function computeTerrainData(decision: string): TerrainData {
  const seed = hashString(decision)
  return {
    seed,
    multipliers: {
      cash:   hashToMultiplier(seed, 0, 0.88, 1.12),
      burn:   hashToMultiplier(seed, 4, 0.90, 1.15),
      growth: hashToMultiplier(seed, 8, 0.85, 1.20),
    },
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

      setActiveScenarioId: (id) => set({ activeScenarioId: id }),

      createScenario: (input) => {
        const id = newId()
        const scenario: Phase1Scenario = {
          id,
          createdAt: input.createdAt ?? Date.now(),
          decision: input.decision,
          intent: input.intent,
          status: "draft",
        }

        set((s) => ({
          scenarios: [scenario, ...s.scenarios],
        }))

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

        // Set status → running
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === scenarioId ? { ...sc, status: "running" as const } : sc
          ),
        }))

        // Compute terrain + KPIs deterministically from decision text
        const terrain = computeTerrainData(scenario.decision)
        const kpis = computeKpis(baseline, terrain.multipliers)

        // Simulate with 1.4s delay → complete with rich results
        setTimeout(() => {
          set((s) => ({
            scenarios: s.scenarios.map((sc) =>
              sc.id === scenarioId
                ? {
                    ...sc,
                    status: "complete" as const,
                    simulationResults: {
                      completedAt: Date.now(),
                      horizonMonths: 24,
                      summary: `Simulation complete — ${scenario.decision.slice(0, 60)}`,
                      kpis,
                      terrain,
                    },
                  }
                : sc
            ),
          }))
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
      }),
      onRehydrateStorage: () => (state) => {
        // mark hydrated after persist rehydrates
        state?.hydrate?.()
      },
    }
  )
)
