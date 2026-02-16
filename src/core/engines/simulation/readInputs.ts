// src/core/engines/simulation/readInputs.ts
// STRATFIT — Engine Input Adapter
// Phase 5 Simulation Orchestration Lock

import { useStratfitStore } from "@/core/store/useStratfitStore";

export function readSimulationInputs() {
    const { position } = useStratfitStore.getState();

    return {
        arr: position.arr,
        growthRate: position.growthRate,
        grossMargin: position.grossMargin,
        burnMultiple: position.burnMultiple,
    };
}
