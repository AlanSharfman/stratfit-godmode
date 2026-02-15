import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createResonanceTexture } from "@/render/srl/createResonanceTexture";
import {
    createSrlUniforms,
    injectResonance,
    removeSrlInjection,
} from "@/render/srl/injectResonance";
import type { SrlUniforms } from "@/render/srl/srlContracts";

/**
 * StructuralResonance — declarative R3F component.
 *
 * Injects micro tonal resonance shader into terrain material (no new mesh).
 * Composes with RPF → CF → TFL → DHL injection chain.
 *
 * Effect: subtle contrast compression in high-resonance zones —
 * terrain feels "denser" where multiple semantic signals converge.
 * Extremely subtle — imperceptible when toggled quickly.
 *
 * Idempotent: guarded by material.userData.__srlInjected.
 * Returns null — renders nothing.
 */
export default function StructuralResonance({
    resonanceValues,
    enabled = true,
}: {
    resonanceValues: Float32Array;
    enabled?: boolean;
}) {
    const { scene } = useThree();
    const uniformsRef = useRef<SrlUniforms | null>(null);
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
            console.warn("[SRL] Terrain material not found — skipping injection");
            return;
        }

        const tex = createResonanceTexture(resonanceValues);
        textureRef.current = tex;

        const uniforms = createSrlUniforms(tex);
        uniforms.uSrlEnabled.value = enabled ? 1.0 : 0.0;
        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectResonance(terrainMat, uniforms);

        return () => {
            if (materialRef.current) {
                removeSrlInjection(materialRef.current);
            }
            textureRef.current?.dispose();
            textureRef.current = null;
            uniformsRef.current = null;
            materialRef.current = null;
        };
    }, [scene, resonanceValues]);

    // ── Toggle enable/disable (uniform only, no recompile) ──
    useEffect(() => {
        if (!uniformsRef.current) return;
        uniformsRef.current.uSrlEnabled.value = enabled ? 1.0 : 0.0;
    }, [enabled]);

    return null;
}
