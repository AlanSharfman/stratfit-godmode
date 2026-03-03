// src/features/intelligence/CaptionRail.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Caption + Silence Engine (Executive Briefing)
//
// Bottom-left cinematic caption rail. 1–2 lines max.
// Subtle typewriter effect. Each cue supports pauseAfterMs.
// Silence moments are honored — no text displayed during pauses.
// All text must be probability-safe (no advice language).
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo, useRef, useState } from "react"

/* ── Types ── */

export interface NarrationCue {
  id: string
  /** Start time in ms from briefing start */
  startMs: number
  /** Display duration in ms */
  durationMs: number
  /** Caption text (1–2 lines, probability-safe) */
  text: string
  /** Pause after this cue in ms (silence moment) */
  pauseAfterMs?: number
  /** Line 2 (optional) */
  subtitle?: string
  /** Terrain anchor id to highlight during this cue */
  targetAnchorId?: string
}

export interface CaptionRailProps {
  active: boolean
  cues: NarrationCue[]
  nowMs: number
}

/* ── Timing ── */

const FADE_IN_MS = 300
const FADE_OUT_MS = 250
const TYPEWRITER_SPEED = 28 // ms per character

/* ── Component ── */

const CaptionRail: React.FC<CaptionRailProps> = memo(
  ({ active, cues, nowMs }) => {
    const [displayedText, setDisplayedText] = useState("")
    const [displayedSub, setDisplayedSub] = useState("")
    const [opacity, setOpacity] = useState(0)
    const lastCueId = useRef<string | null>(null)

    // Find active cue
    const activeCue = useMemo(() => {
      if (!active) return null
      for (let i = cues.length - 1; i >= 0; i--) {
        const cue = cues[i]
        if (nowMs >= cue.startMs && nowMs < cue.startMs + cue.durationMs) {
          return cue
        }
      }
      return null
    }, [active, cues, nowMs])

    useEffect(() => {
      if (!activeCue) {
        // In silence zone
        setOpacity(0)
        lastCueId.current = null
        return
      }

      const elapsed = nowMs - activeCue.startMs
      const remaining = activeCue.durationMs - elapsed

      // Fade timing
      if (elapsed < FADE_IN_MS) {
        setOpacity(elapsed / FADE_IN_MS)
      } else if (remaining < FADE_OUT_MS) {
        setOpacity(Math.max(remaining / FADE_OUT_MS, 0))
      } else {
        setOpacity(1)
      }

      // Typewriter effect — characters revealed over time
      const typewriterElapsed = Math.max(elapsed - FADE_IN_MS * 0.5, 0)
      const charsToShow = Math.floor(typewriterElapsed / TYPEWRITER_SPEED)
      const mainText = activeCue.text.slice(0, charsToShow)
      setDisplayedText(mainText)

      // Subtitle (if any) — starts after main text is fully revealed
      if (activeCue.subtitle) {
        const mainDone = activeCue.text.length * TYPEWRITER_SPEED
        const subElapsed = Math.max(typewriterElapsed - mainDone - 200, 0) // 200ms gap
        const subChars = Math.floor(subElapsed / TYPEWRITER_SPEED)
        setDisplayedSub(activeCue.subtitle.slice(0, subChars))
      } else {
        setDisplayedSub("")
      }

      lastCueId.current = activeCue.id
    }, [activeCue, nowMs])

    if (!active || (opacity <= 0 && !activeCue)) return null

    return (
      <div style={{ ...CS.container, opacity }}>
        <div style={CS.textLine}>{displayedText}</div>
        {displayedSub && <div style={CS.subLine}>{displayedSub}</div>}
      </div>
    )
  },
)

CaptionRail.displayName = "CaptionRail"
export default CaptionRail

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"

const CS: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 48,
    left: 32,
    maxWidth: 520,
    zIndex: 20,
    pointerEvents: "none",
    transition: "opacity 300ms ease",
  },

  textLine: {
    fontSize: 15,
    fontWeight: 500,
    color: "rgba(226, 240, 255, 0.85)",
    fontFamily: FONT,
    lineHeight: 1.55,
    letterSpacing: "0.01em",
    textShadow: "0 2px 12px rgba(0,0,0,0.7)",
  },

  subLine: {
    fontSize: 12,
    fontWeight: 400,
    color: "rgba(148, 180, 214, 0.55)",
    fontFamily: FONT,
    lineHeight: 1.4,
    letterSpacing: "0.02em",
    marginTop: 4,
    textShadow: "0 1px 8px rgba(0,0,0,0.6)",
  },
}
