// src/modules/capital/useCapitalRender.ts
// STRATFIT — Capital Render Bridge
// Phase 7 Render Adapter Lock

import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";

export function useCapitalRender() {
    return useSimulationSelectors();
}
