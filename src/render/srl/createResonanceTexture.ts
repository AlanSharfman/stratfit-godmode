import * as THREE from "three";

/**
 * Creates a 1D DataTexture from a Float32Array of resonance values.
 * Values in [0..1]. Stored in R channel.
 */
export function createResonanceTexture(values: Float32Array): THREE.DataTexture {
    const width = values.length;
    const data = new Uint8Array(width * 4);

    for (let i = 0; i < width; i++) {
        const v = Math.max(0, Math.min(1, values[i]));
        const byte = Math.round(v * 255);
        data[i * 4 + 0] = byte;
        data[i * 4 + 1] = byte;
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
 * Generate deterministic resonance curve from risk, heat, and confidence.
 *
 * resonance = normalize(risk * 0.4 + heat * 0.3 + (1 - confidence) * 0.3)
 *
 * Represents structural "tension" where multiple semantic signals converge.
 * Smoothed with 5-tap box filter for ultra-soft transitions.
 */
export function generateBaselineResonanceCurve(
    riskValues: Float32Array,
    heatValues: Float32Array,
    confidenceValues: Float32Array,
    samples: number = 256,
): Float32Array {
    const rn = riskValues.length;
    const hn = heatValues.length;
    const cn = confidenceValues.length;

    const raw = new Float32Array(samples);
    let maxVal = 0;

    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);

        // Resample each input
        const ri = Math.min(Math.floor(t * (rn - 1)), rn - 1);
        const hi = Math.min(Math.floor(t * (hn - 1)), hn - 1);
        const ci = Math.min(Math.floor(t * (cn - 1)), cn - 1);

        const risk = riskValues[ri];
        const heat = heatValues[hi];
        const conf = confidenceValues[ci];

        raw[i] = risk * 0.4 + heat * 0.3 + (1.0 - conf) * 0.3;
        if (raw[i] > maxVal) maxVal = raw[i];
    }

    // Normalize to [0..1]
    const scale = maxVal > 1e-6 ? 1 / maxVal : 1;
    for (let i = 0; i < samples; i++) {
        raw[i] *= scale;
    }

    // 5-tap box smooth for ultra-soft transitions
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
