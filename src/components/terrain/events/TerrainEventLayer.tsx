// src/components/terrain/events/TerrainEventLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Event Layer
//
// Group renderer that maps simulation events to TerrainEventNode positions.
// Pulls events from engine signals and distributes them along the terrain
// timeline axis (X). Y is sampled from terrain surface. Z follows P50 meander.
//
// Must be mounted inside <Canvas> as a child of TerrainStage.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import { useDebugFlags, useDebugSignals } from "@/debug/debugSignals"
import TerrainEventNode from "./TerrainEventNode"
import type { TerrainEventNodeProps } from "./TerrainEventNode"

// ── TerrainEvent schema ─────────────────────────────────────────

export type TerrainEventType =
  | "risk_spike"
  | "liquidity_stress"
  | "volatility_zone"
  | "growth_inflection"
  | "probability_shift"
  | "downside_regime"

export interface TerrainEvent {
  id: string
  type: TerrainEventType
  /** Normalised severity 0–1 */
  severity: number
  /** Month-index timestamp on the horizon (0-based) */
  timestamp: number
  /** KPI metric that sourced this event */
  metricSource: string
  /** Human-readable description */
  description: string
  /** Impact on outcome probability (signed, −1…+1) */
  probabilityImpact: number
  /** Pre-computed world-space coordinates */
  coordinates: { x: number; y: number; z: number }
}

// ── Visual mapping ──────────────────────────────────────────────

const EVENT_CATEGORY: Record<TerrainEventType, TerrainEventNodeProps["category"]> = {
  risk_spike: "risk",
  liquidity_stress: "risk",
  volatility_zone: "info",
  growth_inflection: "positive",
  probability_shift: "strategic",
  downside_regime: "risk",
}

// ── Terrain coordinate mapping — matches P50Path + TimelineTicks ──

/** Path X bounds (plane-local). Matches P50Path & TimelineTicks. */
const PATH_X0 = -TERRAIN_CONSTANTS.width * 0.36  // ≈ -201.6
const PATH_X1 = TERRAIN_CONSTANTS.width * 0.36   // ≈ +201.6

/** P50Path meander formula — constants match TimelineTicks exactly. */
const MEANDER_AMP1 = 22
const MEANDER_AMP2 = 9
const MEANDER_W1 = Math.PI * 2 * 1.05
const MEANDER_W2 = Math.PI * 2 * 2.35
const MEANDER_P1 = 0.75
const MEANDER_P2 = 1.9

/** Small vertical offset so pillars sit just above terrain surface. */
const EVENT_Y_OFFSET = 0.8

function monthToTerrainXZ(
  month: number,
  horizonMonths: number,
): { x: number; z: number } {
  const t = Math.max(0, Math.min(1, month / Math.max(1, horizonMonths)))
  const x = PATH_X0 + t * (PATH_X1 - PATH_X0)
  const z =
    Math.sin(t * MEANDER_W1 + MEANDER_P1) * MEANDER_AMP1 +
    Math.sin(t * MEANDER_W2 + MEANDER_P2) * MEANDER_AMP2
  return { x, z }
}

// ── Event detection (deterministic, pure) ───────────────────────

/** Clamp helper */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

function detectTerrainEvents(
  kpis: {
    cash: number
    monthlyBurn: number
    revenue: number
    grossMargin: number
    growthRate: number
    churnRate: number
    runway: number | null
  } | null,
  horizonMonths: number,
): TerrainEvent[] {
  if (!kpis) return []

  const events: TerrainEvent[] = []
  const runway = kpis.runway ?? horizonMonths

  // Helper: build coordinates for a given month
  const coords = (month: number) => {
    const { x, z } = monthToTerrainXZ(month, horizonMonths)
    return { x, y: 0, z } // Y is resolved later by getHeightAt
  }

  // ── risk_spike — burn ratio dangerously high ──
  if (kpis.monthlyBurn > 0 && kpis.revenue > 0) {
    const burnRatio = kpis.monthlyBurn / kpis.revenue
    if (burnRatio > 1.3) {
      const month = Math.round(horizonMonths * 0.3)
      events.push({
        id: "risk-spike",
        type: "risk_spike",
        severity: clamp01((burnRatio - 1.3) / 1.7), // 1.3→0, 3.0→1
        timestamp: month,
        metricSource: "monthlyBurn/revenue",
        description: `Burn ratio ${burnRatio.toFixed(1)}× revenue — elevated operational risk`,
        probabilityImpact: -clamp01((burnRatio - 1.3) / 2),
        coordinates: coords(month),
      })
    }
  }

  // ── liquidity_stress — runway shorter than horizon ──
  if (runway > 0 && runway < horizonMonths) {
    const month = Math.round(runway)
    const severityRaw = 1 - runway / horizonMonths // shorter runway → higher severity
    events.push({
      id: "liquidity-stress",
      type: "liquidity_stress",
      severity: clamp01(severityRaw),
      timestamp: month,
      metricSource: "runway",
      description: `Cash runway exhausted at month ${month} of ${horizonMonths}`,
      probabilityImpact: -clamp01(severityRaw * 0.8),
      coordinates: coords(month),
    })
  }

  // ── volatility_zone — high churn + low margin ──
  if (kpis.churnRate > 0.04 || kpis.grossMargin < 0.4) {
    const churnSev = clamp01((kpis.churnRate - 0.04) / 0.08) // 4%→0, 12%→1
    const marginSev = clamp01((0.5 - kpis.grossMargin) / 0.3)  // 50%→0, 20%→1
    const severity = clamp01(Math.max(churnSev, marginSev))
    if (severity > 0.1) {
      const month = Math.round(horizonMonths * 0.45)
      events.push({
        id: "volatility-zone",
        type: "volatility_zone",
        severity,
        timestamp: month,
        metricSource: "churnRate,grossMargin",
        description: `Volatile unit economics — churn ${(kpis.churnRate * 100).toFixed(1)}%, margin ${(kpis.grossMargin * 100).toFixed(0)}%`,
        probabilityImpact: -severity * 0.3,
        coordinates: coords(month),
      })
    }
  }

  // ── growth_inflection — revenue can outpace burn ──
  if (kpis.revenue > 0 && kpis.monthlyBurn > 0 && kpis.growthRate > 0) {
    const gap = kpis.monthlyBurn - kpis.revenue
    if (gap > 0) {
      const monthsToBreakeven = Math.ceil(
        Math.log(kpis.monthlyBurn / kpis.revenue) / Math.log(1 + kpis.growthRate),
      )
      if (monthsToBreakeven > 0 && monthsToBreakeven <= horizonMonths) {
        events.push({
          id: "growth-inflection",
          type: "growth_inflection",
          severity: clamp01(1 - monthsToBreakeven / horizonMonths),
          timestamp: monthsToBreakeven,
          metricSource: "revenue,growthRate",
          description: `Revenue crosses burn at month ${monthsToBreakeven} (${(kpis.growthRate * 100).toFixed(1)}% MoM growth)`,
          probabilityImpact: clamp01(0.3 + (1 - monthsToBreakeven / horizonMonths) * 0.5),
          coordinates: coords(monthsToBreakeven),
        })
      }
    }
  }

  // ── probability_shift — compound positive signals ──
  const positiveSignals =
    (kpis.growthRate > 0.08 ? 1 : 0) +
    (kpis.grossMargin > 0.6 ? 1 : 0) +
    (kpis.churnRate < 0.03 ? 1 : 0) +
    (runway >= horizonMonths ? 1 : 0)
  if (positiveSignals >= 2) {
    const month = Math.round(horizonMonths * 0.65)
    const severity = clamp01(positiveSignals / 4)
    events.push({
      id: "probability-shift",
      type: "probability_shift",
      severity,
      timestamp: month,
      metricSource: "growthRate,grossMargin,churnRate,runway",
      description: `${positiveSignals}/4 positive signals — outcome probability elevated`,
      probabilityImpact: clamp01(severity * 0.6),
      coordinates: coords(month),
    })
  }

  // ── downside_regime — multiple risk factors compound ──
  const riskFactors =
    (kpis.monthlyBurn > kpis.revenue * 2 ? 1 : 0) +
    (runway < horizonMonths * 0.5 ? 1 : 0) +
    (kpis.churnRate > 0.06 ? 1 : 0) +
    (kpis.grossMargin < 0.3 ? 1 : 0)
  if (riskFactors >= 2) {
    const month = Math.round(horizonMonths * 0.5)
    const severity = clamp01(riskFactors / 4)
    events.push({
      id: "downside-regime",
      type: "downside_regime",
      severity,
      timestamp: month,
      metricSource: "monthlyBurn,runway,churnRate,grossMargin",
      description: `${riskFactors}/4 risk factors active — downside regime`,
      probabilityImpact: -clamp01(severity * 0.7),
      coordinates: coords(month),
    })
  }

  return events
}

// ── Selector: pull events from store ────────────────────────────

function useTerrainEvents(): {
  events: TerrainEvent[]
  horizonMonths: number
  activeScenarioId: string | null
  activeScenarioStatus: string | null
} {
  const { kpis, horizonMonths, activeScenarioId, activeScenarioStatus } =
    usePhase1ScenarioStore(
      useShallow((s) => {
        const active = s.scenarios.find((sc) => sc.id === s.activeScenarioId)
        if (active?.status === "complete" && active.simulationResults) {
          return {
            kpis: active.simulationResults.kpis,
            horizonMonths: active.simulationResults.horizonMonths,
            activeScenarioId: s.activeScenarioId,
            activeScenarioStatus: active.status,
          }
        }
        return {
          kpis: null,
          horizonMonths: 24,
          activeScenarioId: s.activeScenarioId,
          activeScenarioStatus: active?.status ?? null,
        }
      }),
    )

  const events = useMemo(
    () => detectTerrainEvents(kpis, horizonMonths),
    [kpis, horizonMonths],
  )

  return { events, horizonMonths, activeScenarioId, activeScenarioStatus }
}

// ── Layer component ─────────────────────────────────────────────

export interface TerrainEventLayerProps {
  /** Terrain surface ref — provides getHeightAt for correct Y anchoring */
  terrainRef: React.RefObject<TerrainSurfaceHandle | null>
  /** Called when a node gains/loses focus */
  onFocusChange?: (eventId: string | null) => void
}

const TerrainEventLayer: React.FC<TerrainEventLayerProps> = memo(
  ({ terrainRef, onFocusChange }) => {
    const { events, horizonMonths, activeScenarioId, activeScenarioStatus } =
      useTerrainEvents()
    const [focusedId, setFocusedId] = useState<string | null>(null)

    // ── Reactive debug flags from URL ──
    const { debugHud, debugEvents } = useDebugFlags()

    // ── Publish debug signals to HUD store ──
    const setEventsLength = useDebugSignals((s) => s.setEventsLength)
    const setActiveScenario = useDebugSignals((s) => s.setActiveScenario)

    useEffect(() => {
      if (debugHud) {
        setEventsLength(events.length)
        setActiveScenario(activeScenarioId, activeScenarioStatus)
      }
    }, [
      debugHud,
      events.length,
      activeScenarioId,
      activeScenarioStatus,
      setEventsLength,
      setActiveScenario,
    ])

    // ── Console proof — only log when values change and debugHud is on ──
    const prevSnap = useRef<string>("")
    useEffect(() => {
      if (!debugHud) return
      const terrReady = !!terrainRef.current
      const snap = JSON.stringify({
        debugEvents,
        terrainReady: terrReady,
        eventsLen: events.length,
        activeScenarioId,
        activeScenarioStatus,
      })
      if (snap !== prevSnap.current) {
        prevSnap.current = snap
        console.log("[TerrainEventLayer]", JSON.parse(snap))
      }
    }, [debugHud, debugEvents, events.length, activeScenarioId, activeScenarioStatus, terrainRef])

    const handleFocusChange = useCallback(
      (eventId: string | null) => {
        setFocusedId(eventId)
        onFocusChange?.(eventId)
      },
      [onFocusChange],
    )

    /** Sample terrain Y at (x, z) via terrainRef.getHeightAt (matches P50Path). */
    const getY = useCallback(
      (x: number, z: number) => {
        const terrain = terrainRef.current
        if (terrain) return terrain.getHeightAt(x, z) + EVENT_Y_OFFSET
        return TERRAIN_CONSTANTS.yOffset + EVENT_Y_OFFSET
      },
      [terrainRef],
    )

    // Build positioned event nodes (only when events exist)
    const eventNodes = useMemo(() => {
      if (events.length === 0) return null
      return events.map((evt) => {
        const y = getY(evt.coordinates.x, evt.coordinates.z)
        if (import.meta.env.DEV) {
          console.warn(
            `[TerrainEventLayer] node "${evt.type}" sev=${evt.severity.toFixed(2)} → x=${evt.coordinates.x.toFixed(1)} y=${y.toFixed(1)} z=${evt.coordinates.z.toFixed(1)}`,
          )
        }
        return (
          <TerrainEventNode
            key={evt.id}
            eventId={evt.id}
            position={[evt.coordinates.x, y, evt.coordinates.z]}
            severity={evt.severity}
            category={EVENT_CATEGORY[evt.type]}
            description={evt.description}
            isFocused={focusedId === evt.id}
            onFocusChange={handleFocusChange}
          />
        )
      })
    }, [events, getY, focusedId, handleFocusChange])

    // ── HUGE debug objects — always render when ?debugEvents ──
    // NOT gated by terrainReady or events.length.
    // Giant hotpink box at [0, 40, 0] visible from ANY camera angle.
    const debugMarkers = useMemo(() => {
      if (!debugEvents) return null
      return (
        <>
          {/* GIANT hotpink cube — unmissable proof the layer renders */}
          <mesh position={[0, 40, 0]}>
            <boxGeometry args={[20, 20, 20]} />
            <meshStandardMaterial color="hotpink" emissive="hotpink" emissiveIntensity={0.5} />
          </mesh>

          {/* Forced TerrainEventNode — proves node component renders */}
          <TerrainEventNode
            position={[0, 42, 0]}
            severity={1}
            category="risk"
            isFocused={true}
            eventId="__debug_forced__"
          />

          {/* Terrain-anchored debug pillar (uses getY when terrain is ready) */}
          <TerrainEventNode
            position={[0, getY(0, 0), 0]}
            severity={0.8}
            category="info"
            isFocused={false}
            eventId="__debug_terrain_anchored__"
          />
        </>
      )
    }, [debugEvents, getY])

    // NEVER early-return — always render the group so debug markers appear
    return (
      <group name="TerrainEventLayer">
        {debugMarkers}
        {eventNodes}
      </group>
    )
  },
)

TerrainEventLayer.displayName = "TerrainEventLayer"
export default TerrainEventLayer
