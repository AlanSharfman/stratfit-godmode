// src/components/terrain/signals/useSignalClock.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Single Global Animation Clock (Phase A8.2 — DETERMINISTIC)
//
// One RAF per canvas frame via useFrame. All signal primitives consume
// this clock via prop — no per-signal RAF loops.
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useCallback } from "react"
import { useFrame } from "@react-three/fiber"

export interface SignalClock {
  /** Seconds since mount (monotonic float) */
  t: number
  /** Delta time since last frame (seconds) */
  dt: number
}

/**
 * Single deterministic clock for all terrain signals.
 * Must be called ONCE per render tree (typically in TerrainSignalsLayer).
 * Returns a stable ref — primitives read clock.current.
 */
export function useSignalClock() {
  const clockRef = useRef<SignalClock>({ t: 0, dt: 0 })
  const startRef = useRef<number>(-1)

  useFrame((_, delta) => {
    if (startRef.current < 0) startRef.current = 0
    startRef.current += delta
    clockRef.current = { t: startRef.current, dt: delta }
  })

  return clockRef
}
