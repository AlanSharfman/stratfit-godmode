import { create } from "zustand";
import { BaselineInputs } from "@/pages/initialize/initialize.types";

export interface OverrideScenario {
  id: string;
  name: string;
  overrides: Partial<BaselineInputs>;
}

interface ScenarioOverridesStore {
  scenarios: OverrideScenario[];
  activeScenarioId: string | null;

  addScenario: (scenario: OverrideScenario) => void;
  setActiveScenario: (id: string | null) => void;
}

export const useScenarioOverridesStore = create<ScenarioOverridesStore>((set) => ({
  scenarios: [],
  activeScenarioId: null,

  addScenario: (scenario) =>
    set((state) => ({
      scenarios: [...state.scenarios, scenario],
    })),

  setActiveScenario: (id) => set({ activeScenarioId: id }),
}));
