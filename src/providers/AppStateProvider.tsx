import React, { createContext, useContext, useMemo, useState } from "react";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { calculateMetrics, type LeverState, type ScenarioId as MetricsScenarioId } from "@/logic/calculateMetrics";
import type { ScenarioId } from "@/components/ScenarioSlidePanel";
import { useSimulationStore } from "@/state/simulationStore";
import { MODE } from "@/config/featureFlags";

export type AppState = {
  hasBaseline: boolean;
  showSimulate: boolean;
  setShowSimulate: (show: boolean) => void;
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  showLoadPanel: boolean;
  setShowLoadPanel: (show: boolean) => void;
  levers: LeverState;
  setLevers: React.Dispatch<React.SetStateAction<LeverState>>;
  scenario: ScenarioId;
  dataPoints: number[];
  isSimulatingGlobal: boolean;
};

const AppStateContext = createContext<AppState | null>(null);

const INITIAL_LEVERS: LeverState = {
  demandStrength: 60,
  pricingPower: 50,
  expansionVelocity: 45,
  costDiscipline: 55,
  hiringIntensity: 40,
  operatingDrag: 35,
  marketVolatility: 30,
  executionRisk: 25,
  fundingPressure: 20,
};

function metricsToDataPoints(metrics: ReturnType<typeof calculateMetrics>): number[] {
  const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
  return [
    clamp01(metrics.momentum / 100),
    clamp01(metrics.earningsPower / 100),
    clamp01(metrics.runway / 36),
    clamp01(metrics.cashPosition / 10),
    clamp01(1 - metrics.burnQuality / 100),
    clamp01(metrics.enterpriseValue / 100),
    clamp01(1 - metrics.riskIndex / 100),
  ];
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { baseline: systemBaseline } = useSystemBaseline();
  const hasBaseline = MODE === "demo" || !!systemBaseline;

  const [levers, setLevers] = useState<LeverState>(INITIAL_LEVERS);
  const [scenario] = useState<ScenarioId>("base");

  const [showSimulate, setShowSimulate] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadPanel, setShowLoadPanel] = useState(false);

  const isSimulatingGlobal = useSimulationStore((s) => s.simulationStatus === "running" || s.isSimulating);

  const dataPoints = useMemo(() => {
    const metrics = calculateMetrics(levers, scenario as unknown as MetricsScenarioId);
    return metricsToDataPoints(metrics);
  }, [levers, scenario]);

  const value: AppState = {
    hasBaseline,
    showSimulate,
    setShowSimulate,
    showSaveModal,
    setShowSaveModal,
    showLoadPanel,
    setShowLoadPanel,
    levers,
    setLevers,
    scenario,
    dataPoints,
    isSimulatingGlobal,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
