// src/core/store/stratfitState.ts
// STRATFIT — Canonical State Contract (Single Source of Truth)
// Phase 2 Store Lock

export interface LiquidityState {
    cash: number;
    monthlyBurn: number;
    runwayMonths: number;
    cashDistribution: number[];
}

export interface ValuationState {
    baseValue: number;
    probabilityBandLow: number;
    probabilityBandHigh: number;
}

// Simplified three-field summary used only within this store island
export interface SimulationSummary {
    survivalProbability: number;
    confidenceIndex: number;
    volatility: number;
}

export interface PositionState {
    arr: number;
    growthRate: number;
    grossMargin: number;
    burnMultiple: number;
}

export interface StratfitState {
    position: PositionState;
    liquidity: LiquidityState;
    valuation: ValuationState;
    simulation: SimulationSummary;
}
