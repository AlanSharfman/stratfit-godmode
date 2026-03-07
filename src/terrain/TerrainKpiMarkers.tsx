import React, { useCallback, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import {
  PRIMARY_KPI_KEYS,
  PRIMARY_ANCHOR_POSITIONS,
  KPI_CATEGORY_COLORS,
  KPI_ZONE_MAP,
  getHealthLevel,
} from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "./ProgressiveTerrainSurface"
import { TERRAIN_CONSTANTS, TERRAIN_WORLD_SCALE } from "./terrainConstants"

interface Props {
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  focusedKpi: KpiKey | null
  onFocusKpi?: (kpi: KpiKey | null) => void
  onClickKpi?: (kpi: KpiKey | null) => void
  onFocusedMarkerScreen?: (pos: { x: number; y: number } | null) => void
  kpis: PositionKpis | null
  revealedKpis: Set<KpiKey>
  visible: boolean
}

const MARKER_LIFT = 9
const HOVER_LIFT = 14
const STEM_HEIGHT = 8
const ORB_RADIUS = 2.8
const HALO_INNER = ORB_RADIUS + 0.4
const HALO_OUTER = ORB_RADIUS + 2.0
const STEM_RADIUS = 0.06
const PULSE_SPEED = 1.4
const LABEL_OFFSET_Y = ORB_RADIUS + 3.4
const VIEW_SAFE_ZONE_SCALE = 0.78
const Z_LANE_EXTENT = TERRAIN_CONSTANTS.depth * TERRAIN_WORLD_SCALE.z * 0.1
const Z_SEARCH_OFFSETS = [-16, -8, 0, 8, 16]
const MAX_FEATURE_DELTA = 22
const EDGE_PADDING_RATIO = 0.08

const FOCUSED_SCALE = 1.25
const STORY_INITIAL_DELAY = 1.0
const STORY_PER_KPI = 1.1

const MARKER_LABELS: Partial<Record<KpiKey, string>> = {
  cash: "Liquidity Basin",
  runway: "Runway Horizon",
  growth: "Growth Gradient",
  revenue: "Revenue Flow",
  burn: "Burn Zone",
  enterpriseValue: "Value Summit",
}

const KPI_Z_LANES: Partial<Record<KpiKey, number>> = {
  cash: -18,
  runway: 16,
  growth: -10,
  revenue: 10,
  burn: -16,
  enterpriseValue: 18,
}

export default function TerrainKpiMarkers({
  terrainRef,
  focusedKpi,
  onFocusKpi,
  onClickKpi,
  onFocusedMarkerScreen,
  kpis,
  revealedKpis,
  visible,
}: Props) {
  const markers = useMemo(() => {
    if (!kpis || !visible) return []
    return PRIMARY_KPI_KEYS.filter((k) => revealedKpis.has(k)).map((key, idx) => {
      const anchor = PRIMARY_ANCHOR_POSITIONS.get(key)
      const zone = KPI_ZONE_MAP[key]
      const color = KPI_CATEGORY_COLORS[key]
      const cx = anchor?.cx ?? 0.5
      const health = getHealthLevel(key, kpis)
      const visibleWorldWidth = TERRAIN_CONSTANTS.width * TERRAIN_WORLD_SCALE.x * VIEW_SAFE_ZONE_SCALE
      const worldX = (cx - 0.5) * visibleWorldWidth
      const zoneStartX = (zone.xStart - 0.5) * visibleWorldWidth
      const zoneEndX = (zone.xEnd - 0.5) * visibleWorldWidth
      return {
        key,
        worldX,
        zoneStartX,
        zoneEndX,
        preferredZ: KPI_Z_LANES[key] ?? 0,
        preferValley: health === "critical" || health === "watch",
        color,
        storyIndex: idx,
      }
    })
  }, [kpis, revealedKpis, visible])

  const storylineClockStart = useRef(-1)
  const prevKpiHash = useRef("")

  const kpiHash = useMemo(() => {
    if (!kpis) return ""
    return `${kpis.cashOnHand}|${kpis.runwayMonths}|${kpis.growthRatePct}|${kpis.revenueMonthly}|${kpis.burnMonthly}|${kpis.valuationEstimate}`
  }, [kpis])

  useEffect(() => {
    if (markers.length > 0 && kpiHash && prevKpiHash.current !== kpiHash) {
      prevKpiHash.current = kpiHash
      storylineClockStart.current = -1
    }
  }, [markers.length, kpiHash])

  if (!visible || markers.length === 0) return null

  return (
    <group name="kpi-terrain-markers">
      {markers.map((m) => (
        <SignalBeacon
          key={m.key}
          kpiKey={m.key}
          worldX={m.worldX}
          zoneStartX={m.zoneStartX}
          zoneEndX={m.zoneEndX}
          preferredZ={m.preferredZ}
          preferValley={m.preferValley}
          color={m.color}
          isFocused={focusedKpi === m.key}
          isDimmed={focusedKpi !== null && focusedKpi !== m.key}
          onFocusKpi={onFocusKpi}
          onClickKpi={onClickKpi}
          onFocusedMarkerScreen={onFocusedMarkerScreen}
          storyIndex={m.storyIndex}
          storylineClockStart={storylineClockStart}
          terrainRef={terrainRef}
        />
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIGNAL BEACON — Slim stem + orb + halo ring + Html label
   Premium institutional marker, no logo, no sprite textures.
   ═══════════════════════════════════════════════════════════════ */

function SignalBeacon({
  kpiKey,
  worldX,
  zoneStartX,
  zoneEndX,
  preferredZ,
  preferValley,
  color,
  isFocused,
  isDimmed = false,
  onFocusKpi,
  onClickKpi,
  onFocusedMarkerScreen,
  storyIndex,
  storylineClockStart,
  terrainRef,
}: {
  kpiKey: KpiKey
  worldX: number
  zoneStartX: number
  zoneEndX: number
  preferredZ: number
  preferValley: boolean
  color: { hex: string; r: number; g: number; b: number }
  isFocused: boolean
  isDimmed?: boolean
  onFocusKpi?: (kpi: KpiKey | null) => void
  onClickKpi?: (kpi: KpiKey | null) => void
  onFocusedMarkerScreen?: (pos: { x: number; y: number } | null) => void
  storyIndex: number
  storylineClockStart: React.MutableRefObject<number>
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const signalRef = useRef<THREE.Group>(null)
  const stemRef = useRef<THREE.Mesh>(null)
  const orbRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const wasFocusedRef = useRef(false)
  const { camera, gl } = useThree()

  const tintColor = useMemo(() => new THREE.Color(color.r, color.g, color.b), [color])
  const label = MARKER_LABELS[kpiKey] ?? KPI_ZONE_MAP[kpiKey]?.stationName ?? kpiKey

  useFrame(({ clock }, delta) => {
    const g = groupRef.current
    if (!g || !terrainRef.current) return

    if (storylineClockStart.current < 0) {
      storylineClockStart.current = clock.elapsedTime
    }

    const storyElapsed = clock.elapsedTime - storylineClockStart.current - STORY_INITIAL_DELAY
    const slotStart = storyIndex * STORY_PER_KPI
    const localT = (storyElapsed - slotStart) / STORY_PER_KPI
    const isStoryActive = localT >= 0 && localT < 1 && !isFocused
    const storyEnvelope = isStoryActive ? Math.sin(localT * Math.PI) : 0

    const zoneWidth = Math.max(20, Math.abs(zoneEndX - zoneStartX))
    const zonePadding = zoneWidth * EDGE_PADDING_RATIO
    const safeZoneStartX = Math.min(zoneStartX, zoneEndX) + zonePadding
    const safeZoneEndX = Math.max(zoneStartX, zoneEndX) - zonePadding
    const sampleWorldX = THREE.MathUtils.clamp(worldX, safeZoneStartX, safeZoneEndX)
    const xSamples = [
      safeZoneStartX,
      safeZoneStartX + (safeZoneEndX - safeZoneStartX) * 0.2,
      safeZoneStartX + (safeZoneEndX - safeZoneStartX) * 0.4,
      sampleWorldX,
      safeZoneStartX + (safeZoneEndX - safeZoneStartX) * 0.6,
      safeZoneStartX + (safeZoneEndX - safeZoneStartX) * 0.8,
      safeZoneEndX,
    ]
    const zSamples = Z_SEARCH_OFFSETS
      .map((offset) => THREE.MathUtils.clamp(preferredZ + offset, -Z_LANE_EXTENT, Z_LANE_EXTENT))

    let bestX = sampleWorldX
    let bestZ = preferredZ
    let bestH = terrainRef.current.getHeightAt(sampleWorldX, preferredZ)
    let bestScore = preferValley ? -bestH : bestH
    const anchorH = bestH

    for (const sampleX of xSamples) {
      for (const sampleZ of zSamples) {
        const h = terrainRef.current.getHeightAt(sampleX, sampleZ)
        const xPenalty = Math.abs(sampleX - sampleWorldX) / Math.max(zoneWidth, 1)
        const zPenalty = Math.abs(sampleZ - preferredZ) / Math.max(Z_LANE_EXTENT, 1)
        const featureScore = preferValley ? -h : h
        const elevationPenalty = Math.max(0, Math.abs(h - anchorH) - MAX_FEATURE_DELTA)
        const score = featureScore - xPenalty * 10 - zPenalty * 10 - elevationPenalty * 1.5
        if (score > bestScore) {
          bestScore = score
          bestX = sampleX
          bestZ = sampleZ
          bestH = h
        }
      }
    }

    const t = clock.elapsedTime
    const pulse = 0.5 + 0.5 * Math.sin(t * PULSE_SPEED + worldX * 0.02)

    let yLift: number
    let scale: number

    if (isFocused) {
      yLift = HOVER_LIFT
      scale = FOCUSED_SCALE
    } else if (storyEnvelope > 0.01) {
      yLift = MARKER_LIFT + (HOVER_LIFT - MARKER_LIFT) * storyEnvelope * 0.4
      scale = 1.0 + (FOCUSED_SCALE - 1.0) * storyEnvelope * 0.5
    } else {
      yLift = MARKER_LIFT
      scale = 1.0
    }

    const followLerp = 1 - Math.pow(0.001, delta * 4)
    g.position.x = THREE.MathUtils.lerp(g.position.x, bestX, followLerp)
    g.position.y = THREE.MathUtils.lerp(g.position.y, bestH, followLerp)
    g.position.z = THREE.MathUtils.lerp(g.position.z, bestZ, followLerp)

    const d = camera.position.distanceTo(g.position)
    const distScale = THREE.MathUtils.clamp(d * 0.016, 0.7, 2.2) * scale

    if (signalRef.current) {
      signalRef.current.position.y = yLift
      signalRef.current.scale.setScalar(distScale)
    }

    if (stemRef.current) {
      stemRef.current.position.y = yLift / 2
      stemRef.current.scale.set(1, yLift, 1)
    }

    // Dim factor: when a lens is active and this isn't the focused marker
    const dimFactor = isDimmed ? 0.25 : 1.0

    if (orbRef.current) {
      const mat = orbRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = (0.8 + pulse * (isFocused ? 1.0 : 0.5)) * dimFactor
      mat.opacity = dimFactor < 1 ? 0.35 : 1.0
      mat.transparent = true
    }

    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (0.18 + pulse * 0.12 + storyEnvelope * 0.2) * dimFactor
    }

    if (isFocused && onFocusedMarkerScreen) {
      wasFocusedRef.current = true
      const worldPos = new THREE.Vector3()
      ;(signalRef.current ?? g).getWorldPosition(worldPos)
      const v = worldPos.clone()
      v.project(camera)
      const cw = gl.domElement.clientWidth
      const ch = gl.domElement.clientHeight
      onFocusedMarkerScreen({
        x: (v.x + 1) / 2 * cw,
        y: (-v.y + 1) / 2 * ch,
      })
    }
    if (!isFocused && wasFocusedRef.current) {
      wasFocusedRef.current = false
      onFocusedMarkerScreen?.(null)
    }
  })

  const handleClick = useCallback(
    (e: { stopPropagation?: () => void }) => {
      e.stopPropagation?.()
      onClickKpi?.(kpiKey)
    },
    [kpiKey, onClickKpi],
  )

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = "pointer"
    onFocusKpi?.(kpiKey)
  }, [kpiKey, onFocusKpi])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = ""
    onFocusKpi?.(null)
  }, [onFocusKpi])

  return (
    <group
      ref={groupRef}
      name={`kpi-beacon-${kpiKey}`}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Stem — slim vertical line from terrain to orb */}
      <mesh ref={stemRef}>
        <cylinderGeometry args={[STEM_RADIUS, STEM_RADIUS, 1, 6]} />
        <meshStandardMaterial
          color={tintColor}
          emissive={tintColor}
          emissiveIntensity={0.3}
          transparent
          opacity={isDimmed ? 0.12 : 0.45}
          depthTest
          depthWrite={false}
        />
      </mesh>

      <group ref={signalRef}>
        {/* Orb — signal head */}
        <mesh ref={orbRef} renderOrder={200}>
          <sphereGeometry args={[ORB_RADIUS, 20, 20]} />
          <meshStandardMaterial
            color={tintColor}
            emissive={tintColor}
            emissiveIntensity={0.6}
            metalness={0.25}
            roughness={0.2}
            depthTest
            depthWrite={false}
          />
        </mesh>

        {/* Halo ring — horizontal accent ring around orb */}
        <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={199}>
          <ringGeometry args={[HALO_INNER, HALO_OUTER, 32]} />
          <meshBasicMaterial
            color={tintColor}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthTest
            depthWrite={false}
          />
        </mesh>

        {/* Label — holographic intelligence panel */}
        <Html
          position={[0, LABEL_OFFSET_Y, 0]}
          center
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <div
            ref={labelRef}
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgba(8,22,40,0.85)",
              border: "1px solid #36e2ff",
              color: "#b6f2ff",
              boxShadow: "0 0 18px rgba(0,200,255,0.45)",
              backdropFilter: "blur(6px)",
              fontFamily: "'Inter', system-ui, sans-serif",
              userSelect: "none",
              transition: "box-shadow 0.3s, border-color 0.3s, opacity 0.3s",
              opacity: isDimmed ? 0.2 : 1,
            }}
          >
            {label}
          </div>
        </Html>
      </group>
    </group>
  )
}
