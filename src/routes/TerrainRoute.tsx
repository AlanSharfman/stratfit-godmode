import React, { useMemo, useState } from "react";
import BaselinePage from "@/pages/baseline/BaselinePage";
import BaselineKPIStrip from "@/components/baseline/BaselineKPIStrip";
import { SimulateOverlay } from "@/components/simulate";
import { SaveSimulationModal, LoadSimulationPanel } from "@/components/simulations";
import SimulationTelemetryRibbon from "@/components/simulation/SimulationTelemetryRibbon";
import ProDetailDrawer from "@/components/simulation/ProDetailDrawer";
import SimulationActivityMonitor from "@/components/system/SimulationActivityMonitor";
import { emitCausal } from "@/ui/causalEvents";
import { useNavigate } from "react-router-dom";
import type { LeverState } from "@/logic/calculateMetrics";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";

interface TerrainRouteProps {
    hasBaseline?: boolean;
    showSimulate?: boolean;
    setShowSimulate?: (show: boolean) => void;
    showSaveModal?: boolean;
    setShowSaveModal?: (show: boolean) => void;
    showLoadPanel?: boolean;
    setShowLoadPanel?: (show: boolean) => void;
    levers?: LeverState;
    isSimulatingGlobal?: boolean;
}

export default function TerrainRoute(props: TerrainRouteProps) {
    const navigate = useNavigate();
    const { baseline } = useSystemBaseline();

    const hasBaseline = props.hasBaseline ?? !!baseline;

    const [showSimulateLocal, setShowSimulateLocal] = useState(false);
    const [showSaveModalLocal, setShowSaveModalLocal] = useState(false);
    const [showLoadPanelLocal, setShowLoadPanelLocal] = useState(false);

    const showSimulate = props.showSimulate ?? showSimulateLocal;
    const setShowSimulate = props.setShowSimulate ?? setShowSimulateLocal;

    const showSaveModal = props.showSaveModal ?? showSaveModalLocal;
    const setShowSaveModal = props.setShowSaveModal ?? setShowSaveModalLocal;

    const showLoadPanel = props.showLoadPanel ?? showLoadPanelLocal;
    const setShowLoadPanel = props.setShowLoadPanel ?? setShowLoadPanelLocal;

    const defaultLevers = useMemo<LeverState>(
        () => ({
            demandStrength: 60,
            pricingPower: 55,
            expansionVelocity: 58,
            costDiscipline: 62,
            hiringIntensity: 52,
            operatingDrag: 48,
            marketVolatility: 45,
            executionRisk: 50,
            fundingPressure: 50,
        }),
        []
    );

    const levers = props.levers ?? defaultLevers;
    const isSimulatingGlobal = props.isSimulatingGlobal ?? false;

    return (
        <div
            className="mode-terrain"
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
            {!hasBaseline ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "400px",
                        padding: "3rem",
                        background:
                            "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))",
                        border: "1px solid rgba(100,116,139,0.2)",
                        borderRadius: "1rem",
                        margin: "2rem auto",
                        maxWidth: "520px",
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            marginBottom: "1.5rem",
                            background:
                                "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
                            border: "1px solid rgba(139,92,246,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            color: "rgba(165,143,255,0.9)",
                        }}
                    >
                        ◆
                    </div>
                    <h2
                        style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: "1.25rem",
                            color: "rgba(226,232,240,0.95)",
                            marginBottom: "0.75rem",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Baseline Required
                    </h2>
                    <p
                        style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: "0.875rem",
                            color: "rgba(148,163,184,0.85)",
                            textAlign: "center",
                            lineHeight: 1.6,
                            marginBottom: "2rem",
                            maxWidth: "360px",
                        }}
                    >
                        Initialize your company&apos;s financial and operational truth to unlock
                        the STRATFIT platform.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/initiate")}
                        style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            padding: "0.75rem 2rem",
                            borderRadius: "0.5rem",
                            border: "none",
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "#fff",
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                            transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.5)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.35)";
                        }}
                    >
                        Go to Initiate
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
                        <BaselineKPIStrip />
                    </div>
                    <BaselinePage />
                </>
            )}

            <SimulateOverlay
                isOpen={showSimulate}
                onClose={() => setShowSimulate(false)}
                levers={levers}
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
            <SimulationActivityMonitor />

            <div
                style={{ position: "fixed", bottom: 24, right: 24, zIndex: 800, width: 380 }}
            >
                <ProDetailDrawer />
            </div>

            <div className={`recalibration-dim-veil${isSimulatingGlobal ? " active" : ""}`} />
            <div className={`recalibration-signal${isSimulatingGlobal ? " active" : ""}`}>
                Recalculating structural behaviour…
            </div>
        </div>
    );
}
