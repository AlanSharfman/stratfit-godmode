import * as THREE from "three";
import type { SpinePoint, LeveragePeak } from "./slmContracts";

/**
 * Compute a deterministic leverage curve from spine curvature + inverse risk.
 *
 * leverage = clamp01( 0.6 * curvature + 0.4 * (1 - risk) )
 *
 * Curvature = normalized magnitude of direction change between consecutive segments.
 * Risk values are resampled to match spine length if needed.
 */
export function computeLeverageCurve(
    spinePoints: SpinePoint[],
    riskCurve: Float32Array,
): Float32Array {
    const n = spinePoints.length;
    const leverage = new Float32Array(n);

    if (n < 3) return leverage;

    // 1) Compute raw curvature at each interior point
    const rawCurvature = new Float32Array(n);
    for (let i = 1; i < n - 1; i++) {
        const prev = spinePoints[i - 1].position;
        const curr = spinePoints[i].position;
        const next = spinePoints[i + 1].position;

        const d1 = new THREE.Vector3().subVectors(curr, prev).normalize();
        const d2 = new THREE.Vector3().subVectors(next, curr).normalize();
        const cross = new THREE.Vector3().crossVectors(d1, d2);
        rawCurvature[i] = cross.length(); // sin(angle) ≈ curvature
    }
    rawCurvature[0] = rawCurvature[1];
    rawCurvature[n - 1] = rawCurvature[n - 2];

    // 2) Normalize curvature to [0..1]
    let maxCurv = 0;
    for (let i = 0; i < n; i++) {
        if (rawCurvature[i] > maxCurv) maxCurv = rawCurvature[i];
    }
    const curvScale = maxCurv > 1e-6 ? 1.0 / maxCurv : 1.0;

    // 3) Combine curvature + inverse risk
    for (let i = 0; i < n; i++) {
        const t = spinePoints[i].t;
        // Resample risk curve to match spine parameterization
        const riskIdx = Math.min(
            riskCurve.length - 1,
            Math.round(t * (riskCurve.length - 1)),
        );
        const risk = riskCurve[riskIdx];
        const curv = rawCurvature[i] * curvScale;

        leverage[i] = Math.max(0, Math.min(1, 0.6 * curv + 0.4 * (1.0 - risk)));
    }

    return leverage;
}

/**
 * Pick up to maxPeaks local maxima from the leverage curve.
 *
 * Enforces minimum spacing along cumulative corridor distance.
 * Returns peaks sorted descending by score.
 */
export function pickLeveragePeaks(
    spinePoints: SpinePoint[],
    leverageCurve: Float32Array,
    maxPeaks: number = 5,
): LeveragePeak[] {
    const n = spinePoints.length;
    if (n < 3) return [];

    // 1) Compute cumulative distance along spine
    const cumDist = new Float32Array(n);
    for (let i = 1; i < n; i++) {
        cumDist[i] =
            cumDist[i - 1] +
            spinePoints[i].position.distanceTo(spinePoints[i - 1].position);
    }
    const totalDist = cumDist[n - 1];
    const minSep = totalDist / 8;

    // 2) Find all local maxima (value > both neighbors)
    const candidates: LeveragePeak[] = [];
    for (let i = 1; i < n - 1; i++) {
        if (
            leverageCurve[i] > leverageCurve[i - 1] &&
            leverageCurve[i] > leverageCurve[i + 1] &&
            leverageCurve[i] > 0.1 // minimum threshold
        ) {
            candidates.push({
                index: i,
                score: leverageCurve[i],
                position: spinePoints[i].position.clone(),
                t: spinePoints[i].t,
            });
        }
    }

    // 3) Sort descending by score
    candidates.sort((a, b) => b.score - a.score);

    // 4) Greedy pick with min separation
    const selected: LeveragePeak[] = [];
    for (const c of candidates) {
        if (selected.length >= Math.min(maxPeaks, 7)) break;

        const tooClose = selected.some(
            (s) => Math.abs(cumDist[c.index] - cumDist[s.index]) < minSep,
        );
        if (tooClose) continue;

        selected.push(c);
    }

    // Ensure at least 3 if we have enough candidates
    const clampedCount = Math.max(3, Math.min(7, selected.length));
    return selected.slice(0, clampedCount);
}
