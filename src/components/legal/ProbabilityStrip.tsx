// src/components/legal/ProbabilityStrip.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability Disclaimer Strip (Executive Briefing)
//
// Always visible during briefing playback. Never hidden during play.
// Institutional legal framing — probability-safe language.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react"

export interface ProbabilityStripProps {
  /** Whether the strip is visible */
  visible: boolean
}

const DISCLAIMER_TEXT =
  "Scenario outcomes are probability-based simulations derived from modelled assumptions and inputs. Results are indicative, not predictive."

const ProbabilityStrip: React.FC<ProbabilityStripProps> = memo(
  ({ visible }) => {
    if (!visible) return null

    return (
      <div style={PS.strip}>
        <span style={PS.icon}>ℹ</span>
        <span style={PS.text}>{DISCLAIMER_TEXT}</span>
      </div>
    )
  },
)

ProbabilityStrip.displayName = "ProbabilityStrip"
export default ProbabilityStrip

/* ── Inline styles ── */

const FONT = "'Inter', system-ui, sans-serif"

const PS: Record<string, React.CSSProperties> = {
  strip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "6px 20px",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(6px)",
    borderBottom: "1px solid rgba(34,211,238,0.08)",
  },

  icon: {
    fontSize: 11,
    color: "rgba(34,211,238,0.4)",
    flexShrink: 0,
  },

  text: {
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: "0.04em",
    color: "rgba(148,180,214,0.45)",
    fontFamily: FONT,
    lineHeight: 1.4,
  },
}
