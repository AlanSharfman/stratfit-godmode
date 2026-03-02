// src/components/terrain/signals/TerrainSignalsLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Signals Layer (God Mode)
//
// Maps TerrainEvent[] → visual signal components anchored to terrain.
// No detection logic — receives pre-computed events from selector layer.
// Must be mounted inside <Canvas> as a child of TerrainStage.
//
// Signal routing:
//   risk_spike        → RiskSpikeSignal       (thin beam, pulse)
//   liquidity_stress  → LiquidityStressSignal  (low fog, spread)
//   volatility_zone   → VolatilityZoneSignal   (translucent field)
//   growth_inflection → GrowthInflectionSignal  (upward arc glow)
//   probability_shift → ProbabilityShiftSignal  (contour ripple)
//   downside_regime   → DownsideRegimeSignal    (compound risk field)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useCallback, useEffect, useRef, memo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { selectTerrainEvents } from "@/selectors/terrainSelectors"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"
import { useDebugFlags, useDebugSignals } from "@/debug/debugSignals"

import RiskSpikeSignal from "./RiskSpikeSignal"
import LiquidityStressSignal from "./LiquidityStressSignal"
import VolatilityZoneSignal from "./VolatilityZoneSignal"
import GrowthInflectionSignal from "./GrowthInflectionSignal"
import ProbabilityShiftSignal from "./ProbabilityShiftSignal"
import DownsideRegimeSignal from "./DownsideRegimeSignal"

// ── Constants ───────────────────────────────────────────────────

const EVENT_Y_OFFSET = 0.8

// ── Signal component router ────────────────────────────────────

function SignalForEvent({
  event,
  position,
}: {
  event: TerrainEvent
  position: [number, number, number]
}) {
  const { type, severity } = event

  switch (type) {
    case "risk_spike":
      return <RiskSpikeSignal position={position} severity={severity} />
    case "liquidity_stress":
      return <LiquidityStressSignal position={position} severity={severity} />
    case "volatility_zone":
      return <VolatilityZoneSignal position={position} severity={severity} />
    case "growth_inflection":
      return <GrowthInflectionSignal position={position} severity={severity} />
    case "probability_shift":
      return <ProbabilityShiftSignal position={position} severity={severity} />
    case "downside_regime":
      return <DownsideRegimeSignal position={position} severity={severity} />
    default:
      return null
  }
}

// ── Hook: derive events from store via selector ─────────────────

function useTerrainSignalEvents(): {
  events: TerrainEvent[]
  activeScenarioId: string | null
  activeScenarioStatus: string | null
} {
  const { simulationResults, activeScenarioId, activeScenarioStatus } =
    usePhase1ScenarioStore(
      useShallow((s) => {
        const active = s.scenarios.find((sc) => sc.id === s.activeScenarioId)
        if (active?.status === "complete" && active.simulationResults) {
          return {
            simulationResults: active.simulationResults,
            activeScenarioId: s.activeScenarioId,
            activeScenarioStatus: active.status,
          }
        }
        return {
          simulationResults: null,
          activeScenarioId: s.activeScenarioId,
          activeScenarioStatus: active?.status ?? null,
        }
      }),
    )

  const events = useMemo(
    () => selectTerrainEvents(simulationResults),
    [simulationResults],
  )

  return { events, activeScenarioId, activeScenarioStatus }
}

// ── Layer component ─────────────────────────────────────────────

export interface TerrainSignalsLayerProps {
  /** Terrain surface ref — provides getHeightAt for correct Y anchoring */
  terrainRef: React.RefObject<TerrainSurfaceHandle | null>
}

const TerrainSignalsLayer: React.FC<TerrainSignalsLayerProps> = memo(
  ({ terrainRef }) => {
    const { events, activeScenarioId, activeScenarioStatus } =
      useTerrainSignalEvents()

    // ── Debug integration ──
    const { debugHud } = useDebugFlags()
    const setEventsLength = useDebugSignals((s) => s.setEventsLength)
    const setActiveScenario = useDebugSignals((s) => s.setActiveScenario)

    useEffect(() => {
      if (debugHud) {
        setEventsLength(events.length)
        setActiveScenario(activeScenarioId, activeScenarioStatus)
      }
    }, [debugHud, events.length, activeScenarioId, activeScenarioStatus, setEventsLength, setActiveScenario])

    // Console diagnostics
    const prevSnap = useRef<string>("")
    useEffect(() => {
      if (!debugHud) return
      const snap = JSON.stringify({
        signalCount: events.length,
        types: events.map((e) => e.type),
        activeScenarioId,
      })
      if (snap !== prevSnap.current) {
        prevSnap.current = snap
        console.log("[TerrainSignalsLayer]", JSON.parse(snap))
      }
    }, [debugHud, events, activeScenarioId])

    /** Sample terrain Y at (x, z) */
    const getY = useCallback(
      (x: number, z: number) => {
        const terrain = terrainRef.current
        if (terrain) return terrain.getHeightAt(x, z) + EVENT_Y_OFFSET
        return TERRAIN_CONSTANTS.yOffset + EVENT_Y_OFFSET
      },
      [terrainRef],
    )

    // Build signal nodes
    const signalNodes = useMemo(() => {
      if (events.length === 0) return null
      return events.map((evt) => {
        const y = getY(evt.coordinates.x, evt.coordinates.z)
        const pos: [number, number, number] = [evt.coordinates.x, y, evt.coordinates.z]

        if (import.meta.env.DEV) {
          console.warn(
            `[TerrainSignalsLayer] "${evt.type}" sev=${evt.severity.toFixed(2)} → [${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}]`,
          )
        }

        return <SignalForEvent key={evt.id} event={evt} position={pos} />
      })
    }, [events, getY])

    return (
      <group name="TerrainSignalsLayer">
        {signalNodes}
      </group>
    )
  },
)

TerrainSignalsLayer.displayName = "TerrainSignalsLayer"
export default TerrainSignalsLayer
