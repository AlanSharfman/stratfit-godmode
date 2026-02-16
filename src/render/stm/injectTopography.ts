import * as THREE from "three";
import type { StmUniforms } from "./stmContracts";
import { STM_INJECTED_KEY, STM_UNIFORMS_KEY } from "./stmContracts";
import { terrainHeightMode } from "@/config/featureFlags";

let FALLBACK_STRUCTURE_TEX: THREE.DataTexture | null = null;

function getFallbackStructureTexture(): THREE.DataTexture {
    if (FALLBACK_STRUCTURE_TEX) return FALLBACK_STRUCTURE_TEX;
    const data = new Uint8Array([0, 0, 0, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    FALLBACK_STRUCTURE_TEX = tex;
    return tex;
}

/**
 * Create the STM uniform block for injection into terrain material.
 * When terrainHeightMode is "neutral", uTopoScale is 0 (no vertex displacement)
 * but the texture + injection chain remain intact so semantic overlays still work.
 */
export function createStmUniforms(structureTexture: THREE.DataTexture | null): StmUniforms {
    return {
        // Phase 14B: texture uniform must never be null.
        uStructureTex: { value: structureTexture ?? getFallbackStructureTexture() },
        // Phase 14B: moderate displacement (visible but not extreme).
        // Original "active" was 14.0; 8.0 gives clear structural relief.
        // terrainHeightMode gating remains only for the legacy base-height mesh;
        // STM displacement is controlled via uTopoEnabled/uStmEnabled.
        uTopoScale: { value: 8.0 },
        uTopoWidth: { value: 70.0 },      // wide Gaussian falloff from corridor center
        // Phase 14B naming: uTopoEnabled requested by spec.
        uTopoEnabled: { value: 1.0 },
        // Back-compat alias: some code still toggles uStmEnabled.
        uStmEnabled: { value: 1.0 },
        // Debug force: set to 1.0 to guarantee visible mountain (proves axis + injection path)
        uTopoDebugForce: { value: 0.0 },
    };
}

// ── Shader chunks ──

const VERTEX_STM_PREAMBLE = /* glsl */ `
#ifndef STM_UNIFORMS_DECLARED
#define STM_UNIFORMS_DECLARED
uniform sampler2D uStructureTex;
uniform float uTopoScale;
uniform float uTopoWidth;
uniform float uTopoEnabled;
uniform float uStmEnabled;
uniform float uTopoDebugForce;

float saturate(float x) { return clamp(x, 0.0, 1.0); }

// Expands mid-tones (unlike pow(x, >1) which crushes them)
float contrastExpand(float x) {
    x = saturate(x);
    // smoothstep expands mid values and keeps endpoints stable
    return smoothstep(0.10, 0.90, x);
}
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
    if ((uTopoEnabled > 0.5) && (uStmEnabled > 0.5)) {
        // Compute world position deterministically from the 'transformed' local vertex
        vec3 stmWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;

        // Map local X to corridor parameter t [0..1]
        // Corridor spans X: -220 → +220 in local (and world) space
        float stmT = clamp((transformed.x + 220.0) / 440.0, 0.0, 1.0);

        // Distance from corridor centerline (local Y ≈ 0)
        float stmDist = abs(transformed.y);

        // Wide Gaussian falloff — structure propagates outward from corridor
        float stmFalloff = exp(-(stmDist * stmDist) / (uTopoWidth * uTopoWidth));

        // Sample structure from 1D texture (vertex shader texture fetch)
        float structure = texture2D(uStructureTex, vec2(stmT, 0.5)).r;

        // Smooth edge fade to prevent popping (stable smoothstep order)
        float edgeIn = smoothstep(0.0, 0.08, stmT);
        float edgeOut = 1.0 - smoothstep(0.92, 1.0, stmT);
        float edgeFade = edgeIn * edgeOut;

        // --- STM DISPLACEMENT (VISUAL-TRUTHFUL) ---
        float dispRaw = structure * stmFalloff * edgeFade;
        
        // Normalize to [0..1] domain safely (structure is already 0..1 from texture.r)
        dispRaw = saturate(dispRaw);
        
        // Expand mid-tones so relief is visible across the field (avoids "only one hump")
        float disp = contrastExpand(dispRaw);
        
        // Scale by uTopoScale (remove 3x amplification - tune at uniform source instead)
        disp *= uTopoScale;
        
        // Safety clamp (prevents exploded triangles if future inputs spike)
        disp = clamp(disp, 0.0, uTopoScale * 1.25);
        
        // Debug force: guarantees a mountain if you set uTopoDebugForce = 1
        // Useful to prove axis + injection path beyond any doubt
        disp = mix(disp, uTopoScale * 0.75, saturate(uTopoDebugForce));
        
        // Apply displacement along local Z (maps to world-up Y after mesh rotation)
        transformed.z += disp;
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
        return base + "_stm_v2";
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

        // DIAGNOSTIC: Log uniform value
        console.log("[STM SHADER] uTopoScale:", shader.uniforms.uTopoScale?.value);

        // ── Vertex: declare STM uniforms ──
        if (!shader.vertexShader.includes("STM_UNIFORMS_DECLARED")) {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                `#include <common>\n${VERTEX_STM_PREAMBLE}`,
            );

            // CRITICAL FIX: Inject displacement after worldpos_vertex to ensure worldPosition is available
            shader.vertexShader = shader.vertexShader.replace(
                "#include <worldpos_vertex>",
                `#include <worldpos_vertex>\n${VERTEX_STM_DISPLACE}`,
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

