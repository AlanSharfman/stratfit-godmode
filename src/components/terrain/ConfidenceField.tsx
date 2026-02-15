import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createConfidenceTexture } from "@/render/cf/createConfidenceTexture";
import {
    createCfUniforms,
    injectConfidenceField,
    removeCfInjection,
} from "@/render/cf/injectConfidenceField";
import type { CfUniforms } from "@/render/cf/cfContracts";

/**
 * ConfidenceField — declarative R3F component.
 *
 * Injects confidence aura shader into the terrain material (no new mesh).
 * Composes with RPF injection (wraps existing onBeforeCompile).
 *
 * Idempotent: guarded by material.userData.__cfInjected.
 * Returns null — renders nothing.
 */
export default function ConfidenceField({
    confidenceValues,
    enabled = true,
}: {
    confidenceValues: Float32Array;
    enabled?: boolean;
}) {
    const { scene } = useThree();
    const uniformsRef = useRef<CfUniforms | null>(null);
    const textureRef = useRef<THREE.DataTexture | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    // ── Inject shader into terrain material (once, composable with RPF) ──
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
            console.warn("[CF] Terrain material not found — skipping injection");
            return;
        }

        const tex = createConfidenceTexture(confidenceValues);
        textureRef.current = tex;

        const uniforms = createCfUniforms(tex);
        uniforms.uCfEnabled.value = enabled ? 1.0 : 0.0;
        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectConfidenceField(terrainMat, uniforms);

        return () => {
            if (materialRef.current) {
                removeCfInjection(materialRef.current);
            }
            textureRef.current?.dispose();
            textureRef.current = null;
            uniformsRef.current = null;
            materialRef.current = null;
        };
    }, [scene, confidenceValues]);

    // ── Toggle enable/disable (uniform only, no recompile) ──
    useEffect(() => {
        if (!uniformsRef.current) return;
        uniformsRef.current.uCfEnabled.value = enabled ? 1.0 : 0.0;
    }, [enabled]);

    return null;
}
