import * as THREE from "three";
import type { TrajectoryVector } from "@/types/trajectory";

/**
 * Extended TrajectoryVector with y coordinate after terrain projection.
 */
export type ProjectedTrajectoryVector = TrajectoryVector & { y: number };

/**
 * Projects TrajectoryVector[] → TrajectoryVector[] with y set once.
 * This is the deterministic projection layer - no per-frame raycasts.
 *
 * Architecture rule: One render pass only (no nested raycasts per frame).
 */
export function projectVectorsToTerrainOnce(
  vectors: TrajectoryVector[],
  terrainMesh: THREE.Mesh
): ProjectedTrajectoryVector[] {
  const raycaster = new THREE.Raycaster();
  const out: ProjectedTrajectoryVector[] = [];

  for (const v of vectors) {
    raycaster.set(new THREE.Vector3(v.x, 200, v.z), new THREE.Vector3(0, -1, 0));
    const hits = raycaster.intersectObject(terrainMesh);
    if (!hits.length) continue;

    const p = hits[0].point;
    out.push({ ...v, y: p.y + 0.18 });
  }

  return out;
}

/**
 * Checks if vectors have already been terrain-projected (have y values).
 */
export function areVectorsProjected(vectors: TrajectoryVector[]): boolean {
  if (!vectors.length) return false;
  return vectors.every(
    (v) => typeof (v as ProjectedTrajectoryVector).y === "number"
  );
}
