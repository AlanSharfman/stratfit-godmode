// src/hooks/useIntelligencePresentation.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Command Glass Presentation Controller
//
// State machine: idle → reveal → settled
//
// Trigger: completedAt changes (new simulation run)
// Safety: StrictMode-safe, setTimeout with cleanup, ref-guarded
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from "react"

export type IntelligencePhase = "idle" | "reveal" | "settled"

interface UseIntelligencePresentationOptions {
  /** Simulation completedAt — null when no run exists */
  completedAt: number | null
  /** Maximum time in reveal before forcing settled (safety cap) */
  maxRevealDurationMs?: number
}

interface IntelligencePresentationState {
  phase: IntelligencePhase
  /** Typewriter done → transition to settled */
  requestSettle: () => void
  /** Reset to idle */
  reset: () => void
  /** Whether reveal is active (for terrain dim) */
  isRevealing: boolean
}

export function useIntelligencePresentation({
  completedAt,
  maxRevealDurationMs = 14_000,
}: UseIntelligencePresentationOptions): IntelligencePresentationState {
  const [phase, setPhase] = useState<IntelligencePhase>("idle")
  const lastCompletedAtRef = useRef<number | null>(null)
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Clear timers */
  const clearTimers = useCallback(() => {
    if (safetyTimerRef.current != null) {
      clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = null
    }
  }, [])

  /** Public: typewriter done → settle */
  const requestSettle = useCallback(() => {
    clearTimers()
    setPhase("settled")
  }, [clearTimers])

  /** Public: reset to idle */
  const reset = useCallback(() => {
    clearTimers()
    setPhase("idle")
    lastCompletedAtRef.current = null
  }, [clearTimers])

  // Trigger on new completedAt
  useEffect(() => {
    if (completedAt == null) return
    if (completedAt === lastCompletedAtRef.current) return

    lastCompletedAtRef.current = completedAt
    clearTimers()

    // → reveal
    setPhase("reveal")

    // Safety cap: if typewriter never finishes, force settled
    safetyTimerRef.current = setTimeout(() => {
      setPhase("settled")
    }, maxRevealDurationMs)

    return () => clearTimers()
  }, [completedAt, clearTimers, maxRevealDurationMs])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const isRevealing = phase === "reveal"

  return { phase, requestSettle, reset, isRevealing }
}
