// src/terrain/ProgressiveTerrainSurface.tsx
// Flat-to-mountain animated terrain driven by revealed KPI zones.
// Each zone's elevation is determined by its KPI health level.

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

const SEGMENTS = 220
const LERP_SPEED = 2.5
const PEAK_HEIGHT = 52
const NOISE_AMP = 0.08
const BASE_UNDULATION_AMP = 3.0
const BASE_UNDULATION_FREQ = 3.2
const HIGHLIGHT_OPACITY = 0.35
const HIGHLIGHT_FADE = 4.0
const CASCADE_DELAY_PER_HOP = 0.15
const CASCADE_PULSE_DURATION = 0.8
const CASCADE_PULSE_AMP = 3.5

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

function baseUndulation(nx: number, nz: number, seed: number): number {
  const edgeFade = Math.min(
    smoothstep(0, 0.08, nx),
    smoothstep(1, 0.92, nx),
    smoothstep(0, 0.1, nz),
    smoothstep(1, 0.9, nz),
  )
  const n = fbmNoise(nx * BASE_UNDULATION_FREQ, nz * BASE_UNDULATION_FREQ, seed)
  return Math.max(0, n * 0.5 + 0.3) * BASE_UNDULATION_AMP * edgeFade
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const ProgressiveTerrainSurface = forwardRef<ProgressiveTerrainHandle, Props>(
  function ProgressiveTerrainSurface({ revealedKpis, kpis, focusedKpi, cascadeImpulse }, ref) {
    const solidRef = useRef<THREE.Mesh>(null)
    const latticeRef = useRef<THREE.Mesh>(null)
    const highlightRef = useRef<THREE.Mesh>(null)
    const highlightMatRef = useRef<THREE.MeshBasicMaterial>(null)
    const highlightOpacity = useRef(0)
    const cascadeTimeRef = useRef(0)

    const { baseline } = useSystemBaseline()
    const showGrid = useRenderFlagsStore((s) => s.showGrid)
    const baselineAny = baseline as any
    const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny])
    const seed = useMemo(() => createSeed(seedStr), [seedStr])

    // Build a flat PlaneGeometry
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(
        TERRAIN_CONSTANTS.width,
        TERRAIN_CONSTANTS.depth,
        SEGMENTS,
        SEGMENTS,
      )
      // Start flat — all Z = 0
      const pos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, 0)
      }
      geo.computeVertexNormals()
      geo.computeBoundingSphere()
      return geo
    }, [])

    // Target heights array — recomputed when revealedKpis or kpis change
    const targetHeights = useMemo(() => {
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const count = pos.count
      const targets = new Float32Array(count)

      if (!kpis) return targets

      const vertsPerRow = SEGMENTS + 1

      // Precompute zone elevations
      const zoneElevations = new Map<KpiKey, number>()
      for (const key of KPI_KEYS) {
        if (!revealedKpis.has(key)) continue
        const health = getHealthLevel(key, kpis)
        zoneElevations.set(key, HEALTH_ELEVATION[health] * PEAK_HEIGHT)
      }

      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const row = Math.floor(i / vertsPerRow)
        const nx = col / SEGMENTS
        const nz = row / SEGMENTS

        // Determine which zone(s) this vertex belongs to
        let totalWeight = 0
        let weightedHeight = 0

        for (const key of KPI_KEYS) {
          const elev = zoneElevations.get(key)
          if (elev === undefined) continue

          const zone = KPI_ZONE_MAP[key]
          const blendWidth = 0.04

          let weight = 0
          if (nx >= zone.xStart && nx <= zone.xEnd) {
            weight = 1.0
            // Smooth blend at edges
            const dLeft = nx - zone.xStart
            const dRight = zone.xEnd - nx
            if (dLeft < blendWidth) weight *= smoothstep(0, blendWidth, dLeft)
            if (dRight < blendWidth) weight *= smoothstep(0, blendWidth, dRight)
          } else {
            // Blend into adjacent zones
            const dToZone = nx < zone.xStart
              ? zone.xStart - nx
              : nx - zone.xEnd
            if (dToZone < blendWidth) {
              weight = smoothstep(blendWidth, 0, dToZone)
            }
          }

          if (weight > 0) {
            // Shape: bell curve along Z (depth) for mountain profile
            const zCenter = 0.5
            const zSpread = 0.48
            const zDist = Math.abs(nz - zCenter)
            const zFalloff = Math.max(0, 1 - (zDist / zSpread) ** 2)

            // Noise for organic texture
            const noise = pseudoNoise(nx * 20, nz * 20, seed + col) * NOISE_AMP * elev

            const h = (elev * zFalloff + noise) * weight
            weightedHeight += h
            totalWeight += weight
          }
        }

        const base = baseUndulation(nx, nz, seed)
        targets[i] = totalWeight > 0 ? weightedHeight / Math.max(totalWeight, 1) + base : base
      }

      return targets
    }, [geometry, revealedKpis, kpis, seed])

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
      // Copy current heights from animated geometry
      for (let i = 0; i < count; i++) {
        hPos.setZ(i, pos.getZ(i))
      }

      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const nx = col / SEGMENTS
        const h = pos.getZ(i)

        if (h < 0.5) continue // skip flat vertices

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
        // Find nearest vertex
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
