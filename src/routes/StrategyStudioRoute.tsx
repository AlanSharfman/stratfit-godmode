import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import StrategyStudioPage from "@/components/strategy-studio/StrategyStudioPage";
import SimulationTelemetryRibbon from "@/components/simulation/SimulationTelemetryRibbon";
import ProDetailDrawer from "@/components/simulation/ProDetailDrawer";
import { SaveSimulationModal, LoadSimulationPanel } from "@/components/simulations";
import { emitCausal } from "@/ui/causalEvents";

import type { LeverState, ScenarioId } from "@/logic/calculateMetrics";

interface StrategyStudioRouteProps {
    levers?: LeverState;
    setLevers?: React.Dispatch<React.SetStateAction<LeverState>>;
    scenario?: ScenarioId;
    dataPoints?: number[];
    showSaveModal?: boolean;
    setShowSaveModal?: (show: boolean) => void;
    showLoadPanel?: boolean;
    setShowLoadPanel?: (show: boolean) => void;
    isSimulatingGlobal?: boolean;
    onRunScenario?: () => void;
}

export default function StrategyStudioRoute(props: StrategyStudioRouteProps) {
    const navigate = useNavigate();

    const defaultLevers = useMemo<LeverState>(
        () => ({
            demandStrength: 60,
            pricingPower: 50,
            expansionVelocity: 45,
            costDiscipline: 55,
            hiringIntensity: 40,
            operatingDrag: 35,
            marketVolatility: 30,
            executionRisk: 25,
            fundingPressure: 20,
        }),
        []
    );

    const [leversLocal, setLeversLocal] = useState<LeverState>(props.levers ?? defaultLevers);
    const levers = props.levers ?? leversLocal;
    const setLevers = props.setLevers ?? setLeversLocal;

    const scenario = props.scenario ?? "base";
    const dataPoints = props.dataPoints ?? [];
    const isSimulatingGlobal = props.isSimulatingGlobal ?? false;

    const [showSaveModalLocal, setShowSaveModalLocal] = useState(false);
    const [showLoadPanelLocal, setShowLoadPanelLocal] = useState(false);

    const showSaveModal = props.showSaveModal ?? showSaveModalLocal;
    const setShowSaveModal = props.setShowSaveModal ?? setShowSaveModalLocal;

    const showLoadPanel = props.showLoadPanel ?? showLoadPanelLocal;
    const setShowLoadPanel = props.setShowLoadPanel ?? setShowLoadPanelLocal;

    return (
        <>
            <StrategyStudioPage
                levers={levers}
                setLevers={setLevers}
                scenario={scenario}
                dataPoints={dataPoints}
                onSimulateRequest={() => navigate("/simulate")}
                onRunScenario={props.onRunScenario}
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
        </>
    );
}
