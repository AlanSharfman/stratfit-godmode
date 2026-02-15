import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import type { ProjectedTrajectoryVector } from "./trajectoryProjectionOnce";

/**
 * Monte Carlo simulation configuration
 */
export type MonteCarloConfig = {
  particleCount: number;
  spreadFactor: number;
  velocityScale: number;
  confidenceBias: number;
  riskAmplification: number;
};

const DEFAULT_CONFIG: MonteCarloConfig = {
  particleCount: 800,
  spreadFactor: 0.8,
  velocityScale: 0.02,
  confidenceBias: 0.5,
  riskAmplification: 1.2,
};

/**
 * MonteCarloParticleField renders a probabilistic particle cloud
 * around the trajectory path, visualizing uncertainty and variance.
 *
 * Features:
 * - Particles cluster around high-confidence areas
 * - Spread increases in uncertain/risky zones
 * - Dynamic flow along trajectory direction
 * - Color gradient: cyan (safe) → amber (risk)
 */
export default function MonteCarloParticleField({
  config = DEFAULT_CONFIG,
}: {
  config?: Partial<MonteCarloConfig>;
}) {
  const { baselineVectors, insights } = useTrajectoryStore();
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);

  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Generate initial particle positions based on trajectory
  const { positions, colors, count } = useMemo(() => {
    if (baselineVectors.length < 2) {
      return { positions: new Float32Array(0), colors: new Float32Array(0), count: 0 };
    }

    const projectedVectors = baselineVectors as ProjectedTrajectoryVector[];
    const particleCount = cfg.particleCount;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Initialize velocities for animation
    velocitiesRef.current = new Float32Array(particleCount * 3);

    // Build risk map from insights
    const riskMap = new Map<number, number>();
    for (const insight of insights) {
      const riskWeight = insight.impact === "high" ? 1.0 : insight.impact === "medium" ? 0.6 : 0.3;
      riskMap.set(insight.t, riskWeight * (1 - insight.confidence));
    }

    for (let i = 0; i < particleCount; i++) {
      // Sample along trajectory with random t
      const t = Math.random();
      const vecIndex = Math.floor(t * (projectedVectors.length - 1));
      const vec = projectedVectors[Math.min(vecIndex, projectedVectors.length - 1)];

      // Calculate local risk/uncertainty
      let localRisk = 0;
      for (const [rt, rw] of riskMap) {
        const dist = Math.abs(t - rt);
        if (dist < 0.15) {
          localRisk = Math.max(localRisk, rw * (1 - dist / 0.15));
        }
      }

      // Spread increases with risk
      const spread = cfg.spreadFactor * (0.3 + localRisk * cfg.riskAmplification);

      // Position with Gaussian-like spread
      const offsetX = (Math.random() - 0.5) * 2 * spread * gaussianNoise();
      const offsetY = Math.abs((Math.random() - 0.5) * spread * gaussianNoise() * 0.5);
      const offsetZ = (Math.random() - 0.5) * 2 * spread * gaussianNoise();

      const y = typeof vec.y === "number" ? vec.y : 0;

      positions[i * 3] = vec.x + offsetX;
      positions[i * 3 + 1] = y + offsetY + 0.1;
      positions[i * 3 + 2] = vec.z + offsetZ;

      // Color: cyan (safe) → amber (risk)
      const cyan = new THREE.Color(0x22d3ee);
      const amber = new THREE.Color(0xf59e0b);
      const blendedColor = cyan.clone().lerp(amber, localRisk);

      colors[i * 3] = blendedColor.r;
      colors[i * 3 + 1] = blendedColor.g;
      colors[i * 3 + 2] = blendedColor.b;

      // Initial velocities (flow along trajectory)
      if (velocitiesRef.current) {
        const nextVec = projectedVectors[Math.min(vecIndex + 1, projectedVectors.length - 1)];
        const dir = new THREE.Vector3(nextVec.x - vec.x, 0, nextVec.z - vec.z).normalize();
        velocitiesRef.current[i * 3] = dir.x * cfg.velocityScale * (0.5 + Math.random());
        velocitiesRef.current[i * 3 + 1] = (Math.random() - 0.5) * cfg.velocityScale * 0.3;
        velocitiesRef.current[i * 3 + 2] = dir.z * cfg.velocityScale * (0.5 + Math.random());
      }
    }

    return { positions, colors, count: particleCount };
  }, [baselineVectors, insights, cfg.particleCount, cfg.spreadFactor, cfg.riskAmplification, cfg.velocityScale]);

  // Animate particles
  useFrame((_, delta) => {
    if (!pointsRef.current || !velocitiesRef.current || count === 0) return;

    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const velocities = velocitiesRef.current;

    const projectedVectors = baselineVectors as ProjectedTrajectoryVector[];
    if (projectedVectors.length < 2) return;

    const bounds = {
      minX: Math.min(...projectedVectors.map((v) => v.x)) - 2,
      maxX: Math.max(...projectedVectors.map((v) => v.x)) + 2,
      minZ: Math.min(...projectedVectors.map((v) => v.z)) - 2,
      maxZ: Math.max(...projectedVectors.map((v) => v.z)) + 2,
    };

    for (let i = 0; i < count; i++) {
      // Update position
      posArray[i * 3] += velocities[i * 3] * delta * 60;
      posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta * 60;
      posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta * 60;

      // Respawn if out of bounds
      if (
        posArray[i * 3] < bounds.minX ||
        posArray[i * 3] > bounds.maxX ||
        posArray[i * 3 + 2] < bounds.minZ ||
        posArray[i * 3 + 2] > bounds.maxZ
      ) {
        // Respawn at start of trajectory
        const startVec = projectedVectors[0];
        const y = typeof startVec.y === "number" ? startVec.y : 0;
        posArray[i * 3] = startVec.x + (Math.random() - 0.5) * 0.5;
        posArray[i * 3 + 1] = y + 0.1 + Math.random() * 0.3;
        posArray[i * 3 + 2] = startVec.z + (Math.random() - 0.5) * 0.5;
      }

      // Subtle Y oscillation
      velocities[i * 3 + 1] += (Math.random() - 0.5) * 0.001;
      velocities[i * 3 + 1] *= 0.98; // damping
    }

    posAttr.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Box-Muller transform for Gaussian noise
 */
function gaussianNoise(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
