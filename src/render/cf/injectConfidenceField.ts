import * as THREE from "three";
import type { CfUniforms } from "./cfContracts";
import { CF_INJECTED_KEY, CF_UNIFORMS_KEY } from "./cfContracts";

// ── CF colours (institutional, atmospheric) ──
const DEFAULT_HIGH_COLOR = new THREE.Vector3(0.38, 0.75, 0.78); // confident cyan
const DEFAULT_LOW_COLOR = new THREE.Vector3(0.32, 0.33, 0.38);  // desaturated grey

/**
 * Create the CF uniform block.
 */
export function createCfUniforms(confTexture: THREE.DataTexture | null): CfUniforms {
    return {
        uConfCurveTex: { value: confTexture },
        uCfIntensity: { value: 0.45 },
        uCfWidth: { value: 22.0 },
        uCfHighColor: { value: DEFAULT_HIGH_COLOR.clone() },
        uCfLowColor: { value: DEFAULT_LOW_COLOR.clone() },
        uCfEnabled: { value: 1.0 },
    };
}

// ── Shader chunks ──
// NOTE: We do NOT redeclare vRpfWorldPos — RPF already declares it.
// CF uses the same varying. If RPF is not injected first, the varying
// won't exist, so we declare it conditionally using a preprocessor guard.

const FRAGMENT_CF_PREAMBLE = /* glsl */ `
#ifndef CF_UNIFORMS_DECLARED
#define CF_UNIFORMS_DECLARED
uniform sampler2D uConfCurveTex;
uniform float uCfIntensity;
uniform float uCfWidth;
uniform vec3 uCfHighColor;
uniform vec3 uCfLowColor;
uniform float uCfEnabled;
#endif
`;

const FRAGMENT_CF_BLEND = /* glsl */ `
// ── CF: Confidence Field ──
{
    if (uCfEnabled > 0.5) {
        // Map world X to corridor parameter t [0..1]
        float cfCorridorT = clamp((vWorldPos.x + 220.0) / 440.0, 0.0, 1.0);

        // Distance from corridor centerline (Z ≈ 0)
        float cfDist = abs(vWorldPos.z);

        // Wider, softer falloff than RPF
        float cfFalloff = exp(-(cfDist * cfDist) / (uCfWidth * uCfWidth));

        // Sample confidence from 1D texture
        float confSample = texture2D(uConfCurveTex, vec2(cfCorridorT, 0.5)).r;

        // Tint: high confidence = cyan, low = grey/desaturated
        vec3 cfTint = mix(uCfLowColor, uCfHighColor, confSample);

        // Influence: subtle atmospheric tint near corridor
        float cfInfluence = cfFalloff * confSample;

        // Blend: soft additive, restrained
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb + cfTint, cfInfluence * uCfIntensity);
    }
}
`;

/**
 * Inject CF shader logic into terrain material via onBeforeCompile.
 *
 * COMPOSABLE: wraps any existing onBeforeCompile (e.g. RPF) rather than replacing it.
 * IDEMPOTENT: guards via material.userData[CF_INJECTED_KEY].
 */
export function injectConfidenceField(
    material: THREE.MeshStandardMaterial,
    uniforms: CfUniforms,
): void {
    if (material.userData[CF_INJECTED_KEY]) return;
    material.userData[CF_INJECTED_KEY] = true;
    material.userData[CF_UNIFORMS_KEY] = uniforms;

    // Capture existing onBeforeCompile (RPF may have set one)
    const prevOnBeforeCompile = material.onBeforeCompile;

    // Capture and extend custom program cache key
    const prevCacheKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => {
        const base = prevCacheKey ? prevCacheKey() : "";
        return base + "_cf_v1";
    };

    material.onBeforeCompile = (shader, renderer) => {
        // Run previous injection first (RPF)
        if (prevOnBeforeCompile) {
            prevOnBeforeCompile.call(material, shader, renderer);
        }

        // Merge CF uniforms
        for (const [key, uniform] of Object.entries(uniforms)) {
            shader.uniforms[key] = uniform;
        }

        // ── Vertex: ensure world position varying exists ──
        // RPF declares vRpfWorldPos; CF uses vWorldPos as a separate name
        // to avoid collisions. We add it only if not already present.
        if (!shader.vertexShader.includes("varying vec3 vWorldPos;")) {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                `#include <common>\nvarying vec3 vWorldPos;\n`,
            );
            // CRITICAL FIX: Compute world position from transformed to avoid worldPosition dependency
            shader.vertexShader = shader.vertexShader.replace(
                "#include <worldpos_vertex>",
                `#include <worldpos_vertex>\nvec3 cfWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWorldPos = cfWorldPos;`,
            );
        }

        // ── Fragment: declare CF uniforms + blend ──
        if (!shader.fragmentShader.includes("CF_UNIFORMS_DECLARED")) {
            // Add varying if not already declared in fragment
            if (!shader.fragmentShader.includes("varying vec3 vWorldPos;")) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    `#include <common>\nvarying vec3 vWorldPos;\n${FRAGMENT_CF_PREAMBLE}`,
                );
            } else {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    `#include <common>\n${FRAGMENT_CF_PREAMBLE}`,
                );
            }

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <dithering_fragment>",
                `${FRAGMENT_CF_BLEND}\n#include <dithering_fragment>`,
            );
        }
    };

    material.needsUpdate = true;
}

/**
 * Remove CF injection from material. Restores previous onBeforeCompile if possible.
 */
export function removeCfInjection(material: THREE.MeshStandardMaterial): void {
    if (!material.userData[CF_INJECTED_KEY]) return;

    delete material.userData[CF_INJECTED_KEY];
    delete material.userData[CF_UNIFORMS_KEY];

    // We can't cleanly un-compose onBeforeCompile chains, so reset entirely.
    // If RPF is still active, it will re-inject on next compile.
    material.onBeforeCompile = () => { };
    material.customProgramCacheKey = () => "";
    material.needsUpdate = true;
}
