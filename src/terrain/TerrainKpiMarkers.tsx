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
} from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "./ProgressiveTerrainSurface"
import { TERRAIN_CONSTANTS } from "./terrainConstants"

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

const MARKER_LIFT = 18
const HOVER_LIFT = 26
const STEM_HEIGHT = 14
const ORB_RADIUS = 1.6
const HALO_INNER = ORB_RADIUS + 0.3
const HALO_OUTER = ORB_RADIUS + 1.2
const STEM_RADIUS = 0.04
const PULSE_SPEED = 1.4
const LABEL_OFFSET_Y = ORB_RADIUS + 2.8

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
      const color = KPI_CATEGORY_COLORS[key]
      const cx = anchor?.cx ?? 0.5
      const worldX = (cx - 0.5) * TERRAIN_CONSTANTS.width * 3.0
      return { key, worldX, color, storyIndex: idx }
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
          color={m.color}
          isFocused={focusedKpi === m.key}
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
  color,
  isFocused,
  onFocusKpi,
  onClickKpi,
  onFocusedMarkerScreen,
  storyIndex,
  storylineClockStart,
  terrainRef,
}: {
  kpiKey: KpiKey
  worldX: number
  color: { hex: string; r: number; g: number; b: number }
  isFocused: boolean
  onFocusKpi?: (kpi: KpiKey | null) => void
  onClickKpi?: (kpi: KpiKey | null) => void
  onFocusedMarkerScreen?: (pos: { x: number; y: number } | null) => void
  storyIndex: number
  storylineClockStart: React.MutableRefObject<number>
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const orbRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const hasProjected = useRef(false)
  const { camera, gl } = useThree()

  const tintColor = useMemo(() => new THREE.Color(color.r, color.g, color.b), [color])
  const label = MARKER_LABELS[kpiKey] ?? KPI_ZONE_MAP[kpiKey]?.stationName ?? kpiKey

  useFrame(({ clock }) => {
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

    const terrainH = terrainRef.current.getHeightAt(worldX, 0)
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

    const markerY = terrainH + yLift
    g.position.set(worldX, markerY, 0)

    const d = camera.position.distanceTo(g.position)
    const distScale = THREE.MathUtils.clamp(d * 0.016, 0.7, 2.2) * scale
    g.scale.setScalar(distScale)

    if (orbRef.current) {
      const mat = orbRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.6 + pulse * (isFocused ? 0.8 : 0.35)
    }

    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + pulse * 0.08 + storyEnvelope * 0.15
    }

    if (isFocused && !hasProjected.current && onFocusedMarkerScreen) {
      hasProjected.current = true
      const v = new THREE.Vector3(worldX, markerY, 0)
      v.project(camera)
      const cw = gl.domElement.clientWidth
      const ch = gl.domElement.clientHeight
      onFocusedMarkerScreen({
        x: (v.x + 1) / 2 * cw,
        y: (-v.y + 1) / 2 * ch,
      })
    }
    if (!isFocused && hasProjected.current) {
      hasProjected.current = false
      onFocusedMarkerScreen?.(null)
    }
  })

  const handleClick = useCallback(
    (e: { stopPropagation?: () => void }) => {
      e.stopPropagation?.()
      const target = isFocused ? null : kpiKey
      onClickKpi?.(target)
      onFocusKpi?.(target)
    },
    [onClickKpi, onFocusKpi, kpiKey, isFocused],
  )

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = "pointer"
  }, [])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = ""
  }, [])

  return (
    <group
      ref={groupRef}
      name={`kpi-beacon-${kpiKey}`}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Stem — slim vertical line from terrain to orb */}
      <mesh position={[0, -STEM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[STEM_RADIUS, STEM_RADIUS, STEM_HEIGHT, 6]} />
        <meshStandardMaterial
          color={tintColor}
          emissive={tintColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.45}
          depthTest
          depthWrite={false}
        />
      </mesh>

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

      {/* Label — intelligence overlay tag */}
      <Html
        position={[0, LABEL_OFFSET_Y, 0]}
        center
        style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
      >
        <div
          ref={labelRef}
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "3px 10px",
            borderRadius: 4,
            background: "rgba(6,12,20,0.88)",
            border: `1px solid ${color.hex}40`,
            color: color.hex,
            boxShadow: `0 0 10px ${color.hex}20, 0 3px 12px rgba(0,0,0,0.5)`,
            backdropFilter: "blur(10px)",
            fontFamily: "'Inter', system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  )
}
