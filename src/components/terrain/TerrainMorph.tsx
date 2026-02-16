import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createMorphTextures } from "@/render/tme/morphController";
import {
    createTmeUniforms,
    injectMorphing,
    removeTmeInjection,
} from "@/render/tme/injectMorphing";
import type { TmeUniforms } from "@/render/tme/tmeContracts";
import { STM_UNIFORMS_KEY } from "@/render/stm/stmContracts";
import type { StmUniforms } from "@/render/stm/stmContracts";

/**
 * TerrainMorph — declarative R3F component.
 *
 * Injects vertex shader morphing into terrain material.
 * Smoothly interpolates between two structural states (A → B) via
 * `uMorphProgress` uniform. No geometry rebuild — GPU-side only.
 *
 * Composes with existing injection chain: RPF → CF → TFL → DHL → SRL → STM → TME.
 *
 * When enabled and morphProgress > 0, terrain vertices interpolate between
 * stateA and stateB structure textures. At morphProgress=0, terrain shows
 * stateA (identical to STM baseline). At morphProgress=1, terrain shows stateB.
 *
 * Idempotent: guarded by material.userData.__tmeInjected.
 * Returns null — renders nothing.
 */
export default function TerrainMorph({
    structureA,
    structureB,
    morphProgress = 0,
    enabled = true,
}: {
    structureA: Float32Array;
    structureB: Float32Array;
    morphProgress?: number;
    enabled?: boolean;
}) {
    const { scene } = useThree();
    const uniformsRef = useRef<TmeUniforms | null>(null);
    const texturesRef = useRef<[THREE.DataTexture, THREE.DataTexture] | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    // ── Inject vertex shader into terrain material (once, composable) ──
    useEffect(() => {
        let found: THREE.MeshStandardMaterial | null = null;
        scene.traverse((obj) => {
            if (found) return;
            if (
                obj instanceof THREE.Mesh &&
                obj.name === "terrain-surface"
            ) {
                const mat = obj.material;
                if (mat instanceof THREE.MeshStandardMaterial) {
                    found = mat;
                }
            }
        });

        if (!found) {
            console.warn("[TME] Terrain material not found — skipping injection");
            return;
        }
        const terrainMat: THREE.MeshStandardMaterial = found;

        const [texA, texB] = createMorphTextures(structureA, structureB);
        texturesRef.current = [texA, texB];

        const uniforms = createTmeUniforms(texA, texB);
        uniforms.uTmeEnabled.value = enabled ? 1.0 : 0.0;
        uniforms.uMorphProgress.value = morphProgress;
        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectMorphing(terrainMat, uniforms);

        // Disable STM when TME takes over — prevents double displacement
        const stmUniforms = terrainMat.userData[STM_UNIFORMS_KEY] as StmUniforms | undefined;
        if (stmUniforms && enabled) {
            stmUniforms.uStmEnabled.value = 0.0;
            stmUniforms.uTopoEnabled.value = 0.0;
        }

        return () => {
            // Re-enable STM when TME is removed
            if (materialRef.current) {
                const stm = materialRef.current.userData[STM_UNIFORMS_KEY] as StmUniforms | undefined;
                if (stm) {
                    stm.uStmEnabled.value = 1.0;
                    stm.uTopoEnabled.value = 1.0;
                }
                removeTmeInjection(materialRef.current);
            }
            texturesRef.current?.[0]?.dispose();
            texturesRef.current?.[1]?.dispose();
            texturesRef.current = null;
            uniformsRef.current = null;
            materialRef.current = null;
        };
    }, [scene, structureA, structureB, enabled]);

    // ── Toggle enabled state + STM handoff ──
    useEffect(() => {
        if (uniformsRef.current) {
            uniformsRef.current.uTmeEnabled.value = enabled ? 1.0 : 0.0;
        }
        // When TME is enabled, disable STM; when disabled, re-enable STM
        if (materialRef.current) {
            const stm = materialRef.current.userData[STM_UNIFORMS_KEY] as StmUniforms | undefined;
            if (stm) {
                stm.uStmEnabled.value = enabled ? 0.0 : 1.0;
                stm.uTopoEnabled.value = enabled ? 0.0 : 1.0;
            }
            materialRef.current.needsUpdate = true;
        }
    }, [enabled]);

    // ── Update morph progress ──
    useEffect(() => {
        if (uniformsRef.current) {
            uniformsRef.current.uMorphProgress.value = morphProgress;
        }
    }, [morphProgress]);

    return null;
}

