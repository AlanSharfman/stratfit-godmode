// src/state/scenarioStore.ts
import { create } from "zustand";
import type { LeverId } from "@/logic/mountainPeakModel";

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

type KPIKey = "mrr" | "grossProfit" | "cashBalance" | "burnRate" | "runway" | "cac" | "churnRate";

interface KPIValue {
  value: number;
  display: string;
}

interface ScenarioStoreState {
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;

  dataPoints: number[];
  setDataPoints: (dp: number[]) => void;

  hoveredKpiIndex: number | null;
  setHoveredKpiIndex: (i: number | null) => void;

  activeLeverId: LeverId | null;
  leverIntensity01: number;
  setActiveLever: (id: LeverId | null, intensity01: number) => void;

  kpiValues: Partial<Record<KPIKey, KPIValue>>;
  setKpiValues: (vals: Partial<Record<KPIKey, KPIValue>>) => void;
}

export const useScenarioStore = create<ScenarioStoreState>((set) => ({
  scenario: "base",
  setScenario: (s) => set({ scenario: s }),

  dataPoints: [],
  setDataPoints: (dp) => set({ dataPoints: Array.isArray(dp) ? dp : [] }),

  hoveredKpiIndex: null,
  setHoveredKpiIndex: (i) => set({ hoveredKpiIndex: i }),

  activeLeverId: null,
  leverIntensity01: 0,
  setActiveLever: (id, intensity01) =>
    set({ activeLeverId: id, leverIntensity01: Math.max(0, Math.min(1, intensity01)) }),

  kpiValues: {},
  setKpiValues: (vals) =>
    set((prev) => ({
      kpiValues: { ...prev.kpiValues, ...vals },
    })),
}));
