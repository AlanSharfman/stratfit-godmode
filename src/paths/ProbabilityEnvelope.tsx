import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { HeightSampler } from "@/terrain/corridorTopology";
import { useTerrainHeight } from "@/terrain/useTerrainHeight";
import { generateP50Spline } from "./generateP50Spline";

/**
 * Probability Envelope (P10–P90) corridor
 * - wide translucent lane around the P50 path
 * - soft edge fade, subtle pulse
 * - stays behind the path rail
 */

function makeEnvelopeRibbon(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  width: number,
  getHeightAt: HeightSampler,
  lift = 0.18
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPoint(t);

    // Gentle “corridor breathing” height (subtle, not wavy)
    const micro =
      Math.sin(t * Math.PI * 2.0) * 0.1 + Math.sin(t * Math.PI * 5.0) * 0.05;
    p.y = getHeightAt(p.x, p.z) + lift + micro;

    const tangent = curve.getTangent(t).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    if (binormal.lengthSq() < 1e-6) binormal.set(1, 0, 0);

    const left = p.clone().addScaledVector(binormal, -width * 0.5);
    const right = p.clone().addScaledVector(binormal, width * 0.5);

    positions.push(left.x, left.y, left.z);
    positions.push(right.x, right.y, right.z);

    uvs.push(0, t);
    uvs.push(1, t);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;

    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  geom.computeBoundingSphere();
  return geom;
}

function EnvelopeMaterial({
  baseOpacity = 0.18,
  pulse = 0.06,
}: {
  baseOpacity?: number;
  pulse?: number;
}) {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uBaseOpacity: { value: baseOpacity },
        uPulse: { value: pulse },
        uCore: { value: new THREE.Color(0x22d3ee) }, // cyan
        uHalo: { value: new THREE.Color(0x7dd3fc) }, // ice
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uBaseOpacity;
        uniform float uPulse;
        uniform vec3 uCore;
        uniform vec3 uHalo;

        float hash(vec2 p){
          p = fract(p*vec2(123.34, 456.21));
          p += dot(p, p+45.32);
          return fract(p.x*p.y);
        }

        void main(){
          float x = vUv.x;      // 0..1 across width
          float t = vUv.y;      // 0..1 along path

          // Edge falloff (strongly faded edges)
          float edge = smoothstep(0.06, 0.26, x) * (1.0 - smoothstep(0.74, 0.94, x));

          // Center emphasis
          float center = 1.0 - smoothstep(0.30, 0.55, abs(x - 0.5));

          // Subtle pulse (slow, controlled)
          float p = 0.5 + 0.5 * sin(uTime * 0.7 + t * 6.0);
          float pulse = mix(1.0 - uPulse, 1.0 + uPulse, p);

          // Micro noise to avoid “flat band”
          float n = hash(vec2(t * 220.0, x * 90.0 + uTime * 0.03));
          float shimmer = mix(0.92, 1.08, smoothstep(0.55, 1.0, n));

          vec3 col = mix(uHalo, uCore, center);
          float a = uBaseOpacity * edge * pulse * shimmer;

          // Clamp to keep it institutional
          a = clamp(a, 0.0, 0.26);

          gl_FragColor = vec4(col, a);
        }
      `,
    });
  }, [baseOpacity, pulse]);

  useFrame((_, delta) => {
    mat.uniforms.uTime.value += delta;
  });

  return <primitive object={mat} attach="material" />;
}

export default function ProbabilityEnvelope({
  scenarioId = "baseline",
  visible = true,
  width = 10.5,
  segments = 420,
}: {
  scenarioId?: string;
  visible?: boolean;
  width?: number;
  segments?: number;
}) {
  const heightFn = useTerrainHeight(scenarioId);
  const getHeightAt: HeightSampler = heightFn;

  const curve = useMemo(() => {
    return generateP50Spline(heightFn);
  }, [heightFn]);

  const geom = useMemo(() => {
    return makeEnvelopeRibbon(curve, segments, width, getHeightAt, 0.16);
  }, [curve, segments, width, getHeightAt]);

  useEffect(() => {
    return () => {
      geom?.dispose?.();
    };
  }, [geom]);

  if (!visible || !geom) return null;

  return (
    <mesh
      geometry={geom}
      renderOrder={44}
      frustumCulled={false}
      name={`prob-envelope-${scenarioId}`}
    >
      <EnvelopeMaterial baseOpacity={0.18} pulse={0.06} />
    </mesh>
  );
}
