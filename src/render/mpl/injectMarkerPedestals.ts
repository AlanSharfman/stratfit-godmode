import * as THREE from "three";
import type { MplUniforms } from "./mplContracts";
import { MPL_INJECTED_KEY, MPL_UNIFORMS_KEY, MPL_MAX_MARKERS } from "./mplContracts";

/**
 * Create the uniform block for the Marker Pedestals Layer.
 */
export function createMplUniforms(): MplUniforms {
    return {
        uMplPositions: { value: new Float32Array(MPL_MAX_MARKERS * 3) },
        uMplColors: { value: new Float32Array(MPL_MAX_MARKERS * 4) },
        uMplCount: { value: 0 },
        uMplIntensity: { value: 0.55 },
        uMplRadius: { value: 14.0 },
        uMplLift: { value: 0.06 },
        uMplEnabled: { value: 1.0 },
    };
}

// ── Shader injection chunks ──

const VERTEX_PREAMBLE = /* glsl */ `
// MPL — Marker Pedestals vertex preamble
uniform float uMplPositions[${MPL_MAX_MARKERS * 3}];
uniform float uMplColors[${MPL_MAX_MARKERS * 4}];
uniform int uMplCount;
uniform float uMplRadius;
uniform float uMplLift;
uniform float uMplEnabled;
varying vec3 vMplWorldPos;
`;

const VERTEX_DISPLACE = /* glsl */ `
// MPL — subtle vertex lift around marker positions
vMplWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
if (uMplEnabled > 0.5) {
    float totalLift = 0.0;
    for (int i = 0; i < ${MPL_MAX_MARKERS}; i++) {
        if (i >= uMplCount) break;
        vec3 mp = vec3(uMplPositions[i*3], uMplPositions[i*3+1], uMplPositions[i*3+2]);
        float strength = uMplColors[i*4+3];
        float dx = vMplWorldPos.x - mp.x;
        float dz = vMplWorldPos.z - mp.z;
        float dist2 = dx * dx + dz * dz;
        float r2 = uMplRadius * uMplRadius;
        float att = exp(-dist2 / (r2 * 0.45));
        totalLift += att * strength * uMplLift;
    }
    transformed.y += totalLift;
}
`;

const FRAGMENT_PREAMBLE = /* glsl */ `
// MPL — Marker Pedestals fragment preamble
uniform float uMplPositions[${MPL_MAX_MARKERS * 3}];
uniform float uMplColors[${MPL_MAX_MARKERS * 4}];
uniform int uMplCount;
uniform float uMplIntensity;
uniform float uMplRadius;
uniform float uMplEnabled;
varying vec3 vMplWorldPos;
`;

const FRAGMENT_BLEND = /* glsl */ `
// MPL — Marker Pedestals: subtle terrain tint around markers
{
    if (uMplEnabled > 0.5) {
        for (int i = 0; i < ${MPL_MAX_MARKERS}; i++) {
            if (i >= uMplCount) break;
            vec3 mp = vec3(uMplPositions[i*3], uMplPositions[i*3+1], uMplPositions[i*3+2]);
            vec3 mc = vec3(uMplColors[i*4], uMplColors[i*4+1], uMplColors[i*4+2]);
            float strength = uMplColors[i*4+3];

            float dx = vMplWorldPos.x - mp.x;
            float dz = vMplWorldPos.z - mp.z;
            float dist2 = dx * dx + dz * dz;
            float r2 = uMplRadius * uMplRadius;

            // radial gaussian falloff
            float att = exp(-dist2 / (r2 * 0.45));

            // inner bright ring (subtle emissive boost)
            float ringDist = sqrt(dist2);
            float ringAtt = smoothstep(uMplRadius * 0.45, uMplRadius * 0.2, ringDist);

            float influence = att * strength * uMplIntensity;
            float ringInfluence = ringAtt * strength * uMplIntensity * 0.35;

            // Additive emissive tint
            gl_FragColor.rgb += mc * influence * 0.55;
            // Inner ring brightness
            gl_FragColor.rgb += mc * ringInfluence;
        }
    }
}
`;

/**
 * Inject MPL shader logic into a MeshStandardMaterial via onBeforeCompile.
 *
 * IDEMPOTENT: checks material.userData.__mplInjected guard.
 */
export function injectMarkerPedestals(
    material: THREE.MeshStandardMaterial,
    uniforms: MplUniforms,
): void {
    if (material.userData[MPL_INJECTED_KEY]) return;
    material.userData[MPL_INJECTED_KEY] = true;
    material.userData[MPL_UNIFORMS_KEY] = uniforms;

    const origCacheKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => {
        const base = origCacheKey ? origCacheKey() : "";
        return base + "_mpl_v1";
    };

    // Wrap existing onBeforeCompile (chain with RPF etc.)
    const prevHook = material.onBeforeCompile?.bind(material);

    material.onBeforeCompile = (shader, renderer) => {
        // Let previous hooks run first (RPF, CF, etc.)
        if (prevHook) prevHook(shader, renderer);

        // Merge uniforms
        for (const [key, uniform] of Object.entries(uniforms)) {
            shader.uniforms[key] = uniform;
        }

        // ── Vertex shader ──
        if (!shader.vertexShader.includes("vMplWorldPos")) {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                `#include <common>\n${VERTEX_PREAMBLE}`,
            );
            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                `#include <begin_vertex>\n${VERTEX_DISPLACE}`,
            );
        }

        // ── Fragment shader ──
        if (!shader.fragmentShader.includes("vMplWorldPos")) {
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <common>",
                `#include <common>\n${FRAGMENT_PREAMBLE}`,
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <dithering_fragment>",
                `${FRAGMENT_BLEND}\n#include <dithering_fragment>`,
            );
        }
    };

    material.needsUpdate = true;
}

/**
 * Remove MPL injection from a material.
 */
export function removeMplInjection(material: THREE.MeshStandardMaterial): void {
    if (!material.userData[MPL_INJECTED_KEY]) return;

    delete material.userData[MPL_INJECTED_KEY];
    delete material.userData[MPL_UNIFORMS_KEY];

    material.onBeforeCompile = () => { };
    material.customProgramCacheKey = () => "";
    material.needsUpdate = true;
}
