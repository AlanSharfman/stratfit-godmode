import React, { useEffect, useMemo } from "react"
import * as THREE from "three"
import { buildTerrain } from "./buildTerrain"
import { createSeed } from "./seed"
import {
  createTerrainSolidMaterial,
  createTerrainWireMaterial,
} from "./terrainMaterials"

type Patch = {
  name: string
  seedKey: string
  scale: [number, number, number]
  position: [number, number, number]
  rotationX?: number
}

export default function DecorativeMountainPatches() {
  const patches: Patch[] = useMemo(
    () => [
      {
        name: "decor-left-ridge",
        seedKey: "decor-left-ridge",
        scale: [1.55, 2.65, 1.25],
        position: [-260, -5.65, -280],
        rotationX: -Math.PI / 2,
      },
      {
        name: "decor-center-plateau",
        seedKey: "decor-center-plateau",
        scale: [1.75, 2.85, 1.35],
        position: [40, -5.65, -260],
        rotationX: -Math.PI / 2,
      },
      {
        name: "decor-midright-shelf",
        seedKey: "decor-midright-shelf",
        scale: [1.45, 2.55, 1.2],
        position: [220, -5.7, -285],
        rotationX: -Math.PI / 2,
      },
    ],
    [],
  )

  const geoms = useMemo(() => {
    return patches.map((p) => {
      const seed = createSeed(p.seedKey)
      return buildTerrain(140, seed)
    })
  }, [patches])

  const solidMat = useMemo(() => createTerrainSolidMaterial(), [])
  const wireMat = useMemo(() => createTerrainWireMaterial(), [])

  useEffect(() => {
    return () => {
      geoms.forEach((g) => g?.dispose?.())
      solidMat.dispose()
      wireMat.dispose()
    }
  }, [geoms, solidMat, wireMat])

  return (
    <group name="decorative-mountain-patches" frustumCulled={false}>
      {patches.map((p, i) => (
        <group
          key={p.name}
          name={p.name}
          position={p.position}
          scale={p.scale}
          rotation={[p.rotationX ?? 0, 0, 0]}
          frustumCulled={false}
          renderOrder={-1}
        >
          <mesh geometry={geoms[i]} frustumCulled={false} renderOrder={-1}>
            <primitive object={solidMat} attach="material" />
          </mesh>
          <mesh geometry={geoms[i]} frustumCulled={false} renderOrder={0}>
            <primitive object={wireMat} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
