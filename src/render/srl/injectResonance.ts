import * as THREE from "three";
import type { SrlUniforms } from "./srlContracts";
import { SRL_INJECTED_KEY, SRL_UNIFORMS_KEY } from "./srlContracts";

/**
 * Create the SRL uniform block for injection into terrain material.
 */
export function createSrlUniforms(resonanceTexture: THREE.DataTexture | null): SrlUniforms {
    return {
        uResonanceTex: { value: resonanceTexture },
        uSrlIntensity: { value: 0.08 },   // extremely subtle
        uSrlWidth: { value: 24.0 },       // wide, atmospheric falloff
        uSrlEnabled: { value: 1.0 },
    };
}

// ── Shader chunks ──

const FRAGMENT_SRL_PREAMBLE = /* glsl */ `
#ifndef SRL_UNIFORMS_DECLARED
#define SRL_UNIFORMS_DECLARED
uniform sampler2D uResonanceTex;
uniform float uSrlIntensity;
uniform float uSrlWidth;
uniform float uSrlEnabled;
#endif
`;

const FRAGMENT_SRL_BLEND = /* glsl */ `
// ── SRL: Structural Resonance Layer ──
{
    if (uSrlEnabled > 0.5) {
        // Map world X to corridor parameter t [0..1]
        float srlT = clamp((vWorldPos.x + 220.0) / 440.0, 0.0, 1.0);

        // Distance from corridor centerline
        float srlDist = abs(vWorldPos.z);

        // Very wide Gaussian — atmospheric reach
        float srlFalloff = exp(-(srlDist * srlDist) / (uSrlWidth * uSrlWidth));

        // Sample resonance from 1D texture
        float resSample = texture2D(uResonanceTex, vec2(srlT, 0.5)).r;

        // Micro tonal shift: compress contrast toward mid-grey in resonant zones
        // This creates subtle "depth" without adding colour or glow
        float resInfluence = srlFalloff * resSample * uSrlIntensity;

        // Contrast compression: pull toward luminance midpoint
        float lum = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        vec3 midGrey = vec3(lum);

        // Blend fragment toward its own luminance — reduces local contrast
        // In high-resonance zones the terrain feels "denser", more loaded
        gl_FragColor.rgb = mix(gl_FragColor.rgb, midGrey, resInfluence);
    }
}
`;

/**
 * Inject SRL shader logic into terrain material via onBeforeCompile.
 *
 * COMPOSABLE: wraps existing onBeforeCompile chain (RPF → CF → TFL → DHL).
 * IDEMPOTENT: guards via material.userData[SRL_INJECTED_KEY].
 */
export function injectResonance(
    material: THREE.MeshStandardMaterial,
    uniforms: SrlUniforms,
): void {
    if (material.userData[SRL_INJECTED_KEY]) return;
    material.userData[SRL_INJECTED_KEY] = true;
    material.userData[SRL_UNIFORMS_KEY] = uniforms;

    const prevOnBeforeCompile = material.onBeforeCompile;

    const prevCacheKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => {
        const base = prevCacheKey ? prevCacheKey() : "";
        return base + "_srl_v1";
    };

    material.onBeforeCompile = (shader, renderer) => {
        // Run previous chain first
        if (prevOnBeforeCompile) {
            prevOnBeforeCompile.call(material, shader, renderer);
        }

        // Merge SRL uniforms
        for (const [key, uniform] of Object.entries(uniforms)) {
            shader.uniforms[key] = uniform;
        }

        // ── Vertex: ensure world position varying exists ──
        if (!shader.vertexShader.includes("varying vec3 vWorldPos;")) {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                `#include <common>\nvarying vec3 vWorldPos;\n`,
            );
            // CRITICAL FIX: Compute world position from transformed to avoid worldPosition dependency
            shader.vertexShader = shader.vertexShader.replace(
                "#include <worldpos_vertex>",
                `#include <worldpos_vertex>\nvec3 srlWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWorldPos = srlWorldPos;`,
            );
        }

        // ── Fragment: declare SRL uniforms + blend ──
        if (!shader.fragmentShader.includes("SRL_UNIFORMS_DECLARED")) {
            if (!shader.fragmentShader.includes("varying vec3 vWorldPos;")) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    `#include <common>\nvarying vec3 vWorldPos;\n${FRAGMENT_SRL_PREAMBLE}`,
                );
            } else {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    `#include <common>\n${FRAGMENT_SRL_PREAMBLE}`,
                );
            }

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <dithering_fragment>",
                `${FRAGMENT_SRL_BLEND}\n#include <dithering_fragment>`,
            );
        }
    };

    material.needsUpdate = true;
}

/**
 * Remove SRL injection from material.
 */
export function removeSrlInjection(material: THREE.MeshStandardMaterial): void {
    if (!material.userData[SRL_INJECTED_KEY]) return;

    delete material.userData[SRL_INJECTED_KEY];
    delete material.userData[SRL_UNIFORMS_KEY];

    material.onBeforeCompile = () => { };
    material.customProgramCacheKey = () => "";
    material.needsUpdate = true;
}
