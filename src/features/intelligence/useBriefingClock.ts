// src/features/intelligence/useBriefingClock.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Briefing Clock Store
//
// Zustand store that bridges BriefingDirector (DOM layer) with in-canvas
// R3F components (CinematicCamera, LightingModulatorR3F, OverlayEngine).
//
// BriefingDirector writes clock/state each rAF tick.
// R3F components read via useFrame or selector.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand"
import type { IntelligenceState } from "./intelligenceState"

export interface BriefingClockState {
  /** Current playback time in ms */
  nowMs: number
  /** Whether briefing subsystems are active */
  active: boolean
  /** Whether playback is paused */
  paused: boolean
  /** Current intelligence state */
  state: IntelligenceState
  /** Lighting transition progress 0..1 */
  lightingProgress: number
  /** Writer — called by BriefingDirector each frame */
  update: (nowMs: number, active: boolean, paused: boolean, state: IntelligenceState, lightingProgress: number) => void
  /** Reset to idle defaults */
  reset: () => void
}

export const useBriefingClock = create<BriefingClockState>((set) => ({
  nowMs: 0,
  active: false,
  paused: false,
  state: "idle",
  lightingProgress: 0,
  update: (nowMs, active, paused, state, lightingProgress) => set({ nowMs, active, paused, state, lightingProgress }),
  reset: () => set({ nowMs: 0, active: false, paused: false, state: "idle", lightingProgress: 0 }),
}))
