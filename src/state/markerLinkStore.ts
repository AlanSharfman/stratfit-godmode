// src/state/markerLinkStore.ts
// STRATFIT — Mountain Marker ↔ Panel Link Store

import { create } from "zustand";

type MarkerLinkState = {
  activeId: string | null;
  hoverId: string | null;
  setActive: (id: string | null) => void;
  setHover: (id: string | null) => void;
};

export const useMarkerLinkStore = create<MarkerLinkState>((set) => ({
  activeId: null,
  hoverId: null,
  setActive: (id) => set({ activeId: id }),
  setHover: (id) => set({ hoverId: id }),
}));
