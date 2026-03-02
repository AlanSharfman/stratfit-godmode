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
import { DEBUG_EVENTS, DEBUG_HUD, useDebugSignals } from "@/debug/debugSignals"
import TerrainEventNode from "./TerrainEventNode"
import type { TerrainEventNodeProps } from "./TerrainEventNode"

// ── Event detection types ───────────────────────────────────────

export type SimulationEventType = "breakeven" | "peakValue" | "riskSpike" | "runwayEnd"

export interface SimulationEvent {
  id: string
  type: SimulationEventType
  /** Month index on the horizon (0-based) */
  month: number
  /** Optional label */
  label?: string
}

// ── Importance mapping ──────────────────────────────────────────

const EVENT_IMPORTANCE: Record<SimulationEventType, number> = {
  breakeven: 0.5,
  peakValue: 0.8,
  riskSpike: 0.7,
  runwayEnd: 1.0,
}

const EVENT_CATEGORY: Record<SimulationEventType, TerrainEventNodeProps["category"]> = {
  breakeven: "positive",
  peakValue: "strategic",
  riskSpike: "risk",
  runwayEnd: "risk",
}

// ── Event detection (deterministic, pure) ───────────────────────

function detectSimulationEvents(
  kpis: { cash: number; monthlyBurn: number; revenue: number; runway: number | null } | null,
  horizonMonths: number,
): SimulationEvent[] {
  if (!kpis) return []

  const events: SimulationEvent[] = []

  // Runway end — if runway < horizon
  const runway = kpis.runway ?? horizonMonths
  if (runway > 0 && runway < horizonMonths) {
    events.push({
      id: "runway-end",
      type: "runwayEnd",
      month: Math.round(runway),
      label: "Cash runway exhausted",
    })
  }

  // Breakeven — if revenue can cover burn within horizon
  if (kpis.revenue > 0 && kpis.monthlyBurn > 0) {
    const gap = kpis.monthlyBurn - kpis.revenue
    if (gap > 0 && kpis.revenue > 0) {
      const monthsToBreakeven = Math.ceil(gap / (kpis.revenue * 0.05))
      if (monthsToBreakeven > 0 && monthsToBreakeven <= horizonMonths) {
        events.push({
          id: "breakeven",
          type: "breakeven",
          month: monthsToBreakeven,
          label: "Projected breakeven",
        })
      }
    }
  }

  // Peak value — place at 60% of horizon (structural marker)
  if (kpis.revenue > 0) {
    events.push({
      id: "peak-value",
      type: "peakValue",
      month: Math.round(horizonMonths * 0.6),
      label: "Peak projected value",
    })
  }

  // Risk spike — if burn ratio is concerning, place at 30% of horizon
  if (kpis.monthlyBurn > 0 && kpis.revenue > 0) {
    const burnRatio = kpis.monthlyBurn / kpis.revenue
    if (burnRatio > 1.5) {
      events.push({
        id: "risk-spike",
        type: "riskSpike",
        month: Math.round(horizonMonths * 0.3),
        label: "Elevated burn risk",
      })
    }
  }

  return events
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

function eventToTerrainXZ(
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

// ── Selector: pull events from store ────────────────────────────

function useSimulationEvents(): {
  events: SimulationEvent[]
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
    () => detectSimulationEvents(kpis, horizonMonths),
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
      useSimulationEvents()
    const [focusedId, setFocusedId] = useState<string | null>(null)

    // ── Publish debug signals to HUD store ──
    const setEventsLength = useDebugSignals((s) => s.setEventsLength)
    const setActiveScenario = useDebugSignals((s) => s.setActiveScenario)

    useEffect(() => {
      if (DEBUG_HUD) {
        setEventsLength(events.length)
        setActiveScenario(activeScenarioId, activeScenarioStatus)
      }
    }, [
      events.length,
      activeScenarioId,
      activeScenarioStatus,
      setEventsLength,
      setActiveScenario,
    ])

    // ── STEP 4: Console proof — only log when values change ──
    const prevSnap = useRef<string>("")
    useEffect(() => {
      if (!DEBUG_HUD) return
      const terrReady = !!terrainRef.current
      const snap = JSON.stringify({
        debugEvents: DEBUG_EVENTS,
        terrainReady: terrReady,
        eventsLen: events.length,
        activeScenarioId,
        activeScenarioStatus,
      })
      if (snap !== prevSnap.current) {
        prevSnap.current = snap
        console.log("[TerrainEventLayer]", JSON.parse(snap))
      }
    }, [events.length, activeScenarioId, activeScenarioStatus, terrainRef])

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
        const { x, z } = eventToTerrainXZ(evt.month, horizonMonths)
        const y = getY(x, z)
        if (import.meta.env.DEV) {
          console.warn(
            `[TerrainEventLayer] node "${evt.type}" → x=${x.toFixed(1)} y=${y.toFixed(1)} z=${z.toFixed(1)}`,
          )
        }
        return (
          <TerrainEventNode
            key={evt.id}
            eventId={evt.id}
            position={[x, y, z]}
            importance={EVENT_IMPORTANCE[evt.type]}
            category={EVENT_CATEGORY[evt.type]}
            isFocused={focusedId === evt.id}
            onFocusChange={handleFocusChange}
          />
        )
      })
    }, [events, horizonMonths, getY, focusedId, handleFocusChange])

    // ── STEP 2: HUGE debug objects — always render when ?debugEvents ──
    // NOT gated by terrainReady or events.length.
    // Giant hotpink box at [0, 40, 0] visible from ANY camera angle.
    const debugMarkers = useMemo(() => {
      if (!DEBUG_EVENTS) return null
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
            importance={1}
            category="risk"
            isFocused={true}
            eventId="__debug_forced__"
          />

          {/* Terrain-anchored debug pillar (uses getY when terrain is ready) */}
          <TerrainEventNode
            position={[0, getY(0, 0), 0]}
            importance={0.8}
            category="info"
            isFocused={false}
            eventId="__debug_terrain_anchored__"
          />
        </>
      )
    }, [getY])

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
