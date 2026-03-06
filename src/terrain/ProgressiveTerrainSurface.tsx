// src/terrain/ProgressiveTerrainSurface.tsx
// Baseline-to-summit animated terrain driven by revealed KPI Terrain Stations.
// Always renders realistic mountainous terrain; KPI health modulates zone
// elevation on top of the baseline — the terrain is NEVER flat.

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { createTerrainGeometry } from "@/terrain/createTerrainGeometry"
import { baselineSeedString, createSeed } from "@/terrain/seed"
import { TERRAIN_CONSTANTS, TERRAIN_WORLD_SCALE } from "@/terrain/terrainConstants"
import { createTerrainSolidMaterial, createTerrainWireMaterial } from "@/terrain/terrainMaterials"
import TerrainTrees from "@/terrain/TerrainTrees"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, getHealthLevel, getHealthColor, PRIMARY_KPI_KEYS, PRIMARY_ANCHOR_POSITIONS } from "@/domain/intelligence/kpiZoneMapping"
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
}

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_LERP_SPEED = 2.5

const HIGHLIGHT_OPACITY = 0.35
const HIGHLIGHT_FADE = 4.0
const CASCADE_DELAY_PER_HOP = 0.15
const CASCADE_PULSE_DURATION = 0.8
const CASCADE_PULSE_AMP = 3.5

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

const ProgressiveTerrainSurface = forwardRef<ProgressiveTerrainHandle, Props>(
  function ProgressiveTerrainSurface({ revealedKpis, kpis, focusedKpi, cascadeImpulse, tuning, morphSpeed = DEFAULT_LERP_SPEED }, ref) {
    const solidRef = useRef<THREE.Mesh>(null)
    const latticeRef = useRef<THREE.Mesh>(null)
    const highlightRef = useRef<THREE.Mesh>(null)
    const highlightMatRef = useRef<THREE.MeshBasicMaterial>(null)
    const highlightOpacity = useRef(0)

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

    // Highlight geometry for focused KPI anchor region
    const highlightGeo = useMemo(() => {
      if (!focusedKpi || !kpis) return null

      const anchor = PRIMARY_ANCHOR_POSITIONS.get(focusedKpi)
      const health = getHealthLevel(focusedKpi, kpis)
      const color = getHealthColor(health)
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const count = pos.count
      const vertsPerRow = SEGMENTS + 1
      const aCx = anchor?.cx ?? 0.5
      const aSpread = anchor?.spread ?? 0.11

      const hfCopy = new Float32Array(count)
      for (let i = 0; i < count; i++) hfCopy[i] = pos.getZ(i)
      const geo = createTerrainGeometry({ segments: SEGMENTS, heightfield: hfCopy })
      const hPos = geo.attributes.position as THREE.BufferAttribute

      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const nx = col / SEGMENTS
        const h = pos.getZ(i)

        if (h < 0.2) continue

        const dx = nx - aCx
        const zoneFactor = Math.exp(-(dx * dx) / (aSpread * aSpread))
        if (zoneFactor < 0.05) continue

        const heightFactor = Math.min(1, h / 5)
        const intensity = heightFactor * zoneFactor

        colors[i * 3] = color.r * intensity
        colors[i * 3 + 1] = color.g * intensity
        colors[i * 3 + 2] = color.b * intensity
      }

      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
      geo.computeVertexNormals()
      return geo
    }, [focusedKpi, kpis, geometry])

    // Precompute cascade pulse offsets per zone for quick lookup
    const cascadeZonePulse = useRef(new Map<KpiKey, number>())

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
        geometry.computeVertexNormals()
      }

      // Update highlight geometry heights to match
      if (highlightGeo && highlightRef.current) {
        const hPos = highlightGeo.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < count; i++) {
          hPos.setZ(i, pos.getZ(i))
        }
        hPos.needsUpdate = true
        highlightGeo.computeVertexNormals()
      }

      // Fade highlight opacity
      const targetOp = focusedKpi ? HIGHLIGHT_OPACITY : 0
      const curOp = highlightOpacity.current
      const opDiff = targetOp - curOp
      if (Math.abs(opDiff) > 0.001) {
        highlightOpacity.current += opDiff * Math.min(1, delta * HIGHLIGHT_FADE)
      } else {
        highlightOpacity.current = targetOp
      }
      if (highlightMatRef.current) {
        highlightMatRef.current.opacity = highlightOpacity.current
      }
    })

    // Materials
    const solidMat = useMemo(() => createTerrainSolidMaterial(), [])
    const wireMat = useMemo(() => createTerrainWireMaterial(), [])
    useEffect(() => () => solidMat.dispose(), [solidMat])
    useEffect(() => () => wireMat.dispose(), [wireMat])
    useEffect(() => () => { geometry.dispose() }, [geometry])
    useEffect(() => () => { highlightGeo?.dispose() }, [highlightGeo])

    // Transform — same as TerrainSurface
    useEffect(() => {
      for (const r of [solidRef, latticeRef, highlightRef]) {
        if (!r.current) continue
        r.current.rotation.x = -Math.PI / 2
        r.current.position.set(0, TERRAIN_CONSTANTS.yOffset, 0)
        r.current.scale.set(TERRAIN_WORLD_SCALE.x, TERRAIN_WORLD_SCALE.y, TERRAIN_WORLD_SCALE.z)
        r.current.frustumCulled = false
      }
    }, [highlightGeo])

    useImperativeHandle(ref, () => ({
      seed,
      solidMesh: solidRef.current,
      latticeMesh: latticeRef.current,
      heightfield: stabilizedHF,
      getHeightAt: (worldX: number, worldZ: number) => {
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
        return h * TERRAIN_WORLD_SCALE.y + TERRAIN_CONSTANTS.yOffset
      },
    }), [seed, geometry, stabilizedHF])

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

        {highlightGeo && (
          <mesh
            ref={highlightRef}
            geometry={highlightGeo}
            renderOrder={6}
            name="progressive-zone-highlight"
          >
            <meshBasicMaterial
              ref={highlightMatRef}
              vertexColors
              transparent
              opacity={0}
              depthWrite={false}
              depthTest
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
              toneMapped={false}
            />
          </mesh>
        )}

        <TerrainTrees
          terrainRef={ref as React.RefObject<ProgressiveTerrainHandle>}
          heightfield={stabilizedHF}
          seed={seed}
        />
      </>
    )
  },
)

export default ProgressiveTerrainSurface
