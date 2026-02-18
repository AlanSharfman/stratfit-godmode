import React, { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useObjectiveLensStore } from "@/state/objectiveLensStore";
// Optional: if you want fog intensity tied to KPI risk later, uncomment.
// import { useKPIStore } from "@/state/kpiSelector";

function lensIntensity(lens: string) {
  // Strongest in survival, medium in liquidity, light in value
  if (lens === "survival") return 1.0;
  if (lens === "liquidity") return 0.55;
  return 0.28;
}

export default function RiskFog() {
  const lens = useObjectiveLensStore((s) => s.lens);
  // const risk = useKPIStore((s) => s.primary.risk); // 0..1 if you want
  const { scene } = useThree();

  const intensity = lensIntensity(lens);
  // If KPI-linked later: const intensity = lensIntensity(lens) * (0.55 + 0.9 * clamp01(risk));

  // 1) Scene fog (depth cohesion)
  // Keep subtle — this is “atmospheric grade”, not hiding the terrain.
  const fog = useMemo(() => {
    const f = new THREE.FogExp2(new THREE.Color("#07121a"), 0.01);
    return f;
  }, []);

  // Apply fog to scene, but keep density lens-aware
  React.useEffect(() => {
    const prev = scene.fog;
    scene.fog = fog;
    return () => {
      scene.fog = prev ?? null;
    };
  }, [scene, fog]);

  useFrame((_, dt) => {
    // density: value lens light, survival heavier
    const target = 0.0035 + intensity * 0.0065; // 0.0035..0.010
    fog.density = THREE.MathUtils.damp(fog.density, target, 3.0, dt);
  });

  // 2) Low fog sheet (soft volume)
  return <LowFogSheet intensity={intensity} />;
}

function LowFogSheet({ intensity }: { intensity: number }) {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uColor: { value: new THREE.Color("#0b1a24") }, // deep blue fog
        uEdge: { value: new THREE.Color("#0f2a3a") }, // slightly brighter
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
        uniform vec3 uEdge;

        // deterministic 2D noise
        float hash(vec2 p){
          p = fract(p*vec2(123.34, 456.21));
          p += dot(p, p+45.32);
          return fract(p.x*p.y);
        }

        float noise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0,0.0));
          float c = hash(i + vec2(0.0,1.0));
          float d = hash(i + vec2(1.0,1.0));
          vec2 u = f*f*(3.0-2.0*f);
          return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
        }

        void main() {
          // World-agnostic fog sheet: layered noise, slow drift
          vec2 uv = vUv;
          uv.y *= 1.6;

          float t = uTime * 0.035;

          float n1 = noise(uv * 6.0 + vec2(t, t*0.7));
          float n2 = noise(uv * 13.0 + vec2(-t*1.2, t*0.9));
          float n = mix(n1, n2, 0.55);

          // Stronger near center of sheet, softer at edges (no hard rectangle)
          float edgeFade =
            smoothstep(0.02, 0.18, vUv.x) *
            (1.0 - smoothstep(0.82, 0.98, vUv.x)) *
            smoothstep(0.02, 0.20, vUv.y) *
            (1.0 - smoothstep(0.78, 0.98, vUv.y));

          // Base alpha + noise modulation
          float a = (0.06 + 0.14 * n) * edgeFade * (0.35 + 0.85 * uIntensity);

          // Keep it institutional (never milky white)
          a = clamp(a, 0.0, 0.14);

          // Slight gradient: edges a touch brighter
          vec3 col = mix(uColor, uEdge, smoothstep(0.2, 0.9, n));

          gl_FragColor = vec4(col, a);
        }
      `,
    });
  }, []);

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uIntensity.value = intensity;
  });

  // Large plane hovering just above terrain “ground”
  // IMPORTANT: Terrain is rotated -PI/2 and shifted down; this is in world space.
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -9.0, 0]}
      frustumCulled={false}
      renderOrder={20}
    >
      <planeGeometry args={[560, 360, 1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
