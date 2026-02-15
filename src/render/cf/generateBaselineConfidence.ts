/**
 * Generate a deterministic baseline confidence curve.
 *
 * Derived as inverse of the risk curve:
 *   confidence = 1 - normalizedRisk
 *
 * Smoothed with a gentle cosine taper at edges.
 * Replace with real simulation dispersion metrics when available.
 */
export function generateBaselineConfidenceCurve(
    riskCurve: Float32Array,
): Float32Array {
    const n = riskCurve.length;
    const values = new Float32Array(n);

    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const risk = Math.max(0, Math.min(1, riskCurve[i]));

        // Inverse risk → raw confidence
        let conf = 1.0 - risk;

        // Gentle edge taper (avoids hard 1.0 at boundaries)
        const edgeTaper = 0.5 + 0.5 * Math.sin(t * Math.PI);
        conf *= 0.7 + 0.3 * edgeTaper;

        values[i] = Math.max(0, Math.min(1, conf));
    }

    return values;
}
