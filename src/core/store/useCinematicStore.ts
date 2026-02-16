// src/core/store/useCinematicStore.ts
// STRATFIT — Cinematic Store (Global)
// Phase 9 Cinematic Camera Lock

import { create } from "zustand";

export type CinematicMode = "explore" | "demo";

interface CinematicStore {
    mode: CinematicMode;
    demoStep: number;
    setMode: (mode: CinematicMode) => void;
    setDemoStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
}

export const useCinematicStore = create<CinematicStore>((set, get) => ({
    mode: "explore",
    demoStep: 0,
    setMode: (mode) => set({ mode }),
    setDemoStep: (demoStep) => set({ demoStep }),
    nextStep: () => set({ demoStep: get().demoStep + 1 }),
    prevStep: () => set({ demoStep: Math.max(0, get().demoStep - 1) }),
}));
