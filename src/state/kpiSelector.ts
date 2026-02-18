import { create } from "zustand";

export type KPISet = {
  arr: number;
  runway: number;
  risk: number;
  value: number;
};

type KPIState = {
  primary: KPISet;
  setPrimary: (k: KPISet) => void;
};

export const useKPIStore = create<KPIState>((set) => ({
  primary: {
    arr: 12.4,
    runway: 18,
    risk: 0.34,
    value: 86,
  },
  setPrimary: (k) => set({ primary: k }),
}));
