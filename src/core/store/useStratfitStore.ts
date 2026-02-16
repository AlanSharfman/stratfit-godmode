// src/core/store/useStratfitStore.ts
// STRATFIT — Canonical Zustand Store
// Phase 2 Store Lock

import { create } from "zustand";
import type { StratfitState } from "./stratfitState";

interface StratfitStore extends StratfitState {
    setPosition: (position: Partial<StratfitState["position"]>) => void;
    setLiquidity: (liquidity: Partial<StratfitState["liquidity"]>) => void;
    setValuation: (valuation: Partial<StratfitState["valuation"]>) => void;
    setSimulation: (simulation: Partial<StratfitState["simulation"]>) => void;
}

export const useStratfitStore = create<StratfitStore>((set) => ({
    position: {
        arr: 2000000,
        growthRate: 0.2,
        grossMargin: 0.7,
        burnMultiple: 1.5,
    },

    liquidity: {
        cash: 1500000,
        monthlyBurn: 100000,
        runwayMonths: 15,
        cashDistribution: [],
    },

    valuation: {
        baseValue: 10000000,
        probabilityBandLow: 8000000,
        probabilityBandHigh: 14000000,
    },

    simulation: {
        survivalProbability: 0.72,
        confidenceIndex: 0.81,
        volatility: 0.3,
    },

    setPosition: (position) =>
        set((state) => ({ position: { ...state.position, ...position } })),

    setLiquidity: (liquidity) =>
        set((state) => ({ liquidity: { ...state.liquidity, ...liquidity } })),

    setValuation: (valuation) =>
        set((state) => ({ valuation: { ...state.valuation, ...valuation } })),

    setSimulation: (simulation) =>
        set((state) => ({ simulation: { ...state.simulation, ...simulation } })),
}));
