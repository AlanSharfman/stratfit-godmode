/**
 * SIL — Strategic Interaction Layer contracts.
 *
 * Single source of truth for user strategic inputs.
 * Flow: input → store → simulation → morph targets → render.
 * No direct shader mutation from UI.
 */

/** Strategic input parameters that drive simulation */
export interface StrategicInputs {
    /** Morph progress between structural states [0..1] */
    morphProgress: number;

    /** Risk bias adjustment [-1..1]: negative = less risk, positive = more risk */
    riskBias: number;

    /** Confidence adjustment [-1..1]: negative = lower confidence, positive = higher */
    confidenceBias: number;

    /** Growth rate modifier [0..2]: 1.0 = baseline, <1 = slower, >1 = faster */
    growthModifier: number;

    /** Burn rate modifier [0..2]: 1.0 = baseline, <1 = lower burn, >1 = higher */
    burnModifier: number;
}

/** Default strategic inputs — baseline (no adjustments) */
export const DEFAULT_STRATEGIC_INPUTS: StrategicInputs = {
    morphProgress: 0,
    riskBias: 0,
    confidenceBias: 0,
    growthModifier: 1.0,
    burnModifier: 1.0,
};

/** Simulation output state derived from strategic inputs */
export interface SimulationState {
    /** Current morph progress for TME [0..1] */
    morphProgress: number;

    /** Adjusted risk curve modifier [0..2] */
    riskMultiplier: number;

    /** Adjusted confidence curve modifier [0..2] */
    confidenceMultiplier: number;

    /** SHL weight overrides derived from inputs */
    semanticWeightOverrides: Partial<{
        risk: number;
        confidence: number;
        heat: number;
        flow: number;
        resonance: number;
        topography: number;
        divergence: number;
    }>;

    /** Timestamp of last update (monotonic) */
    lastUpdated: number;
}

/** Default simulation state — baseline */
export const DEFAULT_SIMULATION_STATE: SimulationState = {
    morphProgress: 0,
    riskMultiplier: 1.0,
    confidenceMultiplier: 1.0,
    semanticWeightOverrides: {},
    lastUpdated: 0,
};
