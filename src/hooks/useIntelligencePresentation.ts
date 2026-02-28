// src/hooks/useIntelligencePresentation.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Intelligence Presentation Controller
//
// State machine: idle → emerge → dock → settled
//
// Trigger: completedAt changes (new simulation run)
// Safety: StrictMode-safe, setTimeout with cleanup, ref-guarded
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from "react"

export type IntelligencePhase = "idle" | "emerge" | "dock" | "settled"

interface UseIntelligencePresentationOptions {
  /** Simulation completedAt — null when no run exists */
  completedAt: number | null
  /** Maximum time in emerge before forcing dock (safety cap) */
  maxEmergeDurationMs?: number
  /** Duration of dock transition animation */
  dockDurationMs?: number
}

interface IntelligencePresentationState {
  phase: IntelligencePhase
  /** Force transition to dock (called by typewriter onComplete) */
  requestDock: () => void
  /** Reset to idle (called on new run start) */
  reset: () => void
}

export function useIntelligencePresentation({
  completedAt,
  maxEmergeDurationMs = 12_000,
  dockDurationMs = 600,
}: UseIntelligencePresentationOptions): IntelligencePresentationState {
  const [phase, setPhase] = useState<IntelligencePhase>("idle")
  const lastCompletedAtRef = useRef<number | null>(null)
  const emergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Clear all timers */
  const clearTimers = useCallback(() => {
    if (emergeTimerRef.current != null) {
      clearTimeout(emergeTimerRef.current)
      emergeTimerRef.current = null
    }
    if (dockTimerRef.current != null) {
      clearTimeout(dockTimerRef.current)
      dockTimerRef.current = null
    }
  }, [])

  /** Trigger dock phase, then settle after dockDurationMs */
  const transitionToDock = useCallback(() => {
    clearTimers()
    setPhase("dock")
    dockTimerRef.current = setTimeout(() => {
      setPhase("settled")
    }, dockDurationMs)
  }, [clearTimers, dockDurationMs])

  /** Public: typewriter signals it's done → go to dock */
  const requestDock = useCallback(() => {
    setPhase((prev) => {
      if (prev === "emerge") {
        // Schedule dock → settled transition
        transitionToDock()
        return prev // transitionToDock sets it
      }
      return prev
    })
  }, [transitionToDock])

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

    // → emerge
    setPhase("emerge")

    // Safety cap: if typewriter never finishes, force dock
    emergeTimerRef.current = setTimeout(() => {
      transitionToDock()
    }, maxEmergeDurationMs)

    return () => clearTimers()
  }, [completedAt, clearTimers, maxEmergeDurationMs, transitionToDock])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  return { phase, requestDock, reset }
}
