import React, { useMemo } from "react";
import * as THREE from "three";

type Props = {
  radius?: number;
  heightY?: number; // world Y position of the band
  thickness?: number; // world units
  color?: string;
  opacity?: number;
};

/**
 * HorizonGlow:
 * Thin additive ring around the world to create a clean horizon separation.
 * No fog, no postprocessing. Very controlled.
 */
export default function HorizonGlow({
  radius = 900,
  heightY = -6,
  thickness = 220,
  color = "#0ea5e9",
  opacity = 0.12,
}: Props) {
  const mat = useMemo(() => {
    const uniforms = {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    };

    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uOpacity;

        void main() {
          // Soft band: brightest at center, fades to edges
          float d = abs(vUv.y - 0.5) * 2.0;         // 0..1
          float a = smoothstep(1.0, 0.0, d);        // 1 in center
          a = pow(a, 2.2) * uOpacity;               // tighten
          gl_FragColor = vec4(uColor, a);
        }
      `,
    });
  }, [color, opacity]);

  return (
    <mesh
      frustumCulled={false}
      renderOrder={-998}
      position={[0, heightY, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      {/* A thin "disc" built from a plane + shader band via UV */}
      <ringGeometry args={[radius, radius + thickness, 128, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
