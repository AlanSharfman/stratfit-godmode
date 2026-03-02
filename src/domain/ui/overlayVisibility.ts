// src/domain/ui/overlayVisibility.ts
// ═══════════════════════════════════════════════════════════════
// STRATFIT — Canonical Overlay Visibility Selector
//
// Single source-of-truth for which terrain overlays are visible.
// Respects renderFlagsStore toggles UNLESS overridden by URL params:
//   ?overlays=1  → force ALL on
//   ?overlays=0  → force ALL off
//   ?debugHud=1  → also force ALL on (debug mode)
//
// REACTIVE: URL params are read live (no module-scope cache).
// Works inside R3F Canvas and DOM via useSyncExternalStore.
// ═══════════════════════════════════════════════════════════════

import { useSyncExternalStore } from "react"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"

// ── Reactive URL reader (shared with debugSignals.ts pattern) ──

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

/** Parse URL overlay force from a search string. */
function parseUrlOverrides(search: string): { force: boolean | null; debugHud: boolean } {
  const params = new URLSearchParams(search)
  const force = params.has("overlays")
    ? params.get("overlays") === "1"
    : null
  return { force, debugHud: params.has("debugHud") }
}

export type OverlayVisibility = {
  pathsOn: boolean
  timelineOn: boolean
  liquidityOn: boolean
  eventsOn: boolean
}

const ALL_ON: OverlayVisibility = { pathsOn: true, timelineOn: true, liquidityOn: true, eventsOn: true }
const ALL_OFF: OverlayVisibility = { pathsOn: false, timelineOn: false, liquidityOn: false, eventsOn: false }

/**
 * Non-React snapshot — reads URL at call time + store snapshot.
 * Safe for use outside of React components.
 */
export function selectOverlayVisibility(): OverlayVisibility {
  const { force, debugHud } = parseUrlOverrides(getSearchString())
  if (force === true || debugHud) return ALL_ON
  if (force === false) return ALL_OFF

  const state = useRenderFlagsStore.getState()
  return {
    pathsOn: state.showPaths,
    timelineOn: state.showPaths,
    liquidityOn: state.showFlow,
    eventsOn: true,
  }
}

/**
 * React hook — subscribes to both URL changes AND renderFlagsStore.
 * Immediately reactive to ?overlays= and ?debugHud= changes.
 */
export function useOverlayVisibility(): OverlayVisibility {
  const search = useSyncExternalStore(subscribeToLocation, getSearchString, () => "")
  const { force, debugHud } = parseUrlOverrides(search)

  // Always call store hooks unconditionally (Rules of Hooks)
  const showPaths = useRenderFlagsStore((s) => s.showPaths)
  const showFlow = useRenderFlagsStore((s) => s.showFlow)

  // URL force takes priority
  if (force === true || debugHud) return ALL_ON
  if (force === false) return ALL_OFF

  return {
    pathsOn: showPaths,
    timelineOn: showPaths,
    liquidityOn: showFlow,
    eventsOn: true,
  }
}
