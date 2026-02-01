import { create } from "zustand";
import { Levers } from "../engine/SimulationEngine";

interface LeverState {
  workingLevers: Levers;
  setLevers: (l: Levers) => void;
}

export const useWorkingLeversStore = create<LeverState>((set) => ({
  workingLevers: {
    pricingPower: 0,
    hiringIntensity: 0,
    expansionRate: 0,
    costDiscipline: 0,
  },
  setLevers: (l) => set({ workingLevers: l }),
}));


