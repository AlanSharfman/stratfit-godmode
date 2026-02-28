// src/components/cinematic/InsightRevealController.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Reveal Timeline Controller
//
// rAF-driven deterministic timeline that advances RevealPhase states.
// Mounted once in PositionPage. Consumes cinematicRevealStore.
//
// Timeline (maximal):
//   T+0      → micro_settle  (450ms)   terrain intensity ramp
//   T+450    → blur_in       (300ms)   bokeh-blur fade-in
//   T+750    → panel_in      (260ms)   panel scale/translate
//   T+1010   → typewriter    (≤1800ms) char-by-char text, cut short by onComplete
//   T+~2800  → signals       (~1000ms) probability signal cascade  
//   T+~3800  → blur_out      (500ms)   restore terrain
//   T+~4300  → restore                 unlock controls, idle
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

  const {
    revealPhase,
    isPlaying,
    startSequence,
    setPhase,
    setProgress,
  } = useCinematicRevealStore()

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
  useEffect(() => {
    if (!isPlaying || reduced) return

    // Mark phase start on first frame
    phaseStartRef.current = performance.now()

    const tick = (now: number) => {
      const phase = useCinematicRevealStore.getState().revealPhase
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
