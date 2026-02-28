// src/hooks/useReducedMotion.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Performance safety hook
//
// Returns true when animations should be disabled:
//   1. prefers-reduced-motion is set
//   2. Measured FPS drops below threshold (40fps default)
//
// Lightweight: single RAF loop, no per-frame allocations.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react"

/**
 * Returns `true` when animations should be suppressed:
 * - OS-level `prefers-reduced-motion: reduce` is active, OR
 * - measured FPS consistently below `fpsThreshold` (default 40).
 */
export function useReducedMotion(fpsThreshold = 40): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  })

  // OS preference listener
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // FPS monitor — samples over 2s window, checks every 3s
  const fpsRef = useRef({ frames: 0, last: performance.now() })

  useEffect(() => {
    if (reduced) return // already suppressed by OS pref

    let raf: number
    let interval: ReturnType<typeof setInterval>

    function tick() {
      fpsRef.current.frames++
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    interval = setInterval(() => {
      const now = performance.now()
      const elapsed = (now - fpsRef.current.last) / 1000
      if (elapsed > 0) {
        const fps = fpsRef.current.frames / elapsed
        if (fps < fpsThreshold) {
          setReduced(true)
        }
      }
      fpsRef.current.frames = 0
      fpsRef.current.last = now
    }, 3000)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(interval)
    }
  }, [reduced, fpsThreshold])

  return reduced
}
