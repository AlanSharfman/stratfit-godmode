// src/state/terrainLensStore.ts
// Terrain Lens System — single source of truth for terrain exploration mode.
// Only the bottom explorer bar (TerrainZoneLabels) may toggle the active lens.

import { create } from "zustand"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

/** The 6 primary lenses that map 1-to-1 with PRIMARY_KPI_KEYS */
export type TerrainLens = KpiKey | null

export interface TerrainLensState {
  /** Currently active lens — null means terrain is in idle/overview mode */
  activeLens: TerrainLens
  /** Whether the laser beam connecting pill → marker is visible */
  laserVisible: boolean
  /** Whether the explainer card near the marker is open */
  explainerOpen: boolean
  /** Which terrain marker (stationName) is highlighted */
  highlightedMarker: string | null
  /** Which KPI key is highlighted in the sidebar */
  highlightedKPI: KpiKey | null
}

export interface TerrainLensActions {
  /** Toggle a lens on/off — called ONLY from bottom bar icons */
  toggleLens: (kpi: KpiKey) => void
  /** Clear the active lens (return to overview) */
  clearLens: () => void
}

export const useTerrainLensStore = create<TerrainLensState & TerrainLensActions>()(
  (set, get) => ({
    activeLens: null,
    laserVisible: false,
    explainerOpen: false,
    highlightedMarker: null,
    highlightedKPI: null,

    toggleLens: (kpi) => {
      const current = get().activeLens
      if (current === kpi) {
        // Same lens tapped again → deactivate
        set({
          activeLens: null,
          laserVisible: false,
          explainerOpen: false,
          highlightedMarker: null,
          highlightedKPI: null,
        })
      } else {
        // Activate new lens
        set({
          activeLens: kpi,
          laserVisible: true,
          explainerOpen: true,
          highlightedMarker: kpi,
          highlightedKPI: kpi,
        })
      }
    },

    clearLens: () =>
      set({
        activeLens: null,
        laserVisible: false,
        explainerOpen: false,
        highlightedMarker: null,
        highlightedKPI: null,
      }),
  }),
)
