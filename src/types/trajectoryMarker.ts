// src/types/trajectoryMarker.ts
// STRATFIT — Semantic Trajectory Marker contract

/**
 * Marker semantic types. Each type drives a distinct glyph + color:
 *   risk_inflection      → red halo + triangular tick
 *   runway_threshold     → red halo + vertical bar tick
 *   leverage_opportunity → indigo halo + diamond glyph
 *   confidence_shift     → cyan halo + ring glyph
 */
export type TrajectoryMarkerType =
    | "risk_inflection"
    | "runway_threshold"
    | "leverage_opportunity"
    | "confidence_shift";

/**
 * A single trajectory marker anchored on the P50 corridor.
 * Deterministic: same inputs → same markers.
 */
export interface TrajectoryMarker {
    /** Unique identifier — matches SIGNAL_MARKERS in BaselineIntelligencePanel */
    id: string;
    /** Semantic type controlling glyph shape + color palette */
    type: TrajectoryMarkerType;
    /** Parameter along corridor centerline [0..1] */
    t: number;
    /** Closest spine sample index */
    sampleIndex: number;
    /** Signal strength [0..1] — higher = stronger signal */
    strength: number;
}
