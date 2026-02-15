import * as THREE from "three";
import { varianceAt } from "./variance";
import { buildGridSnappedCorridorGeometry, type TerrainGridMeta } from "@/terrain/corridorTopology";

export interface PathMeshOptions {
    opacity?: number;
    widthMin?: number;
    widthMax?: number;
    depthFadeNear?: number;
    depthFadeFar?: number;
    edgeFeather?: number;
    useGridSnap?: boolean;
    gridMeta?: TerrainGridMeta;
    seed?: number;
}

export function buildPathMesh(curve: THREE.CatmullRomCurve3, options: PathMeshOptions = {}) {
    const {
        opacity = 0.85,
        widthMin = 1,
        widthMax = 1,
        depthFadeNear = 140,
        depthFadeFar = 520,
        edgeFeather = 0.22,
        useGridSnap = false,
        gridMeta,
        seed
    } = options;
    const segments = 140;
    const radiusSegments = 8;

    let geometry: THREE.BufferGeometry;

    if (useGridSnap && gridMeta && seed !== undefined) {
        // Use deterministic grid-snapped topology
        const widthFn = (t: number) => {
            const varianceScale = varianceAt(t);
            return widthMin + (widthMax - widthMin) * varianceScale;
        };
        geometry = buildGridSnappedCorridorGeometry(curve, gridMeta, seed, segments, radiusSegments, widthFn);
    } else {
        // DISABLED: TubeGeometry fallback — using corridor topology only
        throw new Error("TubeGeometry fallback disabled — using corridor topology only");
    }

    // FIXED: depth authority — corridor renders on top, ignores terrain depth
    const mat = new THREE.MeshStandardMaterial({
        color: 0xb8e7ff,
        emissive: 0x7fdcff,
        emissiveIntensity: 0.6,
        metalness: 0.2,
        roughness: 0.35,
        transparent: false,
        depthWrite: false,
        depthTest: false
    });

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.renderOrder = 1000;
    mesh.frustumCulled = false;

    return mesh;
}
