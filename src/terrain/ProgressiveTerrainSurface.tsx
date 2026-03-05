// src/terrain/ProgressiveTerrainSurface.tsx
// Baseline-to-summit animated terrain driven by revealed KPI Terrain Stations.
// Always renders realistic mountainous terrain; KPI health modulates zone
// elevation on top of the baseline — the terrain is NEVER flat.

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { baselineSeedString, createSeed } from "@/terrain/seed"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { createTerrainSolidMaterial, createTerrainWireMaterial } from "@/terrain/terrainMaterials"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, getHealthLevel, getHealthColor } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { PropagationResult } from "@/engine/kpiDependencyGraph"

export type ProgressiveTerrainHandle = {
  getHeightAt: (worldX: number, worldZ: number) => number
  seed: number
  solidMesh: THREE.Mesh | null
  latticeMesh: THREE.Mesh | null
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
}

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const SEGMENTS = 220
const LERP_SPEED = 2.5

const BASELINE_RIDGE_HEIGHT = 14
const BASELINE_RIDGE_WIDTH = 0.15
const BASELINE_PEAK_COUNT = 7
const BASELINE_PEAK_AMP_MIN = 4
const BASELINE_PEAK_AMP_MAX = 12
const BASELINE_PEAK_SPREAD_MIN = 0.06
const BASELINE_PEAK_SPREAD_MAX = 0.14

const KPI_PEAK_HEIGHT = 35
const NOISE_AMP = 0.08

const HIGHLIGHT_OPACITY = 0.35
const HIGHLIGHT_FADE = 4.0
const CASCADE_DELAY_PER_HOP = 0.15
const CASCADE_PULSE_DURATION = 0.8
const CASCADE_PULSE_AMP = 3.5

/* ═══════════════════════════════════════════════════════════════════════════
   Noise & math utilities
   ═══════════════════════════════════════════════════════════════════════════ */

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pseudoNoise(x: number, z: number, seed: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233 + seed * 43758.5453) * 43758.5453
  return s - Math.floor(s)
}

function fbmNoise(x: number, z: number, seed: number, octaves = 4): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxAmp = 0
  for (let i = 0; i < octaves; i++) {
    value += (pseudoNoise(x * frequency, z * frequency, seed + i * 97.13) * 2 - 1) * amplitude
    maxAmp += amplitude
    amplitude *= 0.45
    frequency *= 2.1
  }
  return value / maxAmp
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/* ═══════════════════════════════════════════════════════════════════════════
   Seed-driven peak placement
   ═══════════════════════════════════════════════════════════════════════════ */

interface SeedPeak {
  x: number
  z: number
  amp: number
  spread: number
}

function buildSeedPeaks(seed: number): SeedPeak[] {
  const rand = mulberry32(seed)
  return Array.from({ length: BASELINE_PEAK_COUNT }, () => ({
    x: 0.1 + rand() * 0.8,
    z: 0.15 + rand() * 0.7,
    amp: BASELINE_PEAK_AMP_MIN + rand() * (BASELINE_PEAK_AMP_MAX - BASELINE_PEAK_AMP_MIN),
    spread: BASELINE_PEAK_SPREAD_MIN + rand() * (BASELINE_PEAK_SPREAD_MAX - BASELINE_PEAK_SPREAD_MIN),
  }))
}

/* ═══════════════════════════════════════════════════════════════════════════
   Baseline terrain height — always mountainous, never flat.
   Produces a realistic mountain range from seed alone.
   ═══════════════════════════════════════════════════════════════════════════ */

function baselineTerrainHeight(
  nx: number,
  nz: number,
  seed: number,
  peaks: SeedPeak[],
): number {
  // Central ridge running along X at Z = 0.5
  const ridgeDist = nz - 0.5
  const ridgeProfile = Math.exp(
    -(ridgeDist * ridgeDist) / (BASELINE_RIDGE_WIDTH * BASELINE_RIDGE_WIDTH),
  )
  const ridgeUndulation = 0.65 + 0.35 * Math.sin(nx * Math.PI * 3.0 + seed * 0.13)
  const ridge = BASELINE_RIDGE_HEIGHT * ridgeProfile * ridgeUndulation

  // Seed-driven peaks (Gaussian bumps)
  let peakContrib = 0
  for (const p of peaks) {
    const dx = nx - p.x
    const dz = nz - p.z
    const d2 = (dx * dx + dz * dz) / (p.spread * p.spread)
    peakContrib += p.amp * Math.exp(-d2)
  }

  // Multi-octave FBM detail
  const detailNoise = fbmNoise(nx * 6, nz * 6, seed, 5) * 3.5
  const microNoise = fbmNoise(nx * 14, nz * 14, seed + 37, 3) * 1.2

  // Broad low-frequency terrain shaping
  const broadWave =
    Math.sin(nx * Math.PI * 1.5 + seed * 0.02) * 2.5 +
    Math.cos(nz * Math.PI * 2.0 - seed * 0.015) * 2.0

  // Edge falloff — terrain tapers at boundaries
  const edgeFade = Math.min(
    smoothstep(0, 0.1, nx),
    smoothstep(1, 0.9, nx),
    smoothstep(0, 0.1, nz),
    smoothstep(1, 0.9, nz),
  )

  const raw = ridge + peakContrib + detailNoise + microNoise + broadWave
  return Math.max(0, raw * edgeFade)
}

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

const ProgressiveTerrainSurface = forwardRef<ProgressiveTerrainHandle, Props>(
  function ProgressiveTerrainSurface({ revealedKpis, kpis, focusedKpi, cascadeImpulse }, ref) {
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

    // Build geometry with baseline terrain (never flat)
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(
        TERRAIN_CONSTANTS.width,
        TERRAIN_CONSTANTS.depth,
        SEGMENTS,
        SEGMENTS,
      )
      const pos = geo.attributes.position as THREE.BufferAttribute
      const vertsPerRow = SEGMENTS + 1
      for (let i = 0; i < pos.count; i++) {
        const col = i % vertsPerRow
        const row = Math.floor(i / vertsPerRow)
        const nx = col / SEGMENTS
        const nz = row / SEGMENTS
        pos.setZ(i, baselineTerrainHeight(nx, nz, seed, seedPeaks))
      }
      geo.computeVertexNormals()
      geo.computeBoundingSphere()
      return geo
    }, [seed, seedPeaks])

    // Target heights — baseline + KPI zone modulation
    const targetHeights = useMemo(() => {
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const count = pos.count
      const targets = new Float32Array(count)
      const vertsPerRow = SEGMENTS + 1

      // Precompute zone elevations for revealed KPIs
      const zoneElevations = new Map<KpiKey, number>()
      for (const key of KPI_KEYS) {
        if (!kpis || !revealedKpis.has(key)) continue
        const health = getHealthLevel(key, kpis)
        zoneElevations.set(key, HEALTH_ELEVATION[health])
      }

      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const row = Math.floor(i / vertsPerRow)
        const nx = col / SEGMENTS
        const nz = row / SEGMENTS

        const baseH = baselineTerrainHeight(nx, nz, seed, seedPeaks)

        // Accumulate KPI-driven elevation for this vertex
        let kpiHeight = 0
        let totalWeight = 0

        for (const key of KPI_KEYS) {
          const elevFactor = zoneElevations.get(key)
          if (elevFactor === undefined) continue

          const zone = KPI_ZONE_MAP[key]
          const blendWidth = 0.04

          let weight = 0
          if (nx >= zone.xStart && nx <= zone.xEnd) {
            weight = 1.0
            const dLeft = nx - zone.xStart
            const dRight = zone.xEnd - nx
            if (dLeft < blendWidth) weight *= smoothstep(0, blendWidth, dLeft)
            if (dRight < blendWidth) weight *= smoothstep(0, blendWidth, dRight)
          } else {
            const dToZone = nx < zone.xStart
              ? zone.xStart - nx
              : nx - zone.xEnd
            if (dToZone < blendWidth) {
              weight = smoothstep(blendWidth, 0, dToZone)
            }
          }

          if (weight > 0) {
            const zCenter = 0.5
            const zSpread = 0.48
            const zDist = Math.abs(nz - zCenter)
            const zFalloff = Math.max(0, 1 - (zDist / zSpread) ** 2)

            const noise = pseudoNoise(nx * 20, nz * 20, seed + col) * NOISE_AMP * KPI_PEAK_HEIGHT
            kpiHeight += (elevFactor * KPI_PEAK_HEIGHT * zFalloff + noise) * weight
            totalWeight += weight
          }
        }

        const kpiContrib = totalWeight > 0 ? kpiHeight / Math.max(totalWeight, 1) : 0
        targets[i] = baseH + kpiContrib
      }

      return targets
    }, [geometry, revealedKpis, kpis, seed, seedPeaks])

    // Highlight geometry for focused KPI zone
    const highlightGeo = useMemo(() => {
      if (!focusedKpi || !kpis) return null

      const zone = KPI_ZONE_MAP[focusedKpi]
      const health = getHealthLevel(focusedKpi, kpis)
      const color = getHealthColor(health)
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const count = pos.count
      const vertsPerRow = SEGMENTS + 1

      const geo = new THREE.PlaneGeometry(
        TERRAIN_CONSTANTS.width,
        TERRAIN_CONSTANTS.depth,
        SEGMENTS,
        SEGMENTS,
      )
      const hPos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < count; i++) {
        hPos.setZ(i, pos.getZ(i))
      }

      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const nx = col / SEGMENTS
        const h = pos.getZ(i)

        if (h < 0.2) continue

        let zoneFactor = 0
        const edgeFade = 0.03
        const dLeft = nx - zone.xStart
        const dRight = zone.xEnd - nx
        if (dLeft >= 0 && dRight >= 0) {
          zoneFactor = Math.min(dLeft / edgeFade, dRight / edgeFade, 1.0)
        }
        if (zoneFactor <= 0) continue

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
          pos.setZ(i, current + diff * Math.min(1, delta * LERP_SPEED))
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
        r.current.position.set(0, -6, 0)
        r.current.scale.set(3.0, 2.8, 2.6)
        r.current.frustumCulled = false
      }
    }, [highlightGeo])

    useImperativeHandle(ref, () => ({
      seed,
      solidMesh: solidRef.current,
      latticeMesh: latticeRef.current,
      getHeightAt: (worldX: number, worldZ: number) => {
        const geomX = worldX / 3.0
        const geomZ = worldZ / 2.6
        const halfW = TERRAIN_CONSTANTS.width / 2
        const halfD = TERRAIN_CONSTANTS.depth / 2
        const col = Math.round(((geomX + halfW) / TERRAIN_CONSTANTS.width) * SEGMENTS)
        const row = Math.round(((geomZ + halfD) / TERRAIN_CONSTANTS.depth) * SEGMENTS)
        const clampedCol = Math.max(0, Math.min(SEGMENTS, col))
        const clampedRow = Math.max(0, Math.min(SEGMENTS, row))
        const idx = clampedRow * (SEGMENTS + 1) + clampedCol
        const pos = geometry.attributes.position as THREE.BufferAttribute
        const h = pos.getZ(idx) ?? 0
        return h * 2.8 + TERRAIN_CONSTANTS.yOffset
      },
    }), [seed, geometry])

    return (
      <>
        <mesh
          ref={solidRef}
          geometry={geometry}
          renderOrder={0}
          name="progressive-terrain-surface"
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
      </>
    )
  },
)

export default ProgressiveTerrainSurface
