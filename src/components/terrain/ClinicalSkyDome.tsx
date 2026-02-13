import * as THREE from "three";
import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Calm/Clinical background gradient WITHOUT images.
 * We render an inverted sphere with a tiny shader gradient.
 */
export default function ClinicalSkyDome() {
  const { scene } = useThree();

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color("#050A12") },   // deep navy
        uMid: { value: new THREE.Color("#070D14") },   // charcoal
        uBottom: { value: new THREE.Color("#07161B") }, // subtle cyan fog base
      },
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uBottom;
        varying vec3 vWorld;

        void main() {
          // Normalized height in world space (approx)
          float h = clamp((vWorld.y + 10.0) / 40.0, 0.0, 1.0);

          // 2-step smooth gradient: bottom->mid->top
          float t1 = smoothstep(0.0, 0.45, h);
          float t2 = smoothstep(0.45, 1.0, h);

          vec3 c = mix(uBottom, uMid, t1);
          c = mix(c, uTop, t2);

          gl_FragColor = vec4(c, 1.0);
        }
      `,
    });

    return mat;
  }, []);

  // Optional: subtle fog for depth (clinical haze, not "weather")
  React.useEffect(() => {
    scene.fog = new THREE.FogExp2("#07141A", 0.03);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return (
    <mesh renderOrder={-1000}>
      <sphereGeometry args={[200, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
