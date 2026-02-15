import type * as THREE from "three";

/** Risk field data for a single corridor slice */
export interface RiskFieldData {
    /** Risk values along corridor parameter [0..1], range [0..1] */
    values: Float32Array;
    /** Number of corridor samples */
    sampleCount: number;
}

/** Corridor topology slice used by RPF for spatial mapping */
export interface CorridorSlice {
    /** World-space X range of the corridor [min, max] */
    xRange: [number, number];
    /** World-space Z center of the corridor */
    zCenter: number;
}

/** Uniforms injected into terrain material by RPF */
export interface RpfUniforms {
    uRiskCurveTex: THREE.IUniform<THREE.DataTexture | null>;
    uRpfIntensity: THREE.IUniform<number>;
    uRpfWidth: THREE.IUniform<number>;
    uRpfLowColor: THREE.IUniform<THREE.Vector3>;
    uRpfHighColor: THREE.IUniform<THREE.Vector3>;
    uRpfTime: THREE.IUniform<number>;
    uRpfEnabled: THREE.IUniform<number>;
}

/** Marker key stored on material.userData when RPF is injected */
export const RPF_INJECTED_KEY = "__rpfInjected" as const;

/** Key for stored uniforms on material.userData */
export const RPF_UNIFORMS_KEY = "__rpfUniforms" as const;
