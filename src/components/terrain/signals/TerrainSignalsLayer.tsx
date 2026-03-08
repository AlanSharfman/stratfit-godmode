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
import { useUiFocusStore } from "@/store/uiFocusStore"
import { useCommandStore, MODE_EMPHASIS } from "@/store/commandStore"
import { useIntelligenceStore } from "@/store/intelligenceStore"

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
  resonanceBoost,
  onSignalClick,
}: {
  event: TerrainEvent
  position: [number, number, number]
  intensity: number
  alpha: number
  clock: React.RefObject<{ t: number; dt: number }>
  resonanceBoost: number
  onSignalClick?: () => void
}) {
  const effectiveIntensity = Math.min(1, intensity * (1 + resonanceBoost * 0.15))
  const effectiveAlpha = Math.min(1, alpha * (1 + resonanceBoost * 0.1))

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    onSignalClick?.()
  }, [onSignalClick])

  let primitive: React.ReactNode = null
  switch (event.type) {
    case "risk_spike":
      primitive = <RiskSpikeBeam position={position} intensity={effectiveIntensity} alpha={effectiveAlpha} clock={clock} />
      break
    case "liquidity_stress":
      primitive = <LiquidityStressField position={position} intensity={effectiveIntensity} alpha={effectiveAlpha} clock={clock} />
      break
    case "volatility_zone":
      primitive = <VolatilityField position={position} intensity={effectiveIntensity} alpha={effectiveAlpha} clock={clock} />
      break
    case "growth_inflection":
      primitive = <GrowthArc position={position} intensity={effectiveIntensity} alpha={effectiveAlpha} clock={clock} />
      break
    case "probability_shift":
      primitive = <ProbabilityRipple position={position} intensity={effectiveIntensity} alpha={effectiveAlpha} clock={clock} />
      break
    case "downside_regime":
      primitive = <DownsideShadow position={position} intensity={effectiveIntensity} alpha={effectiveAlpha} clock={clock} />
      break
  }
  if (!primitive) return null
  // Wrap in invisible click target — no camera movement, no re-render of terrain
  return (
    <group onClick={handleClick}>
      {primitive}
    </group>
  )
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
  /** When provided, uses these events instead of reading from the active scenario store */
  overrideEvents?: TerrainEvent[]
}

const TerrainSignalsLayer: React.FC<TerrainSignalsLayerProps> = memo(
  ({ terrainRef, overrideEvents }) => {
    const storeData = useTerrainSignalEvents()
    const events = overrideEvents ?? storeData.events
    const { activeScenarioId, activeScenarioStatus } = storeData

    // Spatial resonance — read selectedEventId from uiFocusStore
    const selectedEventId = useUiFocusStore((s) => s.selectedEventId)

    // A10.2 — Intelligence lock: click signal → lock overlay to that event
    const setLockedEventId = useIntelligenceStore((s) => s.setLockedEventId)

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

    // ── Command mode emphasis — adjust intensity/opacity per mode ──
    const commandMode = useCommandStore((s) => s.currentMode)
    const emphasizedTypes = MODE_EMPHASIS[commandMode]
    const hasEmphasis = emphasizedTypes.length > 0

    // Build signal nodes — memoized positions + curated events
    const signalNodes = useMemo(() => {
      if (curated.length === 0) return null
      return curated.map((item) => {
        const { event, intensity, alphaMultiplier } = item
        const y = getY(event.coordinates.x, event.coordinates.z)
        const pos: [number, number, number] = [event.coordinates.x, y, event.coordinates.z]
        const resonanceBoost = selectedEventId === event.id ? 1 : 0

        // Command mode emphasis: boost emphasized types, dim others
        let modeIntensity = intensity
        let modeAlpha = alphaMultiplier
        if (hasEmphasis) {
          if (emphasizedTypes.includes(event.type)) {
            modeIntensity = Math.min(1, intensity * 1.3)
            modeAlpha = Math.min(1, alphaMultiplier * 1.2)
          } else {
            modeIntensity = intensity * 0.35
            modeAlpha = alphaMultiplier * 0.3
          }
        }

        return (
          <SignalForEvent
            key={event.id}
            event={event}
            position={pos}
            intensity={modeIntensity}
            alpha={modeAlpha}
            clock={clockRef}
            resonanceBoost={resonanceBoost}
            onSignalClick={() => setLockedEventId(event.id)}
          />
        )
      })
    }, [curated, getY, clockRef, selectedEventId, hasEmphasis, emphasizedTypes, setLockedEventId])

    return (
      <group name="TerrainSignalsLayer">
        {signalNodes}
      </group>
    )
  },
)

TerrainSignalsLayer.displayName = "TerrainSignalsLayer"
export default TerrainSignalsLayer
