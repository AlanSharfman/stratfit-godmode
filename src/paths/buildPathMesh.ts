import * as THREE from "three";
import { buildGridSnappedCorridorGeometry } from "@/terrain/corridorTopology";

export interface BuildPathMeshOptions {
    curve: THREE.CatmullRomCurve3;
    sampleHeight: (x: number, z: number) => number;
    resolution: number;
    width: number;
}

export function buildPathMesh(opts: BuildPathMeshOptions) {
    const geometry = buildGridSnappedCorridorGeometry(
        opts.curve,
        opts.sampleHeight,
        {
            resolution: opts.resolution,
            width: opts.width,
            bias: -0.015,
        }
    );

    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#66e0ff"),
        roughness: 0.5,
        metalness: 0.1,
        depthWrite: true,
        depthTest: true,
        transparent: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;

    return mesh;
}
