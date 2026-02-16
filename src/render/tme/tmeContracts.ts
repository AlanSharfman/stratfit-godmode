import type * as THREE from "three";

/**
 * TME — Terrain Morph Engine contracts.
 *
 * Enables smooth interpolation between two structural states (A → B)
 * via shader-based vertex morphing. No geometry rebuild.
 *
 * uMorphProgress [0..1]: 0 = state A, 1 = state B.
 */

/** Uniforms injected into terrain material by TME */
export interface TmeUniforms {
    uStructureTexA: THREE.IUniform<THREE.DataTexture | null>;
    uStructureTexB: THREE.IUniform<THREE.DataTexture | null>;
    uMorphProgress: THREE.IUniform<number>;
    uTmeEnabled: THREE.IUniform<number>;
    /** Height displacement multiplier — 0 in neutral mode, 14 in active mode */
    uTmeHeightScale: THREE.IUniform<number>;
}

/** Marker key stored on material.userData when TME is injected */
export const TME_INJECTED_KEY = "__tmeInjected" as const;
export const TME_UNIFORMS_KEY = "__tmeUniforms" as const;
