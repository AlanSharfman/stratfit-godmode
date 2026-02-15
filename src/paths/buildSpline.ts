import * as THREE from "three";

export function buildSpline(points: THREE.Vector3[]) {
    return new THREE.CatmullRomCurve3(points);
}
