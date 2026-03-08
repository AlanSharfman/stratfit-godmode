// src/components/terrain/events/TerrainEventLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Event Layer (RENDER ONLY — Phase A7)
//
// Group renderer that maps engine-generated TerrainEvent[] to
// TerrainEventNode positions. Events come from SimulationResults.events
// via selectTerrainEvents (pass-through selector). NO detection logic here.
//
// Must be mounted inside <Canvas> as a child of TerrainStage.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { selectTerrainEvents } from "@/selectors/terrainSelectors"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import type { TerrainEvent, TerrainEventType } from "@/domain/events/terrainEventTypes"
import { useDebugFlags, useDebugSignals } from "@/debug/debugSignals"
import TerrainEventNode from "./TerrainEventNode"
import type { TerrainEventNodeProps } from "./TerrainEventNode"

// ── Visual mapping ──────────────────────────────────────────────

const EVENT_CATEGORY: Record<TerrainEventType, TerrainEventNodeProps["category"]> = {
  risk_spike: "risk",
  liquidity_stress: "risk",
  volatility_zone: "info",
  growth_inflection: "positive",
  probability_shift: "strategic",
  downside_regime: "risk",
}

/** Small vertical offset so pillars sit just above terrain surface. */
const EVENT_Y_OFFSET = 0.8

// ── Selector: pull engine-generated events from store ────────────

function useTerrainEvents(): {
  events: TerrainEvent[]
  horizonMonths: number
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

  // Pass-through: events are engine-generated, no derivation
  const events = useMemo(
    () => selectTerrainEvents(simulationResults),
    [simulationResults],
  )

  const horizonMonths = simulationResults?.horizonMonths ?? 24

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
