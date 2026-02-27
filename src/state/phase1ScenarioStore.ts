import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Scenario, SCENARIO_STORAGE_KEY } from "@/types/scenario"

interface Phase1ScenarioState {
  scenarios: Scenario[]
  activeScenarioId: string | null
  isHydrated: boolean

  hydrate: () => void
  createScenario: (scenario: Scenario) => void
  setActiveScenario: (id: string | null) => void
  updateScenario: (scenario: Scenario) => void
  deleteScenario: (id: string) => void
  clearAll: () => void
}

export const usePhase1ScenarioStore = create<Phase1ScenarioState>()(
  persist(
    (set, get) => ({
      scenarios: [],
      activeScenarioId: null,
      isHydrated: false,

      hydrate: () => set({ isHydrated: true }),
      createScenario: (scenario) =>
        set((state) => ({
          scenarios: [...state.scenarios, scenario],
          activeScenarioId: scenario.id,
        })),

      setActiveScenario: (id) => set({ activeScenarioId: id }),

      updateScenario: (scenario) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === scenario.id ? scenario : s
          ),
        })),

      deleteScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
          activeScenarioId:
            state.activeScenarioId === id ? null : state.activeScenarioId,
        })),

      clearAll: () =>
        set({
          scenarios: [],
          activeScenarioId: null,
        }),
    }),
    {
      name: SCENARIO_STORAGE_KEY,
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.hydrate()
      },
    }
  )
)
