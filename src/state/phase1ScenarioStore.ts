import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Phase1Scenario = {
  id: string
  createdAt: number

  // Phase-1 canonical fields
  decision: string

  // Pipeline enrichment (LLM later)
  intent?: unknown

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
        }

        set((s) => ({
          scenarios: [scenario, ...s.scenarios],
        }))

        return id
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
