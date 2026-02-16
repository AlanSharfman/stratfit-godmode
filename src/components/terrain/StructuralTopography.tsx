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
import { devlog, devwarn } from "@/lib/devlog";

const TOPO_SCALE = 24.0;
const TOPO_WIDTH = 70.0;

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

        const t = clamp01((x + 220.0) / 440.0);
        const dist = Math.abs(y);
        const falloff = Math.exp(-(dist * dist) / (TOPO_WIDTH * TOPO_WIDTH));
        const structure = sampleCurve(structureValues, t);
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

function restoreGeometry(geometry: THREE.BufferGeometry, originalZ: Float32Array) {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, originalZ[i]);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
}

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

    useEffect(() => {
        setStmStructureCurve(structureValues);

        let terrainMesh: THREE.Mesh | null = null;
        let terrainMat: THREE.MeshStandardMaterial | null = null;

        scene.traverse((obj) => {
            if (terrainMesh) return;
            if (obj instanceof THREE.Mesh && obj.name === "terrain-surface") {
                terrainMesh = obj;
                if (obj.material instanceof THREE.MeshStandardMaterial) {
                    terrainMat = obj.material;
                }
            }
        });

        if (!terrainMesh || !terrainMat) {
            devwarn("[STM] Terrain mesh/material not found — skipping");
            return;
        }

        const geo = (terrainMesh as THREE.Mesh).geometry as THREE.BufferGeometry;

        devlog("[STM] Applying CPU displacement", {
            len: structureValues.length,
            min: Math.min(...structureValues),
            max: Math.max(...structureValues),
        });

        const scale = enabled ? TOPO_SCALE : 0;
        const origZ = applyGeometryDisplacement(geo, structureValues, scale);
        originalZRef.current = origZ;
        geometryRef.current = geo;

        devlog("[STM] CPU displacement scale:", scale);

        const tex = createStructureTexture(structureValues);
        textureRef.current = tex;

        const uniforms = createStmUniforms(tex);
        uniforms.uTopoEnabled.value = 0.0;
        uniforms.uStmEnabled.value = 0.0;

        setStmEnabled(enabled);
        setStmTopoScale(TOPO_SCALE);
        setStmTopoWidth(TOPO_WIDTH);

        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectTopography(terrainMat, uniforms);

        return () => {
            if (geometryRef.current && originalZRef.current) {
                restoreGeometry(geometryRef.current, originalZRef.current);
            }
            if (materialRef.current) removeStmInjection(materialRef.current);

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

    useEffect(() => {
        if (!geometryRef.current || !originalZRef.current) return;

        restoreGeometry(geometryRef.current, originalZRef.current);

        if (enabled) {
            const origZ = applyGeometryDisplacement(
                geometryRef.current,
                structureValues,
                TOPO_SCALE
            );
            originalZRef.current = origZ;
        }

        setStmEnabled(enabled);
    }, [enabled, structureValues]);

    return null;
}
