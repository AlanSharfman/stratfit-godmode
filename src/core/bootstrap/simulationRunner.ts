// src/core/bootstrap/simulationRunner.ts
// STRATFIT — Single Simulation Runner (Boot + Re-Run API)
// Phase 5 Simulation Orchestration Lock

import { runCanonicalSimulation } from "@/core/engines/simulation/simulationOrchestrator";
import { useCanonicalOutputStore } from "@/core/store/useCanonicalOutputStore";

export function runSimulationAndStore() {
    const output = runCanonicalSimulation();
    useCanonicalOutputStore.getState().setOutput(output);
    return output;
}
