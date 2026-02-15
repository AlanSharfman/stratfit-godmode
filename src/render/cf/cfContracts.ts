import type * as THREE from "three";

/** Confidence field data aligned to corridor parameter */
export interface ConfidenceFieldData {
    /** Confidence values along corridor parameter [0..1], range [0..1] */
    values: Float32Array;
    /** Number of samples */
    sampleCount: number;
}

/** Uniforms injected into terrain material by CF */
export interface CfUniforms {
    uConfCurveTex: THREE.IUniform<THREE.DataTexture | null>;
    uCfIntensity: THREE.IUniform<number>;
    uCfWidth: THREE.IUniform<number>;
    uCfHighColor: THREE.IUniform<THREE.Vector3>;
    uCfLowColor: THREE.IUniform<THREE.Vector3>;
    uCfEnabled: THREE.IUniform<number>;
}

/** Guard key on material.userData to prevent double injection */
export const CF_INJECTED_KEY = "__cfInjected" as const;

/** Stored uniforms key on material.userData */
export const CF_UNIFORMS_KEY = "__cfUniforms" as const;
