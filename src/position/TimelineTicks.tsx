// src/position/TimelineTicks.tsx
// STRATFIT — Temporal Spine (Phase 2.2 revised)
// Arc-length-spaced ticks + graphite rail + dark-glass plaques.
// PATH = luminous cyan (P50Path). TIMELINE = graphite rail + notch ticks.
// Tick t-values are chosen by arc length so months are visually even.

import React, { useEffect, useMemo, useState } from "react"
import { Line, Html } from "@react-three/drei"
import * as THREE from "three"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

// ── Public contract ───────────────────────────────────────────────────────────

export type TimeGranularity = "month" | "quarter" | "year"

type Props = {
  terrainRef:     React.RefObject<TerrainSurfaceHandle>
  granularity?:   TimeGranularity
  horizonMonths?: number
  rebuildKey?:    string
}

// ── Internal types ────────────────────────────────────────────────────────────

type TickWeight = "major" | "medium" | "minor"

type TickDef = {
  /** arc-length-resolved path parameter 0..1 */
  t:          number
  label:      string
  weight:     TickWeight
  showLabel:  boolean
}

type TickGeom = TickDef & {
  railPt: THREE.Vector3
  notchA: THREE.Vector3
  notchB: THREE.Vector3
}

// ── Spatial constants ─────────────────────────────────────────────────────────

const HOVER         = 0.68   // match P50Path
const AXIS_LIFT     = 6.0    // vertical offset above path into axis band
const LATERAL_SHIFT = 0.0    // no lateral offset — keep spine on path centre
const RAIL_SAMPLES  = 200    // polyline resolution
const ARC_LUT_N     = 400    // arc-length LUT resolution

const NOTCH: Record<TickWeight, number> = {
  major:  9.0,
  medium: 6.0,
  minor:  3.5,
}

// ── Colour palette — steel/graphite, NOT cyan ────────────────────────────────

const COL_RAIL         = "#2E4A58"   // dark graphite-steel
const COL_TICK_MAJOR   = "#A4BEC8"
const COL_TICK_MEDIUM  = "#638090"
const COL_TICK_MINOR   = "#2E4A58"

const OPACITY_TICK: Record<TickWeight, number> = {
  major:  0.85,
  medium: 0.58,
  minor:  0.28,
}
const LINEWIDTH_TICK: Record<TickWeight, number> = {
  major:  1.5,
  medium: 0.9,
  minor:  0.55,
}

// ── Calendar reference ────────────────────────────────────────────────────────

const REF_MONTH  = 1      // 0-indexed Feb
const REF_YEAR   = 2026
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// ── P50 path formula (mirrors P50Path.tsx exactly) ──────────────────────────

function _lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function samplePathXZ(t: number, x0: number, x1: number) {
  const amp1 = 22, amp2 = 9
  const w1   = Math.PI * 2 * 1.05, w2 = Math.PI * 2 * 2.35
  const p1   = 0.75, p2 = 1.9
  return {
    x: _lerp(x0, x1, t),
    z: Math.sin(t * w1 + p1) * amp1 + Math.sin(t * w2 + p2) * amp2,
  }
}

function perpAtT(t: number, x0: number, x1: number) {
  const dt = 0.002
  const a  = samplePathXZ(Math.max(0, t - dt), x0, x1)
  const b  = samplePathXZ(Math.min(1, t + dt), x0, x1)
  const tx = b.x - a.x, tz = b.z - a.z
  const len = Math.sqrt(tx * tx + tz * tz) || 1
  return { dx: -tz / len, dz: tx / len }
}

// ── Arc-length LUT ────────────────────────────────────────────────────────────

/** Returns LUT: array of { t, cumDist } with arc increments computed in XZ. */
function buildArcLUT(x0: number, x1: number, n: number) {
  const lut: { t: number; cumDist: number }[] = []
  let cum = 0
  let prev = samplePathXZ(0, x0, x1)
  lut.push({ t: 0, cumDist: 0 })
  for (let i = 1; i <= n; i++) {
    const t    = i / n
    const cur  = samplePathXZ(t, x0, x1)
    const dx   = cur.x - prev.x
    const dz   = cur.z - prev.z
    cum += Math.sqrt(dx * dx + dz * dz)
    lut.push({ t, cumDist: cum })
    prev = cur
  }
  return lut
}

/**
 * Find the path t-value that corresponds to targetDist along arc length.
 * Uses binary-search-style scan through LUT.
 */
function tAtArcDist(lut: { t: number; cumDist: number }[], targetDist: number): number {
  const total = lut[lut.length - 1].cumDist
  const dist  = Math.max(0, Math.min(total, targetDist))
  for (let i = 1; i < lut.length; i++) {
    if (lut[i].cumDist >= dist) {
      const lo  = lut[i - 1]
      const hi  = lut[i]
      const seg = hi.cumDist - lo.cumDist
      if (seg < 1e-9) return lo.t
      const frac = (dist - lo.cumDist) / seg
      return lo.t + frac * (hi.t - lo.t)
    }
  }
  return 1
}

// ── Label formatting ──────────────────────────────────────────────────────────

function formatLabel(m: number, granularity: TimeGranularity): string {
  const abs        = REF_MONTH + m
  const yearOffset = Math.floor(abs / 12)
  const monthIdx   = ((abs % 12) + 12) % 12
  const year       = REF_YEAR + yearOffset
  if (granularity === "year")    return String(year)
  if (granularity === "quarter") return `Q${Math.floor(monthIdx / 3) + 1} ${year}`
  return `${MONTH_ABBR[monthIdx]} ${String(year).slice(2)}`
}

// ── Tick definitions using arc-length-resolved t-values ──────────────────────

function buildTickDefs(
  horizonMonths: number,
  granularity: TimeGranularity,
  arcLut: { t: number; cumDist: number }[]
): TickDef[] {
  const step       = granularity === "month" ? 1 : granularity === "quarter" ? 3 : 12
  const labelEvery = granularity === "month"   ? 3
                   : granularity === "quarter" ? 1
                   : 1
  const maxTicks   = granularity === "year" ? 6 : 10
  const totalArc   = arcLut[arcLut.length - 1].cumDist

  const defs: TickDef[] = []
  let idx = 0

  for (let m = step; m < horizonMonths; m += step) {
    if (defs.length >= maxTicks) break
    const paramT  = m / horizonMonths
    if (paramT > 0.985) break

    // Arc-length-resolved t
    const targetDist = paramT * totalArc
    const arcT       = tAtArcDist(arcLut, targetDist)

    const isYear  = m % 12 === 0
    const isQtr   = m % 3  === 0
    const weight: TickWeight = isYear ? "major" : isQtr ? "medium" : "minor"
    const showLabel = isYear || idx % labelEvery === 0

    defs.push({ t: arcT, label: formatLabel(m, granularity), weight, showLabel })
    idx++
  }

  return defs
}

function autoGranularity(horizonMonths: number): TimeGranularity {
  return horizonMonths <= 12 ? "month" : "quarter"
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TimelineTicks({
  terrainRef,
  granularity: granularityProp,
  horizonMonths = 36,
  rebuildKey,
}: Props) {
  const [railPoints, setRailPoints] = useState<THREE.Vector3[]>([])
  const [ticks, setTicks]           = useState<TickGeom[]>([])

  const x0 = useMemo(() => -TERRAIN_CONSTANTS.width * 0.36, [])
  const x1 = useMemo(() =>  TERRAIN_CONSTANTS.width * 0.36, [])

  const granularity = granularityProp ?? autoGranularity(horizonMonths)

  // Arc-length LUT — recomputed only when path extents change
  const arcLut = useMemo(() => buildArcLUT(x0, x1, ARC_LUT_N), [x0, x1])

  const tickDefs = useMemo(
    () => buildTickDefs(horizonMonths, granularity, arcLut),
    [horizonMonths, granularity, arcLut]
  )

  useEffect(() => {
    const terrain = terrainRef.current
    if (!terrain) return

    // Spine rail
    const rail: THREE.Vector3[] = []
    for (let i = 0; i <= RAIL_SAMPLES; i++) {
      const t        = i / RAIL_SAMPLES
      const { x, z } = samplePathXZ(t, x0, x1)
      const y        = terrain.getHeightAt(x, z) + HOVER + AXIS_LIFT
      rail.push(new THREE.Vector3(x + LATERAL_SHIFT, y, z))
    }
    setRailPoints(rail)

    // Tick geometry
    const nextTicks: TickGeom[] = tickDefs.map((td) => {
      const { x, z }   = samplePathXZ(td.t, x0, x1)
      const { dx, dz } = perpAtT(td.t, x0, x1)
      const y          = terrain.getHeightAt(x, z) + HOVER + AXIS_LIFT
      const half       = NOTCH[td.weight]
      return {
        ...td,
        railPt: new THREE.Vector3(x, y, z),
        notchA: new THREE.Vector3(x - dx * half, y, z - dz * half),
        notchB: new THREE.Vector3(x + dx * half, y, z + dz * half),
      }
    })
    setTicks(nextTicks)
  }, [terrainRef, x0, x1, tickDefs, rebuildKey])

  if (railPoints.length < 2) return null

  return (
    <group name="temporal-spine">

      {/* Spine rail — graphite, clearly not the cyan P50 path */}
      <Line
        points={railPoints}
        color={COL_RAIL}
        lineWidth={0.9}
        transparent
        opacity={0.42}
      />

      {ticks.map((tick, i) => (
        <React.Fragment key={`sp-${i}`}>

          {/* Perpendicular notch */}
          <Line
            points={[tick.notchA, tick.notchB]}
            color={
              tick.weight === "major"  ? COL_TICK_MAJOR  :
              tick.weight === "medium" ? COL_TICK_MEDIUM :
              COL_TICK_MINOR
            }
            lineWidth={LINEWIDTH_TICK[tick.weight]}
            transparent
            opacity={OPACITY_TICK[tick.weight]}
          />

          {/* Label plaque — dark glass, readable at default camera */}
          {tick.showLabel && (
            <Html
              position={[tick.railPt.x, tick.railPt.y + 4.0, tick.railPt.z]}
              center
              zIndexRange={[10, 20]}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <div style={{
                display:       "inline-block",
                background:    "rgba(6,10,14,0.80)",
                border:        `1px solid ${
                  tick.weight === "major"
                    ? "rgba(210,228,240,0.22)"
                    : "rgba(160,190,208,0.12)"
                }`,
                borderRadius:  "4px",
                padding:       tick.weight === "major" ? "4px 8px" : "3px 6px",
                fontFamily:    "ui-monospace,'JetBrains Mono','Consolas',monospace",
                fontSize:      tick.weight === "major" ? "13px" : "11px",
                fontWeight:    tick.weight === "major" ? 700 : 400,
                letterSpacing: "0.07em",
                color:         tick.weight === "major" ? "#E8F4FF" : "#B0CCDA",
                whiteSpace:    "nowrap",
                lineHeight:    "1.1",
                textTransform: "uppercase" as const,
              }}>
                {tick.label}
              </div>
            </Html>
          )}

        </React.Fragment>
      ))}

    </group>
  )
}
