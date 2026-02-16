import React, { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { generateP50Nodes } from "@/paths/generatePath";
import { nodesToWorldXZ } from "@/paths/P50Path";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry } from "@/terrain/corridorTopology";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";

import {
    createMplUniforms,
    injectMarkerPedestals,
    removeMplInjection,
    MPL_MAX_MARKERS,
} from "@/render/mpl";
import type { MplUniforms } from "@/render/mpl";

import { deriveWorldStateMarkers, pickMarkerIndex, TYPE_RGB } from "./markerStrength";

/**
 * MarkerPedestals — shader-based terrain hotspots around semantic markers.
 *
 * Injects MPL shader logic into the terrain-surface material.
 * Each marker produces a subtle emissive tint + optional micro height lift.
 * Must be mounted inside <Canvas> as a child of TerrainStage.
 *
 * Non-negotiables:
 * - Shader-based only (no new geometry system)
 * - Max lift 0.06 (subtle emboss)
 * - Derives positions from worldState markers (baseline truth)
 * - No orange anywhere
 */
export default function MarkerPedestals({ enabled = true }: { enabled?: boolean }) {
    const { scene } = useThree();
    const { baseline } = useSystemBaseline();

    const uniformsRef = useRef<MplUniforms | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    const seed = useMemo(() => createSeed("baseline"), []);

    const { centerline, getHeightAt } = useMemo(() => {
        const nodes = generateP50Nodes();
        const { points, getHeightAt } = nodesToWorldXZ(nodes, seed);
        const { centerline } = buildRibbonGeometry(points, getHeightAt, {
            samples: 220,
            halfWidth: 0.55,
            widthSegments: 2,
            lift: 0,
            tension: 0.55,
        });
        return { centerline, getHeightAt };
    }, [seed]);

    const markers = useMemo(() => {
        const arr = baseline?.financial.arr ?? 0;
        const grossMarginPct = baseline?.financial.grossMarginPct ?? 0;
        const monthlyBurn = baseline?.financial.monthlyBurn ?? 0;
        const cash = baseline?.financial.cashOnHand ?? 0;
        const runwayMonths = monthlyBurn > 0 ? cash / monthlyBurn : 999;
        return deriveWorldStateMarkers({ runwayMonths, grossMarginPct, monthlyBurn, arr });
    }, [baseline]);

    // Compute world positions for each marker on the corridor centerline
    const markerWorldData = useMemo(() => {
        const samples = centerline.length;
        if (samples < 3) return [];

        return markers.slice(0, MPL_MAX_MARKERS).map((m) => {
            const idx = pickMarkerIndex(m, samples);
            const p = centerline[idx];
            const y = getHeightAt(p.x, p.z);
            const rgb = TYPE_RGB[m.type];
            return {
                x: p.x,
                y,
                z: p.z,
                r: rgb[0],
                g: rgb[1],
                b: rgb[2],
                strength: m.strength,
            };
        });
    }, [centerline, getHeightAt, markers]);

    // Inject shader into terrain material (once)
    useEffect(() => {
        let terrainMat: THREE.MeshStandardMaterial | null = null;

        scene.traverse((obj) => {
            if (terrainMat) return;
            if (obj instanceof THREE.Mesh && obj.name === "terrain-surface") {
                const mat = obj.material;
                if (mat instanceof THREE.MeshStandardMaterial) {
                    terrainMat = mat;
                }
            }
        });

        if (!terrainMat) {
            console.warn("[MPL] Terrain material not found — skipping injection");
            return;
        }

        const uniforms = createMplUniforms();
        uniforms.uMplEnabled.value = enabled ? 1.0 : 0.0;

        uniformsRef.current = uniforms;
        materialRef.current = terrainMat;

        injectMarkerPedestals(terrainMat, uniforms);

        return () => {
            if (materialRef.current) {
                removeMplInjection(materialRef.current);
            }
            uniformsRef.current = null;
            materialRef.current = null;
        };
    }, [scene]); // do NOT depend on enabled here (handled below)

    // Update enable/disable
    useEffect(() => {
        if (!uniformsRef.current) return;
        uniformsRef.current.uMplEnabled.value = enabled ? 1.0 : 0.0;
    }, [enabled]);

    // Update marker positions + colors when data changes
    useEffect(() => {
        if (!uniformsRef.current) return;

        const u = uniformsRef.current;
        const positions = u.uMplPositions.value;
        const colors = u.uMplColors.value;

        positions.fill(0);
        colors.fill(0);

        const count = Math.min(markerWorldData.length, MPL_MAX_MARKERS);
        for (let i = 0; i < count; i++) {
            const d = markerWorldData[i];
            positions[i * 3] = d.x;
            positions[i * 3 + 1] = d.y;
            positions[i * 3 + 2] = d.z;

            colors[i * 4] = d.r;
            colors[i * 4 + 1] = d.g;
            colors[i * 4 + 2] = d.b;
            colors[i * 4 + 3] = d.strength;
        }

        u.uMplCount.value = count;
    }, [markerWorldData]);

    return null;
}
