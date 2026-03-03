// src/store/compareStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Store (Phase D1 — God Mode)
//
// IDs only. No results stored here.
// aId = null means "use raw baseline"
// bId = scenario UUID from phase1ScenarioStore
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand"

interface CompareState {
  /** Scenario ID for left (A) side. null = raw baseline */
  aId: string | null
  /** Scenario ID for right (B) side. null = raw baseline */
  bId: string | null
  setAId: (id: string | null) => void
  setBId: (id: string | null) => void
  swap: () => void
}

export const useCompareStore = create<CompareState>()((set) => ({
  aId: null,
  bId: null,
  setAId: (id) => set({ aId: id }),
  setBId: (id) => set({ bId: id }),
  swap: () => set((s) => ({ aId: s.bId, bId: s.aId })),
}))
