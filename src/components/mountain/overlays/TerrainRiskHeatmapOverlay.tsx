import * as THREE from "three";
import React, { useMemo } from "react";
import { useFrame } from "@react-three/fiber";

export type RiskPoint = { x: number; z: number; intensity: number }; // 0..1

type Props = {
  geometry: THREE.BufferGeometry;     // SAME geometry as your terrain
  enabled: boolean;                  // Heatmap toggle
  riskPoints: RiskPoint[];           // risk epicenters in XZ
  opacity?: number;                  // recommended 0.22–0.32
  banding?: boolean;                 // contour bands on/off
  proof?: boolean;                   // proof mode: undeniably visible
};

export default function TerrainRiskHeatmapOverlay({
  geometry,
  enabled,
  riskPoints,
  opacity = 0.28,
  banding = true,
  proof = false,
}: Props) {
  const material = useMemo(() => {
    const uniforms = {
      uEnabled: { value: enabled ? 1 : 0 },
      uOpacity: { value: opacity },
      uTime: { value: 0 },

      // Palette discipline (no orange)
      uCyan: { value: new THREE.Color("#37d7ea") },   // stable
      uEmerald: { value: new THREE.Color("#29d49a") },// strengthening
      uIndigo: { value: new THREE.Color("#6b63ff") }, // strategic
      uRed: { value: new THREE.Color("#c83a3a") },    // stress

      uRiskCount: { value: 0 },
      uRiskXZ: { value: new Float32Array(16) }, // up to 8 points (x,z)
      uRiskI: { value: new Float32Array(8) },
      uBanding: { value: banding ? 1 : 0 },
      uStrength: { value: 1.0 }, // proof mode multiplier
    };

    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec3 vPos;

        uniform int uEnabled;
        uniform float uOpacity;
        uniform float uTime;

        uniform vec3 uCyan;
        uniform vec3 uEmerald;
        uniform vec3 uIndigo;
        uniform vec3 uRed;

        uniform int uRiskCount;
        uniform float uRiskXZ[16];
        uniform float uRiskI[8];
        uniform int uBanding;
        uniform float uStrength;

        // Terrain object-space plane is X/Y, with Z as height.
        float riskField(vec2 xy){
          float f = 0.0;
          for(int i=0;i<8;i++){
            if(i >= uRiskCount) break;
            vec2 p = vec2(uRiskXZ[i*2], uRiskXZ[i*2+1]);
            float d = length(xy - p);
            // Diffusion: exp falloff (tune 0.75–1.2 depending on your terrain scale)
            float g = exp(-d * 0.85) * uRiskI[i];
            f = max(f, g);
          }
          return clamp(f, 0.0, 1.0);
        }

        // Contour banding for "financial instrument" look (not game)
        float contour(float v){
          // bands at ~0.75/0.85/0.95 but smooth
          float b1 = smoothstep(0.72, 0.75, v) - smoothstep(0.75, 0.78, v);
          float b2 = smoothstep(0.82, 0.85, v) - smoothstep(0.85, 0.88, v);
          float b3 = smoothstep(0.92, 0.95, v) - smoothstep(0.95, 0.98, v);
          return clamp(b1*0.6 + b2*0.85 + b3*1.0, 0.0, 1.0);
        }

        void main() {
          if(uEnabled == 0){
            gl_FragColor = vec4(0.0);
            return;
          }

          float r = riskField(vPos.xy);

          // Risk color: cyan -> indigo (strategic volatility) -> red (stress)
          vec3 col = mix(uCyan, uIndigo, smoothstep(0.25, 0.70, r));
          col = mix(col, uRed, smoothstep(0.70, 0.98, r));

          // Keep it subtle (avoid "painted heatmap")
          float a = uOpacity * smoothstep(0.10, 0.95, r);

          // Optional contour rings
          if(uBanding == 1){
            float c = contour(r);
            // Contours brighter but thin
            col += vec3(0.12) * c;
            a = max(a, 0.10 * c);
          }

          // Slight shimmer only when visible (very subtle)
          float shimmer = 0.015 * sin(uTime * 1.2 + vPos.x * 1.8 + vPos.z * 1.3);
          col += vec3(shimmer) * smoothstep(0.2, 0.9, r);

          // Apply proof-mode strength multiplier
          a = a * uStrength;

          // clamp
          a = clamp(a, 0.0, 0.85);
          gl_FragColor = vec4(col, a);
        }
      `,
    });
  }, []);

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });

  // Update uniforms when inputs change
  useMemo(() => {
    material.uniforms.uEnabled.value = enabled ? 1 : 0;
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uBanding.value = banding ? 1 : 0;
    material.uniforms.uStrength.value = proof ? 2.25 : 1.0;

    const rp = riskPoints.slice(0, 8);
    material.uniforms.uRiskCount.value = rp.length;

    const xz = material.uniforms.uRiskXZ.value as Float32Array;
    const ii = material.uniforms.uRiskI.value as Float32Array;

    for (let i = 0; i < 8; i++) {
      xz[i * 2] = 0;
      xz[i * 2 + 1] = 0;
      ii[i] = 0;
    }
    rp.forEach((p, i) => {
      xz[i * 2] = p.x;
      xz[i * 2 + 1] = p.z;
      ii[i] = THREE.MathUtils.clamp(p.intensity, 0, 1);
    });
  }, [enabled, opacity, banding, riskPoints, proof]);

  return (
    <mesh geometry={geometry} material={material} renderOrder={50} />
  );
}
