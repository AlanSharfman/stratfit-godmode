import * as THREE from "three";

export type TerrainSampler = (x: number, z: number) => number;

export interface TerrainPathOptions {
    samples?: number;
    halfWidth?: number;
    heightOffset?: number;
}

/**
 * Generates a terrain-anchored trajectory.
 * This is deterministic and works even if terrain sampler is simple.
 */
export function generateTerrainAnchoredPath(
    baseCurve: THREE.Curve<THREE.Vector3>,
    sampleHeight: TerrainSampler,
    options: TerrainPathOptions = {}
) {
    const samples = options.samples ?? 40;
    const offset = options.heightOffset ?? 0.25;

    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const p = baseCurve.getPoint(t);

        const terrainY = sampleHeight(p.x, p.z);

        points.push(new THREE.Vector3(p.x, terrainY + offset, p.z));
    }

    return points;
}

/**
 * Default sampler (flat plane fallback)
 * Replace later with real terrain sampling
 */
export const defaultTerrainSampler: TerrainSampler = (x, z) => {
    return 0;
};
