import * as THREE from "three";

/**
 * Creates a 1D DataTexture from a Float32Array of structure values.
 * Values in [0..1]. Stored in R channel. LINEAR filtering for smooth vertex lookups.
 */
export function createStructureTexture(values: Float32Array): THREE.DataTexture {
    const width = values.length;
    const data = new Uint8Array(width * 4);

    for (let i = 0; i < width; i++) {
        const v = Math.max(0, Math.min(1, values[i]));
        const byte = Math.round(v * 255);
        data[i * 4 + 0] = byte;  // R — structure value
        data[i * 4 + 1] = byte;  // G — mirror for debugging
        data[i * 4 + 2] = 0;
        data[i * 4 + 3] = 255;
    }

    const tex = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;

    return tex;
}

/**
 * Generate deterministic structure curve from confidence and risk.
 *
 * structure = normalize( confidence * (1 - risk) )
 *
 * Represents structural integrity — high where confidence is strong
 * and risk is low. These zones get elevated via vertex displacement.
 * Smoothed with 5-tap box filter for ultra-smooth terrain transitions.
 */
export function generateBaselineStructureCurve(
    confidenceValues: Float32Array,
    riskValues: Float32Array,
    samples: number = 256,
): Float32Array {
    const cn = confidenceValues.length;
    const rn = riskValues.length;

    const raw = new Float32Array(samples);
    let maxVal = 0;

    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);

        // Resample each input to target sample count
        const ci = Math.min(Math.floor(t * (cn - 1)), cn - 1);
        const ri = Math.min(Math.floor(t * (rn - 1)), rn - 1);

        const conf = confidenceValues[ci];
        const risk = riskValues[ri];

        raw[i] = conf * (1.0 - risk);
        if (raw[i] > maxVal) maxVal = raw[i];
    }

    // Normalize to [0..1]
    const scale = maxVal > 1e-6 ? 1 / maxVal : 1;
    for (let i = 0; i < samples; i++) {
        raw[i] *= scale;
    }

    // 5-tap box smooth for ultra-soft terrain transitions (no popping)
    const smoothed = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        let sum = 0;
        let count = 0;
        for (let k = -2; k <= 2; k++) {
            const j = Math.max(0, Math.min(samples - 1, i + k));
            sum += raw[j];
            count++;
        }
        smoothed[i] = sum / count;
    }

    return smoothed;
}
