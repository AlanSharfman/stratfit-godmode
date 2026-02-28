// src/components/insight/ProbabilityBadge.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability micro-badge
//
// Compact colour-coded probability indicator with reveal pulse.
// Colour mapping:
//   > 80  → emerald
//   60–80 → cyan
//   40–59 → indigo
//   20–39 → amber
//   < 20  → red
//
// Respects reduced motion — skips pulse animation when disabled.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useState } from "react"

interface Props {
  /** Probability 0–100 */
  probability: number
  /** Badge size variant */
  size?: "small" | "medium"
  /** Disable reveal animation */
  disableAnimation?: boolean
}

function badgeColor(p: number): { bg: string; fg: string; border: string } {
  if (p > 80)
    return {
      bg: "rgba(52,211,153,0.12)",
      fg: "rgba(52,211,153,0.9)",
      border: "rgba(52,211,153,0.25)",
    }
  if (p >= 60)
    return {
      bg: "rgba(34,211,238,0.12)",
      fg: "rgba(34,211,238,0.9)",
      border: "rgba(34,211,238,0.25)",
    }
  if (p >= 40)
    return {
      bg: "rgba(99,102,241,0.12)",
      fg: "rgba(99,102,241,0.9)",
      border: "rgba(99,102,241,0.25)",
    }
  if (p >= 20)
    return {
      bg: "rgba(251,191,36,0.12)",
      fg: "rgba(251,191,36,0.9)",
      border: "rgba(251,191,36,0.25)",
    }
  return {
    bg: "rgba(239,68,68,0.12)",
    fg: "rgba(239,68,68,0.9)",
    border: "rgba(239,68,68,0.25)",
  }
}

const ProbabilityBadge: React.FC<Props> = memo(
  ({ probability, size = "small", disableAnimation = false }) => {
    const [revealed, setRevealed] = useState(false)
    const colors = badgeColor(probability)

    useEffect(() => {
      if (disableAnimation) {
        setRevealed(true)
        return
      }
      // Slight delay before reveal pulse
      const id = setTimeout(() => setRevealed(true), 80)
      return () => clearTimeout(id)
    }, [probability, disableAnimation])

    const isSmall = size === "small"

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: isSmall ? "9px" : "11px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          lineHeight: 1,
          padding: isSmall ? "2px 5px" : "3px 7px",
          borderRadius: "4px",
          background: colors.bg,
          color: colors.fg,
          border: `1px solid ${colors.border}`,
          transform: revealed ? "scale(1)" : "scale(0.7)",
          opacity: revealed ? 1 : 0,
          transition: disableAnimation
            ? "none"
            : "transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 200ms ease-out",
          whiteSpace: "nowrap",
        }}
        aria-label={`Probability ${probability}%`}
      >
        {probability}%
      </span>
    )
  },
)

ProbabilityBadge.displayName = "ProbabilityBadge"
export default ProbabilityBadge
