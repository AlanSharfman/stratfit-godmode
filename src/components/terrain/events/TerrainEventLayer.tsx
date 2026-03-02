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

import React, { useState, useCallback, useMemo, memo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { getTerrainHeight } from "@/terrain/terrainHeightSampler"
import TerrainEventNode from "./TerrainEventNode"
import type { TerrainEventNodeProps } from "./TerrainEventNode"

// ── Debug flag — append ?debugEvents to URL to force diagnostic markers ──

const DEBUG_EVENTS =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debugEvents")

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

function useSimulationEvents(): { events: SimulationEvent[]; horizonMonths: number } {
  const { kpis, horizonMonths } = usePhase1ScenarioStore(
    useShallow((s) => {
      const active = s.scenarios.find((sc) => sc.id === s.activeScenarioId)
      if (active?.status === "complete" && active.simulationResults) {
        return {
          kpis: active.simulationResults.kpis,
          horizonMonths: active.simulationResults.horizonMonths,
        }
      }
      return { kpis: null, horizonMonths: 24 }
    }),
  )

  const events = useMemo(
    () => detectSimulationEvents(kpis, horizonMonths),
    [kpis, horizonMonths],
  )

  return { events, horizonMonths }
}

// ── Layer component ─────────────────────────────────────────────

export interface TerrainEventLayerProps {
  /** Called when a node gains/loses focus */
  onFocusChange?: (eventId: string | null) => void
}

const TerrainEventLayer: React.FC<TerrainEventLayerProps> = memo(
  ({ onFocusChange }) => {
    const { events, horizonMonths } = useSimulationEvents()
    const [focusedId, setFocusedId] = useState<string | null>(null)

    const handleFocusChange = useCallback(
      (eventId: string | null) => {
        setFocusedId(eventId)
        onFocusChange?.(eventId)
      },
      [onFocusChange],
    )

    /** Sample terrain Y at (x, z) via standalone height sampler. */
    const getY = useCallback(
      (x: number, z: number) => {
        return getTerrainHeight(x, z) + EVENT_Y_OFFSET
      },
      [],
    )

    // Build positioned event nodes (only when events exist)
    const eventNodes = useMemo(() => {
      if (events.length === 0) return null
      return events.map((evt) => {
        const { x, z } = eventToTerrainXZ(evt.month, horizonMonths)
        const y = getY(x, z)
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

    // ── DEBUG markers (only when ?debugEvents in URL) ────────────
    const debugMarkers = useMemo(() => {
      if (!DEBUG_EVENTS) return null
      const dbg1 = eventToTerrainXZ(6, 24)
      const dbg2 = eventToTerrainXZ(18, 24)
      const y1 = getY(dbg1.x, dbg1.z)
      const y2 = getY(dbg2.x, dbg2.z)
      return (
        <>
          {/* Hotpink cube — highly visible proof the layer renders */}
          <mesh position={[dbg1.x, y1 + 6, dbg1.z]}>
            <boxGeometry args={[4, 4, 4]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>
          {/* Forced TerrainEventNode — verify pillar renders above terrain */}
          <TerrainEventNode
            position={[dbg2.x, y2, dbg2.z]}
            importance={1}
            category="info"
            eventId="__debug_forced__"
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
