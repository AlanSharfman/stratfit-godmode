// src/components/cinematic/InsightRevealController.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Reveal Timeline Controller
//
// rAF-driven deterministic timeline that advances RevealPhase states.
// Mounted once in PositionPage. Consumes cinematicRevealStore.
//
// Timeline (maximal):
//   T+0      → micro_settle    (450ms)   terrain intensity ramp
//   T+450    → blur_in         (300ms)   bokeh-blur fade-in
//   T+750    → panel_in        (260ms)   panel scale/translate
//   T+1010   → typewriter      (≤1800ms) char-by-char text, cut short by onComplete
//   T+~2800  → signals         (~1000ms) probability signal cascade
//   T+~3800  → intel_breakout  (600ms)   panel lifts from dock, traverses to terrain
//   T+~4400  → intel_debrief   (2800ms)  panel centered over terrain, cinematic hold
//   T+~7200  → intel_retract   (500ms)   panel shrinks back to dock
//   T+~7700  → blur_out        (500ms)   restore terrain
//   T+~8200  → restore                   unlock controls, idle
//
// Reduced motion: collapses entire sequence → instant panel visible + signals
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from "react"
import {
  useCinematicRevealStore,
  ENABLE_CINEMATIC_SYNC,
  PHASE_DURATIONS,
  nextPhase,
  type RevealPhase,
} from "@/state/cinematicRevealStore"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface InsightRevealControllerProps {
  /** Simulation completedAt timestamp — triggers sequence once per unique value */
  completedAt: number | null
  /** Engine run ID to prevent duplicate sequences */
  runId: number | null
}

export function InsightRevealController({
  completedAt,
  runId,
}: InsightRevealControllerProps) {
  const reduced = useReducedMotion()
  const rafRef = useRef<number>(0)
  const phaseStartRef = useRef<number>(0)
  const lastCompletedAtRef = useRef<number | null>(null)

  // Use individual selectors to avoid re-rendering on every setProgress tick
  const isPlaying = useCinematicRevealStore((s) => s.isPlaying)
  const startSequence = useCinematicRevealStore((s) => s.startSequence)
  const setPhase = useCinematicRevealStore((s) => s.setPhase)
  const setProgress = useCinematicRevealStore((s) => s.setProgress)

  /* ── Trigger sequence on new completion ── */
  useEffect(() => {
    if (!ENABLE_CINEMATIC_SYNC) return
    if (completedAt == null || runId == null) return
    if (completedAt === lastCompletedAtRef.current) return

    lastCompletedAtRef.current = completedAt

    if (reduced) {
      // Simplified: skip straight to restore (panel + signals render immediately)
      startSequence(runId)
      // Give store a tick to register startSequence, then jump to restore
      requestAnimationFrame(() => {
        setPhase("restore")
      })
      return
    }

    startSequence(runId)
  }, [completedAt, runId, reduced, startSequence, setPhase])

  /* ── Advance phase helper ── */
  const advancePhase = useCallback(
    (current: RevealPhase) => {
      const next = nextPhase(current)
      phaseStartRef.current = performance.now()
      setPhase(next)
    },
    [setPhase],
  )

  /* ── rAF timeline loop ── */
  const lastPhaseRef = useRef<RevealPhase>("idle")

  useEffect(() => {
    if (!isPlaying || reduced) return

    // Mark phase start on first frame
    phaseStartRef.current = performance.now()
    lastPhaseRef.current = useCinematicRevealStore.getState().revealPhase

    const tick = (now: number) => {
      const phase = useCinematicRevealStore.getState().revealPhase

      // Detect external phase change (e.g. typewriter onComplete → signals)
      // and reset the timer so the new phase gets its full duration
      if (phase !== lastPhaseRef.current) {
        lastPhaseRef.current = phase
        phaseStartRef.current = now
      }

      const duration = PHASE_DURATIONS[phase]

      if (duration <= 0) {
        // Instant phase — advance immediately
        advancePhase(phase)
        return
      }

      const elapsed = now - phaseStartRef.current
      const progress = Math.min(1, elapsed / duration)
      setProgress(progress)

      if (progress >= 1) {
        // Phase complete — advance
        advancePhase(phase)
      }

      // Continue if still playing
      const { isPlaying: stillPlaying } = useCinematicRevealStore.getState()
      if (stillPlaying) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, reduced, advancePhase, setProgress])

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Render-less controller
  return null
}
