import type { DivergenceCurves, DivergenceSpline } from "./sdlContracts";

/**
 * Compute divergence spline control points for optimistic & defensive scenarios.
 *
 * Uses the P50 spine as baseline, offsets laterally (Z-axis) scaled by
 * the divergence curve values. Optimistic drifts one direction, defensive the other.
 *
 * @param spinePoints  P50 world-space XZ control points (same as corridor engine input)
 * @param curves       Divergence offset curves (Float32Array, values in [-1..1] or [0..1])
 * @returns            Two DivergenceSpline objects with offset control points
 */
export function computeDivergenceSplines(
    spinePoints: { x: number; z: number }[],
    curves: DivergenceCurves,
): DivergenceSpline[] {
    const n = spinePoints.length;
    if (n < 2) return [];

    const optPts: { x: number; z: number }[] = [];
    const defPts: { x: number; z: number }[] = [];

    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const p = spinePoints[i];

        // Sample curves (resample if different length)
        const optIdx = Math.min(Math.floor(t * (curves.optimistic.length - 1)), curves.optimistic.length - 1);
        const defIdx = Math.min(Math.floor(t * (curves.defensive.length - 1)), curves.defensive.length - 1);

        const optOffset = curves.optimistic[optIdx];
        const defOffset = curves.defensive[defIdx];

        // Lateral offset in Z (perpendicular to corridor direction X)
        // Max offset ~25 world units — enough to be visible, not cluttering
        const MAX_LATERAL = 25;

        optPts.push({ x: p.x, z: p.z - optOffset * MAX_LATERAL });
        defPts.push({ x: p.x, z: p.z + defOffset * MAX_LATERAL });
    }

    return [
        { scenario: "optimistic", controlPoints: optPts },
        { scenario: "defensive", controlPoints: defPts },
    ];
}

/**
 * Generate deterministic divergence curves from a risk curve.
 *
 * Optimistic: inverted risk (low risk → higher divergence upward)
 * Defensive: risk amplified (high risk → stronger defensive offset)
 *
 * Both normalized to [0..1] with smooth edges.
 */
export function generateBaselineDivergenceCurves(
    riskValues: Float32Array,
    samples: number = 256,
): DivergenceCurves {
    const n = riskValues.length;
    const optimistic = new Float32Array(samples);
    const defensive = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const rIdx = Math.min(Math.floor(t * (n - 1)), n - 1);
        const risk = riskValues[rIdx];

        // Edge taper: fade in/out at corridor extremes
        const taper = Math.sin(t * Math.PI);

        // Optimistic = where risk is LOW, we can push further out
        optimistic[i] = (1.0 - risk) * 0.6 * taper;

        // Defensive = where risk is HIGH, defensive path diverges more
        defensive[i] = risk * 0.55 * taper;
    }

    return { optimistic, defensive };
}
