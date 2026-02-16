// src/core/store/useGodModeStore.ts
// STRATFIT — God Mode Store
// Phase 10 God Mode Overlays Lock

import { create } from "zustand";

interface GodModeState {
    enabled: boolean;
    showSignals: boolean;
    showPressure: boolean;
    showGhosts: boolean;
    toggle: () => void;
    setLayer: (layer: keyof Omit<GodModeState, "enabled" | "toggle" | "setLayer">, v: boolean) => void;
}

export const useGodModeStore = create<GodModeState>((set) => ({
    enabled: true,
    showSignals: true,
    showPressure: true,
    showGhosts: true,
    toggle: () => set((s) => ({ enabled: !s.enabled })),
    setLayer: (layer, v) => set({ [layer]: v } as any),
}));
