import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * STRATFIT — Lava Divergence Layer (V1)
 * Minimal overlay that visually pulses terrain risk under divergence pressure.
 *
 * Usage:
 * <LavaDivergenceLayer intensity={lava?.overall ?? 0} />
 *
 * NOTE:
 * - No store reads here.
 * - Keep this purely presentational.
 */
export default function LavaDivergenceLayer(props: {
  intensity: number; // 0..1
  // optionally allow caller to position this above terrain
  y?: number;
}) {
  const intensity = Math.max(0, Math.min(1, props.intensity));
  const y = props.y ?? 0.06;

  const material = useMemo(() => {
    // Deterministic: same intensity = same material config
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.75, 0.05, 0.02), // deep lava red
      emissive: new THREE.Color(1.0, 0.15, 0.03),
      emissiveIntensity: 0.25 + intensity * 1.75,
      transparent: true,
      opacity: 0.02 + intensity * 0.22,
      roughness: 0.45,
      metalness: 0.0,
      depthWrite: false,
    });
    return mat;
  }, [intensity]);

  // Large plane; replace with terrain-following mesh in V2.
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]} material={material}>
      <planeGeometry args={[200, 200, 1, 1]} />
    </mesh>
  );
}
