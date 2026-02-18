import React, { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useObjectiveLensStore } from "@/state/objectiveLensStore";

type Pocket = {
  position: [number, number, number];
  radius: number;
};

function lensMultiplier(lens: string) {
  if (lens === "survival") return 1.0;
  if (lens === "liquidity") return 0.65;
  return 0.35;
}

export default function RiskFogPockets() {
  const lens = useObjectiveLensStore((s) => s.lens);

  // Example static pockets (replace later with real risk anchors)
  const pockets: Pocket[] = useMemo(
    () => [
      { position: [-40, -8.8, 20], radius: 18 },
      { position: [10, -8.7, -10], radius: 22 },
      { position: [50, -8.6, 40], radius: 16 },
    ],
    []
  );

  const multiplier = lensMultiplier(lens);

  return (
    <group renderOrder={25}>
      {pockets.map((p, i) => (
        <RiskPocket key={i} {...p} intensity={multiplier} />
      ))}
    </group>
  );
}

function RiskPocket({
  position,
  radius,
  intensity,
}: {
  position: [number, number, number];
  radius: number;
  intensity: number;
}) {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uColor: { value: new THREE.Color("#142533") },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uIntensity;
        uniform vec3 uColor;

        void main() {
          vec2 c = vUv - 0.5;
          float dist = length(c);

          // soft radial falloff
          float falloff = smoothstep(0.55, 0.0, dist);

          // subtle breathing
          float pulse = 0.85 + 0.15 * sin(uTime * 0.6);

          float alpha = falloff * 0.18 * uIntensity * pulse;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uIntensity.value = intensity;
  });

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      frustumCulled={false}
    >
      <circleGeometry args={[radius, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
