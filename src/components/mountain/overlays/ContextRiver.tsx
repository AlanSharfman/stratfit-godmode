import React, { useMemo } from "react";
import * as THREE from "three";

type Vec3 = [number, number, number];

export type ContextRiverProps = {
  points: Vec3[];
  width?: number;
  lift?: number;
  opacity?: number;
};

export default function ContextRiver({ points, width = 0.9, lift = 0.06, opacity = 0.16 }: ContextRiverProps) {
  const geom = useMemo(() => {
    if (!points || points.length < 2) return null;

    const ctrl = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "centripetal", 0.25);

    const segments = 220;
    const halfW = width * 0.5;

    const positions = new Float32Array((segments + 1) * 2 * 3);
    const uvs = new Float32Array((segments + 1) * 2 * 2);

    const up = new THREE.Vector3(0, 0, 1);
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const n = new THREE.Vector3();

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      curve.getPointAt(t, p);
      curve.getTangentAt(t, tan);

      n.copy(up).cross(tan);
      if (n.lengthSq() < 1e-6) n.set(1, 0, 0);
      n.normalize();

      const left = p.clone().addScaledVector(n, halfW);
      const right = p.clone().addScaledVector(n, -halfW);
      left.z += lift;
      right.z += lift;

      const vBase = i * 2;
      positions[(vBase + 0) * 3 + 0] = left.x;
      positions[(vBase + 0) * 3 + 1] = left.y;
      positions[(vBase + 0) * 3 + 2] = left.z;
      positions[(vBase + 1) * 3 + 0] = right.x;
      positions[(vBase + 1) * 3 + 1] = right.y;
      positions[(vBase + 1) * 3 + 2] = right.z;

      uvs[(vBase + 0) * 2 + 0] = t;
      uvs[(vBase + 0) * 2 + 1] = 0;
      uvs[(vBase + 1) * 2 + 0] = t;
      uvs[(vBase + 1) * 2 + 1] = 1;
    }

    const indices: number[] = [];
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, c, b);
      indices.push(c, d, b);
    }

    const g = new THREE.BufferGeometry();
    g.setIndex(indices);
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    g.computeVertexNormals();
    return g;
  }, [points, width, lift]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uOpacity: { value: opacity },
        uCyan: { value: new THREE.Color("#37d7ea") },
        uIndigo: { value: new THREE.Color("#6b63ff") },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform float uOpacity;
        uniform vec3 uCyan;
        uniform vec3 uIndigo;

        float edgeFade(float v){
          float e = abs(v - 0.5) * 2.0;
          return smoothstep(1.0, 0.72, e);
        }

        void main(){
          float fade = edgeFade(vUv.y);
          // subtle streaking so it reads as flowing water (still static)
          float streak = 0.06 * sin(vUv.x * 160.0) * (0.55 + 0.45 * sin(vUv.y * 10.0));

          // bright core line (waterfall highlight)
          float core = smoothstep(0.22, 0.0, abs(vUv.y - 0.5));

          float shimmer = 0.04 * sin(vUv.x * 42.0) * sin(vUv.y * 12.0);
          vec3 col = mix(uIndigo, uCyan, 0.62 + shimmer + streak);
          col = mix(col, uCyan, core * 0.75);

          float a = uOpacity * fade;
          a += uOpacity * core * 0.28;
          gl_FragColor = vec4(col, a);
        }
      `,
    });
  }, []);

  useMemo(() => {
    (mat.uniforms.uOpacity.value as number) = opacity;
  }, [opacity, mat]);

  if (!geom) return null;
  return <mesh geometry={geom} material={mat} renderOrder={52} />;
}
