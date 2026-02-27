// src/terrain/useTerrainControls.ts
// ═══════════════════════════════════════════════════════════════════════════
// Lightweight bridge between DOM-layer terrain widgets and R3F OrbitControls.
// TerrainStage registers its controls here; TerrainNavWidget reads them.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface TerrainControlsStore {
  controls: OrbitControlsImpl | null;
  setControls: (c: OrbitControlsImpl | null) => void;
}

export const useTerrainControls = create<TerrainControlsStore>((set) => ({
  controls: null,
  setControls: (c) => set({ controls: c }),
}));
