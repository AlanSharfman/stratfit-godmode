import * as THREE from "three";
import type { SpinePoint } from "@/render/slm/slmContracts";
import type { PreviewRequest, PreviewSplinePoint } from "./ipeContracts";
import { DEFAULT_GHOST_CONFIG } from "./ipeContracts";

/**
 * Compute a short ghost spline branching from a leverage peak.
 *
 * The preview path:
 * 1) Starts at the peak position on the P50 spine
 * 2) Projects forward along the spine tangent
 * 3) Deflects laterally based on leverage score (higher = more divergence)
 * 4) Covers ~15% of corridor length
 *
 * Uses the existing P50 spine — no new geometry engine.
 * Deterministic: same inputs → same output.
 */
export function computePreviewSpline(
    request: PreviewRequest,
    spine: SpinePoint[],
    getHeightAt: (worldX: number, worldZ: number) => number,
    config = DEFAULT_GHOST_CONFIG,
): PreviewSplinePoint[] {
    const n = spine.length;
    if (n < 3) return [];

    // Find the closest spine index to the peak
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < n; i++) {
        const d = spine[i].position.distanceTo(request.peakPosition);
        if (d < closestDist) {
            closestDist = d;
            closestIdx = i;
        }
    }

    // Compute total corridor length for proportional preview
    let totalDist = 0;
    for (let i = 1; i < n; i++) {
        totalDist += spine[i].position.distanceTo(spine[i - 1].position);
    }
    const previewLength = totalDist * config.lengthFraction;

    // Compute forward tangent at peak
    const iPrev = Math.max(0, closestIdx - 1);
    const iNext = Math.min(n - 1, closestIdx + 1);
    const tangent = new THREE.Vector3()
        .subVectors(spine[iNext].position, spine[iPrev].position)
        .normalize();

    // Lateral direction (perpendicular to tangent on XZ plane)
    const up = new THREE.Vector3(0, 1, 0);
    const lateral = new THREE.Vector3().crossVectors(up, tangent).normalize();
    if (lateral.lengthSq() < 1e-6) lateral.set(1, 0, 0);

    // Deflection magnitude scales with leverage score
    // Higher leverage = more dramatic branch
    const deflection = previewLength * 0.4 * request.leverageScore;

    // Build control points for a smooth CatmullRom branch
    const cp: THREE.Vector3[] = [];
    const origin = request.peakPosition.clone();

    // Point 0: Origin (at peak)
    cp.push(origin.clone());

    // Point 1: Slight forward + begin lateral drift
    const p1 = origin.clone()
        .add(tangent.clone().multiplyScalar(previewLength * 0.3))
        .add(lateral.clone().multiplyScalar(deflection * 0.3));
    p1.y = getHeightAt(p1.x, p1.z) + config.lift;
    cp.push(p1);

    // Point 2: Mid-preview, full lateral deflection
    const p2 = origin.clone()
        .add(tangent.clone().multiplyScalar(previewLength * 0.65))
        .add(lateral.clone().multiplyScalar(deflection * 0.7));
    p2.y = getHeightAt(p2.x, p2.z) + config.lift;
    cp.push(p2);

    // Point 3: End, slightly pulled back toward corridor
    const p3 = origin.clone()
        .add(tangent.clone().multiplyScalar(previewLength))
        .add(lateral.clone().multiplyScalar(deflection * 0.55));
    p3.y = getHeightAt(p3.x, p3.z) + config.lift;
    cp.push(p3);

    // Smooth curve through control points
    const curve = new THREE.CatmullRomCurve3(cp, false, "catmullrom", 0.5);
    const sampled = curve.getPoints(config.samples);

    // Snap Y to terrain + lift at each sample
    return sampled.map((pt, i) => {
        pt.y = getHeightAt(pt.x, pt.z) + config.lift;
        return {
            position: pt,
            t: i / (sampled.length - 1),
        };
    });
}
