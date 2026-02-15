import type * as THREE from "three";

/** A preview spline point for intervention ghost path */
export interface PreviewSplinePoint {
    /** World-space position */
    position: THREE.Vector3;
    /** Parameter along preview [0..1] */
    t: number;
}

/** Input data for computing a preview spline from a leverage peak */
export interface PreviewRequest {
    /** Index of the hovered leverage peak */
    peakIndex: number;
    /** World-space position of the peak */
    peakPosition: THREE.Vector3;
    /** Corridor parameter [0..1] at peak */
    peakT: number;
    /** Leverage score at peak [0..1] */
    leverageScore: number;
}

/** Ghost path visual configuration */
export interface GhostPathConfig {
    /** Number of samples along preview spline */
    samples: number;
    /** Ribbon half-width */
    halfWidth: number;
    /** Opacity (visually secondary) */
    opacity: number;
    /** Vertical lift above terrain */
    lift: number;
    /** Preview length as fraction of total corridor length */
    lengthFraction: number;
}

/** Default ghost path configuration */
export const DEFAULT_GHOST_CONFIG: GhostPathConfig = {
    samples: 40,
    halfWidth: 2.0,
    opacity: 0.35,
    lift: 0.3,
    lengthFraction: 0.15,
};
