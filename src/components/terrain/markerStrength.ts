import type { TrajectoryMarker, TrajectoryMarkerType } from "@/types/trajectory";

/**
 * Shared marker derivation logic for terrain overlays.
 * Used by MarkerPedestals + StrategicLeverageMarkers.
 */

export function clamp01(n: number): number {
    return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

export function pickMarkerIndex(marker: TrajectoryMarker, sampleCount: number): number {
    if (typeof marker.sampleIndex === "number" && Number.isFinite(marker.sampleIndex)) {
        return Math.max(0, Math.min(sampleCount - 1, Math.round(marker.sampleIndex)));
    }
    const t = clamp01(marker.t ?? 0);
    return Math.max(0, Math.min(sampleCount - 1, Math.round(t * (sampleCount - 1))));
}

export interface DeriveMarkersInput {
    runwayMonths: number;
    grossMarginPct: number;
    monthlyBurn: number;
    arr: number;
}

/**
 * Derive world state markers from baseline financial metrics.
 * Deterministic — same inputs always produce same markers.
 */
export function deriveWorldStateMarkers(args: DeriveMarkersInput): TrajectoryMarker[] {
    const { runwayMonths, grossMarginPct, monthlyBurn, arr } = args;
    const runwayPressure01 = clamp01((18 - runwayMonths) / 18);
    const marginStress01 = clamp01((55 - grossMarginPct) / 25);
    const monthlyArr = Math.max(1, arr / 12);
    const burnRatio = monthlyBurn / monthlyArr;
    const burnPressure01 = clamp01((burnRatio - 1) / 2);

    return [
        { id: "capital-dependency", type: "runway_threshold", t: 0.18, strength: clamp01(0.35 + 0.65 * runwayPressure01) },
        { id: "burn-acceleration", type: "risk_inflection", t: 0.38, strength: clamp01(0.35 + 0.65 * burnPressure01) },
        { id: "margin-volatility", type: "confidence_shift", t: 0.52, strength: clamp01(0.25 + 0.75 * marginStress01) },
        { id: "revenue-concentration", type: "risk_inflection", t: 0.66, strength: 0.6 },
        { id: "runway-strength", type: "leverage_opportunity", t: 0.82, strength: clamp01(runwayMonths / 24) },
    ];
}

// Color palettes (no orange)
export const TYPE_RGB: Record<TrajectoryMarkerType, [number, number, number]> = {
    risk_inflection: [0.94, 0.27, 0.27],     // #EF4444
    runway_threshold: [0.94, 0.27, 0.27],     // #EF4444
    leverage_opportunity: [0.39, 0.40, 0.95], // #6366F1
    confidence_shift: [0.13, 0.83, 0.93],     // #22D3EE
};

export const TYPE_HEX: Record<TrajectoryMarkerType, string> = {
    risk_inflection: "#EF4444",
    runway_threshold: "#EF4444",
    leverage_opportunity: "#6366F1",
    confidence_shift: "#22D3EE",
};
