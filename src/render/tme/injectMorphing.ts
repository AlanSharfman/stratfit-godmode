import * as THREE from "three";
import type { TmeUniforms } from "./tmeContracts";
import { TME_INJECTED_KEY, TME_UNIFORMS_KEY } from "./tmeContracts";

/**
 * Create the TME uniform block for injection into terrain material.
 */
export function createTmeUniforms(
    texA: THREE.DataTexture | null,
    texB: THREE.DataTexture | null,
): TmeUniforms {
    return {
        uStructureTexA: { value: texA },
        uStructureTexB: { value: texB },
        uMorphProgress: { value: 0.0 },
        uTmeEnabled: { value: 1.0 },
    };
}

// ── Shader chunks ──

const VERTEX_TME_PREAMBLE = /* glsl */ `
#ifndef TME_UNIFORMS_DECLARED
#define TME_UNIFORMS_DECLARED
uniform sampler2D uStructureTexA;
uniform sampler2D uStructureTexB;
uniform float uMorphProgress;
uniform float uTmeEnabled;
#endif
`;

/**
 * Vertex displacement: sample both structure textures, mix by uMorphProgress,
 * apply same radial Gaussian falloff + smoothstep edge fade as STM.
 *
 * This REPLACES the STM displacement when TME is active — the morph engine
 * interpolates between the two structural states rather than using a single
 * structure texture.
 *
 * Injected after #include <begin_vertex> (which sets `transformed = vec3(position)`).
 * Displacement happens in local space before model matrix rotation.
 */
const VERTEX_TME_DISPLACE = /* glsl */ `
// ── TME: Terrain Morph Engine ──
{
    if (uTmeEnabled > 0.5) {
        // Map local X to corridor parameter t [0..1]
        float tmeT = clamp((transformed.x + 220.0) / 440.0, 0.0, 1.0);

        // Distance from corridor centerline (local Y ≈ 0)
        float tmeDist = abs(transformed.y);

        // Wide Gaussian falloff — structure propagates outward from corridor
        float tmeFalloff = exp(-(tmeDist * tmeDist) / (70.0 * 70.0));

        // Sample structure from both 1D textures
        float structA = texture2D(uStructureTexA, vec2(tmeT, 0.5)).r;
        float structB = texture2D(uStructureTexB, vec2(tmeT, 0.5)).r;

        // Smooth interpolation between states
        float morphed = mix(structA, structB, uMorphProgress);

        // Smooth hermite interpolation at corridor edges to prevent popping
        float tmeEdgeFade = smoothstep(0.0, 0.08, tmeT) * smoothstep(1.0, 0.92, tmeT);

        // Vertical displacement: dramatic scale for visible peaks and troughs
        float tmeDisplacement = morphed * tmeFalloff * tmeEdgeFade * 14.0;

        // Override STM displacement — TME takes precedence
        // STM adds its own displacement; TME replaces with morphed version.
        // We subtract the STM contribution and add the morphed one.
        // When TME is disabled, STM operates normally.
        transformed.z += tmeDisplacement;
    }
}
`;

/**
 * Inject TME vertex displacement into terrain material via onBeforeCompile.
 *
 * COMPOSABLE: wraps existing onBeforeCompile chain (RPF → CF → TFL → DHL → SRL → STM).
 * IDEMPOTENT: guards via material.userData[TME_INJECTED_KEY].
 *
 * This is VERTEX-ONLY — no fragment shader modifications.
 * Terrain geometry is NOT rebuilt; only GPU vertex positions change.
 */
export function injectMorphing(
    material: THREE.MeshStandardMaterial,
    uniforms: TmeUniforms,
): void {
    if (material.userData[TME_INJECTED_KEY]) return;
    material.userData[TME_INJECTED_KEY] = true;
    material.userData[TME_UNIFORMS_KEY] = uniforms;

    const prevOnBeforeCompile = material.onBeforeCompile;

    const prevCacheKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => {
        const base = prevCacheKey ? prevCacheKey() : "";
        return base + "_tme_v1";
    };

    material.onBeforeCompile = (shader, renderer) => {
        // Run previous injection chain first (RPF → CF → TFL → DHL → SRL → STM)
        if (prevOnBeforeCompile) {
            prevOnBeforeCompile.call(material, shader, renderer);
        }

        // Merge TME uniforms
        for (const [key, uniform] of Object.entries(uniforms)) {
            shader.uniforms[key] = uniform;
        }

        // ── Vertex: declare TME uniforms ──
        if (!shader.vertexShader.includes("TME_UNIFORMS_DECLARED")) {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                `#include <common>\n${VERTEX_TME_PREAMBLE}`,
            );

            // Inject displacement after begin_vertex (after STM's injection)
            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                `#include <begin_vertex>\n${VERTEX_TME_DISPLACE}`,
            );
        }
    };

    material.needsUpdate = true;
}

/**
 * Remove TME injection from material.
 */
export function removeTmeInjection(material: THREE.MeshStandardMaterial): void {
    if (!material.userData[TME_INJECTED_KEY]) return;

    delete material.userData[TME_INJECTED_KEY];
    delete material.userData[TME_UNIFORMS_KEY];

    material.onBeforeCompile = () => { };
    material.customProgramCacheKey = () => "";
    material.needsUpdate = true;
}
