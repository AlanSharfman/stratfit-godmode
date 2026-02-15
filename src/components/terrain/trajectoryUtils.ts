import * as THREE from "three";

/**
 * Projects a path of 3D points onto the terrain surface.
 * Uses raycasting from above to find terrain intersection points.
 *
 * @param points - Array of Vector3 points to project
 * @param terrainMesh - The terrain mesh to project onto
 * @param offsetY - Height offset above terrain surface (default: 0.15)
 * @returns Array of projected Vector3 points sitting above the terrain
 */
export function projectPathToTerrain(
  points: THREE.Vector3[],
  terrainMesh: THREE.Mesh,
  offsetY = 0.15
): THREE.Vector3[] {
  const raycaster = new THREE.Raycaster();
  const projected: THREE.Vector3[] = [];
  const downDirection = new THREE.Vector3(0, -1, 0);

  points.forEach((p) => {
    raycaster.set(new THREE.Vector3(p.x, 500, p.z), downDirection);
    const intersects = raycaster.intersectObject(terrainMesh);
    if (intersects.length > 0) {
      const hit = intersects[0].point.clone();
      hit.y += offsetY;
      projected.push(hit);
    }
  });

  return projected;
}

/**
 * Samples points along a CatmullRom curve at even intervals.
 *
 * @param curve - The curve to sample
 * @param numSamples - Number of samples to take (default: 200)
 * @returns Array of Vector3 points along the curve
 */
export function sampleCurve(
  curve: THREE.CatmullRomCurve3,
  numSamples = 200
): THREE.Vector3[] {
  return curve.getPoints(numSamples);
}

/**
 * Gets a point along the curve at a normalized position (0-1).
 *
 * @param curve - The curve to sample
 * @param t - Normalized position along curve (0 = start, 1 = end)
 * @returns Vector3 point at the given position
 */
export function getPointAtPosition(
  curve: THREE.CatmullRomCurve3,
  t: number
): THREE.Vector3 {
  return curve.getPointAt(Math.max(0, Math.min(1, t)));
}

/**
 * Converts trajectory points to Vector3 array for curve generation.
 *
 * @param points - Array of trajectory points with x, z coordinates
 * @returns Array of Vector3 with y = 0 (to be projected later)
 */
export function trajectoryPointsToVector3(
  points: Array<{ x: number; z: number }>
): THREE.Vector3[] {
  return points.map((p) => new THREE.Vector3(p.x, 0, p.z));
}
