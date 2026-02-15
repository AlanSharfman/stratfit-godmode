import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createHeatTexture } from "@/render/dhl/createHeatTexture";
import {
    createDhlUniforms,
    injectDecisionHeat,
    removeDhlInjection,
} from "@/render/dhl/injectDecisionHeat";
import type { DhlUniforms } from "@/render/dhl/dhlContracts";

/**
 * DecisionHeat — declarative R3F component.
 *
 * Injects decision heat shader into terrain material (no new mesh).
 * Composes with RPF → CF → TFL injection chain.
 *
 * Subsurface warm zones along corridor — no glow, no additive pass.
 * Idempotent: guarded by material.userData.__dhlInjected.
 * Returns null — renders nothing.
 */
export default function DecisionHeat({
    heatValues,
    enabled = true,
}: {
    heatValues: Float32Array;
    enabled?: boolean;
}) {
    const { scene } = useThree();
    const uniformsRef = useRef<DhlUniforms | null>(null);
    const textureRef = useRef<THREE.DataTexture | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    // ── Inject shader into terrain material (once, composable) ──
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
            console.warn("[DHL] Terrain material not found — skipping injection");
            return;
        }

        const tex = createHeatTexture(heatValues);
        textureRef.current = tex;

        const uniforms = createDhlUniforms(tex);
        uniforms.uDhlEnabled.value = enabled ? 1.0 : 0.0;
        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectDecisionHeat(terrainMat, uniforms);

        return () => {
            if (materialRef.current) {
                removeDhlInjection(materialRef.current);
            }
            textureRef.current?.dispose();
            textureRef.current = null;
            uniformsRef.current = null;
            materialRef.current = null;
        };
    }, [scene, heatValues]);

    // ── Toggle enable/disable (uniform only, no recompile) ──
    useEffect(() => {
        if (!uniformsRef.current) return;
        uniformsRef.current.uDhlEnabled.value = enabled ? 1.0 : 0.0;
    }, [enabled]);

    return null;
}
