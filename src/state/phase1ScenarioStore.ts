import { create } from "zustand"
import { persist } from "zustand/middleware"

export type SimulationStatus = "draft" | "running" | "complete"

export type Phase1Scenario = {
  id: string
  createdAt: number

  // Phase-1 canonical fields
  decision: string

  // Pipeline enrichment (LLM later)
  intent?: unknown

  // Simulation lifecycle
  status: SimulationStatus
  simulationResults?: unknown

  // room for future:
  // baselineSnapshot?: unknown
  // deltas?: Record<string, unknown>
}

export type CreateScenarioInput = {
  createdAt?: number
  decision: string
  intent?: unknown
}

type Phase1ScenarioState = {
  // NOTE: earlier you flagged this store uses isHydrated, not hydrated
  isHydrated: boolean
  hydrate: () => void

  scenarios: Phase1Scenario[]
  activeScenarioId: string | null
  setActiveScenarioId: (id: string | null) => void

  // NEW canonical API (DecisionPage will use this)
  createScenario: (input: CreateScenarioInput) => string

  // Simulation lifecycle
  runSimulation: (scenarioId: string) => void

  // OPTIONAL legacy compat: allow adding a fully formed scenario
  addScenario: (scenario: Phase1Scenario) => void
}

function newId() {
  // crypto.randomUUID available in modern browsers; fallback for older
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `scn_${Math.random().toString(16).slice(2)}_${Date.now()}`
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
        // Set status → running
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === scenarioId ? { ...sc, status: "running" as const } : sc
          ),
        }))

        // Mock simulation: 1.5s delay → complete with stub results
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
                      summary: "Simulation complete (stub)",
                    },
                  }
                : sc
            ),
          }))
        }, 1500)
      },

      addScenario: (scenario) => {
        set((s) => ({
          scenarios: [scenario, ...s.scenarios],
        }))
      },
    }),
    {
      name: "phase1ScenarioStore",
      version: 1,
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
