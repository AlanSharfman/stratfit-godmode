/** Semantic layer weight keys */
export type SemanticLayerKey = "risk" | "heat" | "confidence" | "divergence" | "flow" | "resonance" | "topography";

/** Uniform block for semantic harmonization */
export interface ShlWeights {
    risk: number;
    heat: number;
    confidence: number;
    divergence: number;
    flow: number;
    resonance: number;
    topography: number;
}

/** Default semantic weights — all near 1.0 so default appearance is unchanged */
export const DEFAULT_SHL_WEIGHTS: ShlWeights = {
    risk: 1.0,
    heat: 0.85,
    confidence: 0.9,
    divergence: 0.8,
    flow: 0.75,
    resonance: 1.0,
    topography: 1.0,
};
