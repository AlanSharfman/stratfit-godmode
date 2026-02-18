import { create } from "zustand";

export type NarrativeTargetType = "beacon" | "marker" | "path" | "terrain";

export type NarrativeTarget = {
  id: string;
  type: NarrativeTargetType;
  label?: string;
  kind?: string; // risk/liquidity/value/strategy
  strength?: number;
  t?: number; // 0..1
};

type NarrativeState = {
  hovered: NarrativeTarget | null;
  selected: NarrativeTarget | null;

  setHovered: (t: NarrativeTarget | null) => void;
  setSelected: (t: NarrativeTarget | null) => void;

  clearHovered: () => void;
  clearSelected: () => void;
  clearAll: () => void;
};

export const useNarrativeStore = create<NarrativeState>((set) => ({
  hovered: null,
  selected: null,

  setHovered: (t) => set({ hovered: t }),
  setSelected: (t) => set({ selected: t }),

  clearHovered: () => set({ hovered: null }),
  clearSelected: () => set({ selected: null }),
  clearAll: () => set({ hovered: null, selected: null }),
}));
