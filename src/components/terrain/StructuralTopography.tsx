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
import { setStmEnabled, setStmStructureCurve, setStmTopoScale, setStmTopoWidth } from "@/render/stm/stmRuntime";

// ── CPU displacement constants ──

const TOPO_SCALE = 8.0;       // max displacement in local-space Z units
const TOPO_WIDTH = 70.0;      // Gaussian width from corridor centerline

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

function smoothstep01(edge0: number, edge1: number, x: number) {
    if (edge0 === edge1) return x < edge0 ? 0 : 1;
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

function sampleCurve(values: Float32Array, t: number) {
    const n = values.length;
    if (n <= 1) return n === 1 ? clamp01(values[0]) : 0;
    const ft = clamp01(t) * (n - 1);
    const i0 = Math.floor(ft);
    const i1 = Math.min(n - 1, i0 + 1);
    const f = ft - i0;
    return clamp01(values[i0] + (values[i1] - values[i0]) * f);
}

/**
 * Apply structure-curve displacement DIRECTLY to geometry vertex positions.
 * This affects both the solid and wireframe meshes (shared geometry).
 * Returns the originalZ array for cleanup.
 */
function applyGeometryDisplacement(
    geometry: THREE.BufferGeometry,
    structureValues: Float32Array,
    scale: number,
): Float32Array {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const count = pos.count;
    const originalZ = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        originalZ[i] = z;

        // Corridor parameter t [0..1] — plane X spans -280 to +280
        const t = clamp01((x + 220.0) / 440.0);

        // Distance from corridor centerline (plane Y ≈ 0)
        const dist = Math.abs(y);
        const falloff = Math.exp(-(dist * dist) / (TOPO_WIDTH * TOPO_WIDTH));

        // Sample structure
        const structure = sampleCurve(structureValues, t);

        // Edge fade
        const edgeIn = smoothstep01(0.0, 0.08, t);
        const edgeOut = 1.0 - smoothstep01(0.92, 1.0, t);

        const displacement = structure * falloff * edgeIn * edgeOut * scale;
        pos.setZ(i, z + displacement);
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    return originalZ;
}

/**
 * Restore original Z values on the geometry (cleanup).
 */
function restoreGeometry(geometry: THREE.BufferGeometry, originalZ: Float32Array) {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, originalZ[i]);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
}

/**
 * StructuralTopography — declarative R3F component.
 *
 * Applies CPU-side vertex displacement directly to the terrain geometry buffer.
 * Both solid and wireframe meshes share the same geometry so BOTH get elevation.
 *
 * Also injects shader uniforms into the terrain material (for fragment-layer
 * compatibility — RPF/CF/TFL/DHL/SRL/SHL chain reads uStmEnabled).
 *
 * Effect: terrain rises in structurally strong zones (high confidence,
 * low risk) and descends where structure is weak.
 *
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
    const originalZRef = useRef<Float32Array | null>(null);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);

    // ── Main effect: CPU displacement + shader injection ──
    useEffect(() => {
        setStmStructureCurve(structureValues);

        let terrainMesh: THREE.Mesh | null = null;
        let terrainMat: THREE.MeshStandardMaterial | null = null;

        scene.traverse((obj) => {
            if (terrainMesh) return;
            if (obj instanceof THREE.Mesh && obj.name === "terrain-surface") {
                terrainMesh = obj;
                const mat = obj.material;
                if (mat instanceof THREE.MeshStandardMaterial) {
                    terrainMat = mat;
                }
            }
        });

        if (!terrainMesh || !terrainMat) {
            console.warn("[STM] Terrain mesh/material not found — skipping");
            return;
        }

        const geo = (terrainMesh as THREE.Mesh).geometry as THREE.BufferGeometry;
        console.log("[AUDIT][STM] terrain-surface FOUND — applying CPU displacement");
        console.log("[AUDIT][STM] structureValues length:", structureValues.length,
            "min:", Math.min(...structureValues).toFixed(4),
            "max:", Math.max(...structureValues).toFixed(4));

        // ── 1. CPU geometry displacement (reliable, affects both meshes) ──
        const scale = enabled ? TOPO_SCALE : 0;
        const origZ = applyGeometryDisplacement(geo, structureValues, scale);
        originalZRef.current = origZ;
        geometryRef.current = geo;

        console.log("[AUDIT][STM] CPU displacement applied — scale:", scale);

        // ── 2. Shader injection (fragment-layer compat + uniform chain) ──
        const tex = createStructureTexture(structureValues);
        textureRef.current = tex;

        const uniforms = createStmUniforms(tex);
        // Disable shader-side vertex displacement — CPU handles it
        uniforms.uTopoEnabled.value = 0.0;
        uniforms.uStmEnabled.value = 0.0;
        setStmEnabled(enabled);
        setStmTopoScale(TOPO_SCALE);
        setStmTopoWidth(TOPO_WIDTH);
        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectTopography(terrainMat, uniforms);

        return () => {
            // Restore original geometry Z values
            if (geometryRef.current && originalZRef.current) {
                restoreGeometry(geometryRef.current, originalZRef.current);
            }
            if (materialRef.current) {
                removeStmInjection(materialRef.current);
            }
            textureRef.current?.dispose();
            textureRef.current = null;
            uniformsRef.current = null;
            materialRef.current = null;
            originalZRef.current = null;
            geometryRef.current = null;
            setStmEnabled(false);
            setStmStructureCurve(null);
        };
    }, [scene, structureValues]);

    // ── Toggle enable/disable — re-apply or remove displacement ──
    useEffect(() => {
        if (!geometryRef.current || !originalZRef.current) return;

        // Restore to baseline first
        restoreGeometry(geometryRef.current, originalZRef.current);

        if (enabled) {
            // Re-apply displacement
            const origZ = applyGeometryDisplacement(geometryRef.current, structureValues, TOPO_SCALE);
            originalZRef.current = origZ;
        }

        setStmEnabled(enabled);
    }, [enabled, structureValues]);

    return null;
}

