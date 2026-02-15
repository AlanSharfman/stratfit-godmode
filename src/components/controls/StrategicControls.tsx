import React, { useEffect } from "react";
import { useStrategicInputStore } from "@/simulation/sil/strategicInputStore";
import { useSimulationBridge, connectSimulationBridge } from "@/simulation/sil/simulationBridge";

/**
 * StrategicControls — UI control panel for strategic inputs.
 *
 * Mounted at App root level (NOT inside Canvas/R3F).
 * Writes to StrategicInputStore only — never touches shaders directly.
 *
 * Flow: slider/input → store.setInput() → simulation bridge → render
 *
 * The simulation bridge subscription is initialized here on mount.
 * All inputs are resettable to defaults.
 */
export default function StrategicControls() {
    const inputs = useStrategicInputStore((s) => s.inputs);
    const setInput = useStrategicInputStore((s) => s.setInput);
    const reset = useStrategicInputStore((s) => s.reset);
    const simState = useSimulationBridge((s) => s.state);

    // Connect simulation bridge to input store on mount
    useEffect(() => {
        const unsub = connectSimulationBridge();
        // Trigger initial computation
        useSimulationBridge.getState().update();
        return unsub;
    }, []);

    return (
        <div
            style={{
                position: "fixed",
                bottom: 16,
                left: 16,
                zIndex: 1000,
                background: "rgba(10, 12, 18, 0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "12px 16px",
                color: "#e0e0e0",
                fontSize: 11,
                fontFamily: "monospace",
                minWidth: 220,
                backdropFilter: "blur(8px)",
                pointerEvents: "auto",
            }}
        >
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "#a0c4ff" }}>
                STRATEGIC CONTROLS
            </div>

            {/* Morph Progress */}
            <label style={labelStyle}>
                MORPH PROGRESS: {inputs.morphProgress.toFixed(2)}
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={inputs.morphProgress}
                    onChange={(e) => setInput("morphProgress", parseFloat(e.target.value))}
                    style={sliderStyle}
                />
            </label>

            {/* Risk Bias */}
            <label style={labelStyle}>
                RISK BIAS: {inputs.riskBias > 0 ? "+" : ""}{inputs.riskBias.toFixed(2)}
                <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={inputs.riskBias}
                    onChange={(e) => setInput("riskBias", parseFloat(e.target.value))}
                    style={sliderStyle}
                />
            </label>

            {/* Confidence Bias */}
            <label style={labelStyle}>
                CONFIDENCE BIAS: {inputs.confidenceBias > 0 ? "+" : ""}{inputs.confidenceBias.toFixed(2)}
                <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={inputs.confidenceBias}
                    onChange={(e) => setInput("confidenceBias", parseFloat(e.target.value))}
                    style={sliderStyle}
                />
            </label>

            {/* Growth Modifier */}
            <label style={labelStyle}>
                GROWTH: {inputs.growthModifier.toFixed(2)}x
                <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={inputs.growthModifier}
                    onChange={(e) => setInput("growthModifier", parseFloat(e.target.value))}
                    style={sliderStyle}
                />
            </label>

            {/* Burn Modifier */}
            <label style={labelStyle}>
                BURN: {inputs.burnModifier.toFixed(2)}x
                <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={inputs.burnModifier}
                    onChange={(e) => setInput("burnModifier", parseFloat(e.target.value))}
                    style={sliderStyle}
                />
            </label>

            {/* Sim state readout */}
            <div style={{ marginTop: 8, fontSize: 10, color: "#888" }}>
                risk×{simState.riskMultiplier.toFixed(2)} · conf×{simState.confidenceMultiplier.toFixed(2)}
            </div>

            {/* Reset */}
            <button
                type="button"
                onClick={reset}
                style={{
                    marginTop: 8,
                    padding: "4px 12px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 4,
                    color: "#e0e0e0",
                    cursor: "pointer",
                }}
            >
                RESET TO BASELINE
            </button>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 10,
    color: "#ccc",
};

const sliderStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: 2,
    accentColor: "#a0c4ff",
};
