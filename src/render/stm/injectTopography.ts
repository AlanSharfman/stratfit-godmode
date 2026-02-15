import * as THREE from "three";
import type { StmUniforms } from "./stmContracts";
import { STM_INJECTED_KEY, STM_UNIFORMS_KEY } from "./stmContracts";

/**
 * Create the STM uniform block for injection into terrain material.
 */
export function createStmUniforms(structureTexture: THREE.DataTexture | null): StmUniforms {
    return {
        uStructureTex: { value: structureTexture },
        uTopoScale: { value: 14.0 },      // max displacement in local Z units — dramatic peaks/troughs
        uTopoWidth: { value: 70.0 },      // wide Gaussian falloff from corridor center
        uStmEnabled: { value: 1.0 },
    };
}

// ── Shader chunks ──

const VERTEX_STM_PREAMBLE = /* glsl */ `
#ifndef STM_UNIFORMS_DECLARED
#define STM_UNIFORMS_DECLARED
uniform sampler2D uStructureTex;
uniform float uTopoScale;
uniform float uTopoWidth;
uniform float uStmEnabled;
#endif
`;

/**
 * Vertex displacement: sample structure texture, radial falloff from corridor,
 * displace local Z (height) smoothly.
 *
 * Injected after #include <begin_vertex> (which sets `transformed = vec3(position)`).
 * Displacement happens in local space before model matrix rotation.
 * - position.x = corridor axis (world X after rotation)
 * - position.y = cross-terrain axis (world -Z after rotation)
 * - position.z = height (world Y after rotation)
 */
const VERTEX_STM_DISPLACE = /* glsl */ `
// ── STM: Structural Topography Mapping ──
{
    if (uStmEnabled > 0.5) {
        // Map local X to corridor parameter t [0..1]
        // Corridor spans X: -220 → +220 in local (and world) space
        float stmT = clamp((transformed.x + 220.0) / 440.0, 0.0, 1.0);

        // Distance from corridor centerline (local Y ≈ 0)
        float stmDist = abs(transformed.y);

        // Wide Gaussian falloff — structure propagates outward from corridor
        float stmFalloff = exp(-(stmDist * stmDist) / (uTopoWidth * uTopoWidth));

        // Sample structure from 1D texture (vertex shader texture fetch)
        float structure = texture2D(uStructureTex, vec2(stmT, 0.5)).r;

        // Smooth hermite interpolation at corridor edges to prevent popping
        float edgeFade = smoothstep(0.0, 0.08, stmT) * smoothstep(1.0, 0.92, stmT);

        // Vertical displacement: positive = terrain rises in structurally strong zones
        float displacement = structure * stmFalloff * edgeFade * uTopoScale;

        transformed.z += displacement;
    }
}
`;

/**
 * Inject STM vertex displacement into terrain material via onBeforeCompile.
 *
 * COMPOSABLE: wraps existing onBeforeCompile chain (RPF → CF → TFL → DHL → SRL).
 * IDEMPOTENT: guards via material.userData[STM_INJECTED_KEY].
 *
 * This is VERTEX-ONLY — no fragment shader modifications.
 * Terrain geometry is NOT rebuilt; only the GPU vertex positions change.
 */
export function injectTopography(
    material: THREE.MeshStandardMaterial,
    uniforms: StmUniforms,
): void {
    if (material.userData[STM_INJECTED_KEY]) return;
    material.userData[STM_INJECTED_KEY] = true;
    material.userData[STM_UNIFORMS_KEY] = uniforms;

    const prevOnBeforeCompile = material.onBeforeCompile;

    const prevCacheKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => {
        const base = prevCacheKey ? prevCacheKey() : "";
        return base + "_stm_v1";
    };

    material.onBeforeCompile = (shader, renderer) => {
        // Run previous injection chain first (RPF → CF → TFL → DHL → SRL)
        if (prevOnBeforeCompile) {
            prevOnBeforeCompile.call(material, shader, renderer);
        }

        // Merge STM uniforms
        for (const [key, uniform] of Object.entries(uniforms)) {
            shader.uniforms[key] = uniform;
        }

        // ── Vertex: declare STM uniforms ──
        if (!shader.vertexShader.includes("STM_UNIFORMS_DECLARED")) {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                `#include <common>\n${VERTEX_STM_PREAMBLE}`,
            );

            // Inject displacement after begin_vertex (which sets `transformed`)
            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                `#include <begin_vertex>\n${VERTEX_STM_DISPLACE}`,
            );
        }
    };

    material.needsUpdate = true;
}

/**
 * Remove STM injection from material.
 */
export function removeStmInjection(material: THREE.MeshStandardMaterial): void {
    if (!material.userData[STM_INJECTED_KEY]) return;

    delete material.userData[STM_INJECTED_KEY];
    delete material.userData[STM_UNIFORMS_KEY];

    material.onBeforeCompile = () => { };
    material.customProgramCacheKey = () => "";
    material.needsUpdate = true;
}
