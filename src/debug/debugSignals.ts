// src/debug/debugSignals.ts
// ═══════════════════════════════════════════════════════════════
// STRATFIT — Debug Signal Store (diagnostic only)
//
// Tiny zustand store that collects runtime flags from Canvas-internal
// components (TerrainStage, TerrainEventLayer) and exposes them to the
// DOM-side PositionDebugHUD.
//
// Gated by ?debugHud=1 — zero overhead in production.
// ═══════════════════════════════════════════════════════════════

import { create } from "zustand"

export const DEBUG_HUD =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debugHud")

export const DEBUG_EVENTS =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debugEvents")

export type DebugSignals = {
  terrainReady: boolean
  pathsOn: boolean
  timelineOn: boolean
  liquidityOn: boolean
  eventsOn: boolean
  eventsLength: number
  activeScenarioId: string | null
  activeScenarioStatus: string | null
  setTerrainReady: (v: boolean) => void
  setPathsOn: (v: boolean) => void
  setOverlayFlags: (flags: { timelineOn: boolean; liquidityOn: boolean; eventsOn: boolean }) => void
  setEventsLength: (v: number) => void
  setActiveScenario: (id: string | null, status: string | null) => void
}

export const useDebugSignals = create<DebugSignals>((set) => ({
  terrainReady: false,
  pathsOn: false,
  timelineOn: false,
  liquidityOn: false,
  eventsOn: false,
  eventsLength: 0,
  activeScenarioId: null,
  activeScenarioStatus: null,
  setTerrainReady: (v) => set({ terrainReady: v }),
  setPathsOn: (v) => set({ pathsOn: v }),
  setOverlayFlags: (flags) => set(flags),
  setEventsLength: (v) => set({ eventsLength: v }),
  setActiveScenario: (id, status) =>
    set({ activeScenarioId: id, activeScenarioStatus: status }),
}))
