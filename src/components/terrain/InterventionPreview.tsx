import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { generateP50Nodes } from "@/paths/generatePath";
import { nodesToWorldXZ } from "@/paths/p50Terrain";
import { createSeed } from "@/terrain/seed";
import { computeLeverageCurve, pickLeveragePeaks } from "@/render/slm";
import type { SpinePoint, LeveragePeak } from "@/render/slm";
import { computePreviewSpline } from "@/render/ipe";
import type { PreviewRequest } from "@/render/ipe";
import { buildRibbonGeometry } from "@/terrain/corridorTopology";
import { useIpeHoverStore } from "@/state/ipeHoverStore";

/**
 * InterventionPreview — declarative R3F component.
 *
 * Renders a ghost trajectory branch from hovered leverage markers.
 * Reuses the corridor spline system (buildRibbonGeometry) — no new geometry engine.
 *
 * Single ghost path at a time. Visually secondary (opacity 0.35, desaturated cyan).
 * Fade in/out via animated opacity uniform.
 *
 * Returns a <primitive> wrapping a single reused Mesh (no accumulation).
 */

const GHOST_COLOR = new THREE.Color(0x88c8d8);    // desaturated cyan
const GHOST_EMISSIVE = new THREE.Color(0x5a9aaa);
const FADE_SPEED = 4.0; // opacity units per second

export default function InterventionPreview({
    riskValues,
    enabled = true,
}: {
    riskValues: Float32Array;
    enabled?: boolean;
}) {
    const meshRef = useRef<THREE.Mesh | null>(null);
    const opacityRef = useRef(0);
    const targetOpacityRef = useRef(0);
    const activePeakRef = useRef(-1);

    // ── Derive spine + peaks from P50 corridor (same source) ──
    const { spine, peaks, getHeightAt } = useMemo(() => {
        const seed = createSeed("baseline");
        const nodes = generateP50Nodes();
        const { points, getHeightAt: heightFn } = nodesToWorldXZ(nodes, seed);

        const sp: SpinePoint[] = points.map((p, i) => ({
            position: new THREE.Vector3(p.x, heightFn(p.x, p.z), p.z),
            t: points.length > 1 ? i / (points.length - 1) : 0,
        }));

        const leverageCurve = computeLeverageCurve(sp, riskValues);
        const pk = pickLeveragePeaks(sp, leverageCurve, 5);

        return { spine: sp, peaks: pk, getHeightAt: heightFn };
    }, [riskValues]);

    // ── Create mesh once (stable ref, reuse geometry slot) ──
    if (!meshRef.current) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshStandardMaterial({
            color: GHOST_COLOR,
            emissive: GHOST_EMISSIVE,
            emissiveIntensity: 0.4,
            metalness: 0.1,
            roughness: 0.5,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
        });
        meshRef.current = new THREE.Mesh(geometry, material);
        meshRef.current.name = "ipe-ghost-path";
        meshRef.current.renderOrder = 12;
        meshRef.current.frustumCulled = false;
        meshRef.current.visible = false;
    }

    // ── React to hover state changes ──
    const hoveredPeakIndex = useIpeHoverStore((s) => s.hoveredPeakIndex);

    useEffect(() => {
        if (!enabled || hoveredPeakIndex < 0 || hoveredPeakIndex >= peaks.length) {
            // Fade out
            targetOpacityRef.current = 0;
            activePeakRef.current = -1;
            return;
        }

        const peak = peaks[hoveredPeakIndex];
        if (!peak) {
            targetOpacityRef.current = 0;
            activePeakRef.current = -1;
            return;
        }

        // Build preview spline from hovered peak
        const request: PreviewRequest = {
            peakIndex: hoveredPeakIndex,
            peakPosition: peak.position,
            peakT: peak.t,
            leverageScore: peak.score,
        };

        const previewPts = computePreviewSpline(request, spine, getHeightAt);
        if (previewPts.length < 2) {
            targetOpacityRef.current = 0;
            return;
        }

        // Build ribbon from preview spline using existing corridor builder
        const controlPts = previewPts.map((p) => ({ x: p.position.x, z: p.position.z }));
        const result = buildRibbonGeometry(controlPts, getHeightAt, {
            samples: 40,
            halfWidth: 2.0,
            widthSegments: 4,
            lift: 0.3,
            tension: 0.5,
        });

        // Swap geometry (dispose old)
        const mesh = meshRef.current!;
        mesh.geometry.dispose();
        mesh.geometry = result.geometry;

        activePeakRef.current = hoveredPeakIndex;
        targetOpacityRef.current = 0.35;
    }, [hoveredPeakIndex, enabled, peaks, spine, getHeightAt]);

    // ── Animate opacity fade in/out ──
    useFrame((_, delta) => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const target = targetOpacityRef.current;
        const current = opacityRef.current;

        if (Math.abs(current - target) < 0.01) {
            opacityRef.current = target;
        } else {
            opacityRef.current += (target - current) * Math.min(1, delta * FADE_SPEED);
        }

        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = opacityRef.current;
        mesh.visible = opacityRef.current > 0.01;
    });

    // ── Cleanup on unmount ──
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

    return <primitive object={meshRef.current} />;
}
