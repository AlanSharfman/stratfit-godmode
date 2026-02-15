import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createStructureTexture } from "@/render/stm/createStructureTexture";
import {
    createStmUniforms,
    injectTopography,
    removeStmInjection,
} from "@/render/stm/injectTopography";
import type { StmUniforms } from "@/render/stm/stmContracts";

/**
 * StructuralTopography — declarative R3F component.
 *
 * Injects vertex shader displacement into terrain material (no new geometry).
 * Composes with RPF → CF → TFL → DHL → SRL injection chain.
 *
 * Effect: terrain subtly rises in structurally strong zones (high confidence,
 * low risk) and descends where structure is weak. The corridor visually
 * climbs and dips along the topographic surface.
 *
 * VERTEX DISPLACEMENT ONLY — no fragment modifications.
 * No geometry rebuild — GPU-side displacement via shader uniform.
 * Smooth: 5-tap box smooth on curve + Gaussian radial falloff + edge fade.
 *
 * Idempotent: guarded by material.userData.__stmInjected.
 * Returns null — renders nothing.
 */
export default function StructuralTopography({
    structureValues,
    enabled = true,
}: {
    structureValues: Float32Array;
    enabled?: boolean;
}) {
    const { scene } = useThree();
    const uniformsRef = useRef<StmUniforms | null>(null);
    const textureRef = useRef<THREE.DataTexture | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    // ── Inject vertex shader into terrain material (once, composable) ──
    useEffect(() => {
        let terrainMat: THREE.MeshStandardMaterial | null = null;
        scene.traverse((obj) => {
            if (terrainMat) return;
            if (
                obj instanceof THREE.Mesh &&
                obj.name === "terrain-surface"
            ) {
                const mat = obj.material;
                if (mat instanceof THREE.MeshStandardMaterial) {
                    terrainMat = mat;
                }
            }
        });

        if (!terrainMat) {
            console.warn("[STM] Terrain material not found — skipping injection");
            return;
        }

        const tex = createStructureTexture(structureValues);
        textureRef.current = tex;

        const uniforms = createStmUniforms(tex);
        uniforms.uStmEnabled.value = enabled ? 1.0 : 0.0;
        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectTopography(terrainMat, uniforms);

        return () => {
            if (materialRef.current) {
                removeStmInjection(materialRef.current);
            }
            textureRef.current?.dispose();
            textureRef.current = null;
            uniformsRef.current = null;
            materialRef.current = null;
        };
    }, [scene, structureValues]);

    // ── Toggle enable/disable (uniform only, no recompile) ──
    useEffect(() => {
        if (!uniformsRef.current) return;
        uniformsRef.current.uStmEnabled.value = enabled ? 1.0 : 0.0;
    }, [enabled]);

    return null;
}
