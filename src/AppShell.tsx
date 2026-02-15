import React, { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import { MainNav } from "@/components/navigation";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { calculateMetrics, type LeverState, type ScenarioId as MetricsScenarioId } from "@/logic/calculateMetrics";
import type { ScenarioId } from "@/components/ScenarioSlidePanel";
import { useSimulationStore } from "@/state/simulationStore";
import { useSimulationStore as useSimStore } from "@/sim/SimulationStore";
import { runSimulation } from "@/sim/SimulationEngine";
import StratfitErrorBoundary from "@/diagnostics/StratfitErrorBoundary";
import GlobalErrorCapture from "@/diagnostics/GlobalErrorCapture";
import DiagnosticsBootstrap from "@/diagnostics/DiagnosticsBootstrap";
import DiagnosticsOverlay from "@/diagnostics/DiagnosticsOverlay";
import { useDiagnosticsStore } from "@/diagnostics/DiagnosticsStore";

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

  const simPhase = useSimStore((s) => s.phase);
  const simMeta = useSimStore((s) => s.meta);
  const diagEnabled = useDiagnosticsStore((s) => s.enabled);

  const handleRunSimulation = () => {
    runSimulation({ convergenceThreshold: 0.08 });
  };

  return (
    <StratfitErrorBoundary>
      <GlobalErrorCapture />
      <DiagnosticsBootstrap />
      <DiagnosticsOverlay />

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

        {/* Phase 2 Dev Probe: Simulation Lifecycle - Only shown when diagnostics enabled */}
        {diagEnabled && (
          <div
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              background: "#1a1a1a",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              fontFamily: "monospace",
              fontSize: 11,
              zIndex: 9998,
              minWidth: 240,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12 }}>
              Phase 2: Simulation Lifecycle
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Phase:</strong> {simPhase}
            </div>
            {simMeta && (
              <>
                <div style={{ marginBottom: 4 }}>
                  <strong>Progress:</strong> {((simMeta.progress || 0) * 100).toFixed(0)}%
                </div>
                {simMeta.confidenceIntervalWidth !== undefined && (
                  <div style={{ marginBottom: 4 }}>
                    <strong>CI Width:</strong> {simMeta.confidenceIntervalWidth.toFixed(3)}
                  </div>
                )}
                {simMeta.error && (
                  <div style={{ color: "#ff6b6b", marginBottom: 4 }}>
                    <strong>Error:</strong> {simMeta.error}
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleRunSimulation}
              disabled={simPhase !== "Idle" && simPhase !== "Stable" && simPhase !== "Error"}
              style={{
                marginTop: 10,
                padding: "6px 12px",
                background: simPhase === "Idle" || simPhase === "Stable" || simPhase === "Error" ? "#3b82f6" : "#666",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: simPhase === "Idle" || simPhase === "Stable" || simPhase === "Error" ? "pointer" : "not-allowed",
                fontFamily: "monospace",
                fontSize: 11,
                fontWeight: 700,
                width: "100%",
              }}
            >
              Run Simulation
            </button>
          </div>
        )}
      </div>
    </StratfitErrorBoundary>
  );
}
