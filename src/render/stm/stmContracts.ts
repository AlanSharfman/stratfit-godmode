import type * as THREE from "three";

/** Structure data aligned to corridor samples */
export interface StructureFieldData {
    /** Structure values along corridor parameter [0..1], range [0..1] */
    values: Float32Array;
    /** Number of corridor samples */
    sampleCount: number;
}

/** Uniforms injected into terrain material by STM */
export interface StmUniforms {
    uStructureTex: THREE.IUniform<THREE.DataTexture | null>;
    uTopoScale: THREE.IUniform<number>;
    uTopoWidth: THREE.IUniform<number>;
    uTopoEnabled: THREE.IUniform<number>;
    uStmEnabled: THREE.IUniform<number>;
}

/** Marker key stored on material.userData when STM is injected */
export const STM_INJECTED_KEY = "__stmInjected" as const;
export const STM_UNIFORMS_KEY = "__stmUniforms" as const;

