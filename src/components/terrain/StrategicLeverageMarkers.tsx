import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "@/paths/generatePath";
import { nodesToWorldXZ } from "@/paths/P50Path";
import { createSeed } from "@/terrain/seed";
import { computeLeverageCurve, pickLeveragePeaks, createMarkerInstances } from "@/render/slm";
import type { SpinePoint } from "@/render/slm";

/**
 * StrategicLeverageMarkers — declarative R3F component.
 *
 * Renders leverage peaks as instanced icosahedra along the P50 corridor.
 * Uses a SINGLE InstancedMesh with shared IcosahedronGeometry.
 *
 * Data derivation path (proves criteria 1):
 *   generateP50Nodes()  →  nodesToWorldXZ()  →  SpinePoint[]
 *   computeLeverageCurve(spine, riskValues)   →  Float32Array
 *   pickLeveragePeaks(spine, leverage, 5)     →  LeveragePeak[]  (max 7, minSep = totalDist/8)
 *   createMarkerInstances(peaks)              →  MarkerInstanceData[]  (Matrix4 transforms)
 *   InstancedMesh.setMatrixAt()
 *
 * No new corridor/path BufferGeometry. Only one IcosahedronGeometry (primitive, shared).
 * Deterministic: same riskValues → same marker placements every time.
 */

/** Hard cap — InstancedMesh pre-allocated count */
const MAX_MARKERS = 7;

const MARKER_COLOR = new THREE.Color(0xfbbf24);    // amber
const MARKER_EMISSIVE = new THREE.Color(0xf59e0b);

export default function StrategicLeverageMarkers({
    riskValues,
    enabled = true,
}: {
    riskValues: Float32Array;
    enabled?: boolean;
}) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // ── Derive spine from P50 corridor (same source as P50Path) ──
    const spine = useMemo<SpinePoint[]>(() => {
        const seed = createSeed("baseline");
        const nodes = generateP50Nodes();
        const { points, getHeightAt } = nodesToWorldXZ(nodes, seed);

        return points.map((p, i) => ({
            position: new THREE.Vector3(p.x, getHeightAt(p.x, p.z), p.z),
            t: points.length > 1 ? i / (points.length - 1) : 0,
        }));
    }, []);

    // ── Compute leverage peaks → instance transforms (deterministic) ──
    const instances = useMemo(() => {
        if (spine.length < 3) return [];
        const leverageCurve = computeLeverageCurve(spine, riskValues);
        const peaks = pickLeveragePeaks(spine, leverageCurve, 5);
        return createMarkerInstances(peaks);
    }, [spine, riskValues]);

    // ── Apply matrices to InstancedMesh ──
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || instances.length === 0) return;

        // Zero out all slots first (prevents stale instances on count decrease)
        const identity = new THREE.Matrix4();
        identity.makeScale(0, 0, 0);
        for (let i = 0; i < MAX_MARKERS; i++) {
            mesh.setMatrixAt(i, identity);
        }

        // Set active markers
        for (let i = 0; i < instances.length; i++) {
            mesh.setMatrixAt(i, instances[i].matrix);
        }

        mesh.count = instances.length;
        mesh.instanceMatrix.needsUpdate = true;
    }, [instances]);

    // ── Cleanup: dispose geometry + material on unmount ──
    useEffect(() => {
        return () => {
            const mesh = meshRef.current;
            if (!mesh) return;
            mesh.geometry?.dispose();
            const mat = mesh.material;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else (mat as THREE.Material)?.dispose();
        };
    }, []);

    // Toggle: visible=false hides without unmount (no material accumulation)
    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined!, undefined!, MAX_MARKERS]}
            visible={enabled && instances.length > 0}
            frustumCulled={false}
            renderOrder={15}
        >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
                color={MARKER_COLOR}
                emissive={MARKER_EMISSIVE}
                emissiveIntensity={0.5}
                metalness={0.3}
                roughness={0.4}
                transparent
                opacity={0.85}
            />
        </instancedMesh>
    );
}
