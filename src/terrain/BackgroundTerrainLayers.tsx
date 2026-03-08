// src/terrain/BackgroundTerrainLayers.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Background Mountain Silhouettes
//
// Low-detail distant mountain silhouettes that create scale and depth behind
// the main terrain. Pure solid meshes — no wireframe, no markers, no interaction.
// These exist only to fill the horizon and make the hero terrain feel situated
// in a larger landscape.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useEffect } from "react"
import { buildTerrain } from "@/terrain/buildTerrain"
import { createSeed } from "@/terrain/seed"

interface Layer {
  name: string
  seedKey: string
  scale: [number, number, number]
  position: [number, number, number]
  rotationX: number
  opacity: number
  emissiveIntensity: number
}

const LAYERS: Layer[] = [
  { name: "bg-left-ridge",     seedKey: "bg-left-ridge",     scale: [1.55, 2.65, 1.25], position: [-260, -20, -280], rotationX: -Math.PI / 2, opacity: 0.44, emissiveIntensity: 0.18 },
  { name: "bg-midleft-mass",   seedKey: "bg-midleft-mass",   scale: [1.35, 2.45, 1.20], position: [-120, -19, -230], rotationX: -Math.PI / 2, opacity: 0.38, emissiveIntensity: 0.15 },
  { name: "bg-center-plateau", seedKey: "bg-center-plateau", scale: [1.75, 2.85, 1.35], position: [40,   -19, -260], rotationX: -Math.PI / 2, opacity: 0.34, emissiveIntensity: 0.14 },
  { name: "bg-midright-shelf", seedKey: "bg-midright-shelf", scale: [1.45, 2.55, 1.20], position: [220,  -21, -285], rotationX: -Math.PI / 2, opacity: 0.30, emissiveIntensity: 0.13 },
  { name: "bg-right-ridge",    seedKey: "bg-right-ridge",    scale: [1.65, 2.75, 1.30], position: [360,  -22, -340], rotationX: -Math.PI / 2, opacity: 0.26, emissiveIntensity: 0.12 },
  { name: "bg-nearback-band",  seedKey: "bg-nearback-band",  scale: [1.25, 2.10, 1.10], position: [0,    -18, -150], rotationX: -Math.PI / 2, opacity: 0.20, emissiveIntensity: 0.10 },
]

export default function BackgroundTerrainLayers() {
  const geoms = useMemo(
    () => LAYERS.map((l) => buildTerrain(64, createSeed(l.seedKey))),
    [],
  )

  useEffect(() => () => { geoms.forEach((g) => g?.dispose?.()) }, [geoms])

  return (
    <group name="background-terrain-layers" frustumCulled={false}>
      {LAYERS.map((l, i) => (
        <group
          key={l.name}
          name={l.name}
          position={l.position}
          scale={l.scale}
          rotation={[l.rotationX, 0, 0]}
          frustumCulled={false}
          renderOrder={-50}
        >
          <mesh geometry={geoms[i]} frustumCulled={false} renderOrder={-50}>
            <meshStandardMaterial
              color={0x0a1e30}
              emissive={0x0a2236}
              emissiveIntensity={l.emissiveIntensity}
              transparent
              opacity={l.opacity}
              roughness={0.92}
              metalness={0.0}
              depthWrite={false}
              depthTest
              fog={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
