/**
 * Derive a placeholder velocity curve from a risk curve.
 *
 * velocity = normalized gradient of risk (absolute segment-length derivative).
 * High velocity = rapid change in risk → fast-moving corridor region.
 * Low velocity = stable plateau → slow-moving region.
 *
 * Smoothed with 3-tap box filter to avoid noisy texels.
 * Output: Float32Array of length `samples`, values in [0..1].
 */
export function generateBaselineVelocityCurve(
    riskValues: Float32Array,
    samples: number = 256,
): Float32Array {
    const n = riskValues.length;
    if (n < 2) return new Float32Array(samples).fill(0.5);

    // 1. compute raw gradient magnitude
    const rawGrad = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const prev = i > 0 ? riskValues[i - 1] : riskValues[0];
        const next = i < n - 1 ? riskValues[i + 1] : riskValues[n - 1];
        rawGrad[i] = Math.abs(next - prev) * 0.5 * n; // scale to per-unit-t
    }

    // 2. normalize to [0..1]
    let maxGrad = 0;
    for (let i = 0; i < n; i++) {
        if (rawGrad[i] > maxGrad) maxGrad = rawGrad[i];
    }
    const scale = maxGrad > 1e-6 ? 1 / maxGrad : 1;
    for (let i = 0; i < n; i++) {
        rawGrad[i] *= scale;
    }

    // 3. resample to output length with 3-tap smoothing
    const values = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const fidx = t * (n - 1);
        const i0 = Math.floor(fidx);
        const i1 = Math.min(i0 + 1, n - 1);
        const frac = fidx - i0;
        values[i] = rawGrad[i0] * (1 - frac) + rawGrad[i1] * frac;
    }

    // 4. 3-tap box smooth
    const smoothed = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const a = i > 0 ? values[i - 1] : values[0];
        const b = values[i];
        const c = i < samples - 1 ? values[i + 1] : values[samples - 1];
        smoothed[i] = (a + b + c) / 3;
    }

    // 5. add baseline floor so even "still" regions have slight flow feel
    for (let i = 0; i < samples; i++) {
        smoothed[i] = Math.min(1, smoothed[i] * 0.7 + 0.3);
    }

    return smoothed;
}
