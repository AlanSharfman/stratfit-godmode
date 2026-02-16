export interface EngineInputs {
    demandStrength: number;
    pricingPower: number;
    costDiscipline: number;
    fundingPressure: number;
    expansionVelocity: number;
}

export function mapBaselineToEngine(baseline: any): EngineInputs {
    const runwayMonths =
        baseline.monthlyBurn > 0
            ? baseline.cashOnHand / baseline.monthlyBurn
            : 0;

    const margin =
        baseline.arr > 0
            ? (baseline.arr - baseline.monthlyBurn * 12) / baseline.arr
            : 0;

    return {
        demandStrength: Math.min(100, Math.max(10, baseline.arr / 100000)),
        pricingPower: Math.min(100, Math.max(10, margin * 100)),
        costDiscipline: Math.min(100, Math.max(10, 100 - margin * 100)),
        fundingPressure: Math.min(100, Math.max(10, 60 - runwayMonths)),
        expansionVelocity: Math.min(100, Math.max(10, baseline.growthRate || 30))
    };
}
