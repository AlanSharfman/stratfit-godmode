import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/state/trajectoryStore";

/**
 * DivergenceRibbon creates a subtle translucent ribbon between baseline and scenario paths.
 *
 * This visualizes the "delta space" between trajectories in a premium, non-gaming aesthetic.
 * The ribbon uses a soft cyan color with very low opacity (0.15) for institutional quality.
 *
 * Geometry: Triangle strip connecting corresponding points on both paths.
 */
export default function DivergenceRibbon() {
  const { baselineVectors, scenarioVectors } = useTrajectoryStore();

  const geometry = useMemo(() => {
    if (!baselineVectors.length || !scenarioVectors.length) return null;

    // Match lengths - use the shorter path
    const len = Math.min(baselineVectors.length, scenarioVectors.length);
    if (len < 2) return null;

    const vertices: number[] = [];
    const indices: number[] = [];

    // Build triangle strip vertices
    for (let i = 0; i < len; i++) {
      const b = baselineVectors[i];
      const s = scenarioVectors[i];
      if (!b || !s) continue;

      // Add baseline point (even index)
      vertices.push(b.x, b.y ?? 0, b.z);
      // Add scenario point (odd index) with slight Y offset for visual separation
      vertices.push(s.x, (s.y ?? 0) + 0.08, s.z);
    }

    // Build triangle strip indices
    for (let i = 0; i < len - 1; i++) {
      const baseIdx = i * 2;
      // Two triangles per quad
      indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [baselineVectors, scenarioVectors]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#38BDF8"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
