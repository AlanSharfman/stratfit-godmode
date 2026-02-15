import * as THREE from "three";

/**
 * Creates a 1D DataTexture from a Float32Array of heat values.
 * Values should be in [0..1] range. Stored in R channel.
 * Texture width = values.length, height = 1.
 */
export function createHeatTexture(values: Float32Array): THREE.DataTexture {
    const width = values.length;
    const data = new Uint8Array(width * 4);

    for (let i = 0; i < width; i++) {
        const v = Math.max(0, Math.min(1, values[i]));
        const byte = Math.round(v * 255);
        data[i * 4 + 0] = byte; // R — heat intensity
        data[i * 4 + 1] = byte; // G — duplicate for filtering
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
 * Generate deterministic decision heat curve.
 *
 * heat = normalize(risk * leverage_proxy)
 *
 * Where leverage_proxy is derived from curvature of the risk curve
 * (high curvature = high leverage = decision-dense region).
 */
export function generateBaselineHeatCurve(
    riskValues: Float32Array,
    samples: number = 256,
): Float32Array {
    const n = riskValues.length;
    if (n < 3) return new Float32Array(samples).fill(0);

    // 1. Compute curvature proxy (second derivative magnitude)
    const curvature = new Float32Array(n);
    for (let i = 1; i < n - 1; i++) {
        curvature[i] = Math.abs(riskValues[i - 1] - 2 * riskValues[i] + riskValues[i + 1]);
    }
    curvature[0] = curvature[1];
    curvature[n - 1] = curvature[n - 2];

    // 2. Normalize curvature
    let maxCurv = 0;
    for (let i = 0; i < n; i++) {
        if (curvature[i] > maxCurv) maxCurv = curvature[i];
    }
    const curvScale = maxCurv > 1e-6 ? 1 / maxCurv : 1;

    // 3. heat = risk * normalized_curvature (decision density)
    const rawHeat = new Float32Array(n);
    let maxHeat = 0;
    for (let i = 0; i < n; i++) {
        rawHeat[i] = riskValues[i] * (curvature[i] * curvScale);
        if (rawHeat[i] > maxHeat) maxHeat = rawHeat[i];
    }

    // 4. Normalize heat to [0..1]
    const heatScale = maxHeat > 1e-6 ? 1 / maxHeat : 1;
    for (let i = 0; i < n; i++) {
        rawHeat[i] *= heatScale;
    }

    // 5. Resample to output length with 3-tap smoothing
    const values = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const fidx = t * (n - 1);
        const i0 = Math.floor(fidx);
        const i1 = Math.min(i0 + 1, n - 1);
        const frac = fidx - i0;
        values[i] = rawHeat[i0] * (1 - frac) + rawHeat[i1] * frac;
    }

    // 6. 3-tap box smooth
    const smoothed = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const a = i > 0 ? values[i - 1] : values[0];
        const b = values[i];
        const c = i < samples - 1 ? values[i + 1] : values[samples - 1];
        smoothed[i] = (a + b + c) / 3;
    }

    return smoothed;
}
