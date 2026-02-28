// src/state/cinematicRevealStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Reveal Store (SINGLE SOURCE OF TRUTH)
//
// Manages the entire cinematic sequence:
//   idle → micro_settle → blur_in → panel_in → typewriter → signals → blur_out → restore
//
// Rules:
//   • Sequence triggers ONLY when simulationStatus === "completed"
//   • Runs ONCE per runId (no repeats on re-render)
//   • All consumers read revealPhase; timeline is driven by InsightRevealController
//   • Feature-flagged via ENABLE_CINEMATIC_SYNC
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand"

/* ── Feature flag ── */
export const ENABLE_CINEMATIC_SYNC = true

/* ── Phase type ── */
export type RevealPhase =
  | "idle"
  | "micro_settle"
  | "blur_in"
  | "panel_in"
  | "typewriter"
  | "signals"
  | "intel_breakout"   // panel lifts from dock, traverses toward terrain
  | "intel_debrief"    // panel centered over terrain, content visible
  | "intel_retract"    // panel shrinks back to dock
  | "blur_out"
  | "restore"

/* ── Phase durations (ms) ── */
export const PHASE_DURATIONS: Record<RevealPhase, number> = {
  idle: 0,
  micro_settle: 450,
  blur_in: 300,
  panel_in: 260,
  typewriter: 1800, // max cap — can be cut short by onComplete
  signals: 1000,    // ~3 signals × 120ms stagger + settle
  intel_breakout: 600,   // lift + traverse
  intel_debrief: 2800,   // hold over terrain
  intel_retract: 500,    // shrink back
  blur_out: 500,
  restore: 0,       // instant
}

/* ── Phase order (for timeline progression) ── */
export const PHASE_ORDER: RevealPhase[] = [
  "idle",
  "micro_settle",
  "blur_in",
  "panel_in",
  "typewriter",
  "signals",
  "intel_breakout",
  "intel_debrief",
  "intel_retract",
  "blur_out",
  "restore",
]

/* ── State contract ── */
interface CinematicRevealState {
  /** Current phase of the cinematic sequence */
  revealPhase: RevealPhase
  /** Continuous 0..1 progress within current phase */
  revealProgress: number
  /** runId of current reveal (tied to engineResults) */
  revealRunId: number | null
  /** Whether the sequence is actively playing */
  isPlaying: boolean
  /** Whether camera/controls are locked */
  controlsLocked: boolean

  /** Start a new cinematic sequence for a given runId */
  startSequence: (runId: number) => void
  /** Advance to a specific phase (called by timeline controller) */
  setPhase: (phase: RevealPhase) => void
  /** Update progress within current phase (0..1) */
  setProgress: (progress: number) => void
  /** Skip directly to typewriter completion (user interaction) */
  skipTypewriter: () => void
  /** Full reset to idle */
  reset: () => void
}

export const useCinematicRevealStore = create<CinematicRevealState>((set, get) => ({
  revealPhase: "idle",
  revealProgress: 0,
  revealRunId: null,
  isPlaying: false,
  controlsLocked: false,

  startSequence: (runId: number) => {
    const { revealRunId, isPlaying } = get()
    // Guard: don't re-trigger for same runId or if already playing
    if (runId === revealRunId || isPlaying) return
    if (import.meta.env.DEV) {
      console.log(`[CinematicReveal] START sequence runId=${runId}`)
    }
    set({
      revealPhase: "micro_settle",
      revealProgress: 0,
      revealRunId: runId,
      isPlaying: true,
      controlsLocked: true,
    })
  },

  setPhase: (phase: RevealPhase) => {
    if (import.meta.env.DEV) {
      console.log(`[CinematicReveal] Phase → ${phase}`)
    }
    const isTerminal = phase === "restore" || phase === "idle"
    set({
      revealPhase: phase,
      revealProgress: 0,
      isPlaying: !isTerminal,
      controlsLocked: !isTerminal,
    })
  },

  setProgress: (progress: number) => {
    set({ revealProgress: Math.min(1, Math.max(0, progress)) })
  },

  skipTypewriter: () => {
    const { revealPhase } = get()
    if (revealPhase === "typewriter") {
      set({ revealPhase: "signals", revealProgress: 0 })
    }
  },

  reset: () => {
    set({
      revealPhase: "idle",
      revealProgress: 0,
      revealRunId: null,
      isPlaying: false,
      controlsLocked: false,
    })
  },
}))

/* ── Derived helpers (pure, no store dependency) ── */

/** Get next phase in sequence */
export function nextPhase(current: RevealPhase): RevealPhase {
  const idx = PHASE_ORDER.indexOf(current)
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return "restore"
  return PHASE_ORDER[idx + 1]
}

/** Check if a phase is within active reveal (not idle/restore) */
export function isRevealActive(phase: RevealPhase): boolean {
  return phase !== "idle" && phase !== "restore"
}

/** Derive blur intensity from phase */
export function deriveBlurIntensity(phase: RevealPhase, progress: number): number {
  switch (phase) {
    case "blur_in": return progress * 0.35
    case "panel_in":
    case "typewriter":
    case "signals": return 0.35
    case "intel_breakout": return 0.35 + progress * 0.10  // slight increase during breakout
    case "intel_debrief": return 0.45
    case "intel_retract": return 0.45 - progress * 0.10  // ease back
    case "blur_out": return 0.35 * (1 - progress)
    default: return 0
  }
}

/** Derive path glow intensity from phase */
export function derivePathGlowIntensity(phase: RevealPhase, progress: number): number {
  switch (phase) {
    case "micro_settle": return progress * 0.55
    case "blur_in": return 0.55
    case "panel_in":
    case "typewriter":
    case "signals": return 0.55
    case "intel_breakout": return 0.55 + progress * 0.15  // brighten during breakout
    case "intel_debrief": return 0.70
    case "intel_retract": return 0.70 - progress * 0.15  // fade back
    case "blur_out": return 0.55 - progress * 0.30
    case "restore": return 0.25
    default: return 0
  }
}
