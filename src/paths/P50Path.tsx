import { Line } from "@react-three/drei"
import * as THREE from "three"
import React, { useEffect, useMemo, useState } from "react"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { buildPathGeometry } from "@/terrain/path/PathFacade"
import type { PathSpec } from "@/terrain/path/PathFacade"
import {
  selectRiskIndexSeries,
  selectVarianceSeries,
  selectConfidenceSeries,
} from "@/domain/engine/engineSelectors"

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>
  hoverOffset?: number
  rebuildKey?: string
  /** Engine run id — when wired to the store, drives series lookup */
  runId?: string
}

const FLAT_FALLBACK_COUNT = 240
const Z_SCALE = 40 // max lateral displacement from risk series

export default function P50Path({
  terrainRef,
  hoverOffset = 0.68,
  rebuildKey,
  runId = "",
}: Props) {
  const [points, setPoints] = useState<THREE.Vector3[]>([])

  const x0 = useMemo(() => -TERRAIN_CONSTANTS.width * 0.36, [])
  const x1 = useMemo(() => TERRAIN_CONSTANTS.width * 0.36, [])

  useEffect(() => {
    const terrain = terrainRef.current
    if (!terrain) return

    // ── Pull analytical series from engine selectors ────────────
    const risk = selectRiskIndexSeries(runId) as number[]
    const variance = selectVarianceSeries(runId) as number[]
    const confidence = selectConfidenceSeries(runId) as number[]

    const hasSeries =
      risk.length > 0 && variance.length > 0 && confidence.length > 0
    const count = hasSeries ? risk.length : FLAT_FALLBACK_COUNT

    // ── Build trajectory XZ ────────────────────────────────────
    const trajectoryXZ: Array<{ x: number; z: number }> = []

    if (hasSeries) {
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        const x = x0 + (x1 - x0) * t
        // Risk-driven lateral displacement
        const z = (risk[i] - 0.5) * 2 * Z_SCALE
        trajectoryXZ.push({ x, z })
      }
    } else {
      // Flat fallback — straight line at z = 0
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        trajectoryXZ.push({ x: x0 + (x1 - x0) * t, z: 0 })
      }
    }

    // ── Safe metric arrays (match trajectory length) ───────────
    const safeRisk = hasSeries ? risk : new Array<number>(count).fill(0)
    const safeVariance = hasSeries ? variance : new Array<number>(count).fill(0)
    const safeConfidence = hasSeries
      ? confidence
      : new Array<number>(count).fill(1)

    // ── Spec + geometry via canonical builder ──────────────────
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

    // ── Convert to THREE.Vector3 with hover offset ─────────────
    const next = geometry.points.map(
      (p) => new THREE.Vector3(p.x, p.y + hoverOffset, p.z)
    )

    setPoints(next)
  }, [terrainRef, x0, x1, hoverOffset, rebuildKey, runId])

  if (points.length < 2) return null

  return (
    <Line
      points={points}
      color="#00E0FF"
      lineWidth={3}
      transparent
      opacity={0.92}
    />
  )
}
