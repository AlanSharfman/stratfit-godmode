import { create } from "zustand";

export type InitiateState = {
  companyName: string;
  timeHorizonMonths: number;
  baselineRevenue: number;
  baselineRunwayMonths: number;
  objective: string;
};

type InitiateStore = InitiateState & {
  setField: <K extends keyof InitiateState>(
    key: K,
    value: InitiateState[K]
  ) => void;
};

export const useInitiateStore = create<InitiateStore>((set) => ({
  companyName: "Sample Co",
  timeHorizonMonths: 24,
  baselineRevenue: 1000000,
  baselineRunwayMonths: 18,
  objective: "Grow sustainably",

  setField: (key, value) =>
    set((state) => ({
      ...state,
      [key]: value,
    })),
}));
