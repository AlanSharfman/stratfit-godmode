// src/core/engines/valuation/valuationEngine.ts
// STRATFIT — Valuation Engine (Probability Bands)
// Phase 5 Simulation Orchestration Lock

export function computeValuation(params: {
    valuationP50: number[];
    valuationP25: number[];
    valuationP75: number[];
}) {
    const { valuationP50, valuationP25, valuationP75 } = params;

    // pick a near-term anchor month for headline valuation (month 12)
    const idx = Math.min(12, valuationP50.length - 1);

    const baseValue = valuationP50[idx];
    const probabilityBandLow = valuationP25[idx];
    const probabilityBandHigh = valuationP75[idx];

    return { baseValue, probabilityBandLow, probabilityBandHigh };
}
