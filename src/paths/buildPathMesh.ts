import * as THREE from "three";
import { varianceAt } from "./variance";

export interface PathMeshOptions {
    opacity?: number;
    widthMin?: number;
    widthMax?: number;
    depthFadeNear?: number;
    depthFadeFar?: number;
    edgeFeather?: number;
}

export function buildPathMesh(curve: THREE.CatmullRomCurve3, options: PathMeshOptions = {}) {
    const {
        opacity = 0.85,
        widthMin = 1,
        widthMax = 1,
        depthFadeNear = 140,
        depthFadeFar = 520,
        edgeFeather = 0.22
    } = options;
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
        metalness: 0.1,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });

    // Shader patch for depth fade and edge feathering
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uFadeNear = { value: depthFadeNear };
        shader.uniforms.uFadeFar = { value: depthFadeFar };
        shader.uniforms.uEdgeFeather = { value: edgeFeather };

        // inject varyings
        shader.vertexShader = shader.vertexShader
            .replace(
                `#include <common>`,
                `#include <common>
                 varying float vCamDist;
                 varying vec2 vUv2;`
            )
            .replace(
                `#include <uv_vertex>`,
                `#include <uv_vertex>
                 vUv2 = uv;`
            )
            .replace(
                `#include <project_vertex>`,
                `#include <project_vertex>
                 vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                 vCamDist = length(mvPos.xyz);`
            );

        shader.fragmentShader = shader.fragmentShader
            .replace(
                `#include <common>`,
                `#include <common>
                 uniform float uFadeNear;
                 uniform float uFadeFar;
                 uniform float uEdgeFeather;
                 varying float vCamDist;
                 varying vec2 vUv2;`
            )
            .replace(
                `#include <dithering_fragment>`,
                `
                // --- depth fade (near=1, far=0)
                float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, vCamDist);

                // --- edge feather across corridor width (uv.x in [0..1])
                float edge = smoothstep(0.0, uEdgeFeather, vUv2.x) *
                             smoothstep(0.0, uEdgeFeather, 1.0 - vUv2.x);

                // apply to alpha
                gl_FragColor.a *= (fade * edge);

                #include <dithering_fragment>
                `
            );
    };

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}
