// src/modules/scenarios/useScenariosRender.ts
// STRATFIT — Scenarios Render Bridge
// Phase 7 Render Adapter Lock

import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";

export function useScenariosRender() {
    return useSimulationSelectors();
}
