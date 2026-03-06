import React, { useCallback, useEffect, useRef } from "react"
import {
  useScenarioTimelineStore,
  TIMELINE_HORIZONS,
  HORIZON_LABELS,
  type TimeHorizon,
} from "@/state/scenarioTimelineStore"

const FONT = "'Inter', system-ui, sans-serif"

const PLAY_INTERVAL_BASE_MS = 1800

interface Props {
  onVoice?: () => void
  isNarrating?: boolean
}

export default function ScenarioTimelineSlider({ onVoice, isNarrating }: Props) {
  const { timeline, activeHorizon, isPlaying, playSpeed, setActiveHorizon, startPlayback, stopPlayback } =
    useScenarioTimelineStore()

  const playRef = useRef(isPlaying)
  playRef.current = isPlaying

  const horizonRef = useRef(activeHorizon)
  horizonRef.current = activeHorizon

  useEffect(() => {
    if (!isPlaying || !timeline) return

    const interval = PLAY_INTERVAL_BASE_MS / playSpeed
    let idx = TIMELINE_HORIZONS.indexOf(activeHorizon as TimeHorizon)

    const timer = setInterval(() => {
      idx++
      if (idx >= TIMELINE_HORIZONS.length) {
        stopPlayback()
        return
      }
      setActiveHorizon(TIMELINE_HORIZONS[idx])
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, timeline, playSpeed, activeHorizon, setActiveHorizon, stopPlayback])

  const handleHorizonClick = useCallback((h: TimeHorizon) => {
    if (isPlaying) stopPlayback()
    setActiveHorizon(h)
  }, [isPlaying, stopPlayback, setActiveHorizon])

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      stopPlayback()
    } else {
      if (activeHorizon === TIMELINE_HORIZONS[TIMELINE_HORIZONS.length - 1]) {
        setActiveHorizon(TIMELINE_HORIZONS[0])
      }
      startPlayback()
    }
  }, [isPlaying, activeHorizon, startPlayback, stopPlayback, setActiveHorizon])

  if (!timeline) return null

  const activeIdx = TIMELINE_HORIZONS.indexOf(activeHorizon as TimeHorizon)
  const progressPct = activeIdx >= 0 ? (activeIdx / (TIMELINE_HORIZONS.length - 1)) * 100 : 0

  return (
    <div style={S.root}>
      <div style={S.row}>
        {/* Play button */}
        <button
          type="button"
          onClick={handlePlayToggle}
          style={S.playBtn}
          title={isPlaying ? "Stop" : "Play timeline"}
        >
          {isPlaying ? "■" : "▶"}
        </button>

        {/* Track */}
        <div style={S.track}>
          {/* Progress fill */}
          <div style={{ ...S.trackFill, width: `${progressPct}%` }} />

          {/* Horizon stops */}
          {TIMELINE_HORIZONS.map((h, i) => {
            const pct = (i / (TIMELINE_HORIZONS.length - 1)) * 100
            const isActive = h === activeHorizon
            const isPast = i <= activeIdx
            return (
              <button
                key={h}
                type="button"
                onClick={() => handleHorizonClick(h)}
                style={{
                  ...S.stop,
                  left: `${pct}%`,
                  background: isActive ? "#22D3EE" : isPast ? "rgba(34,211,238,0.6)" : "rgba(143,180,217,0.25)",
                  boxShadow: isActive ? "0 0 10px rgba(34,211,238,0.5)" : "none",
                  transform: `translateX(-50%) scale(${isActive ? 1.3 : 1})`,
                }}
              >
                <span style={{
                  ...S.stopLabel,
                  color: isActive ? "#22D3EE" : "rgba(143,180,217,0.5)",
                  fontWeight: isActive ? 700 : 500,
                }}>
                  {HORIZON_LABELS[h]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Voice */}
        {onVoice && (
          <button
            type="button"
            onClick={onVoice}
            style={{
              ...S.voiceBtn,
              color: isNarrating ? "#f87171" : "rgba(34,211,238,0.6)",
              borderColor: isNarrating ? "rgba(248,113,113,0.3)" : "rgba(34,211,238,0.15)",
            }}
          >
            {isNarrating ? "Stop" : "Voice"}
          </button>
        )}

        <span style={S.horizonReadout}>{HORIZON_LABELS[activeHorizon as TimeHorizon] ?? `${activeHorizon}M`}</span>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    position: "relative",
    padding: "14px 24px 18px",
    background: "linear-gradient(180deg, rgba(12,20,34,0.92) 0%, rgba(6,12,24,0.96) 100%)",
    borderTop: "1px solid rgba(34,211,238,0.06)",
    fontFamily: FONT,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid rgba(34,211,238,0.2)",
    background: "rgba(34,211,238,0.08)",
    color: "#22D3EE",
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.15s",
    fontFamily: FONT,
  },
  track: {
    flex: 1,
    position: "relative",
    height: 4,
    background: "rgba(143,180,217,0.12)",
    borderRadius: 2,
  },
  trackFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    background: "rgba(34,211,238,0.4)",
    borderRadius: 2,
    transition: "width 0.3s ease-out",
  },
  stop: {
    position: "absolute",
    top: "50%",
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: -6,
    zIndex: 2,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  stopLabel: {
    position: "absolute",
    top: 18,
    fontSize: 9,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
    pointerEvents: "none" as const,
    transition: "color 0.15s",
  },
  voiceBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid rgba(34,211,238,0.15)",
    background: "none",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s",
    fontFamily: FONT,
  },
  horizonReadout: {
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(200,220,240,0.8)",
    fontVariantNumeric: "tabular-nums",
    minWidth: 40,
    textAlign: "right" as const,
    fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  },
}
