import StrategyStudioPage from "@/components/strategy-studio/StrategyStudioPage";
import SimulationTelemetryRibbon from "@/components/simulation/SimulationTelemetryRibbon";
import ProDetailDrawer from "@/components/simulation/ProDetailDrawer";
import { SaveSimulationModal, LoadSimulationPanel } from "@/components/simulations";
import { emitCausal } from "@/ui/causalEvents";
import { useNavigate } from "react-router-dom";
import type { ScenarioId } from "@/components/ScenarioSlidePanel";
import type { LeverState } from "@/logic/calculateMetrics";
import React from "react";

interface StrategyStudioRouteProps {
  levers: LeverState;
  setLevers: React.Dispatch<React.SetStateAction<LeverState>>;
  scenario: ScenarioId;
  dataPoints: number[];
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  showLoadPanel: boolean;
  setShowLoadPanel: (show: boolean) => void;
  isSimulatingGlobal: boolean;
  onRunScenario: () => void;
}

export default function StrategyStudioRoute({
  levers,
  setLevers,
  scenario,
  dataPoints,
  showSaveModal,
  setShowSaveModal,
  showLoadPanel,
  setShowLoadPanel,
  isSimulatingGlobal,
  onRunScenario,
}: StrategyStudioRouteProps) {
  const navigate = useNavigate();

  return (
    <>
      <StrategyStudioPage
        levers={levers}
        setLevers={setLevers}
        scenario={scenario}
        dataPoints={dataPoints}
        onSimulateRequest={() => navigate("/simulate")}
        onRunScenario={onRunScenario}
      />

      <SaveSimulationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaved={(id) => {
          console.log("Simulation saved:", id);
          emitCausal({
            source: "simulation_saved",
            bandStyle: "solid",
            color: "rgba(34, 211, 153, 0.3)",
          });
        }}
      />

      <LoadSimulationPanel
        isOpen={showLoadPanel}
        onClose={() => setShowLoadPanel(false)}
        onLoad={(simulation) => {
          console.log("Simulation loaded:", simulation.name);
          emitCausal({
            source: "simulation_loaded",
            bandStyle: "solid",
            color: "rgba(34, 211, 238, 0.3)",
          });
        }}
      />

      <SimulationTelemetryRibbon />

      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 800, width: 380 }}>
        <ProDetailDrawer />
      </div>

      <div className={`recalibration-dim-veil${isSimulatingGlobal ? " active" : ""}`} />
        // ...existing code...
    </>
  );
}
