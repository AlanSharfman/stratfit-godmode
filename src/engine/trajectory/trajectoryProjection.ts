import * as THREE from "three";

/**
 * Projects a path of 3D points onto the terrain surface using raycasting.
 *
 * NOTE: This should NOT be called per-frame. Use projectVectorsToTerrainOnce
 * for one-time projection when terrain or vectors change.
 *
 * @param vectors - Array of Vector3 points to project
 * @param terrainMesh - The terrain mesh to project onto
 * @returns Array of projected Vector3 points sitting above the terrain
 */
export function projectVectorsToTerrain(
  vectors: THREE.Vector3[],
  terrainMesh: THREE.Mesh
): THREE.Vector3[] {
  const raycaster = new THREE.Raycaster();
  const projected: THREE.Vector3[] = [];
  const downDirection = new THREE.Vector3(0, -1, 0);

  for (const v of vectors) {
    raycaster.set(new THREE.Vector3(v.x, 200, v.z), downDirection);
    const hits = raycaster.intersectObject(terrainMesh);

    if (hits.length) {
      const p = hits[0].point.clone();
      p.y += 0.18; // offset above terrain surface
      projected.push(p);
    }
  }

  return projected;
}
