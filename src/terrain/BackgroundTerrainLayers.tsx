import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { buildTerrain } from "@/terrain/buildTerrain";
import { createSeed } from "@/terrain/seed";

type Layer = {
  name: string;
  seedKey: string;
  scale: [number, number, number];
  position: [number, number, number];
  rotationX?: number;
  opacity: number;
  emissiveIntensity: number;
  wireOpacity: number;
};

export default function BackgroundTerrainLayers() {
  const layers: Layer[] = useMemo(
    () => [
      {
        name: "bg-1",
        seedKey: "bg-1",
        scale: [1.35, 2.4, 1.2],
        position: [0, -18, -220],
        rotationX: -Math.PI / 2,
        opacity: 0.22,
        emissiveIntensity: 0.10,
        wireOpacity: 0.10,
      },
      {
        name: "bg-2",
        seedKey: "bg-2",
        scale: [1.15, 2.2, 1.1],
        position: [-140, -20, -280],
        rotationX: -Math.PI / 2,
        opacity: 0.16,
        emissiveIntensity: 0.08,
        wireOpacity: 0.07,
      },
      {
        name: "bg-3",
        seedKey: "bg-3",
        scale: [1.25, 2.0, 1.05],
        position: [180, -22, -320],
        rotationX: -Math.PI / 2,
        opacity: 0.12,
        emissiveIntensity: 0.07,
        wireOpacity: 0.06,
      },
    ],
    []
  );

  const geoms = useMemo(() => {
    // Lower res than main to keep perf stable
    return layers.map((l) => {
      const seed = createSeed(l.seedKey);
      return buildTerrain(140, seed);
    });
  }, [layers]);

  useEffect(() => {
    return () => {
      geoms.forEach((g) => g?.dispose?.());
    };
  }, [geoms]);

  return (
    <group name="background-terrain-layers" frustumCulled={false}>
      {layers.map((l, i) => (
        <group
          key={l.name}
          name={l.name}
          position={l.position}
          scale={l.scale}
          rotation={[l.rotationX ?? 0, 0, 0]}
          frustumCulled={false}
          renderOrder={-50}
        >
          {/* Solid */}
          <mesh geometry={geoms[i]} frustumCulled={false} renderOrder={-50}>
            <meshStandardMaterial
              color={0x07121b}
              emissive={0x071423}
              emissiveIntensity={l.emissiveIntensity}
              transparent
              opacity={l.opacity}
              roughness={0.95}
              metalness={0.02}
              depthWrite={false}
              depthTest
            />
          </mesh>

          {/* Wire (very subtle) */}
          <mesh geometry={geoms[i]} frustumCulled={false} renderOrder={-49}>
            <meshStandardMaterial
              color={0x7dd3fc}
              emissive={0x38bdf8}
              emissiveIntensity={0.18}
              wireframe
              transparent
              opacity={l.wireOpacity}
              roughness={0.9}
              metalness={0.05}
              depthWrite={false}
              depthTest
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
