/**
 * TERRAIN_CONSTANTS — Single source of truth for terrain geometry.
 * Used by buildTerrain, P50Path, markers, overlays.
 */
export const TERRAIN_CONSTANTS = {
    /** PlaneGeometry width (X axis) */
    width: 560,
    /** PlaneGeometry depth (Z axis after rotation) */
    depth: 360,
    /** Grid resolution (segments + 1 vertices per axis) */
    segments: 96,
    /** Raw height multiplier applied to heightModel output */
    heightScale: 60,
    /** Secondary scale factor for terrain mode */
    heightFactor: 0.35,
    /** Y offset after rotation to center terrain */
    yOffset: -6,
    /** Noise octave base scale */
    noiseScale: 0.045,
    /** Ridge sharpness exponent */
    ridgeSharpness: 1.25,
} as const;

export type TerrainConstants = typeof TERRAIN_CONSTANTS;
