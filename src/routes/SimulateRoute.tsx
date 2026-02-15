import StrategyStudioPage from "@/components/strategy-studio/StrategyStudioPage";
import SimulationTelemetryRibbon from '@/components/simulation/SimulationTelemetryRibbon';
import ProDetailDrawer from '@/components/simulation/ProDetailDrawer';
import { SimulateOverlay } from '@/components/simulate';
import { SaveSimulationModal, LoadSimulationPanel } from '@/components/simulations';
import { emitCausal } from "@/ui/causalEvents";
import { ScenarioId } from "@/components/ScenarioSlidePanel";
import { LeverState } from "@/logic/calculateMetrics";
import React from "react";

interface SimulateRouteProps {
  levers: LeverState;
  setLevers: React.Dispatch<React.SetStateAction<LeverState>>;
  scenario: ScenarioId;
  dataPoints: number[];
  showSimulate: boolean;
  setShowSimulate: (show: boolean) => void;
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  showLoadPanel: boolean;
  setShowLoadPanel: (show: boolean) => void;
  isSimulatingGlobal: boolean;
  onRunScenario: () => void;
}

export default function SimulateRoute({
  levers,
  setLevers,
  scenario,
  dataPoints,
  showSimulate,
  setShowSimulate,
  showSaveModal,
  setShowSaveModal,
  showLoadPanel,
  setShowLoadPanel,
  isSimulatingGlobal,
  onRunScenario,
}: SimulateRouteProps) {
  return (
    <>
      <StrategyStudioPage
        levers={levers}
        setLevers={setLevers}
        scenario={scenario}
        dataPoints={dataPoints}
        onSimulateRequest={() => setShowSimulate(true)}
        onRunScenario={onRunScenario}
      />
      
      {/* Monte Carlo Overlay (still accessible) */}
      <SimulateOverlay
        isOpen={showSimulate}
        onClose={() => setShowSimulate(false)}
        levers={levers}
      />
      
      <SaveSimulationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaved={(id) => {
          console.log('Simulation saved:', id);
          emitCausal({ source: "simulation_saved", bandStyle: "solid", color: "rgba(34, 211, 153, 0.3)" });
        }}
      />
      
      <LoadSimulationPanel
        isOpen={showLoadPanel}
        onClose={() => setShowLoadPanel(false)}
        onLoad={(simulation) => {
          console.log('Simulation loaded:', simulation.name);
          emitCausal({ source: "simulation_loaded", bandStyle: "solid", color: "rgba(34, 211, 238, 0.3)" });
        }}
      />
      
      {/* Telemetry ribbon — visible across all views */}
      <SimulationTelemetryRibbon />
      
      {/* Pro detail drawer — gated (pro/enterprise only) */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 800, width: 380 }}>
        <ProDetailDrawer />
      </div>

      {/* ── RECALIBRATION STAGE ISOLATION ── */}
      <div className={`recalibration-dim-veil${isSimulatingGlobal ? ' active' : ''}`} />
      <div className={`recalibration-signal${isSimulatingGlobal ? ' active' : ''}`}>
        Recalculating structural behaviour…
      </div>
    </>
  );
}
