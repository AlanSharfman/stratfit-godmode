// src/components/terrain/signals/TerrainSignalsLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Signals Layer (Phase A8 — God Mode)
//
// Institutional Signal System:
//   1. Pulls engine-generated TerrainEvent[] via selector (pass-through)
//   2. Applies deterministic clutter governor (priority, caps, merge, fade)
//   3. Routes curated events → signal primitives with shared clock
//
// No detection logic. No per-signal RAF. One global animation clock.
// Must be mounted inside <Canvas> as a child of TerrainStage.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useCallback, useEffect, useRef, memo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { selectTerrainEvents } from "@/selectors/terrainSelectors"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import type { TerrainEvent, TerrainEventType } from "@/domain/events/terrainEventTypes"
import { useDebugFlags, useDebugSignals } from "@/debug/debugSignals"

import { signalParamsByType, perTypeCap, MAX_SIGNALS, computeSignalIntensity } from "./signalStyle"
import { useSignalClock } from "./useSignalClock"

import RiskSpikeBeam from "./primitives/RiskSpikeBeam"
import LiquidityStressField from "./primitives/LiquidityStressField"
import VolatilityField from "./primitives/VolatilityField"
import GrowthArc from "./primitives/GrowthArc"
import ProbabilityRipple from "./primitives/ProbabilityRipple"
import DownsideShadow from "./primitives/DownsideShadow"

// ── Constants ───────────────────────────────────────────────────

const EVENT_Y_OFFSET = 0.8
const NEAR_MONTH_WINDOW = 2 // merge same-type events within this window

// ── Clutter governor ────────────────────────────────────────────

interface CuratedEvent {
  event: TerrainEvent
  intensity: number
  alphaMultiplier: number
}

function curateEvents(events: TerrainEvent[]): CuratedEvent[] {
  if (events.length === 0) return []

  // 1) Compute intensity for each event
  const withIntensity = events.map((e) => ({
    event: e,
    intensity: computeSignalIntensity(e.severity, e.probabilityImpact),
  }))

  // 2) Merge near-month duplicates (same type within NEAR_MONTH_WINDOW)
  const merged: typeof withIntensity = []
  const sorted = [...withIntensity].sort((a, b) => {
    const pa = signalParamsByType[a.event.type].priority
    const pb = signalParamsByType[b.event.type].priority
    if (pa !== pb) return pb - pa
    if (a.intensity !== b.intensity) return b.intensity - a.intensity
    return a.event.timestamp - b.event.timestamp
  })

  for (const item of sorted) {
    const existing = merged.find(
      (m) =>
        m.event.type === item.event.type &&
        Math.abs(m.event.timestamp - item.event.timestamp) <= NEAR_MONTH_WINDOW,
    )
    if (existing) {
      // Keep higher intensity
      if (item.intensity > existing.intensity) {
        const idx = merged.indexOf(existing)
        merged[idx] = item
      }
      continue
    }
    merged.push(item)
  }

  // 3) Apply per-type caps
  const typeCounts: Partial<Record<TerrainEventType, number>> = {}
  const capped: typeof merged = []
  for (const item of merged) {
    const cap = perTypeCap[item.event.type]
    const count = typeCounts[item.event.type] ?? 0
    if (count >= cap) continue
    typeCounts[item.event.type] = count + 1
    capped.push(item)
  }

  // 4) Global cap
  const final = capped.slice(0, MAX_SIGNALS)

  // 5) Fade stacking: alphaMultiplier = clamp01(1 - rank*0.06)
  return final.map((item, i) => ({
    event: item.event,
    intensity: item.intensity,
    alphaMultiplier: Math.max(0, Math.min(1, 1 - i * 0.06)),
  }))
}

// ── Signal component router (new primitives) ────────────────────

function SignalForEvent({
  event,
  position,
  intensity,
  alpha,
  clock,
}: {
  event: TerrainEvent
  position: [number, number, number]
  intensity: number
  alpha: number
  clock: React.RefObject<{ t: number; dt: number }>
}) {
  switch (event.type) {
    case "risk_spike":
      return <RiskSpikeBeam position={position} intensity={intensity} alpha={alpha} clock={clock} />
    case "liquidity_stress":
      return <LiquidityStressField position={position} intensity={intensity} alpha={alpha} clock={clock} />
    case "volatility_zone":
      return <VolatilityField position={position} intensity={intensity} alpha={alpha} clock={clock} />
    case "growth_inflection":
      return <GrowthArc position={position} intensity={intensity} alpha={alpha} clock={clock} />
    case "probability_shift":
      return <ProbabilityRipple position={position} intensity={intensity} alpha={alpha} clock={clock} />
    case "downside_regime":
      return <DownsideShadow position={position} intensity={intensity} alpha={alpha} clock={clock} />
    default:
      return null
  }
}

// ── Hook: read events from store via selector ───────────────────

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

    // Single global animation clock — all primitives consume this ref
    const clockRef = useSignalClock()

    // ── Clutter governor — deterministic curation ──
    const curated = useMemo(() => curateEvents(events), [events])

    // ── Debug integration ──
    const { debugHud } = useDebugFlags()
    const setEventsLength = useDebugSignals((s) => s.setEventsLength)
    const setActiveScenario = useDebugSignals((s) => s.setActiveScenario)

    useEffect(() => {
      if (debugHud) {
        setEventsLength(curated.length)
        setActiveScenario(activeScenarioId, activeScenarioStatus)
      }
    }, [debugHud, curated.length, activeScenarioId, activeScenarioStatus, setEventsLength, setActiveScenario])

    // Console diagnostics
    const prevSnap = useRef<string>("")
    useEffect(() => {
      if (!debugHud) return
      const snap = JSON.stringify({
        rawCount: events.length,
        curatedCount: curated.length,
        types: curated.map((c) => c.event.type),
        activeScenarioId,
      })
      if (snap !== prevSnap.current) {
        prevSnap.current = snap
        console.log("[TerrainSignalsLayer]", JSON.parse(snap))
      }
    }, [debugHud, events.length, curated, activeScenarioId])

    /** Sample terrain Y at (x, z) — memoized callback */
    const getY = useCallback(
      (x: number, z: number) => {
        const terrain = terrainRef.current
        if (terrain) return terrain.getHeightAt(x, z) + EVENT_Y_OFFSET
        return TERRAIN_CONSTANTS.yOffset + EVENT_Y_OFFSET
      },
      [terrainRef],
    )

    // Build signal nodes — memoized positions + curated events
    const signalNodes = useMemo(() => {
      if (curated.length === 0) return null
      return curated.map((item) => {
        const { event, intensity, alphaMultiplier } = item
        const y = getY(event.coordinates.x, event.coordinates.z)
        const pos: [number, number, number] = [event.coordinates.x, y, event.coordinates.z]

        return (
          <SignalForEvent
            key={event.id}
            event={event}
            position={pos}
            intensity={intensity}
            alpha={alphaMultiplier}
            clock={clockRef}
          />
        )
      })
    }, [curated, getY, clockRef])

    return (
      <group name="TerrainSignalsLayer">
        {signalNodes}
      </group>
    )
  },
)

TerrainSignalsLayer.displayName = "TerrainSignalsLayer"
export default TerrainSignalsLayer
