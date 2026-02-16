// src/core/engines/simulation/simulationWriter.ts
// STRATFIT — Simulation Output Writer
// Phase 2 Store Lock

import { useStratfitStore } from "@/core/store/useStratfitStore";

export function writeSimulationOutput(output: {
    survivalProbability: number;
    confidenceIndex: number;
    volatility: number;
}) {
    const { setSimulation } = useStratfitStore.getState();
    setSimulation(output);
}
