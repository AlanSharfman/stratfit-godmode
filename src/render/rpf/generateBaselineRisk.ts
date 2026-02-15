/**
 * Generate a deterministic baseline risk curve.
 *
 * This is a placeholder derived from structural assumptions:
 * - Higher risk early (startup uncertainty / burn acceleration)
 * - Dip mid-timeline (baseline holds)
 * - Rise toward end (capital dependency / growth uncertainty)
 *
 * Replace with real simulation-derived risk when available.
 * API: Float32Array of length `samples`, values in [0..1].
 */
export function generateBaselineRiskCurve(samples: number = 256): Float32Array {
    const values = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);

        // Base shape: gentle U-curve (higher at edges, lower in middle)
        const base = 0.18 + 0.12 * (1.0 - Math.sin(t * Math.PI));

        // Bump 1 — burn acceleration zone (t ≈ 0.30)
        const bump1 = 0.40 * Math.exp(-((t - 0.30) ** 2) * 90);

        // Bump 2 — margin volatility zone (t ≈ 0.55)
        const bump2 = 0.28 * Math.exp(-((t - 0.55) ** 2) * 70);

        // Bump 3 — capital dependency zone (t ≈ 0.80)
        const bump3 = 0.32 * Math.exp(-((t - 0.80) ** 2) * 60);

        // Micro-texture (deterministic, not random)
        const micro = 0.03 * Math.sin(t * 47.1) * Math.cos(t * 23.7);

        values[i] = Math.max(0, Math.min(1, base + bump1 + bump2 + bump3 + micro));
    }

    return values;
}
