import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useNarrativeStore } from "@/state/narrativeStore"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"

import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"
import type { MetricsInput } from "@/terrain/buildTerrain"
import { baselineReliefScalar, baselineSeedString, createSeed } from "@/terrain/seed"
import { TERRAIN_CONSTANTS, TERRAIN_WORLD_SCALE } from "@/terrain/terrainConstants"
import { buildTerrainWithMetrics, sampleTerrainHeight } from "@/terrain/buildTerrain"
import { createTerrainSolidMaterial, createTerrainSolidMaterialVariant, createTerrainWireMaterial } from "@/terrain/terrainMaterials"
import type { TerrainColorVariant } from "@/terrain/terrainMaterials"

export type TerrainSurfaceHandle = {
  getHeightAt: (worldX: number, worldZ: number) => number
  seed: number
  solidMesh: THREE.Mesh | null
  latticeMesh: THREE.Mesh | null
}

type Props = {
  terrainMetrics?: MetricsInput
  /** Color variant for the terrain surface (used by Compare B-side) */
  colorVariant?: TerrainColorVariant
}

const TerrainSurface = forwardRef<TerrainSurfaceHandle, Props>(function TerrainSurface(
  { terrainMetrics, colorVariant },
  ref
) {
  const solidRef = useRef<THREE.Mesh>(null)
  const latticeRef = useRef<THREE.Mesh>(null)

  const clearSelected = useNarrativeStore((s) => s.clearSelected)
  const { baseline } = useSystemBaseline()

  // ✅ Existing flag; no new state introduced
  const showGrid = useRenderFlagsStore((s) => s.showGrid)

  const baselineAny = baseline as any

  const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny])
  const seed = useMemo(() => createSeed(seedStr), [seedStr])
  const relief = useMemo(() => baselineReliefScalar(baselineAny), [baselineAny])

  const geometry = useMemo(() => {
    return buildTerrainWithMetrics(260, seed, relief, terrainMetrics)
  }, [seed, relief, terrainMetrics])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  const solidMat = useMemo(
    () => colorVariant && colorVariant !== "default"
      ? createTerrainSolidMaterialVariant(colorVariant)
      : createTerrainSolidMaterial(),
    [colorVariant],
  )
  const wireMat = useMemo(() => createTerrainWireMaterial(), [])

  useEffect(() => () => solidMat.dispose(), [solidMat])
  useEffect(() => () => wireMat.dispose(), [wireMat])

  useEffect(() => {
    // Deterministic transform setup — scale XZ wide so edges bleed past viewport
    for (const r of [solidRef, latticeRef]) {
      if (!r.current) continue
      r.current.rotation.x = -Math.PI / 2
      r.current.position.set(0, TERRAIN_CONSTANTS.yOffset, 0)
      r.current.scale.set(TERRAIN_WORLD_SCALE.x, TERRAIN_WORLD_SCALE.y, TERRAIN_WORLD_SCALE.z)
      r.current.frustumCulled = false
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      seed,
      solidMesh: solidRef.current,
      latticeMesh: latticeRef.current,
      getHeightAt: (worldX: number, worldZ: number) => {
        // The terrain mesh uses the canonical TERRAIN_WORLD_SCALE in world space.
        // getHeightAt accepts world XZ and must return world Y.
        // Step 1: convert world → geometry space (inverse mesh XZ scale)
        const geomX = worldX / TERRAIN_WORLD_SCALE.x
        const geomZ = worldZ / TERRAIN_WORLD_SCALE.z
        // Step 2: sample raw geometry height
        const y0 = TERRAIN_CONSTANTS.yOffset
        const sampled = sampleTerrainHeight(geomX, geomZ, seed, TERRAIN_CONSTANTS, terrainMetrics)
        // Step 3: convert geometry height → world Y using the canonical terrain Y scale.
        return (sampled - y0) * relief * TERRAIN_WORLD_SCALE.y + y0
      },
    }),
    [seed, relief, terrainMetrics]
  )

  return (
    <>
      {/* Physical surface — imperative mat for onBeforeCompile height AO */}
      <mesh
        ref={solidRef}
        geometry={geometry}
        renderOrder={0}
        name="terrain-surface"
        receiveShadow
        castShadow
        onClick={(e) => {
          e.stopPropagation()
          clearSelected()
        }}
      >
        <primitive object={solidMat} attach="material" />
      </mesh>

      {/* Wire/lattice overlay — ONLY when showGrid is enabled */}
      {showGrid && (
        <mesh ref={latticeRef} geometry={geometry} renderOrder={1} name="terrain-lattice">
          <primitive object={wireMat} attach="material" />
        </mesh>
      )}
    </>
  )
})

export default TerrainSurface
