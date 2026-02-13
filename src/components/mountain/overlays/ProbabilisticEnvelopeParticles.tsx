import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

type Props = {
  enabled: boolean;
  // Provide a bounding box for where the cloud should live (around terrain)
  bounds: {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
  };
  // 0..1 confidence (1 = tight/clear, 0 = foggy/uncertain)
  confidence: number;
  // 0..1 overall risk (adds subtle red specks only when high)
  risk: number;
  count?: number;          // recommended 4500–9000 (adaptive later)
  opacity?: number;        // recommended 0.25–0.45
  proof?: boolean;         // proof mode: undeniably visible
};

export default function ProbabilisticEnvelopeParticles({
  enabled,
  bounds,
  confidence,
  risk,
  count: countProp = 6500,
  opacity: opacityProp = 0.34,
  proof = false,
}: Props) {
  // Proof mode overrides: higher density, opacity, tighter Y range
  const count = proof ? 12000 : countProp;
  const opacity = proof ? 0.55 : opacityProp;
  const points = useRef<THREE.Points>(null);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    const cyan = new THREE.Color("#37d7ea");
    const indigo = new THREE.Color("#6b63ff");
    const red = new THREE.Color("#c83a3a");

    for (let i = 0; i < count; i++) {
      const rx = THREE.MathUtils.lerp(bounds.minX, bounds.maxX, Math.random());
      const ry = THREE.MathUtils.lerp(bounds.minY, bounds.maxY, Math.random());
      const rz = THREE.MathUtils.lerp(bounds.minZ, bounds.maxZ, Math.random());

      positions[i * 3] = rx;
      positions[i * 3 + 1] = ry;
      positions[i * 3 + 2] = rz;

      // Color: mostly cyan/indigo, rare red specks when risk is high
      const t = Math.random();
      const c = cyan.clone().lerp(indigo, t * 0.55);

      const redChance = THREE.MathUtils.clamp((risk - 0.7) * 2.0, 0, 0.25);
      if (Math.random() < redChance * 0.12) c.lerp(red, 0.65);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      seeds[i] = Math.random() * 1000;
    }

    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [count, bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, bounds.minZ, bounds.maxZ, risk]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      uniforms: {
        uEnabled: { value: enabled ? 1 : 0 },
        uTime: { value: 0 },
        uOpacity: { value: opacity },
        uConfidence: { value: THREE.MathUtils.clamp(confidence, 0, 1) },
        uBaseSize: { value: proof ? 2.2 : 1.2 },
      },
      vertexShader: /* glsl */ `
        attribute float seed;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uConfidence;
        uniform float uBaseSize;

        void main(){
          vColor = color;

          vec3 p = position;

          // Confidence controls "tightness": low confidence = more drift
          float drift = (1.0 - uConfidence) * 0.06;

          // Drift in the terrain plane (X/Y). Z is height.
          p.x += sin(uTime * 0.35 + seed) * drift;
          p.y += cos(uTime * 0.28 + seed) * drift;

          // Very subtle vertical breathing (Z), never "snowfall"
          p.z += sin(uTime * 0.22 + seed * 2.0) * drift * 0.35;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          // Size attenuation: slightly bigger when uncertain
          float base = uBaseSize + (1.0 - uConfidence) * 2.5;
          gl_PointSize = base * (300.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec3 vColor;

        uniform int uEnabled;
        uniform float uOpacity;
        uniform float uConfidence;

        void main(){
          if(uEnabled == 0){
            discard;
          }

          // Soft round points
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = dot(uv, uv);
          float alpha = smoothstep(0.25, 0.0, d);

          // Confidence = clearer = less opaque
          float a = uOpacity * alpha * (0.55 + (1.0 - uConfidence) * 0.75);

          gl_FragColor = vec4(vColor, a);
        }
      `,
    });
  }, []);

  useMemo(() => {
    mat.uniforms.uEnabled.value = enabled ? 1 : 0;
    mat.uniforms.uOpacity.value = opacity;
    mat.uniforms.uConfidence.value = THREE.MathUtils.clamp(confidence, 0, 1);
    mat.uniforms.uBaseSize.value = proof ? 2.2 : 1.2;
  }, [enabled, opacity, confidence, proof, mat]);

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });

  return (
    <points ref={points} geometry={geom} material={mat} renderOrder={60} />
  );
}
