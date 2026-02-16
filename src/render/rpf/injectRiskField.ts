import * as THREE from "three";
import type { RpfUniforms } from "./rpfContracts";
import { RPF_INJECTED_KEY, RPF_UNIFORMS_KEY } from "./rpfContracts";

// ── Default RPF colours (institutional, restrained) ──
const DEFAULT_LOW_COLOR = new THREE.Vector3(0.176, 0.169, 0.333);   // deep indigo
const DEFAULT_HIGH_COLOR = new THREE.Vector3(0.42, 0.176, 0.176);   // restrained risk red

/**
 * Create the uniform block that will be injected into the terrain material.
 */
export function createRpfUniforms(riskTexture: THREE.DataTexture | null): RpfUniforms {
    return {
        uRiskCurveTex: { value: riskTexture },
        uRpfIntensity: { value: 0.65 },
        uRpfWidth: { value: 18.0 },
        uRpfLowColor: { value: DEFAULT_LOW_COLOR.clone() },
        uRpfHighColor: { value: DEFAULT_HIGH_COLOR.clone() },
        uRpfTime: { value: 0.0 },
        uRpfEnabled: { value: 1.0 },
    };
}

// ── Shader injection chunks ──

const VERTEX_PREAMBLE = /* glsl */ `
varying vec3 vRpfWorldPos;
`;

const FRAGMENT_PREAMBLE = /* glsl */ `
varying vec3 vRpfWorldPos;
uniform sampler2D uRiskCurveTex;
uniform float uRpfIntensity;
uniform float uRpfWidth;
uniform vec3 uRpfLowColor;
uniform vec3 uRpfHighColor;
uniform float uRpfTime;
uniform float uRpfEnabled;
`;

const FRAGMENT_RPF_BLEND = /* glsl */ `
// ── RPF: Risk Pressure Field ──
{
    if (uRpfEnabled > 0.5) {
        // Map world X to corridor parameter t [0..1]
        // P50 corridor runs X: -220 → +220 in world space
        float corridorT = clamp((vRpfWorldPos.x + 220.0) / 440.0, 0.0, 1.0);

        // Distance from corridor centerline (Z ≈ 0 in world space)
        float corridorDist = abs(vRpfWorldPos.z);

        // Gaussian falloff from corridor center
        float falloff = exp(-(corridorDist * corridorDist) / (uRpfWidth * uRpfWidth));

        // Sample risk intensity from 1D texture
        float riskSample = texture2D(uRiskCurveTex, vec2(corridorT, 0.5)).r;

        // Subtle temporal drift (very slow — no pulsing)
        float drift = sin(corridorT * 6.2831 + uRpfTime * 0.08) * 0.04 + 1.0;
        riskSample *= drift;

        // Compute influence
        float influence = falloff * riskSample;

        // Tint: blend from low (indigo) to high (red) based on risk
        vec3 tint = mix(uRpfLowColor, uRpfHighColor, riskSample);

        // Blend into fragment — additive tint, soft
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb + tint, influence * uRpfIntensity);
    }
}
`;

/**
 * Inject RPF shader logic into a MeshStandardMaterial via onBeforeCompile.
 *
 * IDEMPOTENT: checks material.userData.__rpfInjected guard.
 * Will not inject twice on the same material instance.
 */
export function injectRiskField(
    material: THREE.MeshStandardMaterial,
    uniforms: RpfUniforms,
): void {
    // ── Idempotency guard ──
    if (material.userData[RPF_INJECTED_KEY]) return;
    material.userData[RPF_INJECTED_KEY] = true;
    material.userData[RPF_UNIFORMS_KEY] = uniforms;

    // Force unique program cache key so Three.js compiles a new shader
    const origCacheKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => {
        const base = origCacheKey ? origCacheKey() : "";
        return base + "_rpf_v1";
    };

    material.onBeforeCompile = (shader) => {
        // Merge uniforms
        for (const [key, uniform] of Object.entries(uniforms)) {
            shader.uniforms[key] = uniform;
        }

        // ── Vertex shader: declare varying ──
        shader.vertexShader = shader.vertexShader.replace(
            "#include <common>",
            `#include <common>\n${VERTEX_PREAMBLE}`,
        );

        // ── Vertex shader: pass world position AFTER worldpos_vertex ──
        // CRITICAL FIX: worldPosition is only available AFTER #include <worldpos_vertex>
        shader.vertexShader = shader.vertexShader.replace(
            "#include <worldpos_vertex>",
            `#include <worldpos_vertex>\nvRpfWorldPos = worldPosition.xyz;`,
        );

        // ── Fragment shader: declare uniforms + blend ──
        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            `#include <common>\n${FRAGMENT_PREAMBLE}`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <dithering_fragment>",
            `${FRAGMENT_RPF_BLEND}\n#include <dithering_fragment>`,
        );
    };

    // Trigger shader recompilation
    material.needsUpdate = true;
}

/**
 * Remove RPF injection from a material.
 * Clears guard flag, resets onBeforeCompile, forces recompilation.
 */
export function removeRpfInjection(material: THREE.MeshStandardMaterial): void {
    if (!material.userData[RPF_INJECTED_KEY]) return;

    delete material.userData[RPF_INJECTED_KEY];
    delete material.userData[RPF_UNIFORMS_KEY];

    // Reset to no-op (clean material)
    material.onBeforeCompile = () => { };
    material.customProgramCacheKey = () => "";
    material.needsUpdate = true;
}
