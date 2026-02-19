import React, { useMemo, useEffect } from "react"
import * as THREE from "three"
import { buildTerrain } from "@/terrain/buildTerrain"
import { createSeed } from "@/terrain/seed"

type Layer = {
  name: string
  seedKey: string
  scale: [number, number, number]
  position: [number, number, number]
  rotationX?: number
  opacity: number
  emissiveIntensity: number
  wireOpacity: number
}

export default function BackgroundTerrainLayers() {
  const layers: Layer[] = useMemo(
    () => [
      // Far left ridge (fills your left-top empty horizon)
      {
        name: "bg-left-ridge",
        seedKey: "bg-left-ridge",
        scale: [1.55, 2.65, 1.25],
        position: [-260, -20, -280],
        rotationX: -Math.PI / 2,
        opacity: 0.18,
        emissiveIntensity: 0.10,
        wireOpacity: 0.06,
      },

      // Mid-left mass (fills left-mid band)
      {
        name: "bg-midleft-mass",
        seedKey: "bg-midleft-mass",
        scale: [1.35, 2.45, 1.20],
        position: [-120, -19, -230],
        rotationX: -Math.PI / 2,
        opacity: 0.16,
        emissiveIntensity: 0.09,
        wireOpacity: 0.055,
      },

      // Center distant plateau (fills top-center emptiness)
      {
        name: "bg-center-plateau",
        seedKey: "bg-center-plateau",
        scale: [1.75, 2.85, 1.35],
        position: [40, -19, -260],
        rotationX: -Math.PI / 2,
        opacity: 0.15,
        emissiveIntensity: 0.085,
        wireOpacity: 0.05,
      },

      // Mid-right shelf (fills top-right emptiness)
      {
        name: "bg-midright-shelf",
        seedKey: "bg-midright-shelf",
        scale: [1.45, 2.55, 1.20],
        position: [220, -21, -285],
        rotationX: -Math.PI / 2,
        opacity: 0.14,
        emissiveIntensity: 0.08,
        wireOpacity: 0.045,
      },

      // Far right ridge (fills far-right horizon)
      {
        name: "bg-right-ridge",
        seedKey: "bg-right-ridge",
        scale: [1.65, 2.75, 1.30],
        position: [360, -22, -340],
        rotationX: -Math.PI / 2,
        opacity: 0.12,
        emissiveIntensity: 0.075,
        wireOpacity: 0.04,
      },

      // Near-back band (adds depth just behind main terrain without competing)
      {
        name: "bg-nearback-band",
        seedKey: "bg-nearback-band",
        scale: [1.25, 2.10, 1.10],
        position: [0, -18, -150],
        rotationX: -Math.PI / 2,
        opacity: 0.10,
        emissiveIntensity: 0.07,
        wireOpacity: 0.035,
      },

      // Low-left foreground silhouette (fills your big bottom-left emptiness)
      // Keep subtle so it doesn’t fight the hero terrain.
      {
        name: "bg-lowleft-fore",
        seedKey: "bg-lowleft-fore",
        scale: [1.20, 1.95, 1.05],
        position: [-320, -24, -90],
        rotationX: -Math.PI / 2,
        opacity: 0.09,
        emissiveIntensity: 0.065,
        wireOpacity: 0.03,
      },
    ],
    []
  )

  const geoms = useMemo(() => {
    // Lower res than main to keep perf stable
    return layers.map((l) => {
      const seed = createSeed(l.seedKey)
      return buildTerrain(140, seed)
    })
  }, [layers])

  useEffect(() => {
    return () => {
      geoms.forEach((g) => g?.dispose?.())
    }
  }, [geoms])

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
          {/* Solid silhouette */}
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
              fog
            />
          </mesh>

          {/* Wire (extremely subtle; keeps STRATFIT language consistent) */}
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
              fog
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
