import type * as THREE from "three";

/** Resonance data aligned to corridor samples */
export interface ResonanceFieldData {
    /** Resonance values along corridor parameter [0..1], range [0..1] */
    values: Float32Array;
    /** Number of corridor samples */
    sampleCount: number;
}

/** Uniforms injected into terrain material by SRL */
export interface SrlUniforms {
    uResonanceTex: THREE.IUniform<THREE.DataTexture | null>;
    uSrlIntensity: THREE.IUniform<number>;
    uSrlWidth: THREE.IUniform<number>;
    uSrlEnabled: THREE.IUniform<number>;
}

/** Marker key stored on material.userData when SRL is injected */
export const SRL_INJECTED_KEY = "__srlInjected" as const;
export const SRL_UNIFORMS_KEY = "__srlUniforms" as const;
