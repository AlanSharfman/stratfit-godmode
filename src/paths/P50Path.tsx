import { Line } from "@react-three/drei"
import * as THREE from "three"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { buildPathGeometry } from "@/terrain/path/PathFacade"
import type { PathSpec } from "@/terrain/path/PathFacade"
import {
  selectRiskIndexSeries,
  selectVarianceSeries,
  selectConfidenceSeries,
} from "@/domain/engine/engineSelectors"
import { useStudioTimelineStore } from "@/stores/studioTimelineStore"

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>
  hoverOffset?: number
  rebuildKey?: string
  /** Engine run id — when wired to the store, drives series lookup */
  runId?: string
  /** A12: emphasis-based visibility — always mounted, opacity control */
  visible?: boolean
  /** Fires with the computed CatmullRom spline when path geometry is ready */
  onPathReady?: (curve: THREE.CatmullRomCurve3) => void
}

const FLAT_FALLBACK_COUNT = 240
/**
 * Max lateral (Z) displacement driven by risk index.
 * Lower = gentler bends, more elegant ribbon trajectory.
 * Was 40 → now 18 to eliminate the "drunk line" effect.
 */
const Z_SCALE = 18

// Tube radius tuned for a proper ribbon corridor feel on the terrain
const TUBE_RADIUS = 0.85
const TUBE_RADIAL = 12
// Glow tube: wider for an ethereal aura halo
const GLOW_RADIUS = 3.5
// Ribbon: flat translucent strip along the spline for ground-shadow effect
const RIBBON_RADIUS = 2.8
const RIBBON_RADIAL = 4

function subsample(pts: THREE.Vector3[], targetCount: number): THREE.Vector3[] {
  if (pts.length <= targetCount) return pts
  const step = (pts.length - 1) / (targetCount - 1)
  return Array.from({ length: targetCount }, (_, i) => pts[Math.round(i * step)])
}

export default function P50Path({
  terrainRef,
  hoverOffset = 0.8,
  rebuildKey,
  runId = "",
  visible = true,
  onPathReady,
}: Props) {
  const [points, setPoints] = useState<THREE.Vector3[]>([])
  const tubeMat = useRef<THREE.MeshStandardMaterial>(null)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null)

  const engineResults = useStudioTimelineStore((s) => s.engineResults)

  const x0 = useMemo(() => -TERRAIN_CONSTANTS.width * 0.36, [])
  const x1 = useMemo(() => TERRAIN_CONSTANTS.width * 0.36, [])

  useEffect(() => {
    const terrain = terrainRef.current
    if (!terrain) return

    // Prefer real engine timeline data when available
    const timeline = engineResults?.timeline
    const hasTimeline = timeline && timeline.length > 1

    const risk = hasTimeline
      ? timeline.map((p) => p.riskIndex)
      : (selectRiskIndexSeries(runId) as number[])
    const variance = hasTimeline
      ? timeline.map((p) => Math.abs(p.ebitda) / Math.max(1, Math.abs(timeline[0].ebitda || 1)))
      : (selectVarianceSeries(runId) as number[])
    const confidence = hasTimeline
      ? timeline.map((p) => 1 - p.riskIndex)
      : (selectConfidenceSeries(runId) as number[])

    const hasSeries =
      risk.length > 0 && variance.length > 0 && confidence.length > 0
    const count = hasSeries ? risk.length : FLAT_FALLBACK_COUNT

    const trajectoryXZ: Array<{ x: number; z: number }> = []

    if (hasSeries) {
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        const x = x0 + (x1 - x0) * t
        const z = (risk[i] - 0.5) * 2 * Z_SCALE
        trajectoryXZ.push({ x, z })
      }
    } else {
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        trajectoryXZ.push({ x: x0 + (x1 - x0) * t, z: 0 })
      }
    }

    const safeRisk = hasSeries ? risk : new Array<number>(count).fill(0)
    const safeVariance = hasSeries ? variance : new Array<number>(count).fill(0)
    const safeConfidence = hasSeries
      ? confidence
      : new Array<number>(count).fill(1)

    const spec: PathSpec = {
      timeAxis: "MONTHS",
      timeStart: 0,
      timeEnd: count - 1,
      timePoints: count,
      curvatureFrom: "riskIndex",
      envelopeFrom: "variance",
      shadingFrom: "confidence",
      interventionHash: rebuildKey ?? "default",
      explanation: {
        curvature: "Path bends with risk index",
        envelope: "Width reflects variance",
        shading: "Color driven by confidence",
      },
    }

    const geometry = buildPathGeometry(spec, {
      terrainSampler: (x, z) => terrain.getHeightAt(x, z),
      trajectoryXZ,
      metrics: {
        riskIndexSeries: safeRisk,
        varianceSeries: safeVariance,
        confidenceSeries: safeConfidence,
      },
    })

    const next = geometry.points.map(
      (p) => new THREE.Vector3(p.x, p.y + hoverOffset, p.z)
    )

    setPoints(next)
  }, [terrainRef, x0, x1, hoverOffset, rebuildKey, runId, engineResults])

  const ribbonMat = useRef<THREE.MeshBasicMaterial>(null)

  // ── Animate tube glow pulse ────────────────────────────────────
  useFrame(({ clock }) => {
    if (!visible) return
    const t = clock.elapsedTime
    if (tubeMat.current) {
      tubeMat.current.emissiveIntensity = 0.55 + Math.sin(t * 1.2) * 0.18
    }
    if (glowMat.current) {
      glowMat.current.opacity = 0.06 + Math.sin(t * 1.2 + 1.0) * 0.02
    }
    if (ribbonMat.current) {
      ribbonMat.current.opacity = 0.035 + Math.sin(t * 0.8 + 0.5) * 0.01
    }
  })

  // ── Build tube geometries from CatmullRom spline ───────────────
  const { tubeGeo, glowGeo, ribbonGeo, spinePoints } = useMemo(() => {
    if (points.length < 4) return { tubeGeo: null, glowGeo: null, ribbonGeo: null, spinePoints: [] }

    // Fewer control points + higher tension = silk-smooth spline
    const ctrl = subsample(points, 60)
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "catmullrom", 0.6)

    const tubeSeg = 300
    const tubeGeo = new THREE.TubeGeometry(curve, tubeSeg, TUBE_RADIUS, TUBE_RADIAL, false)
    const glowGeo = new THREE.TubeGeometry(curve, tubeSeg, GLOW_RADIUS, TUBE_RADIAL, false)
    // Ribbon: few radial segments for a flat-ish strip, wider than core tube
    const ribbonGeo = new THREE.TubeGeometry(curve, tubeSeg, RIBBON_RADIUS, RIBBON_RADIAL, false)

    // Spine centerline for the crisp bright line on top
    const spinePoints = curve.getPoints(300)

    return { tubeGeo, glowGeo, ribbonGeo, spinePoints }
  }, [points])

  // ── Fire onPathReady when curve is rebuilt ─────────────────────
  useEffect(() => {
    if (!onPathReady || points.length < 4) return
    const ctrl = subsample(points, 60)
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "catmullrom", 0.6)
    onPathReady(curve)
  }, [points, onPathReady])

  if (points.length < 2) return null

  const masterOpacity = visible ? 1 : 0

  return (
    <group renderOrder={15}>
      {/* Ground ribbon — wide, flat, translucent corridor shadow */}
      {ribbonGeo && (
        <mesh geometry={ribbonGeo} renderOrder={11}>
          <meshBasicMaterial
            ref={ribbonMat}
            color="#00D4FF"
            transparent
            opacity={0.04 * masterOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Outer glow halo — wide transparent tube, BackSide for aura */}
      {glowGeo && (
        <mesh geometry={glowGeo} renderOrder={13}>
          <meshBasicMaterial
            ref={glowMat}
            color="#00D4FF"
            transparent
            opacity={0.07 * masterOpacity}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Core tube body — MeshStandard with emissive pulse */}
      {tubeGeo && (
        <mesh geometry={tubeGeo} renderOrder={14}>
          <meshStandardMaterial
            ref={tubeMat}
            color="#00C8F0"
            emissive="#00E0FF"
            emissiveIntensity={0.55}
            transparent
            opacity={0.82 * masterOpacity}
            roughness={0.3}
            metalness={0.1}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Bright spine line — crisp luminous centreline on top of the tube */}
      {spinePoints.length > 1 && (
        <Line
          points={spinePoints}
          color="#DAFAFF"
          lineWidth={1.6}
          transparent
          opacity={0.75 * masterOpacity}
          renderOrder={16}
          depthWrite={false}
        />
      )}
    </group>
  )
}
