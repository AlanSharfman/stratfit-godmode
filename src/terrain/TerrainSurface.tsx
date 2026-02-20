import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { buildTerrain, sampleTerrainHeight } from "./buildTerrain"
import { baselineReliefScalar, baselineSeedString, createSeed } from "@/terrain/seed"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { useNarrativeStore } from "@/state/narrativeStore"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"

export type TerrainSurfaceHandle = {
  getHeightAt: (worldX: number, worldZ: number) => number
  seed: number
  solidMesh: THREE.Mesh | null
  latticeMesh: THREE.Mesh | null
}

const TerrainSurface = forwardRef<TerrainSurfaceHandle, object>(function TerrainSurface(
  _props,
  ref
) {
  const solidRef = useRef<THREE.Mesh>(null)
  const latticeRef = useRef<THREE.Mesh>(null)

  const clearSelected = useNarrativeStore((s) => s.clearSelected)

  const { baseline } = useSystemBaseline()

  const baselineAny = baseline as any

  const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny])
  const seed = useMemo(() => createSeed(seedStr), [seedStr])
  const relief = useMemo(() => baselineReliefScalar(baselineAny), [baselineAny])

  const geometry = useMemo(() => {
    return buildTerrain(260, seed, relief)
  }, [seed, relief])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  useEffect(() => {
    for (const ref of [solidRef, latticeRef]) {
      if (!ref.current) continue
      ref.current.rotation.x = -Math.PI / 2
      ref.current.position.set(0, -6, 0)
      ref.current.scale.set(1, 1, 1)
      ref.current.frustumCulled = false
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      seed,
      solidMesh: solidRef.current,
      latticeMesh: latticeRef.current,
      getHeightAt: (worldX: number, worldZ: number) => {
        const y = sampleTerrainHeight(worldX, worldZ, seed)
        const y0 = TERRAIN_CONSTANTS.yOffset
        return (y - y0) * relief + y0
      },
    }),
    [seed, relief]
  )

  return (
    <>
      {/* Shadow-catching solid base */}
      <mesh
        ref={solidRef}
        geometry={geometry}
        renderOrder={0}
        name="terrain-surface"
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation()
          clearSelected()
        }}
      >
        <meshStandardMaterial color="#010205" roughness={0.9} />
      </mesh>

      {/* Azure wireframe lattice — bioluminescent glow */}
      <mesh ref={latticeRef} geometry={geometry} renderOrder={1} castShadow>
        <meshStandardMaterial color="#2A82D0" emissive="#1E5A99" emissiveIntensity={0.6} wireframe transparent opacity={0.35} />
      </mesh>
    </>
  )
})

export default TerrainSurface
