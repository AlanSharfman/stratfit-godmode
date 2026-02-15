import * as THREE from "three";
import { varianceAt } from "./variance";

export function buildPathMesh(curve: THREE.CatmullRomCurve3) {
    const segments = 140;
    const radiusSegments = 8;

    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
        points.push(curve.getPoint(i / segments));
    }

    const geometry = new THREE.TubeGeometry(curve, segments, 1, radiusSegments, false);

    // scale radius per segment using variance
    const pos = geometry.attributes.position;
    const tmp = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
        tmp.fromBufferAttribute(pos, i);
        const t = Math.floor(i / (radiusSegments + 1)) / segments;
        const scale = 1 + varianceAt(t) * 0.8;
        const dir = tmp.clone().normalize();
        const dist = tmp.length();
        tmp.copy(dir).multiplyScalar(dist * scale);
        pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }

    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        color: 0xcfe7ff,
        transparent: true,
        opacity: 0.85,
        roughness: 0.6,
        metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}
