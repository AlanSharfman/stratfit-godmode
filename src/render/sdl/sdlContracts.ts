import * as THREE from "three";

/** Divergence scenario type */
export type DivergenceScenario = "optimistic" | "defensive";

/** Input curves for scenario divergence */
export interface DivergenceCurves {
    optimistic: Float32Array;
    defensive: Float32Array;
}

/** A single divergence spline result */
export interface DivergenceSpline {
    scenario: DivergenceScenario;
    controlPoints: { x: number; z: number }[];
}

/** Default ghost path config for divergence corridors */
export const SDL_GHOST_CONFIG = {
    samples: 160,
    halfWidth: 2.2,
    widthSegments: 4,
    lift: 0.18,
    tension: 0.5,
} as const;

/** Colours for divergence corridors */
export const SDL_COLORS: Record<DivergenceScenario, { color: number; emissive: number }> = {
    optimistic: { color: 0x7ad4e8, emissive: 0x5aafcc },   // cyan-tinted
    defensive: { color: 0x8888cc, emissive: 0x6666aa },     // indigo-tinted
};
