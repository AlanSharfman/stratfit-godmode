import * as THREE from "three";
import { createStructureTexture } from "@/render/stm/createStructureTexture";

/**
 * Generate a morph target structure curve.
 *
 * Produces a deterministic alternative structural state by applying
 * a transformation to the base curve. This represents a "what-if"
 * scenario where structural integrity shifts.
 *
 * @param baseCurve    The original structure curve (state A)
 * @param influence    Morph influence factor [0..1] — how different state B is
 * @param samples      Number of curve samples
 * @returns            State B structure curve
 */
export function generateMorphTargetCurve(
    baseCurve: Float32Array,
    influence: number = 0.6,
    samples?: number,
): Float32Array {
    const n = samples ?? baseCurve.length;
    const result = new Float32Array(n);

    const baseN = baseCurve.length;
    let maxVal = 0;

    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const bi = Math.min(Math.floor(t * (baseN - 1)), baseN - 1);
        const base = baseCurve[bi];

        // Invert the structural pattern: strong zones weaken, weak zones strengthen
        // Modulated by influence — at influence=0, identical to base
        const inverted = 1.0 - base;
        const morphed = base * (1.0 - influence) + inverted * influence;

        // Add deterministic perturbation for natural variation
        const perturbation = Math.sin(t * Math.PI * 6) * 0.08 +
            Math.sin(t * Math.PI * 13) * 0.04;
        result[i] = Math.max(0, morphed + perturbation * influence);
        if (result[i] > maxVal) maxVal = result[i];
    }

    // Normalize to [0..1]
    const scale = maxVal > 1e-6 ? 1 / maxVal : 1;
    for (let i = 0; i < n; i++) {
        result[i] *= scale;
    }

    // 5-tap box smooth for soft terrain transitions
    const smoothed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        let count = 0;
        for (let k = -2; k <= 2; k++) {
            const j = Math.max(0, Math.min(n - 1, i + k));
            sum += result[j];
            count++;
        }
        smoothed[i] = sum / count;
    }

    return smoothed;
}

/**
 * Create a pair of structure textures for morph interpolation.
 *
 * @param stateA  Structure curve for state A
 * @param stateB  Structure curve for state B
 * @returns       Pair of DataTextures [texA, texB]
 */
export function createMorphTextures(
    stateA: Float32Array,
    stateB: Float32Array,
): [THREE.DataTexture, THREE.DataTexture] {
    const texA = createStructureTexture(stateA);
    const texB = createStructureTexture(stateB);
    return [texA, texB];
}
