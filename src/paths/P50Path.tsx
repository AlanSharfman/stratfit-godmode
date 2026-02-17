import * as THREE from "three";

/**
 * Canonical P50 trajectory path
 * This is a deterministic placeholder until terrain-anchored
 * sampling is applied.
 */

export type PathPoint = {
    id: string;
    position: THREE.Vector3;
    label?: string;
};

export function generateP50Path(): PathPoint[] {
    // simple forward progression curve
    const points: PathPoint[] = [];

    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-40, 0, -20),
        new THREE.Vector3(-20, 5, 0),
        new THREE.Vector3(0, 10, 20),
        new THREE.Vector3(20, 6, 40),
        new THREE.Vector3(40, 8, 60),
    ]);

    const samples = 20;

    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const pos = curve.getPoint(t);
        points.push({
            id: `p50-${i}`,
            position: pos,
            label: i === samples ? "Target" : undefined,
        });
    }

    return points;
}

export const P50Path = generateP50Path();
