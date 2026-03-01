// src/layout/ConsoleFrame.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Console Frame · Instrument Enclosure
// 3-layer containment shell: outer vignette → metallic bezel → glass surface
// Reusable by any god-mode instrument page (Initiate, Decision, etc.)
// ═══════════════════════════════════════════════════════════════════════════

import React from "react"
import css from "./ConsoleFrame.module.css"

interface ConsoleFrameProps {
  children: React.ReactNode
  /** Optional extra className on outermost div */
  className?: string
  /** Max-width override (default 1380px, set via CSS) */
  maxWidth?: number
}

export default function ConsoleFrame({
  children,
  className,
  maxWidth,
}: ConsoleFrameProps) {
  return (
    <div className={`${css.consoleOuter}${className ? ` ${className}` : ""}`}>
      <div
        className={css.consoleBezel}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className={css.consoleInner}>
          {children}
        </div>
      </div>
    </div>
  )
}
