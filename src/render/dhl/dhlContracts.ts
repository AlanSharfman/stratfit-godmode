import type * as THREE from "three";

/** Decision heat data aligned to corridor samples */
export interface HeatFieldData {
    /** Heat values along corridor parameter [0..1], range [0..1] */
    values: Float32Array;
    /** Number of corridor samples */
    sampleCount: number;
}

/** Uniforms injected into terrain material by DHL */
export interface DhlUniforms {
    uHeatCurveTex: THREE.IUniform<THREE.DataTexture | null>;
    uDhlIntensity: THREE.IUniform<number>;
    uDhlWidth: THREE.IUniform<number>;
    uDhlEnabled: THREE.IUniform<number>;
}

/** Marker key stored on material.userData when DHL is injected */
export const DHL_INJECTED_KEY = "__dhlInjected" as const;
export const DHL_UNIFORMS_KEY = "__dhlUniforms" as const;
