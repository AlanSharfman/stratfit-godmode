// src/state/renderFlagsStore.ts
// STRATFIT — Render Flags Store
// Centralises boolean render toggles consumed by terrain + overlays.

import { create } from "zustand";

export interface RenderFlags {
  showGrid: boolean;
  showMarkers: boolean;
  showPaths: boolean;
  showRiskField: boolean;
  showFlow: boolean;
  showHeat: boolean;
  showTopo: boolean;
  showEnvelope: boolean;
  showAnnotations: boolean;
  showPreview: boolean;
  watchDemo: boolean;
}

interface RenderFlagsState extends RenderFlags {
  toggle: (key: keyof RenderFlags) => void;
  set: (key: keyof RenderFlags, value: boolean) => void;
  reset: () => void;
}

const DEFAULTS: RenderFlags = {
  showGrid: true,
  showMarkers: true,
  showPaths: true,
  showRiskField: true,
  showFlow: false,
  showHeat: false,
  showTopo: false,
  showEnvelope: false,
  showAnnotations: false,
  showPreview: false,
  watchDemo: false,
};

export const useRenderFlagsStore = create<RenderFlagsState>((set, get) => ({
  ...DEFAULTS,

  toggle: (key) => set({ [key]: !get()[key] }),

  set: (key, value) => set({ [key]: value }),

  reset: () => set({ ...DEFAULTS }),
}));

export default useRenderFlagsStore;
