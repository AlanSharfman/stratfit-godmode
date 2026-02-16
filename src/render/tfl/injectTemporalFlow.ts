import * as THREE from "three";
import type { TflUniforms } from "./tflContracts";
import { TFL_INJECTED_KEY, TFL_UNIFORMS_KEY } from "./tflContracts";

/**
 * Create the TFL uniform block for injection into terrain material.
 */
export function createTflUniforms(velocityTexture: THREE.DataTexture | null): TflUniforms {
    return {
        uVelocityTex: { value: velocityTexture },
        uTflIntensity: { value: 0.18 },   // very subtle — no visible "effect"
        uTflWidth: { value: 16.0 },       // corridor falloff width
        uTflSpeed: { value: 0.12 },       // drift speed (slow, anisotropic)
        uTflTime: { value: 0.0 },
        uTflEnabled: { value: 1.0 },
    };
}

// ── Shader chunks ──

const FRAGMENT_TFL_PREAMBLE = /* glsl */ `
#ifndef TFL_UNIFORMS_DECLARED
#define TFL_UNIFORMS_DECLARED
uniform sampler2D uVelocityTex;
uniform float uTflIntensity;
uniform float uTflWidth;
uniform float uTflSpeed;
uniform float uTflTime;
uniform float uTflEnabled;
#endif
`;

const FRAGMENT_TFL_BLEND = /* glsl */ `
// ── TFL: Temporal Flow Layer ──
{
    if (uTflEnabled > 0.5) {
        // Map world X to corridor parameter t [0..1]
        // P50 corridor runs X: -220 → +220 in world space
        float tflT = clamp((vWorldPos.x + 220.0) / 440.0, 0.0, 1.0);

        // Distance from corridor centerline (Z ≈ 0)
        float tflDist = abs(vWorldPos.z);

        // Gaussian falloff from corridor center
        float tflFalloff = exp(-(tflDist * tflDist) / (uTflWidth * uTflWidth));

        // Sample velocity from 1D texture
        float velocity = texture2D(uVelocityTex, vec2(tflT, 0.5)).r;

        // Anisotropic flow: directional highlight that drifts along corridor
        // Phase moves with time, speed modulated by velocity
        float phase = tflT * 12.0 - uTflTime * uTflSpeed * (0.5 + velocity);

        // Soft sinusoidal highlight — NOT a sharp stripe
        float flow = sin(phase) * 0.5 + 0.5;
        flow = flow * flow; // soften further (ease-in)

        // Combine: flow * velocity * falloff — triple gating keeps it subtle
        float tflInfluence = flow * velocity * tflFalloff * uTflIntensity;

        // Very subtle warm directional tint (pale gold, almost white)
        vec3 tflTint = vec3(0.12, 0.10, 0.06);

        // Additive blend — imperceptible unless you look for it
        gl_FragColor.rgb += tflTint * tflInfluence;
    }
}
`;

/**
 * Inject TFL shader logic into terrain material via onBeforeCompile.
 *
 * COMPOSABLE: wraps any existing onBeforeCompile (RPF → CF chain).
 * IDEMPOTENT: guards via material.userData[TFL_INJECTED_KEY].
 */
export function injectTemporalFlow(
    material: THREE.MeshStandardMaterial,
    uniforms: TflUniforms,
): void {
    if (material.userData[TFL_INJECTED_KEY]) return;
    material.userData[TFL_INJECTED_KEY] = true;
    material.userData[TFL_UNIFORMS_KEY] = uniforms;

    // Capture existing onBeforeCompile (RPF → CF may have set one)
    const prevOnBeforeCompile = material.onBeforeCompile;

    // Extend custom program cache key
    const prevCacheKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => {
        const base = prevCacheKey ? prevCacheKey() : "";
        return base + "_tfl_v1";
    };

    material.onBeforeCompile = (shader, renderer) => {
        // Run previous injection chain first (RPF → CF)
        if (prevOnBeforeCompile) {
            prevOnBeforeCompile.call(material, shader, renderer);
        }

        // Merge TFL uniforms
        for (const [key, uniform] of Object.entries(uniforms)) {
            shader.uniforms[key] = uniform;
        }

        // ── Vertex: ensure world position varying exists ──
        // RPF/CF may have already declared vWorldPos; TFL reuses it.
        if (!shader.vertexShader.includes("varying vec3 vWorldPos;")) {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                `#include <common>\nvarying vec3 vWorldPos;\n`,
            );
            // CRITICAL FIX: Compute world position from transformed to avoid worldPosition dependency
            shader.vertexShader = shader.vertexShader.replace(
                "#include <worldpos_vertex>",
                `#include <worldpos_vertex>\nvec3 tflWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWorldPos = tflWorldPos;`,
            );
        }

        // ── Fragment: declare TFL uniforms + blend ──
        if (!shader.fragmentShader.includes("TFL_UNIFORMS_DECLARED")) {
            // Add varying if not already declared in fragment
            if (!shader.fragmentShader.includes("varying vec3 vWorldPos;")) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    `#include <common>\nvarying vec3 vWorldPos;\n${FRAGMENT_TFL_PREAMBLE}`,
                );
            } else {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    `#include <common>\n${FRAGMENT_TFL_PREAMBLE}`,
                );
            }

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <dithering_fragment>",
                `${FRAGMENT_TFL_BLEND}\n#include <dithering_fragment>`,
            );
        }
    };

    material.needsUpdate = true;
}

/**
 * Remove TFL injection from material.
 * Resets onBeforeCompile chain entirely — upstream layers will re-inject on next compile.
 */
export function removeTflInjection(material: THREE.MeshStandardMaterial): void {
    if (!material.userData[TFL_INJECTED_KEY]) return;

    delete material.userData[TFL_INJECTED_KEY];
    delete material.userData[TFL_UNIFORMS_KEY];

    material.onBeforeCompile = () => { };
    material.customProgramCacheKey = () => "";
    material.needsUpdate = true;
}
