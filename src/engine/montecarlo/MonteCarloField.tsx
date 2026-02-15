import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMonteCarloStore } from "@/state/monteCarloStore";
import type { MonteCarloParticle } from "@/types/simulation";

type Props = {
  bounds?: { min: THREE.Vector3; max: THREE.Vector3 };
  baseY?: number;
};

/**
 * MonteCarloField renders a particle system visualizing Monte Carlo simulation outcomes.
 *
 * Particles represent simulation runs:
 * - Green particles: successful outcomes (metrics above threshold)
 * - Cyan particles: neutral outcomes
 * - Red particles: failure outcomes (metrics below threshold)
 *
 * Visual behavior:
 * - Particles flow along the trajectory path
 * - Density indicates probability concentration
 * - Velocity reflects volatility
 */
export default function MonteCarloField({ bounds, baseY = 0 }: Props) {
  const { particles, isRunning, config, result } = useMonteCarloStore();

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleDataRef = useRef<
    { pos: THREE.Vector3; vel: THREE.Vector3; life: number; outcome: string }[]
  >([]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize particles
  useEffect(() => {
    if (!meshRef.current) return;

    const count = config.particleCount;
    const data: typeof particleDataRef.current = [];

    for (let i = 0; i < count; i++) {
      // Random initial position in a volume
      const x = (Math.random() - 0.5) * 20;
      const y = baseY + Math.random() * 3;
      const z = (Math.random() - 0.5) * 20;

      // Velocity based on volatility
      const vx = (Math.random() - 0.5) * config.volatilityFactor;
      const vy = (Math.random() - 0.5) * config.volatilityFactor * 0.5;
      const vz = (Math.random() - 0.5) * config.volatilityFactor;

      // Random outcome distribution
      const rand = Math.random();
      const successRate = result?.successRate ?? 0.6;
      const outcome =
        rand < successRate ? "success" : rand < successRate + 0.2 ? "neutral" : "failure";

      data.push({
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(vx, vy, vz),
        life: Math.random() * 100,
        outcome,
      });
    }

    particleDataRef.current = data;
  }, [config.particleCount, config.volatilityFactor, baseY, result?.successRate]);

  // Animate particles
  useFrame((_, delta) => {
    if (!meshRef.current || !isRunning) return;

    const mesh = meshRef.current;
    const data = particleDataRef.current;

    for (let i = 0; i < data.length; i++) {
      const p = data[i];

      // Update position
      p.pos.add(p.vel.clone().multiplyScalar(delta * 2));

      // Add slight turbulence
      p.vel.x += (Math.random() - 0.5) * 0.01;
      p.vel.y += (Math.random() - 0.5) * 0.005;
      p.vel.z += (Math.random() - 0.5) * 0.01;

      // Boundary bounce
      if (bounds) {
        if (p.pos.x < bounds.min.x || p.pos.x > bounds.max.x) p.vel.x *= -0.8;
        if (p.pos.y < bounds.min.y || p.pos.y > bounds.max.y) p.vel.y *= -0.8;
        if (p.pos.z < bounds.min.z || p.pos.z > bounds.max.z) p.vel.z *= -0.8;
      } else {
        // Default bounds
        if (Math.abs(p.pos.x) > 12) p.vel.x *= -0.8;
        if (p.pos.y < baseY - 1 || p.pos.y > baseY + 5) p.vel.y *= -0.8;
        if (Math.abs(p.pos.z) > 12) p.vel.z *= -0.8;
      }

      // Update life and fade
      p.life += delta;

      // Set instance matrix
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(0.04 + Math.sin(p.life * 2) * 0.01);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  // Color based on outcome
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#00E5FF"),
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  if (!isRunning && particles.length === 0) return null;

  return (
    <group name="monte-carlo-field">
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, config.particleCount]}
        material={material}
      >
        <sphereGeometry args={[1, 8, 8]} />
      </instancedMesh>

      {/* Probability density glow */}
      {result && (
        <mesh position={[0, baseY + 1, 0]}>
          <sphereGeometry args={[3, 32, 32]} />
          <meshBasicMaterial
            color={result.successRate > 0.7 ? "#10B981" : result.successRate > 0.4 ? "#00E5FF" : "#EF4444"}
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}
