// src/core/engines/path/pathOrchestrator.ts
// STRATFIT — Path Engine Orchestrator
// Phase 4 Path Engine Lock

import type { PathEngineOutput } from "./pathTypes";
import { usePathStore } from "@/core/store/usePathStore";

/** Stub output — real path data flows through solverPath in ScenarioMountainImpl */
function generateStrategicPaths(): PathEngineOutput {
    return {
        paths: [
            {
                id: "baseline",
                label: "Baseline Trajectory",
                nodes: [
                    { id: "n1", time: 0, x: -20, y: 0, probability: 0.7 },
                    { id: "n2", time: 12, x: 0, y: 5, probability: 0.65 },
                    { id: "n3", time: 24, x: 20, y: 8, probability: 0.6 },
                ],
            },
        ],
    };
}

export function runPathEngine() {
    const output = generateStrategicPaths();
    usePathStore.getState().setPaths(output.paths);
}
