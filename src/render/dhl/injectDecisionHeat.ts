import * as THREE from "three";
import type { DhlUniforms } from "./dhlContracts";
import { DHL_INJECTED_KEY, DHL_UNIFORMS_KEY } from "./dhlContracts";

/**
 * Create the DHL uniform block for injection into terrain material.
 */
export function createDhlUniforms(heatTexture: THREE.DataTexture | null): DhlUniforms {
    return {
        uHeatCurveTex: { value: heatTexture },
        uDhlIntensity: { value: 0.22 },   // subtle subsurface warmth
        uDhlWidth: { value: 20.0 },       // corridor falloff width
        uDhlEnabled: { value: 1.0 },
    };
}

// ── Shader chunks ──

const FRAGMENT_DHL_PREAMBLE = /* glsl */ `
#ifndef DHL_UNIFORMS_DECLARED
#define DHL_UNIFORMS_DECLARED
uniform sampler2D uHeatCurveTex;
uniform float uDhlIntensity;
uniform float uDhlWidth;
uniform float uDhlEnabled;
#endif
`;

const FRAGMENT_DHL_BLEND = /* glsl */ `
// ── DHL: Decision Heat Layer ──
{
    if (uDhlEnabled > 0.5) {
        // Map world X to corridor parameter t [0..1]
        float dhlT = clamp((vWorldPos.x + 220.0) / 440.0, 0.0, 1.0);

        // Distance from corridor centerline (Z ≈ 0)
        float dhlDist = abs(vWorldPos.z);

        // Radial falloff — subsurface feel (wider, softer than RPF)
        float dhlFalloff = exp(-(dhlDist * dhlDist) / (uDhlWidth * uDhlWidth));

        // Sample heat from 1D texture
        float heatSample = texture2D(uHeatCurveTex, vec2(dhlT, 0.5)).r;

        // Subsurface warm tone: dark amber → nothing
        // NOT additive glow — multiply-blend into existing colour
        vec3 warmTint = vec3(0.14, 0.07, 0.02); // subtle burnt amber

        float dhlInfluence = dhlFalloff * heatSample;

        // Mix blend (not additive) — feels embedded, not overlaid
        gl_FragColor.rgb = mix(
            gl_FragColor.rgb,
            gl_FragColor.rgb + warmTint,
            dhlInfluence * uDhlIntensity
        );
    }
}
`;

/**
 * Inject DHL shader logic into terrain material via onBeforeCompile.
 *
 * COMPOSABLE: wraps any existing onBeforeCompile (RPF → CF → TFL chain).
 * IDEMPOTENT: guards via material.userData[DHL_INJECTED_KEY].
 */
export function injectDecisionHeat(
    material: THREE.MeshStandardMaterial,
    uniforms: DhlUniforms,
): void {
    if (material.userData[DHL_INJECTED_KEY]) return;
    material.userData[DHL_INJECTED_KEY] = true;
    material.userData[DHL_UNIFORMS_KEY] = uniforms;

    // Capture existing onBeforeCompile (RPF → CF → TFL may have set one)
    const prevOnBeforeCompile = material.onBeforeCompile;

    // Extend custom program cache key
    const prevCacheKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => {
        const base = prevCacheKey ? prevCacheKey() : "";
        return base + "_dhl_v1";
    };

    material.onBeforeCompile = (shader, renderer) => {
        // Run previous injection chain first (RPF → CF → TFL)
        if (prevOnBeforeCompile) {
            prevOnBeforeCompile.call(material, shader, renderer);
        }

        // Merge DHL uniforms
        for (const [key, uniform] of Object.entries(uniforms)) {
            shader.uniforms[key] = uniform;
        }

        // ── Vertex: ensure world position varying exists ──
        if (!shader.vertexShader.includes("varying vec3 vWorldPos;")) {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                `#include <common>\nvarying vec3 vWorldPos;\n`,
            );
            // CRITICAL FIX: worldPosition is only available AFTER #include <worldpos_vertex>
            shader.vertexShader = shader.vertexShader.replace(
                "#include <worldpos_vertex>",
                `#include <worldpos_vertex>\nvWorldPos = worldPosition.xyz;`,
            );
        }

        // ── Fragment: declare DHL uniforms + blend ──
        if (!shader.fragmentShader.includes("DHL_UNIFORMS_DECLARED")) {
            if (!shader.fragmentShader.includes("varying vec3 vWorldPos;")) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    `#include <common>\nvarying vec3 vWorldPos;\n${FRAGMENT_DHL_PREAMBLE}`,
                );
            } else {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    `#include <common>\n${FRAGMENT_DHL_PREAMBLE}`,
                );
            }

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <dithering_fragment>",
                `${FRAGMENT_DHL_BLEND}\n#include <dithering_fragment>`,
            );
        }
    };

    material.needsUpdate = true;
}

/**
 * Remove DHL injection from material.
 * Resets onBeforeCompile chain entirely.
 */
export function removeDhlInjection(material: THREE.MeshStandardMaterial): void {
    if (!material.userData[DHL_INJECTED_KEY]) return;

    delete material.userData[DHL_INJECTED_KEY];
    delete material.userData[DHL_UNIFORMS_KEY];

    material.onBeforeCompile = () => { };
    material.customProgramCacheKey = () => "";
    material.needsUpdate = true;
}
