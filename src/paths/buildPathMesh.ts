import * as THREE from "three";

export function buildPathMesh(curve: THREE.CatmullRomCurve3) {
    const tube = new THREE.TubeGeometry(curve, 120, 1.2, 8, false);

    const mat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.85
    });

    return new THREE.Mesh(tube, mat);
}
