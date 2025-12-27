// src/state/uiStore.ts
import { create } from "zustand";
import type { MetricId } from "../dashboardConfig";

interface UIState {
  activeMetricId: MetricId | null;
  setActiveMetricId: (id: MetricId | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeMetricId: null,
  setActiveMetricId: (id) => set({ activeMetricId: id }),
}));
