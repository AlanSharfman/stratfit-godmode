import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/state/trajectoryStore";

/**
 * ProbabilityEnvelope creates a soft confidence band around the baseline path.
 *
 * This visualizes the uncertainty/confidence range of the projection.
 * Uses lightweight triangle strip geometry for performance.
 *
 * Premium aesthetic: subtle cyan with very low opacity (0.12).
 */
export default function ProbabilityEnvelope() {
  const { baselineVectors } = useTrajectoryStore();

  const geometry = useMemo(() => {
    if (baselineVectors.length < 2) return null;

    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < baselineVectors.length; i++) {
      const v = baselineVectors[i];
      const y = v.y ?? 0;

      // Variable spread for organic look
      const spread = 0.25 + Math.sin(i * 0.4) * 0.1;

      // Left edge (even index)
      positions.push(v.x - spread, y, v.z);
      // Right edge (odd index)
      positions.push(v.x + spread, y, v.z);
    }

    // Build triangle strip indices
    for (let i = 0; i < baselineVectors.length - 1; i++) {
      const baseIdx = i * 2;
      indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [baselineVectors]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#22D3EE"
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
