import React, { useMemo } from "react";
import * as THREE from "three";

type Props = {
  radius?: number;
  top?: string; // near-zenith
  horizon?: string; // near-horizon
  bottom?: string; // below horizon / floor tint
  opacity?: number;
};

/**
 * AtmosphereDome (no fog):
 * - Big inverted sphere with a vertical gradient
 * - Adds depth without darkening far terrain
 * - No bloom dependency, no postprocessing required
 */
export default function AtmosphereDome({
  radius = 1200,
  top = "#05070b",
  horizon = "#071824",
  bottom = "#020407",
  opacity = 1.0,
}: Props) {
  const material = useMemo(() => {
    const uniforms = {
      uTop: { value: new THREE.Color(top) },
      uHorizon: { value: new THREE.Color(horizon) },
      uBottom: { value: new THREE.Color(bottom) },
      uOpacity: { value: opacity },
    };

    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      transparent: opacity < 1.0,
      uniforms,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uBottom;
        uniform float uOpacity;

        void main() {
          // normalize world Y to [-1..1]-ish; we want a smooth vertical ramp
          float y = clamp(normalize(vWorldPos).y, -1.0, 1.0);

          // Map y to 0..1
          float t = (y + 1.0) * 0.5;

          // Two-stage gradient: bottom->horizon, horizon->top
          vec3 col;
          if (t < 0.5) {
            float k = smoothstep(0.0, 0.5, t);
            col = mix(uBottom, uHorizon, k);
          } else {
            float k = smoothstep(0.5, 1.0, t);
            col = mix(uHorizon, uTop, k);
          }

          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    });
  }, [top, horizon, bottom, opacity]);

  return (
    <mesh frustumCulled={false} renderOrder={-999}>
      <sphereGeometry args={[radius, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
