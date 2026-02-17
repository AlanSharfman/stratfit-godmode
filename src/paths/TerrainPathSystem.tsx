// src/paths/TerrainPathSystem.tsx
import React, { useMemo } from "react";
import * as THREE from "three";
import { buildRibbonGeometry } from "../terrain/corridorTopology";
import { createSeed } from "../terrain/seed";
import { sampleHeight } from "./sampleTerrain";

type TerrainPathSystemProps = Record<string, never>;

export default function TerrainPathSystem(_props: TerrainPathSystemProps) {
  // Default height sampler
  const seed = useMemo(() => createSeed("baseline"), []);
  const getHeightAt = useMemo(
    () => (worldX: number, worldZ: number) => {
      const normalizedX = (worldX + 280) / 560;
      const normalizedZ = (worldZ + 180) / 360;
      return sampleHeight(normalizedX, normalizedZ, seed);
    },
    [seed]
  );

  // Default control points (P50-style path)
  const controlPoints = useMemo(
    () => [
      { x: -220, z: 40 },
      { x: -140, z: 10 },
      { x: -60, z: -20 },
      { x: 40, z: -10 },
      { x: 140, z: 30 },
      { x: 220, z: 10 },
    ],
    []
  );

  const geometry = useMemo<THREE.BufferGeometry | null>(() => {
    try {
      const result = buildRibbonGeometry(controlPoints, getHeightAt, {
        // Conservative defaults matching existing paths
        samples: 180,
        halfWidth: 1.25,
        widthSegments: 10,
        lift: 0.22,
        tension: 0.55,
      });

      if (!result?.geometry) return null;
      
      // Ensure bounding + normals are sane
      result.geometry.computeVertexNormals();
      result.geometry.computeBoundingSphere();
      return result.geometry;
    } catch (e) {
      console.error("[TerrainPathSystem] buildRibbonGeometry failed:", e);
      return null;
    }
  }, [controlPoints, getHeightAt]);

  if (!geometry) return null;

  return (
    <group name="terrain_path_system">
      <mesh geometry={geometry} frustumCulled={false} renderOrder={50}>
        <meshStandardMaterial
          color={new THREE.Color("#22d3ee")}
          roughness={0.35}
          metalness={0.15}
          emissive={new THREE.Color("#22d3ee")}
          emissiveIntensity={0.25}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
