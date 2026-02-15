import type * as THREE from "three";

/** A single spine sample point on the P50 corridor centerline */
export interface SpinePoint {
    /** World-space position */
    position: THREE.Vector3;
    /** Parameter along corridor [0..1] */
    t: number;
}

/** Leverage curve data aligned with spine samples */
export interface LeverageCurveData {
    /** Leverage values [0..1] per spine sample */
    values: Float32Array;
    /** Number of samples (must match spine length) */
    sampleCount: number;
}

/** A selected leverage peak for marker placement */
export interface LeveragePeak {
    /** Index into the spine/leverage arrays */
    index: number;
    /** Leverage score at this peak [0..1] */
    score: number;
    /** World-space position (from spine) */
    position: THREE.Vector3;
    /** Parameter along corridor [0..1] */
    t: number;
}

/** Marker instance transform data */
export interface MarkerInstanceData {
    /** Instance index */
    index: number;
    /** World position */
    position: THREE.Vector3;
    /** Scale (uniform) */
    scale: number;
    /** Transform matrix for InstancedMesh */
    matrix: THREE.Matrix4;
}
