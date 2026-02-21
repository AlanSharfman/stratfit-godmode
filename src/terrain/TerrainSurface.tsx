import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { buildTerrain, sampleTerrainHeight } from "./buildTerrain"
import { baselineReliefScalar, baselineSeedString, createSeed } from "@/terrain/seed"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { createTerrainSolidMaterial, createTerrainWireMaterial } from "./terrainMaterials"
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

  // Height-based AO gradient — deeper valleys darker, peaks lighter + faint teal tint.
  // onBeforeCompile must be set before first shader compile, so imperative useMemo.
  const solidMat = useMemo(() => createTerrainSolidMaterial(), [])
  const wireMat = useMemo(() => createTerrainWireMaterial(), [])

  useEffect(() => {
    return () => { solidMat.dispose() }
  }, [solidMat])

  useEffect(() => {
    return () => { wireMat.dispose() }
  }, [wireMat])

  useEffect(() => {
    // Solid terrain anchored at base Y
    if (solidRef.current) {
      solidRef.current.rotation.x = -Math.PI / 2
      solidRef.current.position.set(0, -6, 0)
      solidRef.current.scale.set(1, 1, 1)
      solidRef.current.frustumCulled = false
    }
    // Wireframe grid — same position, polygonOffset handles Z-fighting natively
    if (latticeRef.current) {
      latticeRef.current.rotation.x = -Math.PI / 2
      latticeRef.current.position.set(0, -6, 0)
      latticeRef.current.scale.set(1, 1, 1)
      latticeRef.current.frustumCulled = false
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
      {/* Physical surface — imperative mat for onBeforeCompile height AO */}
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
        <primitive object={solidMat} attach="material" />
      </mesh>

      {/* Embedded lattice */}
      <mesh ref={latticeRef} geometry={geometry} renderOrder={1}>
        <primitive object={wireMat} attach="material" />
      </mesh>
    </>
  )
})

export default TerrainSurface
