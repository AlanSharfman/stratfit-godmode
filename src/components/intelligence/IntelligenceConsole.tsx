import React, { memo, useState, useEffect, useRef, useCallback } from "react"

interface Props {
  insightText: string
  /** Delay before slide-in (ms). Default 1000. */
  delay?: number
}

const WIDTH = 420
const SLIDE_MS = 400
const TYPEWRITER_MS = 30
const COLLAPSE_AFTER_MS = 8000
const CYAN = "#22d3ee"

const S = {
  wrapper: {
    position: "fixed" as const,
    top: 68,
    right: 0,
    zIndex: 900,
    pointerEvents: "none" as const,
  },
  panel: (visible: boolean) => ({
    width: WIDTH,
    maxHeight: "calc(100vh - 120px)",
    transform: visible ? "translateX(0)" : `translateX(${WIDTH + 8}px)`,
    transition: `transform ${SLIDE_MS}ms ease-out`,
    background: "#0E1116",
    borderLeft: "1px solid rgba(120,135,150,0.18)",
    borderTop: "1px solid rgba(120,135,150,0.10)",
    borderBottom: "1px solid rgba(120,135,150,0.10)",
    borderRadius: "10px 0 0 10px",
    boxShadow: `0 0 28px rgba(0,0,0,0.55), -2px 0 16px rgba(0,0,0,0.3), 0 0 1px ${CYAN}18`,
    display: "flex" as const,
    flexDirection: "column" as const,
    overflow: "hidden" as const,
    pointerEvents: "auto" as const,
    fontFamily: "'Inter', system-ui, sans-serif",
  }),
  header: {
    padding: "14px 20px 10px",
    borderBottom: "1px solid rgba(120,135,150,0.10)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    flexShrink: 0,
  },
  title: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: CYAN,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "rgba(148,163,184,0.5)",
    fontSize: 14,
    cursor: "pointer",
    padding: "2px 6px",
    lineHeight: 1,
  },
  accentBar: {
    height: 1,
    background: `linear-gradient(90deg, ${CYAN}00 0%, ${CYAN}40 30%, ${CYAN}60 50%, ${CYAN}40 70%, ${CYAN}00 100%)`,
    flexShrink: 0,
  },
  body: {
    padding: "16px 20px 20px",
    fontSize: 12,
    lineHeight: 1.7,
    color: "rgba(226,232,240,0.85)",
    overflowY: "auto" as const,
    flex: 1,
    minHeight: 0,
  },
  cursor: {
    display: "inline-block" as const,
    width: 2,
    height: 14,
    background: CYAN,
    marginLeft: 2,
    verticalAlign: "text-bottom" as const,
    animation: "intConsoleBlink 0.8s step-end infinite",
  },
  icon: (visible: boolean) => ({
    position: "fixed" as const,
    bottom: 24,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "#0E1116",
    border: `1px solid rgba(34,211,238,0.2)`,
    boxShadow: `0 0 14px rgba(34,211,238,0.08), 0 4px 16px rgba(0,0,0,0.4)`,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    cursor: "pointer",
    zIndex: 901,
    pointerEvents: "auto" as const,
    transition: "opacity 300ms, transform 300ms",
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1)" : "scale(0.8)",
  }),
  iconSvg: {
    width: 20,
    height: 20,
    color: CYAN,
  },
} as const

const IntelligenceConsole: React.FC<Props> = memo(({ insightText, delay = 1000 }) => {
  const [panelOpen, setPanelOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [typedLen, setTypedLen] = useState(0)
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textRef = useRef(insightText)

  // Track latest text
  useEffect(() => {
    textRef.current = insightText
    setTypedLen(0)
  }, [insightText])

  // Slide-in after delay
  useEffect(() => {
    const timer = setTimeout(() => setPanelOpen(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  // Typewriter effect — starts when panel opens
  useEffect(() => {
    if (!panelOpen || collapsed) return
    const text = textRef.current
    if (!text) return

    setTypedLen(0)
    let i = 0
    typingRef.current = setInterval(() => {
      i++
      setTypedLen(i)
      if (i >= text.length) {
        if (typingRef.current) clearInterval(typingRef.current)
      }
    }, TYPEWRITER_MS)

    return () => {
      if (typingRef.current) clearInterval(typingRef.current)
    }
  }, [panelOpen, collapsed, insightText])

  // Auto-collapse after 8 seconds of being open
  useEffect(() => {
    if (!panelOpen || collapsed) return
    collapseTimerRef.current = setTimeout(() => {
      setCollapsed(true)
      setPanelOpen(false)
    }, COLLAPSE_AFTER_MS)
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    }
  }, [panelOpen, collapsed])

  const handleReopen = useCallback(() => {
    setCollapsed(false)
    setPanelOpen(true)
    setTypedLen(0)
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
  }, [])

  const handleClose = useCallback(() => {
    setCollapsed(true)
    setPanelOpen(false)
  }, [])

  const displayText = insightText.slice(0, typedLen)
  const isTyping = typedLen < insightText.length && panelOpen && !collapsed

  return (
    <>
      {/* Blink animation for cursor */}
      <style>{`@keyframes intConsoleBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* Sliding panel */}
      <div style={S.wrapper}>
        <div style={S.panel(panelOpen && !collapsed)}>
          <div style={S.header}>
            <span style={S.title}>Stratfit Intelligence</span>
            <button style={S.closeBtn} onClick={handleClose} aria-label="Collapse console">
              ✕
            </button>
          </div>
          <div style={S.accentBar} />
          <div style={S.body}>
            {displayText}
            {isTyping && <span style={S.cursor} />}
          </div>
        </div>
      </div>

      {/* Collapsed icon */}
      <div
        style={S.icon(collapsed)}
        onClick={collapsed ? handleReopen : undefined}
        title="Open Intelligence Console"
      >
        <svg style={S.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </div>
    </>
  )
})

IntelligenceConsole.displayName = "IntelligenceConsole"
export default IntelligenceConsole
