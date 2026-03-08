import React, { memo, useCallback, useEffect, useRef, useState } from "react"
import type { CompareAnalysis } from "@/engine/whatif"
import { useVoiceBriefing, type VoiceState } from "@/hooks/useVoiceBriefing"

interface Props {
  analysis: CompareAnalysis | null
  loading: boolean
  error: string | null
  onApplyScenario?: (scenarioLabel: string) => void
  onClose?: () => void
}

/* ═══════════════════════════════════════════════
   Typewriter engine
   ═══════════════════════════════════════════════ */

interface TypewriterSection {
  label: string
  text: string
}

function buildSections(a: CompareAnalysis): TypewriterSection[] {
  return [
    { label: "RECOMMENDED STRATEGY", text: a.headline },
    {
      label: "WHY THIS WINS",
      text: [
        `Peak height — ${a.why_this_wins.peak_height}`,
        `Ridge strength — ${a.why_this_wins.ridge_strength}`,
        `Valley depth — ${a.why_this_wins.valley_depth}`,
        `Terrain stability — ${a.why_this_wins.terrain_stability}`,
      ].join("\n"),
    },
    { label: "STRATEGIC INSIGHT", text: a.strategic_insight },
    { label: "EXECUTION PLAN", text: a.execution_plan.map((s) => `• ${s}`).join("\n") },
    { label: "RISKS TO WATCH", text: a.risks_to_monitor.map((s) => `• ${s}`).join("\n") },
  ]
}

function useTypewriter(sections: TypewriterSection[]) {
  const [visibleSections, setVisibleSections] = useState<{ label: string; text: string }[]>([])
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    setVisibleSections([])
    setDone(false)
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)

    if (sections.length === 0) return

    let sIdx = 0
    let cIdx = 0

    function startSection() {
      if (sIdx >= sections.length) {
        setDone(true)
        return
      }
      const section = sections[sIdx]
      setVisibleSections((prev) => [...prev, { label: section.label, text: "" }])
      cIdx = 0

      intervalRef.current = setInterval(() => {
        cIdx++
        if (cIdx > section.text.length) {
          clearInterval(intervalRef.current)
          sIdx++
          timerRef.current = setTimeout(startSection, 500)
          return
        }
        setVisibleSections((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { label: section.label, text: section.text.slice(0, cIdx) }
          return copy
        })
      }, 30)
    }

    timerRef.current = setTimeout(startSection, 400)

    return () => {
      clearTimeout(timerRef.current)
      clearInterval(intervalRef.current)
    }
  }, [sections])

  return { visibleSections, done }
}

/* ═══════════════════════════════════════════════
   Audio control icons (inline SVG, instrument-style)
   ═══════════════════════════════════════════════ */

const IconPlay: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M4 2.5L13 8L4 13.5V2.5Z" fill="currentColor" />
  </svg>
)

const IconPause: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="3" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" />
    <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" />
  </svg>
)

const IconMute: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M2 5.5H4.5L8 2V14L4.5 10.5H2V5.5Z" fill="currentColor" />
    <line x1="10" y1="4" x2="15" y2="12" stroke="currentColor" strokeWidth="1.2" />
    <line x1="15" y1="4" x2="10" y2="12" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

const IconVolume: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M2 5.5H4.5L8 2V14L4.5 10.5H2V5.5Z" fill="currentColor" />
    <path d="M10.5 5C11.5 6.2 11.5 9.8 10.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M12.5 3.5C14.2 5.5 14.2 10.5 12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

function voiceIcon(state: VoiceState) {
  switch (state) {
    case "playing":
      return <IconPause />
    case "paused":
      return <IconPlay />
    case "muted":
      return <IconMute />
    default:
      return <IconPlay />
  }
}

/* ═══════════════════════════════════════════════
   CSS keyframes (injected once)
   ═══════════════════════════════════════════════ */

const STYLE_ID = "sf-intelligence-panel-keyframes"

function ensureKeyframes() {
  if (typeof document === "undefined") return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    @keyframes sf-bezel-pulse {
      0%, 100% { box-shadow: inset 0 0 0 rgba(108,198,255,0); border-bottom-color: rgba(80,140,255,0.18); }
      50% { box-shadow: inset 0 0 18px rgba(108,198,255,0.12); border-bottom-color: rgba(108,198,255,0.35); }
    }
    @keyframes sf-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */

const ScenarioIntelligencePanel: React.FC<Props> = memo(({
  analysis,
  loading,
  error,
  onApplyScenario,
  onClose,
}) => {
  const [open, setOpen] = useState(false)
  const sections = React.useMemo(() => (analysis ? buildSections(analysis) : []), [analysis])
  const { visibleSections, done } = useTypewriter(sections)
  const voice = useVoiceBriefing(analysis, done)
  const isSpeaking = voice.voiceState === "playing"

  useEffect(() => ensureKeyframes(), [])

  useEffect(() => {
    if (analysis) {
      const t = setTimeout(() => setOpen(true), 300)
      return () => clearTimeout(t)
    }
    setOpen(false)
  }, [analysis])

  const handleClose = useCallback(() => {
    setOpen(false)
    voice.stop()
    onClose?.()
  }, [onClose, voice])

  const handleApply = useCallback(() => {
    if (analysis?.recommended_scenario) {
      onApplyScenario?.(analysis.recommended_scenario)
    }
  }, [analysis, onApplyScenario])

  const handlePlayPause = useCallback(() => {
    if (voice.voiceState === "playing") voice.pause()
    else voice.play()
  }, [voice])

  if (!analysis && !loading && !error) return null

  return (
    <div style={S.wrapper}>
      <div
        style={{
          ...S.panel,
          transform: open ? "translateX(0)" : "translateX(440px)",
          opacity: open ? 1 : 0,
        }}
      >
        {/* ── Top bezel ── */}
        <div
          style={{
            ...S.bezel,
            ...(isSpeaking ? { animation: "sf-bezel-pulse 2s ease-in-out infinite" } : {}),
          }}
        >
          <span style={S.bezelTitle}>STRATFIT INTELLIGENCE</span>

          {/* ── Audio controls ── */}
          {done && analysis && (
            <div style={S.audioControls}>
              <button
                onClick={handlePlayPause}
                style={S.audioBtn}
                aria-label={voice.voiceState === "playing" ? "Pause" : "Play"}
                title={voice.voiceState === "playing" ? "Pause briefing" : "Play briefing"}
              >
                {voiceIcon(voice.voiceState)}
              </button>
              <button
                onClick={voice.toggleMute}
                style={S.audioBtn}
                aria-label={voice.voiceState === "muted" ? "Unmute" : "Mute"}
                title={voice.voiceState === "muted" ? "Unmute" : "Mute"}
              >
                {voice.voiceState === "muted" ? <IconMute /> : <IconVolume />}
              </button>
            </div>
          )}

          {voice.voiceState === "loading" && (
            <span style={S.voiceLoadingDot} />
          )}

          <span
            style={{
              ...S.bezelDot,
              background: isSpeaking ? "rgba(108,198,255,0.8)" : "rgba(52,211,153,0.7)",
              boxShadow: isSpeaking
                ? "0 0 8px rgba(108,198,255,0.5)"
                : "0 0 6px rgba(52,211,153,0.4)",
            }}
          />
          <button onClick={handleClose} style={S.closeBtn} aria-label="Close panel">
            ✕
          </button>
        </div>

        {/* ── Accent glow bar ── */}
        <div
          style={{
            ...S.accentBar,
            ...(isSpeaking
              ? { background: "linear-gradient(90deg, transparent, rgba(108,198,255,0.5), rgba(108,212,255,0.35), transparent)" }
              : {}),
          }}
        />

        {/* ── Scrollable body ── */}
        <div style={S.body}>
          {loading && (
            <div style={S.loadingWrap}>
              <div style={S.loadingPulse} />
              <span style={S.loadingText}>Analysing terrain differentials...</span>
            </div>
          )}

          {error && (
            <div style={S.errorWrap}>
              <span style={S.errorText}>{error}</span>
            </div>
          )}

          {visibleSections.map((sec, i) => (
            <div key={i} style={S.section}>
              <div style={S.sectionLabel}>{sec.label}</div>
              <div style={S.sectionText}>{sec.text}<span style={S.cursor}>|</span></div>
            </div>
          ))}

          {done && visibleSections.length > 0 && (
            <div style={S.recommendedBadge}>
              {analysis?.recommended_scenario}
            </div>
          )}
        </div>

        {/* ── Bottom action bar ── */}
        {done && analysis && (
          <div style={S.actionBar}>
            <button
              onClick={handleApply}
              style={S.applyBtn}
              onMouseEnter={(e) => {
                ;(e.currentTarget.style.boxShadow = "0 0 16px rgba(124,202,255,0.4)")
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget.style.boxShadow = "0 0 8px rgba(60,160,255,0.15)")
              }}
            >
              APPLY RECOMMENDED SCENARIO
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

ScenarioIntelligencePanel.displayName = "ScenarioIntelligencePanel"
export default ScenarioIntelligencePanel

/* ═══════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: 440,
    zIndex: 950,
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  panel: {
    width: 420,
    height: "85vh",
    display: "flex",
    flexDirection: "column" as const,
    background: "rgba(8,12,20,0.92)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(80,140,255,0.35)",
    borderRadius: 10,
    boxShadow: "0 0 40px rgba(40,120,255,0.15), inset 0 1px 0 rgba(80,160,255,0.08)",
    marginRight: 12,
    overflow: "hidden",
    pointerEvents: "auto" as const,
    transition: "transform 600ms ease-out, opacity 400ms ease-out",
    fontFamily: FONT,
  },

  bezel: {
    height: 32,
    background: "rgba(15,20,30,0.95)",
    borderBottom: "1px solid rgba(80,140,255,0.18)",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    gap: 8,
    flexShrink: 0,
    transition: "box-shadow 600ms ease, border-bottom-color 600ms ease",
  },

  bezelTitle: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#7fc8ff",
    flex: 1,
  },

  audioControls: {
    display: "flex",
    alignItems: "center",
    gap: 2,
  },

  audioBtn: {
    background: "none",
    border: "1px solid rgba(108,198,255,0.15)",
    borderRadius: 3,
    color: "rgba(108,198,255,0.55)",
    cursor: "pointer",
    padding: "2px 4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    transition: "color 180ms ease, border-color 180ms ease",
  },

  voiceLoadingDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "rgba(108,198,255,0.5)",
    animation: "sf-blink 1s ease-in-out infinite",
  },

  bezelDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(52,211,153,0.7)",
    boxShadow: "0 0 6px rgba(52,211,153,0.4)",
    transition: "background 400ms ease, box-shadow 400ms ease",
  },

  closeBtn: {
    background: "none",
    border: "none",
    color: "rgba(200,220,240,0.3)",
    fontSize: 12,
    cursor: "pointer",
    padding: "2px 4px",
    lineHeight: 1,
    transition: "color 180ms ease",
  },

  accentBar: {
    height: 1,
    background: "linear-gradient(90deg, transparent, rgba(60,160,255,0.35), rgba(108,212,255,0.2), transparent)",
    flexShrink: 0,
    transition: "background 400ms ease",
  },

  body: {
    flex: 1,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    padding: "18px 18px 14px",
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(80,140,255,0.12) transparent",
  },

  loadingWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 0",
  },

  loadingPulse: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "rgba(60,160,255,0.6)",
    animation: "sf-blink 1.5s ease-in-out infinite",
  },

  loadingText: {
    fontSize: 12,
    color: "rgba(127,200,255,0.6)",
    fontStyle: "italic" as const,
  },

  errorWrap: {
    padding: "16px 0",
  },

  errorText: {
    fontSize: 11,
    color: "rgba(248,113,113,0.7)",
  },

  section: {
    marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(80,140,255,0.55)",
    marginBottom: 6,
  },

  sectionText: {
    fontSize: 12,
    fontWeight: 400,
    color: "rgba(200,220,240,0.78)",
    lineHeight: 1.65,
    whiteSpace: "pre-wrap" as const,
    letterSpacing: "0.01em",
  },

  cursor: {
    color: "rgba(60,160,255,0.5)",
    fontWeight: 300,
    animation: "sf-blink 1s step-end infinite",
  },

  recommendedBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: 5,
    border: "1px solid rgba(52,211,153,0.25)",
    background: "rgba(52,211,153,0.06)",
    color: "rgba(52,211,153,0.85)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    marginTop: 4,
  },

  actionBar: {
    padding: "12px 18px",
    borderTop: "1px solid rgba(80,140,255,0.12)",
    flexShrink: 0,
    background: "rgba(8,12,20,0.6)",
  },

  applyBtn: {
    width: "100%",
    padding: "10px 0",
    borderRadius: 6,
    border: "none",
    background: "linear-gradient(90deg, #3ca0ff, #6cd4ff)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: FONT,
    boxShadow: "0 0 8px rgba(60,160,255,0.15)",
    transition: "box-shadow 250ms ease, transform 150ms ease",
  },
}
