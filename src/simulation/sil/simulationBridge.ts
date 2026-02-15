import { create } from "zustand";
import type { SimulationState, StrategicInputs } from "./silContracts";
import { DEFAULT_SIMULATION_STATE } from "./silContracts";
import { useStrategicInputStore } from "./strategicInputStore";

/**
 * Simulation Bridge — deterministic transformation from inputs to simulation state.
 *
 * Flow: StrategicInputStore → computeSimulationState() → SimulationBridgeStore
 *
 * RULES:
 * 1) No direct shader mutation
 * 2) Deterministic: same inputs always produce same state
 * 3) No async operations
 * 4) No race conditions — single synchronous update path
 */

/**
 * Pure function: compute simulation state from strategic inputs.
 *
 * This is the ONLY place where inputs are transformed into render parameters.
 * All downstream consumers (TME, SHL, etc.) read from the simulation state,
 * never directly from inputs.
 */
export function computeSimulationState(inputs: StrategicInputs): SimulationState {
    // ── Auto-compute morph progress from ALL inputs ──
    // Any deviation from baseline drives terrain morphing.
    // morphProgress slider provides explicit control; other inputs add implicit morphing.
    const riskDeviation = Math.abs(inputs.riskBias);
    const confDeviation = Math.abs(inputs.confidenceBias);
    const growthDeviation = Math.abs(inputs.growthModifier - 1.0);
    const burnDeviation = Math.abs(inputs.burnModifier - 1.0);

    // Combine all deviations — any input change drives morph
    const implicitMorph = Math.min(1.0,
        riskDeviation * 0.8 +
        confDeviation * 0.8 +
        growthDeviation * 0.6 +
        burnDeviation * 0.6
    );

    // Final morph = max of explicit slider and implicit from other inputs
    const morphProgress = Math.max(
        0,
        Math.min(1, Math.max(inputs.morphProgress, implicitMorph))
    );

    // Risk multiplier: bias maps [-1,1] → [0.3, 1.7]
    // Clamped to avoid extreme values
    const riskMultiplier = Math.max(0.3, Math.min(1.7, 1.0 + inputs.riskBias * 0.7));

    // Confidence multiplier: bias maps [-1,1] → [0.3, 1.7]
    const confidenceMultiplier = Math.max(0.3, Math.min(1.7, 1.0 + inputs.confidenceBias * 0.7));

    // Derive SHL weight overrides from simulation parameters
    // Growth modifier affects flow and divergence visibility
    // Burn modifier affects heat and risk visibility
    const semanticWeightOverrides: SimulationState["semanticWeightOverrides"] = {};

    // Higher burn → more heat visibility, more risk emphasis
    if (inputs.burnModifier !== 1.0) {
        semanticWeightOverrides.heat = Math.max(0.3, Math.min(1.0, 0.85 * inputs.burnModifier));
        semanticWeightOverrides.risk = Math.max(0.3, Math.min(1.0, 1.0 * inputs.burnModifier));
    }

    // Higher growth → more flow, more divergence visibility
    if (inputs.growthModifier !== 1.0) {
        semanticWeightOverrides.flow = Math.max(0.3, Math.min(1.0, 0.75 * inputs.growthModifier));
        semanticWeightOverrides.divergence = Math.max(0.3, Math.min(1.0, 0.8 * inputs.growthModifier));
    }

    // Morph progress modulates topography weight (more morph = more topo change)
    if (morphProgress > 0) {
        semanticWeightOverrides.topography = Math.max(0.5, 1.0 - morphProgress * 0.3);
    }

    return {
        morphProgress,
        riskMultiplier,
        confidenceMultiplier,
        semanticWeightOverrides,
        lastUpdated: performance.now(),
    };
}

/**
 * Zustand store for simulation state.
 * Updated synchronously whenever strategic inputs change.
 */
interface SimulationBridgeStore {
    state: SimulationState;
    update: () => void;
}

export const useSimulationBridge = create<SimulationBridgeStore>((set) => ({
    state: { ...DEFAULT_SIMULATION_STATE },
    update: () => {
        const inputs = useStrategicInputStore.getState().inputs;
        const newState = computeSimulationState(inputs);
        set({ state: newState });
    },
}));

/**
 * Non-reactive getter for reading current simulation state outside React.
 */
export function getSimulationState(): SimulationState {
    return useSimulationBridge.getState().state;
}

/**
 * Subscribe the simulation bridge to input changes.
 * Call once at app initialization.
 * Returns unsubscribe function.
 */
export function connectSimulationBridge(): () => void {
    return useStrategicInputStore.subscribe(() => {
        useSimulationBridge.getState().update();
    });
}
