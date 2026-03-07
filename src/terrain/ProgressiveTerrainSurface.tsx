// src/terrain/ProgressiveTerrainSurface.tsx
// Baseline-to-summit animated terrain driven by revealed KPI Terrain Stations.
// Always renders realistic mountainous terrain; KPI health modulates zone
// elevation on top of the baseline — the terrain is NEVER flat.

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { createTerrainGeometry } from "@/terrain/createTerrainGeometry"
import { baselineSeedString, createSeed } from "@/terrain/seed"
import { TERRAIN_CONSTANTS, TERRAIN_WORLD_SCALE } from "@/terrain/terrainConstants"
import { createTerrainSolidMaterial, createTerrainSolidMaterialVariant, createTerrainWireMaterial } from "@/terrain/terrainMaterials"
import type { TerrainColorVariant } from "@/terrain/terrainMaterials"
import TerrainTrees from "@/terrain/TerrainTrees"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, PRIMARY_KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { PropagationResult } from "@/engine/kpiDependencyGraph"
import type { TerrainTuningParams } from "@/terrain/terrainTuning"
import {
  generateLandscapeHeight,
  buildLandscapePeaks,
  stabilizeHeightfield as sharedStabilizeHeightfield,
  pseudoNoise as sharedPseudoNoise,
  valueNoise as sharedValueNoise,
  smoothstep as sharedSmoothstep,
  type LandscapePeak,
} from "@/engine/terrain/generateLandscapeHeight"
import { SEGMENTS, buildSeedPeaks, buildStabilizedHeightfield } from "@/terrain/terrainHeightfield"

export type ProgressiveTerrainHandle = {
  getHeightAt: (worldX: number, worldZ: number) => number
  seed: number
  solidMesh: THREE.Mesh | null
  latticeMesh: THREE.Mesh | null
  heightfield: Float32Array | null
}

export interface CascadeImpulse {
  propagation: PropagationResult
  startTime: number
}

interface Props {
  revealedKpis: Set<KpiKey>
  kpis: PositionKpis | null
  focusedKpi: KpiKey | null
  cascadeImpulse?: CascadeImpulse | null
  tuning?: TerrainTuningParams | null
  /** Vertex lerp speed — lower = slower, more cinematic morph. Default 2.5 */
  morphSpeed?: number
  colorVariant?: TerrainColorVariant
}

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_LERP_SPEED = 20

const CASCADE_DELAY_PER_HOP = 0.15
const CASCADE_PULSE_DURATION = 0.8
const CASCADE_PULSE_AMP = 3.5

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

const ProgressiveTerrainSurface = forwardRef<ProgressiveTerrainHandle, Props>(
  function ProgressiveTerrainSurface({ revealedKpis, kpis, focusedKpi, cascadeImpulse, tuning, morphSpeed = DEFAULT_LERP_SPEED, colorVariant }, ref) {
    const solidRef = useRef<THREE.Mesh>(null)
    const latticeRef = useRef<THREE.Mesh>(null)

    const { baseline } = useSystemBaseline()
    const showGrid = useRenderFlagsStore((s) => s.showGrid)
    const baselineAny = baseline as any
    const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny])
    const seed = useMemo(() => createSeed(seedStr), [seedStr])
    const seedPeaks = useMemo(() => buildSeedPeaks(seed), [seed])

    // Stabilized heightfield: baseline + KPI zones, slope-clamped and smoothed.
    // This is the SINGLE source of truth for all vertex heights.
    const stabilizedHF = useMemo(
      () => buildStabilizedHeightfield(seed, seedPeaks, kpis, tuning),
      [seed, seedPeaks, kpis, tuning],
    )

    // Build geometry — write stabilized heightfield directly to mesh
    const geometry = useMemo(
      () => createTerrainGeometry({ segments: SEGMENTS, heightfield: stabilizedHF }),
      [stabilizedHF],
    )

    // Target heights = stabilized heightfield (already clean, no further processing needed)
    const targetHeights = stabilizedHF

    // Precompute cascade pulse offsets per zone for quick lookup
    const cascadeZonePulse = useRef(new Map<KpiKey, number>())

    const normalsTimer = useRef(0)
    const morphSettled = useRef(false)

    useEffect(() => { morphSettled.current = false }, [stabilizedHF])

    // Animate vertex heights toward targets + cascade pulses
    useFrame((state, delta) => {
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const count = pos.count
      let changed = false
      const vertsPerRow = SEGMENTS + 1

      // Cascade pulse computation
      cascadeZonePulse.current.clear()
      if (cascadeImpulse) {
        const elapsed = state.clock.elapsedTime - cascadeImpulse.startTime
        const { affected, hops } = cascadeImpulse.propagation
        for (const [kpi, impactDelta] of affected) {
          const hop = hops.get(kpi) ?? 0
          const localT = elapsed - hop * CASCADE_DELAY_PER_HOP
          if (localT > 0 && localT < CASCADE_PULSE_DURATION) {
            const t = localT / CASCADE_PULSE_DURATION
            const envelope = Math.sin(t * Math.PI)
            cascadeZonePulse.current.set(kpi, envelope * Math.sign(impactDelta) * CASCADE_PULSE_AMP * Math.min(1, Math.abs(impactDelta) * 5))
          }
        }
      }

      if (morphSettled.current && cascadeZonePulse.current.size === 0) return

      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const nx = col / SEGMENTS

        let cascadeOffset = 0
        if (cascadeZonePulse.current.size > 0) {
          for (const [kpi, pulse] of cascadeZonePulse.current) {
            const zone = KPI_ZONE_MAP[kpi]
            if (nx >= zone.xStart - 0.02 && nx <= zone.xEnd + 0.02) {
              const dLeft = nx - zone.xStart
              const dRight = zone.xEnd - nx
              const zf = Math.min(Math.max(dLeft / 0.04, 0), 1) * Math.min(Math.max(dRight / 0.04, 0), 1)
              cascadeOffset += pulse * zf
            }
          }
        }

        const current = pos.getZ(i)
        const target = targetHeights[i] + cascadeOffset
        const diff = target - current
        if (Math.abs(diff) > 0.01) {
          pos.setZ(i, current + diff * Math.min(1, delta * morphSpeed))
          changed = true
        }
      }

      if (changed) {
        pos.needsUpdate = true
        normalsTimer.current += delta
        if (normalsTimer.current > 0.1) {
          geometry.computeVertexNormals()
          normalsTimer.current = 0
        }
        morphSettled.current = false
      } else if (!morphSettled.current) {
        geometry.computeVertexNormals()
        morphSettled.current = true
      }

    })

    // Materials
    const solidMat = useMemo(
      () => colorVariant && colorVariant !== "default"
        ? createTerrainSolidMaterialVariant(colorVariant)
        : createTerrainSolidMaterial(),
      [colorVariant],
    )
    const wireMat = useMemo(() => createTerrainWireMaterial(), [])
    useEffect(() => () => solidMat.dispose(), [solidMat])
    useEffect(() => () => wireMat.dispose(), [wireMat])
    useEffect(() => () => { geometry.dispose() }, [geometry])

    // Transform — same as TerrainSurface
    useEffect(() => {
      for (const r of [solidRef, latticeRef]) {
        if (!r.current) continue
        r.current.rotation.x = -Math.PI / 2
        r.current.position.set(0, TERRAIN_CONSTANTS.yOffset, 0)
        r.current.scale.set(TERRAIN_WORLD_SCALE.x, TERRAIN_WORLD_SCALE.y, TERRAIN_WORLD_SCALE.z)
        r.current.frustumCulled = false
      }
    }, [geometry])

    const getHeightAt = useCallback((worldX: number, worldZ: number) => {
      const geomX = worldX / TERRAIN_WORLD_SCALE.x
      const geomZ = worldZ / TERRAIN_WORLD_SCALE.z
      const halfW = TERRAIN_CONSTANTS.width / 2
      const halfD = TERRAIN_CONSTANTS.depth / 2
      const col = Math.round(((geomX + halfW) / TERRAIN_CONSTANTS.width) * SEGMENTS)
      const row = Math.round(((geomZ + halfD) / TERRAIN_CONSTANTS.depth) * SEGMENTS)
      const clampedCol = Math.max(0, Math.min(SEGMENTS, col))
      const clampedRow = Math.max(0, Math.min(SEGMENTS, row))
      const idx = clampedRow * (SEGMENTS + 1) + clampedCol
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const h = pos.getZ(idx) ?? 0
      // The mesh has rotation.x = -PI/2 so geometry Z maps to world Y via scale.z, not scale.y
      return h * TERRAIN_WORLD_SCALE.z + TERRAIN_CONSTANTS.yOffset
    }, [geometry])

    useImperativeHandle(ref, () => ({
      seed,
      solidMesh: solidRef.current,
      latticeMesh: latticeRef.current,
      heightfield: stabilizedHF,
      getHeightAt,
    }), [seed, stabilizedHF, getHeightAt])

    return (
      <>
        <mesh
          ref={solidRef}
          geometry={geometry}
          renderOrder={0}
          name="progressive-terrain-surface"
          receiveShadow
          castShadow
        >
          <primitive object={solidMat} attach="material" />
        </mesh>

        {showGrid && (
          <mesh ref={latticeRef} geometry={geometry} renderOrder={1} name="progressive-terrain-lattice">
            <primitive object={wireMat} attach="material" />
          </mesh>
        )}

        {/* KPI zone highlight overlay removed — terrain colour stays constant */}

        <TerrainTrees
          heightfield={stabilizedHF}
          seed={seed}
          getHeightAt={getHeightAt}
        />
      </>
    )
  },
)

export default ProgressiveTerrainSurface
