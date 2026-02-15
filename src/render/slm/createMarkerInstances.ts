import * as THREE from "three";
import type { LeveragePeak, MarkerInstanceData } from "./slmContracts";

/** Marker base scale — subtle, not dominant */
const BASE_SCALE = 2.2;

/** Vertical offset above terrain surface */
const MARKER_LIFT = 1.8;

/**
 * Convert leverage peaks into InstancedMesh transform matrices.
 * Each marker is positioned at the peak's world position,
 * lifted slightly above the terrain surface.
 *
 * Scale varies subtly with leverage score (higher score = slightly larger).
 */
export function createMarkerInstances(
    peaks: LeveragePeak[],
): MarkerInstanceData[] {
    const instances: MarkerInstanceData[] = [];

    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    for (let i = 0; i < peaks.length; i++) {
        const peak = peaks[i];
        const scale = BASE_SCALE * (0.7 + 0.3 * peak.score);

        pos.set(peak.position.x, peak.position.y + MARKER_LIFT, peak.position.z);
        quat.identity();
        scl.set(scale, scale, scale);

        const matrix = new THREE.Matrix4();
        matrix.compose(pos, quat, scl);

        instances.push({
            index: i,
            position: pos.clone(),
            scale,
            matrix,
        });
    }

    return instances;
}
