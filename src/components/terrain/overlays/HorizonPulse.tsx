// src/components/terrain/overlays/HorizonPulse.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Horizon Pulse micro-cinematic
//
// DOM overlay (not Three.js) — radial gradient flash aligned to the terrain
// horizon line. Triggers on panel_in phase of cinematic reveal.
//
// • Opacity: 0 → 0.12 → 0 over 600ms
// • Palette: ice/cyan radial, no bloom (CSS only)
// • Respects reduced motion
// • Positioned absolute inside terrainViewport
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useRef, useState } from "react"

interface Props {
  /** Unique key that changes on each simulation completion to re-trigger (legacy) */
  triggerKey: number | null
  /** Disable all animation */
  disabled?: boolean
}

const HorizonPulse: React.FC<Props> = memo(({ triggerKey, disabled }) => {
  const [active, setActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (disabled) return

    // Trigger on triggerKey change
    if (triggerKey == null || triggerKey === 0) return

    setActive(true)
    timerRef.current = setTimeout(() => setActive(false), 650)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [triggerKey, disabled])

  if (!active) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse 120% 40% at 50% 65%, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0.04) 40%, transparent 80%)",
        animation: "horizonPulseAnim 600ms ease-out forwards",
      }}
    />
  )
})

HorizonPulse.displayName = "HorizonPulse"
export default HorizonPulse
