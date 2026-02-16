// src/core/adapters/useKpiAdapter.ts
// STRATFIT — Universal KPI Adapter
// Phase 7 Render Adapter Lock

import { useSimulationSelectors } from "../selectors/useSimulationSelectors";

export function useKpiAdapter() {
    const s = useSimulationSelectors();

    return [
        { id: "survival", label: "Survival", value: `${(s.survivalProbability * 100).toFixed(0)}%` },
        { id: "confidence", label: "Confidence", value: `${(s.confidenceIndex * 100).toFixed(0)}%` },
        { id: "runway", label: "Runway", value: `${s.runwayMonths} mo` },
        { id: "valuation", label: "Value", value: `$${Math.round(s.baseValue / 1e6)}M` },
    ];
}
