import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createVelocityTexture } from "@/render/tfl/createVelocityTexture";
import {
    createTflUniforms,
    injectTemporalFlow,
    removeTflInjection,
} from "@/render/tfl/injectTemporalFlow";
import type { TflUniforms } from "@/render/tfl/tflContracts";

/**
 * TemporalFlow — declarative R3F component.
 *
 * Injects temporal flow anisotropy shader into corridor material (no new mesh).
 * Composes with RPF → CF injection chain.
 *
 * Idempotent: guarded by material.userData.__tflInjected.
 * Returns null — renders nothing.
 */
export default function TemporalFlow({
    velocityValues,
    enabled = true,
}: {
    velocityValues: Float32Array;
    enabled?: boolean;
}) {
    const { scene } = useThree();
    const uniformsRef = useRef<TflUniforms | null>(null);
    const textureRef = useRef<THREE.DataTexture | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    // ── Inject shader into terrain material (once, composable with RPF → CF) ──
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
            console.warn("[TFL] Terrain material not found — skipping injection");
            return;
        }

        const tex = createVelocityTexture(velocityValues);
        textureRef.current = tex;

        const uniforms = createTflUniforms(tex);
        uniforms.uTflEnabled.value = enabled ? 1.0 : 0.0;
        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectTemporalFlow(terrainMat, uniforms);

        return () => {
            if (materialRef.current) {
                removeTflInjection(materialRef.current);
            }
            textureRef.current?.dispose();
            textureRef.current = null;
            uniformsRef.current = null;
            materialRef.current = null;
        };
    }, [scene, velocityValues]);

    // ── Toggle enable/disable (uniform only, no recompile) ──
    useEffect(() => {
        if (!uniformsRef.current) return;
        uniformsRef.current.uTflEnabled.value = enabled ? 1.0 : 0.0;
    }, [enabled]);

    // ── Animate time uniform (slow drift — stops when disabled) ──
    useFrame((_, delta) => {
        if (!uniformsRef.current || !enabled) return;
        uniformsRef.current.uTflTime.value += delta;
    });

    return null;
}
