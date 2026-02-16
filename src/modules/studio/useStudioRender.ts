// src/modules/studio/useStudioRender.ts
// STRATFIT — Studio Render Bridge
// Phase 7 Render Adapter Lock

import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";

export function useStudioRender() {
    return useSimulationSelectors();
}
