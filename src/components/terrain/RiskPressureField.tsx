import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createRiskTexture } from "@/render/rpf/createRiskTexture";
import {
    createRpfUniforms,
    injectRiskField,
    removeRpfInjection,
} from "@/render/rpf/injectRiskField";
import type { RpfUniforms } from "@/render/rpf/rpfContracts";

/**
 * RiskPressureField — declarative R3F component.
 *
 * Injects RPF shader logic into the terrain material (no new mesh).
 * Must be mounted inside a <Canvas> as a child of TerrainStage.
 *
 * Idempotent: will not re-inject on re-render or StrictMode double-invoke.
 * Returns null — renders nothing.
 */
export default function RiskPressureField({
    riskValues,
    enabled = true,
}: {
    riskValues: Float32Array;
    enabled?: boolean;
}) {
    const { scene } = useThree();
    const uniformsRef = useRef<RpfUniforms | null>(null);
    const textureRef = useRef<THREE.DataTexture | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    // ── Inject shader into terrain material (once) ──
    useEffect(() => {
        // Find terrain mesh by name
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
            console.warn("[RPF] Terrain material not found — skipping injection");
            return;
        }

        // Create texture + uniforms
        const tex = createRiskTexture(riskValues);
        textureRef.current = tex;

        const uniforms = createRpfUniforms(tex);
        uniforms.uRpfEnabled.value = enabled ? 1.0 : 0.0;
        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        // Inject (idempotent — guard on material.userData)
        injectRiskField(terrainMat, uniforms);

        // Cleanup: remove injection + dispose texture
        return () => {
            if (materialRef.current) {
                removeRpfInjection(materialRef.current);
            }
            textureRef.current?.dispose();
            textureRef.current = null;
            uniformsRef.current = null;
            materialRef.current = null;
        };
    }, [scene, riskValues]);

    // ── Toggle enable/disable (no shader recompile) ──
    useEffect(() => {
        if (!uniformsRef.current) return;
        uniformsRef.current.uRpfEnabled.value = enabled ? 1.0 : 0.0;
    }, [enabled]);

    // ── Animate time uniform (very slow drift — stops when disabled) ──
    useFrame((_, delta) => {
        if (!uniformsRef.current || !enabled) return;
        uniformsRef.current.uRpfTime.value += delta;
    });

    return null;
}
