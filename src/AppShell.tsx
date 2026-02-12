import React, { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import { MainNav } from "@/components/navigation";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { calculateMetrics, type LeverState, type ScenarioId as MetricsScenarioId } from "@/logic/calculateMetrics";
import type { ScenarioId } from "@/components/ScenarioSlidePanel";
import { useSimulationStore } from "@/state/simulationStore";

export type AppOutletContext = {
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

export default function AppShell() {
  const { baseline: systemBaseline } = useSystemBaseline();
  const hasBaseline = !!systemBaseline;

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

  return (
    <div className="app">
      <MainNav />

      <Outlet
        context={{
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
        } satisfies AppOutletContext}
      />
    </div>
  );
}
