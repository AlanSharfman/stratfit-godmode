import * as THREE from "three";
import { varianceAt } from "./variance";

export interface PathMeshOptions {
    opacity?: number;
    widthMin?: number;
    widthMax?: number;
}

export function buildPathMesh(curve: THREE.CatmullRomCurve3, options: PathMeshOptions = {}) {
    const { opacity = 0.85, widthMin = 1, widthMax = 1 } = options;
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
        const varianceScale = varianceAt(t);
        const baseRadius = widthMin + (widthMax - widthMin) * varianceScale;
        const scale = baseRadius;
        const dir = tmp.clone().normalize();
        const dist = tmp.length();
        tmp.copy(dir).multiplyScalar(dist * scale);
        pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }

    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        color: 0xcfe7ff,
        transparent: true,
        opacity,
        roughness: 0.6,
        metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}
