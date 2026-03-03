// src/components/legal/ProbabilityNotice.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability Notice (Reusable Legal Component)
//
// Subtle, minimal legal/probability framing element.
// Two modes:
//   inline  → footnote text appended to a row/section
//   tooltip → info icon (ℹ) that shows notice on hover
//
// Required on Compare page. Reusable across Studio/Position.
// No orange. Palette: subtle grey with cyan accent on hover.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback, useState } from "react"

export interface ProbabilityNoticeProps {
  /** Display mode */
  mode?: "inline" | "tooltip"
  /** Override primary copy */
  copy?: string
  /** Override secondary (tooltip subtitle) */
  secondary?: string
  /** Additional className (not used — inline styles) */
  style?: React.CSSProperties
}

const PRIMARY_COPY =
  "Scenario outcomes are probability-based simulations derived from modelled assumptions and inputs. Results are indicative, not predictive."

const SECONDARY_COPY =
  "Comparative deltas reflect scenario assumptions and may change with inputs."

const ProbabilityNotice: React.FC<ProbabilityNoticeProps> = memo(
  ({ mode = "tooltip", copy, secondary, style }) => {
    const [showTooltip, setShowTooltip] = useState(false)

    const handleEnter = useCallback(() => setShowTooltip(true), [])
    const handleLeave = useCallback(() => setShowTooltip(false), [])

    const primaryText = copy ?? PRIMARY_COPY
    const secondaryText = secondary ?? SECONDARY_COPY

    if (mode === "inline") {
      return (
        <div style={{ ...N.inlineContainer, ...style }}>
          <span style={N.inlineIcon}>ℹ</span>
          <span style={N.inlineText}>{primaryText}</span>
        </div>
      )
    }

    // Tooltip mode
    return (
      <div
        style={{ ...N.tooltipWrapper, ...style }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        role="note"
        aria-label="Probability notice"
      >
        <span style={N.tooltipIcon}>ℹ</span>

        {showTooltip && (
          <div style={N.tooltipBubble}>
            <p style={N.tooltipPrimary}>{primaryText}</p>
            <p style={N.tooltipSecondary}>{secondaryText}</p>
          </div>
        )}
      </div>
    )
  },
)

ProbabilityNotice.displayName = "ProbabilityNotice"
export default ProbabilityNotice

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"

const N: Record<string, React.CSSProperties> = {
  /* ── Inline mode ── */
  inlineContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 4,
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.04)",
  },

  inlineIcon: {
    fontSize: 10,
    color: "rgba(34,211,238,0.3)",
    flexShrink: 0,
    marginTop: 1,
  },

  inlineText: {
    fontSize: 9,
    fontWeight: 400,
    color: "rgba(148,180,214,0.35)",
    fontFamily: FONT,
    lineHeight: 1.5,
    letterSpacing: "0.02em",
  },

  /* ── Tooltip mode ── */
  tooltipWrapper: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    cursor: "help",
  },

  tooltipIcon: {
    fontSize: 12,
    color: "rgba(148,180,214,0.25)",
    transition: "color 200ms ease",
    userSelect: "none",
  },

  tooltipBubble: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    width: 280,
    padding: "10px 12px",
    borderRadius: 6,
    background: "rgba(2,8,20,0.97)",
    border: "1px solid rgba(34,211,238,0.12)",
    boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
    zIndex: 50,
    fontFamily: FONT,
    pointerEvents: "none",
  },

  tooltipPrimary: {
    fontSize: 10,
    fontWeight: 400,
    color: "rgba(226,240,255,0.55)",
    lineHeight: 1.5,
    margin: "0 0 6px",
    letterSpacing: "0.01em",
  },

  tooltipSecondary: {
    fontSize: 9,
    fontWeight: 400,
    color: "rgba(148,180,214,0.3)",
    lineHeight: 1.4,
    margin: 0,
    letterSpacing: "0.01em",
  },
}
