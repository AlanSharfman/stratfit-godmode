import React, { useMemo } from "react";
import * as THREE from "three";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
  start: [number, number, number];
  end: [number, number, number];
  intensity01: number;
  width?: number;
  segments?: number;
  yOffset?: number;
};

export default function FlowlineBand({
  terrainRef,
  start,
  end,
  intensity01,
  width = 1.6,
  segments = 48,
  yOffset = 0.12,
}: Props) {
  const i = clamp01(intensity01);

  const geometry = useMemo(() => {
    if (!terrainRef.current) return null;

    const positions: number[] = [];
    const indices: number[] = [];

    const halfW = width * 0.5;

    for (let s = 0; s <= segments; s++) {
      const t = s / segments;

      const x = THREE.MathUtils.lerp(start[0], end[0], t);
      const z = THREE.MathUtils.lerp(start[2], end[2], t);

      const terrainY =
        terrainRef.current.getHeightAt?.(x, z) ?? start[1];

      const y = terrainY + yOffset;

      // perpendicular on XZ plane (axis runs along X)
      const perpZ = 1;

      positions.push(
        x,
        y,
        z - halfW * perpZ,
        x,
        y,
        z + halfW * perpZ
      );

      if (s < segments) {
        const base = s * 2;
        indices.push(
          base,
          base + 1,
          base + 2,
          base + 1,
          base + 3,
          base + 2
        );
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    g.setIndex(indices);
    g.computeVertexNormals();

    return g;
  }, [terrainRef, start, end, width, segments, yOffset]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.02, 0.85, 0.95),
        emissive: new THREE.Color(0.02, 0.85, 0.95),
        emissiveIntensity: 0.15 + i * 1.6,
        transparent: true,
        opacity: 0.02 + i * 0.25,
        roughness: 0.35,
        metalness: 0.0,
        depthWrite: false,
      }),
    [i]
  );

  if (!geometry || i < 0.02) return null;

  return <mesh geometry={geometry} material={material} />;
}
