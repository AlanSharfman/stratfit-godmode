// src/core/engines/liquidity/liquidityEngine.ts
// STRATFIT — Liquidity Engine (Derives Runway + Distribution)
// Phase 5 Simulation Orchestration Lock

export function computeLiquidity(params: {
    cashNow: number;
    cashSeriesP50: number[];
    monthlyBurn: number;
}) {
    const { cashNow, cashSeriesP50, monthlyBurn } = params;

    // runway is where p50 cash crosses 0
    let runwayMonths = 0;
    for (let i = 0; i < cashSeriesP50.length; i++) {
        if (cashSeriesP50[i] <= 0) break;
        runwayMonths = i;
    }

    return {
        cash: cashNow,
        monthlyBurn,
        runwayMonths,
        cashDistribution: cashSeriesP50,
    };
}
