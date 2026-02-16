// src/core/bootstrap/runEngines.ts
// STRATFIT — Engine Bootstrap
// Phase 5 Simulation Orchestration Lock

import { runPathEngine } from "@/core/engines/path/pathOrchestrator";
import { runSimulationAndStore } from "@/core/bootstrap/simulationRunner";

export function bootstrapEngines() {
    runPathEngine();
    runSimulationAndStore();
}
