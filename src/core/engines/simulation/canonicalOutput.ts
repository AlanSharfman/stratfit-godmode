// src/core/engines/simulation/canonicalOutput.ts
// STRATFIT — Canonical Simulation Output Contract
// Phase 5 Simulation Orchestration Lock

export interface CanonicalSimulationOutput {
    // identity
    runId: string;
    version: "v1";

    // inputs snapshot (what was simulated)
    inputs: {
        arr: number;
        growthRate: number;
        grossMargin: number;
        burnMultiple: number;
    };

    // simulation core (uncertainty-aware)
    simulation: {
        survivalProbability: number; // 0..1
        confidenceIndex: number; // 0..1
        volatility: number; // 0..1
        distributions: {
            cashP50: number[];
            cashP25: number[];
            cashP75: number[];
            valuationP50: number[];
            valuationP25: number[];
            valuationP75: number[];
        };
    };

    // liquidity engine output
    liquidity: {
        cash: number;
        monthlyBurn: number;
        runwayMonths: number;
        cashDistribution: number[]; // e.g. p50 cash series
    };

    // valuation engine output
    valuation: {
        baseValue: number;
        probabilityBandLow: number;
        probabilityBandHigh: number;
    };

    // commentary is interpretation only (probability aware)
    commentary: {
        mode: "neutral" | "caution" | "opportunity";
        bullets: string[];
    };

    // timestamps
    meta: {
        createdAt: number; // epoch ms
        deterministicSeed: number;
    };
}
