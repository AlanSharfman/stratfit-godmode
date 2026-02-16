// src/core/selectors/useSimulationSelectors.ts
// STRATFIT — Canonical Simulation Selectors
// Phase 7 Render Adapter Lock

import { useCanonicalOutputStore } from "@/core/store/useCanonicalOutputStore";

export function useSimulationSelectors() {
    const output = useCanonicalOutputStore((s) => s.output);

    return {
        survivalProbability: output?.simulation.survivalProbability ?? 0,
        confidenceIndex: output?.simulation.confidenceIndex ?? 0,
        volatility: output?.simulation.volatility ?? 0,
        cashSeries: output?.simulation.distributions.cashP50 ?? [],
        valuationP50: output?.simulation.distributions.valuationP50 ?? [],
        valuationLow: output?.simulation.distributions.valuationP25 ?? [],
        valuationHigh: output?.simulation.distributions.valuationP75 ?? [],
        runwayMonths: output?.liquidity.runwayMonths ?? 0,
        baseValue: output?.valuation.baseValue ?? 0,
        commentary: output?.commentary ?? { mode: "neutral", bullets: [] },
    };
}
