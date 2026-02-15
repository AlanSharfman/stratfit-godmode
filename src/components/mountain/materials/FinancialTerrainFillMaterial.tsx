import * as THREE from "three";
import React, { useMemo } from "react";
import { useFrame } from "@react-three/fiber";

export type RiskPoint = { x: number; z: number; intensity: number }; // intensity 0..1

type Props = {
  riskPoints?: RiskPoint[];
  fillOpacity?: number; // 0..1 (recommended 0.14–0.22)
  baseColor?: string; // cyan-ish
  riskColor?: string; // deep red
  emissiveStrength?: number; // 0..2 (recommended 0.55–0.9)
  fogLift?: number; // 0..1 (subtle atmospheric lift)
};

export function useFinancialTerrainFillMaterial({
  riskPoints = [],
  fillOpacity = 0.18,
  baseColor = "#37d7ea", // cyan/ice
  riskColor = "#c83a3a", // deep red
  emissiveStrength = 0.75,
  fogLift = 0.08,
}: Props) {
  const material = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uFillOpacity: { value: fillOpacity },
      uBase: { value: new THREE.Color(baseColor) },
      uRisk: { value: new THREE.Color(riskColor) },
      uEmissive: { value: emissiveStrength },
      uFogLift: { value: fogLift },
      uRiskCount: { value: 0 },
      uRiskXZ: { value: new Float32Array(16) }, // up to 8 points (x,z pairs)
      uRiskI: { value: new Float32Array(8) }, // intensities
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        varying vec3 vN;
        void main() {
          vPos = position;
          vN = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;

        varying vec3 vPos;
        varying vec3 vN;

        uniform float uTime;
        uniform float uFillOpacity;
        uniform vec3  uBase;
        uniform vec3  uRisk;
        uniform float uEmissive;
        uniform float uFogLift;

        uniform int   uRiskCount;
        uniform float uRiskXZ[16];
        uniform float uRiskI[8];

        // Soft min glow around risk points in XZ
        float riskField(vec2 xz) {
          float f = 0.0;
          for (int i = 0; i < 8; i++) {
            if (i >= uRiskCount) break;
            vec2 p = vec2(uRiskXZ[i*2], uRiskXZ[i*2+1]);
            float d = length(xz - p);
            // 0.0–1.0 with smooth falloff; tuned for your scale
            float g = exp(-d * 0.9) * uRiskI[i];
            f = max(f, g);
          }
          return clamp(f, 0.0, 1.0);
        }

        void main() {
          // Slight view-dependent shading so fill feels "present" without becoming glossy
          vec3 n = normalize(vN);
          float facing = pow(clamp(n.y * 0.6 + 0.4, 0.0, 1.0), 1.4);

          // Base cyan fill (subtle)
          vec3 col = uBase * (0.55 + 0.45 * facing);

          // Risk subsurface glow (from within)
          float r = riskField(vPos.xz);

          // Make glow live "inside" the surface (not a sticker)
          float inner = pow(r, 1.35);
          col += uRisk * inner * uEmissive;

          // Tiny atmospheric lift so valleys don't die
          col = mix(col, col + vec3(uFogLift), 0.35);

          // Opacity: base fill + small bump where risk exists
          float a = uFillOpacity + inner * 0.10;

          // Clamp, keep it disciplined
          a = clamp(a, 0.0, 0.35);

          gl_FragColor = vec4(col, a);
        }
      `,
    });

    return mat;
  }, []);

  // keep uniforms synced + animate time if you want micro-life later (currently unused)
  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });

  // Update uniforms from props each render (safe & cheap)
  useMemo(() => {
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

    material.uniforms.uFillOpacity.value = fillOpacity;
    material.uniforms.uBase.value.set(baseColor);
    material.uniforms.uRisk.value.set(riskColor);
    material.uniforms.uEmissive.value = emissiveStrength;
    material.uniforms.uFogLift.value = fogLift;
  }, [riskPoints, fillOpacity, baseColor, riskColor, emissiveStrength, fogLift]);

  return material;
}
