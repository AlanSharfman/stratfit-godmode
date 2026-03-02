// src/components/terrain/events/TerrainEventLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Event Layer
//
// Group renderer that maps simulation events to TerrainEventNode positions.
// Pulls events from engine signals and distributes them along the terrain
// timeline axis (X). Y is terrain surface height, Z is center.
//
// Must be mounted inside <Canvas> as a child of TerrainStage.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, memo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
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

/**
 * Detect simulation events from Phase1 scenario results.
 * Deterministic: same inputs → same events.
 */
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
      // Simple linear projection: months until revenue ≥ burn
      // Assumes current growth trajectory continues
      const monthsToBreakeven = Math.ceil(gap / (kpis.revenue * 0.05)) // ~5% MoM growth assumption
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

// ── Terrain coordinate mapping ──────────────────────────────────

/** Terrain X spans roughly [-200, 200] for a 24-month horizon */
const TERRAIN_X_MIN = -200
const TERRAIN_X_MAX = 200
const TERRAIN_Z_CENTER = 0
const TERRAIN_BASE_Y = 0

function monthToTerrainX(month: number, horizonMonths: number): number {
  const t = Math.max(0, Math.min(1, month / Math.max(1, horizonMonths)))
  return TERRAIN_X_MIN + t * (TERRAIN_X_MAX - TERRAIN_X_MIN)
}

// ── Selector: pull events from store ────────────────────────────

function useSimulationEvents(): SimulationEvent[] {
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

  return useMemo(
    () => detectSimulationEvents(kpis, horizonMonths),
    [kpis, horizonMonths],
  )
}

// ── Layer component ─────────────────────────────────────────────

export interface TerrainEventLayerProps {
  /** Called when a node gains/loses focus */
  onFocusChange?: (eventId: string | null) => void
}

const TerrainEventLayer: React.FC<TerrainEventLayerProps> = memo(({ onFocusChange }) => {
  const events = useSimulationEvents()
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const handleFocusChange = useCallback(
    (eventId: string | null) => {
      setFocusedId(eventId)
      onFocusChange?.(eventId)
    },
    [onFocusChange],
  )

  if (events.length === 0) return null

  // Determine horizon from events for coordinate mapping
  const maxMonth = Math.max(...events.map((e) => e.month), 24)

  return (
    <group name="terrain-event-layer">
      {events.map((evt) => (
        <TerrainEventNode
          key={evt.id}
          eventId={evt.id}
          position={[
            monthToTerrainX(evt.month, maxMonth),
            TERRAIN_BASE_Y,
            TERRAIN_Z_CENTER,
          ]}
          importance={EVENT_IMPORTANCE[evt.type]}
          category={EVENT_CATEGORY[evt.type]}
          isFocused={focusedId === evt.id}
          onFocusChange={handleFocusChange}
        />
      ))}
    </group>
  )
})

TerrainEventLayer.displayName = "TerrainEventLayer"
export default TerrainEventLayer
