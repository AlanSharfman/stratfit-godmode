// src/state/insightRevealStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — LEGACY SHIM (backward compatibility)
//
// All reveal state is now managed by cinematicRevealStore.ts
// This file exists only so stale imports don't break.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand"

interface InsightRevealState {
  revealed: boolean
  startInsightReveal: () => void
  resetReveal: () => void
}

/** @deprecated — use useCinematicRevealStore instead */
export const useInsightRevealStore = create<InsightRevealState>((set) => ({
  revealed: true,
  startInsightReveal: () => set({ revealed: true }),
  resetReveal: () => set({ revealed: false }),
}))
