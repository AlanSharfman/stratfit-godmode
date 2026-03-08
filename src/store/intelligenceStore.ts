// src/store/intelligenceStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence Lock Store (Phase A10.2)
//
// Event-locked intelligence mode:
//   lockedEventId = null  → auto-primary (selectPrimarySignal)
//   lockedEventId = id    → show only that event's explanation
//
// Set via terrain signal click. Clear via "Return to Auto" button.
// No camera movement. No layout shift.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand"

interface IntelligenceState {
  /** When non-null, overlay shows ONLY the explanation for this event */
  lockedEventId: string | null
  /** Lock overlay to a specific terrain event */
  setLockedEventId: (id: string | null) => void
}

export const useIntelligenceStore = create<IntelligenceState>()((set) => ({
  lockedEventId: null,
  setLockedEventId: (id) => set({ lockedEventId: id }),
}))
