// src/stores/intelligenceTargetStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence Target Store
//
// Controls which terrain anchor the intelligence system is currently
// highlighting. Consumed by laser beam, pulse, label, spotlight, camera.
//
// Supports multi-target sequencing via setTarget / clearTarget.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import { getTerrainAnchor, type TerrainAnchor } from "@/terrain/terrainAnchors";

// ────────────────────────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────────────────────────

export interface IntelligenceTargetState {
  currentTarget: TerrainAnchor | null;
  isActive: boolean;
}

export interface IntelligenceTargetActions {
  /** Activate a terrain anchor by id */
  setTarget: (anchorId: string) => void;
  /** Deactivate the current target */
  clearTarget: () => void;
}

export type IntelligenceTargetStore = IntelligenceTargetState & IntelligenceTargetActions;

// ────────────────────────────────────────────────────────────────────────────
// STORE
// ────────────────────────────────────────────────────────────────────────────

export const useIntelligenceTargetStore = create<IntelligenceTargetStore>((set) => ({
  currentTarget: null,
  isActive: false,

  setTarget: (anchorId) => {
    const anchor = getTerrainAnchor(anchorId);
    if (anchor) {
      set({ currentTarget: anchor, isActive: true });
    }
  },

  clearTarget: () => {
    set({ currentTarget: null, isActive: false });
  },
}));

// ────────────────────────────────────────────────────────────────────────────
// NON-REACT ACCESS
// ────────────────────────────────────────────────────────────────────────────

export const intelligenceTarget = {
  set: (anchorId: string) => useIntelligenceTargetStore.getState().setTarget(anchorId),
  clear: () => useIntelligenceTargetStore.getState().clearTarget(),
  get: () => useIntelligenceTargetStore.getState().currentTarget,
};
