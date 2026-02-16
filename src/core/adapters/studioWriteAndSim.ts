// src/core/adapters/studioWriteAndSim.ts
// STRATFIT — Studio Write → Sim Re-Run Hook
// Phase 5 Simulation Orchestration Lock

import { writeStudioPosition } from "@/core/adapters/studioWriteAdapter";
import { runSimulationAndStore } from "@/core/bootstrap/simulationRunner";

export function writeStudioThenSim(updates: {
    arr?: number;
    growthRate?: number;
    grossMargin?: number;
    burnMultiple?: number;
}) {
    writeStudioPosition(updates);
    return runSimulationAndStore();
}
