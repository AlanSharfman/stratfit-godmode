import type * as THREE from "three";

/** Velocity data aligned to corridor samples */
export interface VelocityFieldData {
    /** Velocity values along corridor parameter [0..1], range [0..1] */
    values: Float32Array;
    /** Number of corridor samples */
    sampleCount: number;
}

/** Uniforms injected into terrain material by TFL */
export interface TflUniforms {
    uVelocityTex: THREE.IUniform<THREE.DataTexture | null>;
    uTflIntensity: THREE.IUniform<number>;
    uTflWidth: THREE.IUniform<number>;
    uTflSpeed: THREE.IUniform<number>;
    uTflTime: THREE.IUniform<number>;
    uTflEnabled: THREE.IUniform<number>;
}

/** Marker key stored on material.userData when TFL is injected */
export const TFL_INJECTED_KEY = "__tflInjected" as const;
export const TFL_UNIFORMS_KEY = "__tflUniforms" as const;
