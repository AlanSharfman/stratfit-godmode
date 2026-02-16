// src/core/engines/path/pathOrchestrator.ts
// STRATFIT — Path Engine Orchestrator
// Phase 4 Path Engine Lock

import { generateStrategicPaths } from "./pathEngine";
import { usePathStore } from "@/core/store/usePathStore";

export function runPathEngine() {
    const output = generateStrategicPaths();
    usePathStore.getState().setPaths(output.paths);
}
