import * as THREE from "three";

function createGlowMesh(curve: THREE.CatmullRomCurve3) {
    const geo = new THREE.TubeGeometry(curve, 120, 3.5, 8, false);

    const mat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    return new THREE.Mesh(geo, mat);
}

export default createGlowMesh;
