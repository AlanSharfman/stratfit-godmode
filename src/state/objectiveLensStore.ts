import { create } from "zustand";

export type ObjectiveLens = "survival" | "value" | "liquidity";

type LensState = {
  lens: ObjectiveLens;
  setLens: (l: ObjectiveLens) => void;
};

export const useObjectiveLensStore = create<LensState>((set) => ({
  lens: "value",
  setLens: (l) => set({ lens: l }),
}));
