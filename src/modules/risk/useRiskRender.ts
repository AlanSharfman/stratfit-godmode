// src/modules/risk/useRiskRender.ts
// STRATFIT — Risk Render Bridge
// Phase 7 Render Adapter Lock

import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";

export function useRiskRender() {
    return useSimulationSelectors();
}
