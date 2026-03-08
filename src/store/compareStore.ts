// src/store/compareStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Store (Phase D1 — God Mode)
//
// IDs only. No results stored here.
// aId/bId/cId = null means "use raw baseline"
// compareCount: 2 or 3 panels
// activePair: which pair drives analytics deltas
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ComparePair = "AB" | "AC" | "BC"
export type CompareViewMode = "split" | "ghost"

interface CompareState {
  /** Scenario ID for A panel. null = raw baseline */
  aId: string | null
  /** Scenario ID for B panel. null = raw baseline */
  bId: string | null
  /** Scenario ID for C panel (3-way only). null = raw baseline */
  cId: string | null
  /** 2 or 3 terrain panels */
  compareCount: 2 | 3
  /** Which pair drives the analytics delta */
  activePair: ComparePair
  /** Split (side-by-side) or Ghost (overlay) view */
  viewMode: CompareViewMode
  /** Remembered C selection when toggling 3→2 */
  _lastCId: string | null

  setAId: (id: string | null) => void
  setBId: (id: string | null) => void
  setCId: (id: string | null) => void
  setCompareCount: (n: 2 | 3) => void
  setActivePair: (pair: ComparePair) => void
  setViewMode: (mode: CompareViewMode) => void
  swap: () => void
  rotate: () => void
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      aId: null,
      bId: null,
      cId: null,
      compareCount: 2,
      activePair: "AB",
      viewMode: "split",
      _lastCId: null,

      setAId: (id) => set({ aId: id }),
      setBId: (id) => set({ bId: id }),
      setCId: (id) => set({ cId: id }),
      setCompareCount: (n) =>
        set((s) => {
          if (n === 3 && s.compareCount === 2) {
            return { compareCount: 3, cId: s._lastCId }
          }
          if (n === 2 && s.compareCount === 3) {
            return {
              compareCount: 2,
              _lastCId: s.cId,
              activePair: s.activePair === "AC" || s.activePair === "BC" ? "AB" : s.activePair,
            }
          }
          return { compareCount: n }
        }),
      setActivePair: (pair) => set({ activePair: pair }),
      setViewMode: (mode) => set({ viewMode: mode }),
      swap: () => set((s) => ({ aId: s.bId, bId: s.aId })),
      rotate: () => set((s) => ({ aId: s.bId, bId: s.cId, cId: s.aId })),
    }),
    {
      name: "stratfit-compare-v1",
      // Persist only data fields — not action functions
      partialize: (s) => ({
        aId:          s.aId,
        bId:          s.bId,
        cId:          s.cId,
        compareCount: s.compareCount,
        activePair:   s.activePair,
        viewMode:     s.viewMode,
        _lastCId:     s._lastCId,
      }),
    },
  ),
)
