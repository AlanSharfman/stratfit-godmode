import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { baselineSeedString, createSeed } from "@/terrain/seed"

const SEGMENTS = TERRAIN_CONSTANTS.segments
const PEAK_HEIGHT = 45
const LERP_SPEED = 2.0

const GAIN_COLOR = new THREE.Color(0x34d399)
const LOSS_COLOR = new THREE.Color(0xf87171)
const NEUTRAL_COLOR = new THREE.Color(0x1a2a3a)
const DELTA_THRESHOLD = 0.5
const MAX_OPACITY = 0.28

interface Props {
  revealedKpis: Set<KpiKey>
  baselineKpis: PositionKpis | null
  scenarioKpis: PositionKpis | null
  visible?: boolean
}

function computeZoneHeights(
  kpis: PositionKpis | null,
  revealedKpis: Set<KpiKey>,
  count: number,
  seed: number,
): Float32Array {
  const heights = new Float32Array(count)
  if (!kpis) return heights

  const vertsPerRow = SEGMENTS + 1

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

    let totalWeight = 0
    let weightedHeight = 0

    for (const [key, elevation] of zoneElevations) {
      const zone = KPI_ZONE_MAP[key]
      const cx = (zone.xStart + zone.xEnd) / 2
      const halfW = (zone.xEnd - zone.xStart) / 2
      const dx = nx - cx
      const dz = nz - 0.5
      const dist = Math.sqrt(dx * dx + dz * dz)
      const radius = halfW * 1.5
      if (dist < radius * 2.5) {
        const falloff = Math.max(0, 1 - dist / (radius * 2.5))
        const w = falloff * falloff * falloff
        totalWeight += w
        weightedHeight += elevation * w
      }
    }

    if (totalWeight > 0) {
      heights[i] = weightedHeight / totalWeight
    }

    const noiseX = nx * 6.0 + seed * 0.01
    const noiseZ = nz * 6.0 + seed * 0.01
    const noise = Math.sin(noiseX * 3.7) * Math.cos(noiseZ * 4.3) * 0.04
    heights[i] += heights[i] * noise
  }

  return heights
}

const VERT = /* glsl */ `
  attribute vec3 deltaColor;
  attribute float deltaAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = deltaColor;
    vAlpha = deltaAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    if (vAlpha < 0.01) discard;
    gl_FragColor = vec4(vColor, vAlpha);
  }
`

export default function TerrainDeltaOverlay({
  revealedKpis,
  baselineKpis,
  scenarioKpis,
  visible = true,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null)

  const { baseline } = useSystemBaseline()
  const seedStr = useMemo(() => baselineSeedString(baseline as any), [baseline])
  const seed = useMemo(() => createSeed(seedStr), [seedStr])

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_CONSTANTS.width,
      TERRAIN_CONSTANTS.depth,
      SEGMENTS,
      SEGMENTS,
    )
    const pos = geo.attributes.position as THREE.BufferAttribute
    const count = pos.count

    const colors = new Float32Array(count * 3)
    const alphas = new Float32Array(count)
    geo.setAttribute("deltaColor", new THREE.BufferAttribute(colors, 3))
    geo.setAttribute("deltaAlpha", new THREE.BufferAttribute(alphas, 1))

    for (let i = 0; i < count; i++) {
      pos.setZ(i, 0)
      colors[i * 3] = NEUTRAL_COLOR.r
      colors[i * 3 + 1] = NEUTRAL_COLOR.g
      colors[i * 3 + 2] = NEUTRAL_COLOR.b
      alphas[i] = 0
    }

    geo.computeVertexNormals()
    return geo
  }, [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    })
  }, [])

  const targetHeights = useMemo(() => {
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const count = pos.count
    if (!baselineKpis || !scenarioKpis) return new Float32Array(count)

    const baseH = computeZoneHeights(baselineKpis, revealedKpis, count, seed)
    const scenH = computeZoneHeights(scenarioKpis, revealedKpis, count, seed)

    const deltas = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      deltas[i] = scenH[i] - baseH[i]
    }
    return deltas
  }, [baselineKpis, scenarioKpis, revealedKpis, geometry, seed])

  const targetColors = useMemo(() => {
    const count = targetHeights.length
    const colors = new Float32Array(count * 3)
    const alphas = new Float32Array(count)

    let maxDelta = 0
    for (let i = 0; i < count; i++) {
      maxDelta = Math.max(maxDelta, Math.abs(targetHeights[i]))
    }
    const scale = maxDelta > DELTA_THRESHOLD ? maxDelta : 1

    for (let i = 0; i < count; i++) {
      const d = targetHeights[i]
      const absDelta = Math.abs(d)
      const t = Math.min(absDelta / scale, 1)

      if (absDelta < DELTA_THRESHOLD) {
        colors[i * 3] = NEUTRAL_COLOR.r
        colors[i * 3 + 1] = NEUTRAL_COLOR.g
        colors[i * 3 + 2] = NEUTRAL_COLOR.b
        alphas[i] = 0
      } else if (d > 0) {
        colors[i * 3] = GAIN_COLOR.r
        colors[i * 3 + 1] = GAIN_COLOR.g
        colors[i * 3 + 2] = GAIN_COLOR.b
        alphas[i] = t * MAX_OPACITY
      } else {
        colors[i * 3] = LOSS_COLOR.r
        colors[i * 3 + 1] = LOSS_COLOR.g
        colors[i * 3 + 2] = LOSS_COLOR.b
        alphas[i] = t * MAX_OPACITY
      }
    }

    return { colors, alphas }
  }, [targetHeights])

  useFrame((_, dt) => {
    if (!meshRef.current || !visible) return

    const pos = geometry.attributes.position as THREE.BufferAttribute
    const colorAttr = geometry.attributes.deltaColor as THREE.BufferAttribute
    const alphaAttr = geometry.attributes.deltaAlpha as THREE.BufferAttribute
    const cArr = colorAttr.array as Float32Array
    const aArr = alphaAttr.array as Float32Array
    let changed = false
    const speed = dt * LERP_SPEED

    for (let i = 0; i < pos.count; i++) {
      const currentZ = pos.getZ(i)
      const targetZ = targetHeights[i]
      if (Math.abs(currentZ - targetZ) > 0.01) {
        pos.setZ(i, currentZ + (targetZ - currentZ) * Math.min(1, speed))
        changed = true
      }

      const ci = i * 3
      const tc = targetColors.colors
      const ta = targetColors.alphas
      cArr[ci] += (tc[ci] - cArr[ci]) * Math.min(1, speed)
      cArr[ci + 1] += (tc[ci + 1] - cArr[ci + 1]) * Math.min(1, speed)
      cArr[ci + 2] += (tc[ci + 2] - cArr[ci + 2]) * Math.min(1, speed)
      aArr[i] += (ta[i] - aArr[i]) * Math.min(1, speed)
    }

    if (changed) {
      pos.needsUpdate = true
      geometry.computeVertexNormals()
    }
    colorAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
  })

  if (!visible || !baselineKpis || !scenarioKpis) return null

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.6, 0]}
      renderOrder={5}
    />
  )
}
