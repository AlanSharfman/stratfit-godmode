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
// Each layer reads its own independent flag — no single master guard.
// ═══════════════════════════════════════════════════════════════

import { useRenderFlagsStore } from "@/state/renderFlagsStore"

// ── URL overrides (read once at module load) ──

const _params =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()

/** ?overlays=1 forces all on; ?overlays=0 forces all off */
const URL_OVERLAYS_FORCE: boolean | null = _params.has("overlays")
  ? _params.get("overlays") === "1"
  : null

/** ?debugHud=1 also forces all overlays on */
const URL_DEBUG_HUD = _params.has("debugHud")

export type OverlayVisibility = {
  pathsOn: boolean
  timelineOn: boolean
  liquidityOn: boolean
  eventsOn: boolean
}

/**
 * Read current overlay visibility from renderFlagsStore,
 * with URL force-overrides applied.
 *
 * Usage (inside React component / hook):
 * ```ts
 * const vis = useOverlayVisibility()
 * ```
 *
 * Usage (outside React, snapshot):
 * ```ts
 * const vis = selectOverlayVisibility()
 * ```
 */
export function selectOverlayVisibility(): OverlayVisibility {
  // If URL says force all on / off, that wins
  if (URL_OVERLAYS_FORCE === true || URL_DEBUG_HUD) {
    return { pathsOn: true, timelineOn: true, liquidityOn: true, eventsOn: true }
  }
  if (URL_OVERLAYS_FORCE === false) {
    return { pathsOn: false, timelineOn: false, liquidityOn: false, eventsOn: false }
  }

  // Otherwise read from store (snapshot — for non-React callers)
  const state = useRenderFlagsStore.getState()
  return {
    pathsOn: state.showPaths,
    timelineOn: state.showPaths, // timeline follows paths toggle
    liquidityOn: state.showFlow,
    eventsOn: true, // events always on unless URL forced off
  }
}

/**
 * React hook variant — subscribes to renderFlagsStore changes.
 * Respects URL overrides (which are static per page load).
 */
export function useOverlayVisibility(): OverlayVisibility {
  // URL force takes priority — no store subscription needed
  if (URL_OVERLAYS_FORCE === true || URL_DEBUG_HUD) {
    return { pathsOn: true, timelineOn: true, liquidityOn: true, eventsOn: true }
  }
  if (URL_OVERLAYS_FORCE === false) {
    return { pathsOn: false, timelineOn: false, liquidityOn: false, eventsOn: false }
  }

  // Subscribe to store
  const showPaths = useRenderFlagsStore((s) => s.showPaths)
  const showFlow = useRenderFlagsStore((s) => s.showFlow)

  return {
    pathsOn: showPaths,
    timelineOn: showPaths,
    liquidityOn: showFlow,
    eventsOn: true,
  }
}
