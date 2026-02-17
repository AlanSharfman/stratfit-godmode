import * as THREE from "three";

/**
 * Convert pixel size to world units at a given camera distance.
 * Perspective camera: correct conversion using FOV.
 * Orthographic camera: stable small scalar.
 */
export function worldUnitsPerPixel(
  camera: THREE.Camera,
  distance: number,
  viewportHeightPx: number
) {
  if (viewportHeightPx <= 0) return 0.001;

  if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = (cam.fov * Math.PI) / 180;
    const worldHeightAtDist = 2 * Math.tan(vFov / 2) * Math.max(0.0001, distance);
    return worldHeightAtDist / viewportHeightPx;
  }

  return 0.002;
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** Utility: accept many point shapes and normalize to Vector3 */
export function toV3(p: any): THREE.Vector3 | null {
  if (!p) return null;
  if (p.isVector3) return p as THREE.Vector3;
  if (Array.isArray(p) && p.length >= 3) return new THREE.Vector3(p[0], p[1], p[2]);
  if (typeof p.x === "number" && typeof p.y === "number" && typeof p.z === "number") {
    return new THREE.Vector3(p.x, p.y, p.z);
  }
  return null;
}
