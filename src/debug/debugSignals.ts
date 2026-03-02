// src/debug/debugSignals.ts
// ═══════════════════════════════════════════════════════════════
// STRATFIT — Debug Signal Store (diagnostic only)
//
// Tiny zustand store that collects runtime flags from Canvas-internal
// components (TerrainStage, TerrainEventLayer) and exposes them to the
// DOM-side PositionDebugHUD.
//
// Reactive to URL changes — no module-scope URLSearchParams.
// ═══════════════════════════════════════════════════════════════

import { create } from "zustand"
import { useSyncExternalStore } from "react"

// ── Reactive URL flag reader ──────────────────────────────────
// Works inside R3F Canvas, DOM, anywhere — no react-router dependency.

function getSearchString(): string {
  return typeof window !== "undefined" ? window.location.search : ""
}

function subscribeToLocation(cb: () => void): () => void {
  window.addEventListener("popstate", cb)
  window.addEventListener("sf:location-change", cb)
  return () => {
    window.removeEventListener("popstate", cb)
    window.removeEventListener("sf:location-change", cb)
  }
}

/** Reactive hook — reads ?debugHud and ?debugEvents from URL on every navigation. */
export function useDebugFlags(): { debugHud: boolean; debugEvents: boolean } {
  const search = useSyncExternalStore(subscribeToLocation, getSearchString, () => "")
  const params = new URLSearchParams(search)
  return {
    debugHud: params.has("debugHud"),
    debugEvents: params.has("debugEvents"),
  }
}

/** Non-reactive snapshot — reads URL at call time. For use outside React. */
export function getDebugFlags(): { debugHud: boolean; debugEvents: boolean } {
  const params = new URLSearchParams(getSearchString())
  return {
    debugHud: params.has("debugHud"),
    debugEvents: params.has("debugEvents"),
  }
}

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
