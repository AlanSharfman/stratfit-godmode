import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "@/paths/generatePath";
import { nodesToWorldXZ } from "@/paths/P50Path";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry } from "@/terrain/corridorTopology";
import {
    computeDivergenceSplines,
    generateBaselineDivergenceCurves,
    SDL_GHOST_CONFIG,
    SDL_COLORS,
} from "@/render/sdl";

/**
 * ScenarioDivergence — declarative R3F component.
 *
 * Renders two ghost corridor ribbons (optimistic + defensive)
 * using the same corridor spline engine (buildRibbonGeometry).
 *
 * Ghost materials: low opacity, desaturated, depthWrite=false.
 * No envelope geometry — flat ribbon paths only.
 *
 * Returns two <primitive> elements wrapping stable Mesh refs.
 */

export default function ScenarioDivergence({
    riskValues,
    enabled = true,
}: {
    riskValues: Float32Array;
    enabled?: boolean;
}) {
    const optMeshRef = useRef<THREE.Mesh | null>(null);
    const defMeshRef = useRef<THREE.Mesh | null>(null);

    // ── Derive P50 spine ──
    const { spineXZ, getHeightAt } = useMemo(() => {
        const seed = createSeed("baseline");
        const nodes = generateP50Nodes();
        const { points, getHeightAt: heightFn } = nodesToWorldXZ(nodes, seed);
        return { spineXZ: points, getHeightAt: heightFn };
    }, []);

    // ── Divergence curves from risk ──
    const divergenceCurves = useMemo(
        () => generateBaselineDivergenceCurves(riskValues, 256),
        [riskValues],
    );

    // ── Create meshes once (stable refs) ──
    if (!optMeshRef.current) {
        const geo = new THREE.BufferGeometry();
        const mat = new THREE.MeshStandardMaterial({
            color: SDL_COLORS.optimistic.color,
            emissive: SDL_COLORS.optimistic.emissive,
            emissiveIntensity: 0.3,
            metalness: 0.1,
            roughness: 0.5,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
        });
        optMeshRef.current = new THREE.Mesh(geo, mat);
        optMeshRef.current.name = "sdl-optimistic";
        optMeshRef.current.renderOrder = 8;
        optMeshRef.current.frustumCulled = false;
    }

    if (!defMeshRef.current) {
        const geo = new THREE.BufferGeometry();
        const mat = new THREE.MeshStandardMaterial({
            color: SDL_COLORS.defensive.color,
            emissive: SDL_COLORS.defensive.emissive,
            emissiveIntensity: 0.3,
            metalness: 0.1,
            roughness: 0.5,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
        });
        defMeshRef.current = new THREE.Mesh(geo, mat);
        defMeshRef.current.name = "sdl-defensive";
        defMeshRef.current.renderOrder = 8;
        defMeshRef.current.frustumCulled = false;
    }

    // ── Build divergence splines → ribbon geometry ──
    useEffect(() => {
        if (spineXZ.length < 2) return;

        const splines = computeDivergenceSplines(spineXZ, divergenceCurves);

        for (const spline of splines) {
            const mesh = spline.scenario === "optimistic" ? optMeshRef.current! : defMeshRef.current!;
            const result = buildRibbonGeometry(spline.controlPoints, getHeightAt, {
                ...SDL_GHOST_CONFIG,
            });
            mesh.geometry.dispose();
            mesh.geometry = result.geometry;
        }
    }, [spineXZ, getHeightAt, divergenceCurves]);

    // ── Toggle visibility ──
    useEffect(() => {
        if (optMeshRef.current) optMeshRef.current.visible = enabled;
        if (defMeshRef.current) defMeshRef.current.visible = enabled;
    }, [enabled]);

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            for (const ref of [optMeshRef, defMeshRef]) {
                const mesh = ref.current;
                if (!mesh) continue;
                mesh.geometry?.dispose();
                const mat = mesh.material;
                if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
                else (mat as THREE.Material)?.dispose();
            }
        };
    }, []);

    if (!enabled) return null;

    return (
        <>
            <primitive object={optMeshRef.current} />
            <primitive object={defMeshRef.current} />
        </>
    );
}
