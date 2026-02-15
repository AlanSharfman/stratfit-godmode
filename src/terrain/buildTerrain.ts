import * as THREE from "three";
import { terrainHeight } from "./heightModel";
import { smoothHeightMap } from "./smooth";

export function buildTerrain(resolution: number, seed: number) {
    const size = resolution;
    const heights: number[] = [];

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = (x / (size - 1)) * 2 - 1;
            const v = (y / (size - 1)) * 2 - 1;
            const nx = (u + 1) / 2;
            const ny = (v + 1) / 2;
            heights.push(terrainHeight(nx, ny, seed));
        }
    }

    const smoothed = smoothHeightMap(heights, size, size, 2);

    const geo = new THREE.PlaneGeometry(560, 360, size - 1, size - 1);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, smoothed[i] * 60);
    }

    geo.computeVertexNormals();

    return geo;
}
