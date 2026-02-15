import type { SemanticLayerKey } from "./shlContracts";
import { getSemanticWeight } from "./semanticBalance";

/**
 * Apply semantic balance weight to a layer's intensity uniform.
 *
 * Call this in the component's useFrame or useEffect to modulate
 * the layer's visual intensity by the global semantic weight.
 *
 * @param layerKey   Which semantic layer this is
 * @param baseValue  The layer's base intensity (before harmonization)
 * @returns          The modulated intensity value
 */
export function applySemanticWeight(
    layerKey: SemanticLayerKey,
    baseValue: number,
): number {
    const weight = getSemanticWeight(layerKey);
    return baseValue * weight;
}

/**
 * Map of layer keys to their corresponding intensity uniform names.
 * Used for documentation and debugging — not consumed at runtime.
 */
export const LAYER_UNIFORM_MAP: Record<SemanticLayerKey, string> = {
    risk: "uRpfIntensity",
    heat: "uDhlIntensity",
    confidence: "uCfIntensity",
    divergence: "opacity (SDL material)",
    flow: "uTflIntensity",
    resonance: "uSrlIntensity",
    topography: "uTopoScale",
    morph: "uMorphProgress (TME)",
};
