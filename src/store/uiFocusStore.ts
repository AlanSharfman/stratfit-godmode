// src/store/uiFocusStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Spatial Resonance Focus Store (Phase C+.4)
//
// Lightweight Zustand store for hover-based spatial resonance.
// NO camera movement. NO terrain morphing. NO layout shifts.
//
// When user hovers a ProbabilityBand or Signal, the store updates.
// Consuming components read focusedMetric / selectedEventId and
// adjust opacity / emissive intensity accordingly.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand"

export type FocusableMetric = "revenue" | "risk" | "runway" | "valuation" | null

interface UiFocusState {
  /** Currently hovered probability band metric */
  focusedMetric: FocusableMetric
  /** Currently hovered signal event id */
  selectedEventId: string | null
  /** Set focused metric (from ProbabilityBand hover) */
  setFocusedMetric: (metric: FocusableMetric) => void
  /** Set selected event id (from Signal hover) */
  setSelectedEventId: (id: string | null) => void
}

export const useUiFocusStore = create<UiFocusState>()((set) => ({
  focusedMetric: null,
  selectedEventId: null,
  setFocusedMetric: (metric) => set({ focusedMetric: metric }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),
}))
