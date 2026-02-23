import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BaselineInputs } from "@/pages/initialize/initialize.types";

interface BaselineStore {
  baselineInputs: BaselineInputs | null;
  setBaselineInputs: (inputs: BaselineInputs) => void;
  resetBaseline: () => void;
}

export const useBaselineStore = create<BaselineStore>()(
  persist(
    (set) => ({
      baselineInputs: null,
      setBaselineInputs: (inputs) => set({ baselineInputs: inputs }),
      resetBaseline: () => set({ baselineInputs: null }),
    }),
    { name: "stratfit-baseline" }
  )
);
