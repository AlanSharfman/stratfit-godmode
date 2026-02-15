import * as THREE from "three";

/**
 * Deterministic corridor topology builder
 * Now embeds vertices along terrain normals (derived from heightfield)
 */

export type TerrainSampler = (x: number, z: number) => number;

export interface CorridorTopologyOptions {
    resolution: number;
    width: number;
    bias?: number;
}

export function buildGridSnappedCorridorGeometry(
    curve: THREE.CatmullRomCurve3,
    sampleHeight: TerrainSampler,
    opts: CorridorTopologyOptions
) {
    const { resolution, width, bias = -0.015 } = opts;

    const segments = 180;
    const pts = curve.getSpacedPoints(segments);

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const step = 1 / resolution;

    function sampleNormal(x: number, z: number) {
        const eps = step;

        const hL = sampleHeight(x - eps, z);
        const hR = sampleHeight(x + eps, z);
        const hD = sampleHeight(x, z - eps);
        const hU = sampleHeight(x, z + eps);

        const normal = new THREE.Vector3(
            hL - hR,
            2 * eps,
            hD - hU
        ).normalize();

        return normal;
    }

    for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        const gridX = Math.round(p.x / step) * step;
        const gridZ = Math.round(p.z / step) * step;

        const h = sampleHeight(gridX, gridZ);
        const normal = sampleNormal(gridX, gridZ);

        const basePos = new THREE.Vector3(gridX, h, gridZ);
        const embedded = basePos.clone().add(normal.clone().multiplyScalar(bias));

        positions.push(embedded.x, embedded.y, embedded.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(i / pts.length, 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    return geometry;
}
