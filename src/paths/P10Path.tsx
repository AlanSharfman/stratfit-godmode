import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry } from "@/terrain/corridorTopology";
import { nodesToWorldXZ } from "./P50Path";

// ── Material config (subtler than P50) ──
const PATH_COLOR = new THREE.Color(0xa8d8ea);
const PATH_EMISSIVE = new THREE.Color(0x6fc8e0);

/**
 * P10Path — lower-bound corridor (10th percentile, flat ribbon).
 * Stable mesh ref: mesh created ONCE, geometry updated on data change.
 */
export default function P10Path({
    scenarioId = "baseline",
    visible = true,
}: {
    scenarioId?: string;
    visible?: boolean;
}) {
    const meshRef = useRef<THREE.Mesh | null>(null);

    const seed = useMemo(() => createSeed(scenarioId), [scenarioId]);

    // Derive P10 nodes by offsetting P50 y coordinate downward
    const nodes = useMemo(() => {
        return generateP50Nodes().map(n => ({
            ...n,
            coord: {
                x: n.coord.x,
                y: Math.max(-1, n.coord.y - 0.18),
                z: n.coord.z,
            },
        }));
    }, []);

    const { points, getHeightAt } = useMemo(() => nodesToWorldXZ(nodes, seed), [nodes, seed]);

    // CREATE MESH ONCE
    if (!meshRef.current) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshStandardMaterial({
            color: PATH_COLOR,
            emissive: PATH_EMISSIVE,
            emissiveIntensity: 0.4,
            metalness: 0.2,
            roughness: 0.35,
            transparent: true,
            opacity: 0.5,
            depthWrite: true,
            depthTest: true,
            side: THREE.DoubleSide,
        });
        meshRef.current = new THREE.Mesh(geometry, material);
        meshRef.current.name = "p10-path";
        meshRef.current.userData.pathMesh = true;
        meshRef.current.renderOrder = 10;
        meshRef.current.frustumCulled = false;
    }

    // UPDATE GEOMETRY ONLY
    useEffect(() => {
        if (points.length < 2) return;
        console.log("[P10Path] Updating ribbon geometry (flat surface-following)");

        const result = buildRibbonGeometry(points, getHeightAt, {
            samples: 200,
            halfWidth: 2.0,
            widthSegments: 4,
            lift: 0.12,
            tension: 0.5,
        });

        const mesh = meshRef.current!;
        mesh.geometry.dispose();
        mesh.geometry = result.geometry;
    }, [points, getHeightAt]);

    if (!visible) return null;

    return <primitive object={meshRef.current} />;
}
