import type * as THREE from "three";

/** Maximum number of marker pedestals the shader can process */
export const MPL_MAX_MARKERS = 6;

/** Uniforms injected into terrain material by MPL (Marker Pedestals Layer) */
export interface MplUniforms {
    /** vec3 array: world-space marker positions (x, y, z) — up to MPL_MAX_MARKERS */
    uMplPositions: THREE.IUniform<Float32Array>;
    /** vec4 array: (r, g, b, strength) per marker — up to MPL_MAX_MARKERS */
    uMplColors: THREE.IUniform<Float32Array>;
    /** Number of active markers (0..MPL_MAX_MARKERS) */
    uMplCount: THREE.IUniform<number>;
    /** Overall intensity multiplier */
    uMplIntensity: THREE.IUniform<number>;
    /** Pedestal radius in world units */
    uMplRadius: THREE.IUniform<number>;
    /** Max vertex lift (0 = shading-only, 0.10 = subtle emboss) */
    uMplLift: THREE.IUniform<number>;
    /** Enable flag (0 or 1) */
    uMplEnabled: THREE.IUniform<number>;
}

/** Marker key stored on material.userData when MPL is injected */
export const MPL_INJECTED_KEY = "__mplInjected" as const;

/** Key for stored uniforms on material.userData */
export const MPL_UNIFORMS_KEY = "__mplUniforms" as const;
