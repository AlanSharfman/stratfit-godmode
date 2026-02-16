// src/core/engines/simulation/simCore.ts
// STRATFIT — Canonical Simulation Core
// Phase 5 Simulation Orchestration Lock

export interface SimCoreInputs {
    arr: number;
    growthRate: number;
    grossMargin: number;
    burnMultiple: number;
    seed: number;
}

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

// deterministic pseudo-rng (mulberry32)
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function runSimCore(i: SimCoreInputs) {
    const rnd = mulberry32(i.seed);

    // core probabilities must be stable given same inputs+seed
    const base = clamp01(0.55 + 0.25 * (i.grossMargin - 0.5) + 0.15 * (i.growthRate - 0.15));
    const penalty = clamp01(0.18 * (i.burnMultiple - 1.3));
    const survivalProbability = clamp01(base - penalty);

    const volatility = clamp01(0.2 + 0.5 * (1 - i.grossMargin) + 0.15 * rnd());
    const confidenceIndex = clamp01(0.65 + 0.2 * survivalProbability - 0.25 * volatility);

    // 36 month horizon distributions (placeholder)
    const months = 36;

    const cashP50: number[] = [];
    const cashP25: number[] = [];
    const cashP75: number[] = [];

    const valP50: number[] = [];
    const valP25: number[] = [];
    const valP75: number[] = [];

    // deterministic synthetic curves (not random walk; stable)
    const baseCash = 1500000;
    const burn = Math.max(20000, 80000 + (i.burnMultiple - 1.2) * 60000);
    const growth = Math.max(0.01, i.growthRate);

    const baseVal = Math.max(2000000, i.arr * (4 + 6 * growth) * (0.6 + 0.6 * i.grossMargin));

    for (let t = 0; t < months; t++) {
        const drift = (rnd() - 0.5) * 0.02; // tiny deterministic noise
        const cash = baseCash - burn * t;
        const spread = 1 + volatility * 0.25;

        cashP50.push(cash);
        cashP25.push(cash / spread);
        cashP75.push(cash * spread);

        const v = baseVal * (1 + growth * t * 0.03 + drift);
        const vSpread = 1 + volatility * 0.35;

        valP50.push(v);
        valP25.push(v / vSpread);
        valP75.push(v * vSpread);
    }

    return {
        survivalProbability,
        confidenceIndex,
        volatility,
        distributions: {
            cashP50,
            cashP25,
            cashP75,
            valuationP50: valP50,
            valuationP25: valP25,
            valuationP75: valP75,
        },
    };
}
