// src/features/intelligence/BriefingDirector.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Briefing Director 2.0 (Executive Briefing Orchestrator)
//
// Owns intelligence state machine, drives all subsystems:
//   - LightingModulator (ambient + vignette)
//   - CinematicCamera (shot sequence)
//   - OverlayEngine (mesh overlays with discipline)
//   - CaptionRail (narration cues + silence)
//   - ProbabilityStrip (always visible during play)
//   - TTS engine (optional)
//
// Manages timing clock. Controls entry/exit rituals.
// Max 30 seconds total runtime.
// ═══════════════════════════════════════════════════════════════════════════

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  type IntelligenceState,
  ENTER_DURATION_MS,
  EXIT_DURATION_MS,
} from "./intelligenceState"
import {
  LightingModulatorOverlay,
} from "./LightingModulator"
import CaptionRail, { type NarrationCue } from "./CaptionRail"
import ProbabilityStrip from "@/components/legal/ProbabilityStrip"
import { useBriefingClock } from "./useBriefingClock"
import type { CameraShot } from "./CinematicCamera"
import type { OverlayEvent } from "./OverlayEngine"
import { ttsSpeak, ttsCancel, ttsAvailable } from "./ttsEngine"
import { intelligenceTarget } from "@/stores/intelligenceTargetStore"

/* ── Briefing plan (provided by generateInvestorPlanStub or future AI) ── */

export interface BriefingPlan {
  shots: CameraShot[]
  cues: NarrationCue[]
  overlays: OverlayEvent[]
  totalDurationMs: number
}

export interface BriefingDirectorProps {
  /** Whether briefing is currently requested */
  active: boolean
  /** The briefing plan to execute */
  plan: BriefingPlan | null
  /** Called when briefing completes or is stopped */
  onComplete: () => void
  /** Called when state changes — parent can use to collapse/expand UI */
  onStateChange?: (state: IntelligenceState) => void
  /** Enable TTS narration */
  ttsEnabled?: boolean
}

/* ── Component ── */

const BriefingDirector: React.FC<BriefingDirectorProps> = memo(
  ({ active, plan, onComplete, onStateChange, ttsEnabled = false }) => {
    const [state, setState] = useState<IntelligenceState>("idle")
    const [clockMs, setClockMs] = useState(0)
    const clockRef = useRef(0)
    const [enterProgress, setEnterProgress] = useState(0)
    const [exitProgress, setExitProgress] = useState(0)
    const [paused, setPaused] = useState(false)
    const rafRef = useRef<number>(0)
    const prevTimestamp = useRef(0)
    const enterStartRef = useRef(0)
    const exitStartRef = useRef(0)
    const lastSpokenCue = useRef<string | null>(null)
    const updateClock = useBriefingClock((s) => s.update)
    const resetClock = useBriefingClock((s) => s.reset)

    // ── State transition ──
    const transitionTo = useCallback(
      (next: IntelligenceState) => {
        setState((prev) => {
          if (prev === next) return prev
          onStateChange?.(next)
          return next
        })
      },
      [onStateChange],
    )

    // ── Play trigger ──
    useEffect(() => {
      if (active && plan && state === "idle") {
        setClockMs(0)
        clockRef.current = 0
        setEnterProgress(0)
        setExitProgress(0)
        setPaused(false)
        lastSpokenCue.current = null
        enterStartRef.current = performance.now()
        transitionTo("entering")
      }
      if (!active && state === "playing") {
        exitStartRef.current = performance.now()
        transitionTo("exiting")
        ttsCancel()
        intelligenceTarget.clear()
      }
    }, [active, plan, state, transitionTo])

    // ── Main animation loop ──
    useEffect(() => {
      if (state === "idle" || state === "complete") return

      const tick = (timestamp: number) => {
        if (prevTimestamp.current === 0) prevTimestamp.current = timestamp
        const deltaMs = timestamp - prevTimestamp.current
        prevTimestamp.current = timestamp

        if (state === "entering") {
          const elapsed = timestamp - enterStartRef.current
          const p = Math.min(elapsed / ENTER_DURATION_MS, 1)
          setEnterProgress(p)
          updateClock(0, true, false, "entering", p)
          if (p >= 1) {
            setEnterProgress(1)
            transitionTo("playing")
          }
        }

        if (state === "playing" && !paused && plan) {
          setClockMs((prev) => {
            const next = prev + deltaMs
            // Auto-stop at end of plan
            if (next >= plan.totalDurationMs) {
              exitStartRef.current = performance.now()
              transitionTo("exiting")
              ttsCancel()
              clockRef.current = plan.totalDurationMs
              updateClock(plan.totalDurationMs, true, false, "exiting", 1)
              return plan.totalDurationMs
            }
            clockRef.current = next
            updateClock(next, true, paused, "playing", 1)
            return next
          })
        } else if (state === "playing" && paused) {
          updateClock(clockRef.current, true, true, "playing", 1)
        }

        if (state === "exiting") {
          const elapsed = timestamp - exitStartRef.current
          const p = Math.min(elapsed / EXIT_DURATION_MS, 1)
          setExitProgress(p)
          updateClock(clockRef.current, true, false, "exiting", 1 - p)
          if (p >= 1) {
            transitionTo("complete")
            resetClock()
            setTimeout(() => {
              transitionTo("idle")
              onComplete()
            }, 100)
          }
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      prevTimestamp.current = 0
      rafRef.current = requestAnimationFrame(tick)

      return () => {
        cancelAnimationFrame(rafRef.current)
      }
    }, [state, paused, plan, transitionTo, onComplete, updateClock, resetClock])

    // ── TTS narration ──
    useEffect(() => {
      if (!ttsEnabled || !ttsAvailable() || state !== "playing" || !plan) return

      const activeCue = plan.cues.find(
        (c) => clockMs >= c.startMs && clockMs < c.startMs + c.durationMs,
      )

      if (activeCue && activeCue.id !== lastSpokenCue.current) {
        lastSpokenCue.current = activeCue.id
        ttsSpeak(activeCue.text)
      }
    }, [ttsEnabled, state, plan, clockMs])

    // ── Intelligence terrain targeting ──
    useEffect(() => {
      if (state !== "playing" || !plan) {
        intelligenceTarget.clear()
        return
      }

      const activeCue = plan.cues.find(
        (c) => clockMs >= c.startMs && clockMs < c.startMs + c.durationMs,
      )

      if (activeCue?.targetAnchorId) {
        intelligenceTarget.set(activeCue.targetAnchorId)
      } else {
        intelligenceTarget.clear()
      }
    }, [state, plan, clockMs])

    // ── Compute effective progress for lighting ──
    const lightingProgress = useMemo(() => {
      if (state === "entering") return enterProgress
      if (state === "playing") return 1
      if (state === "exiting") return 1 - exitProgress
      return 0
    }, [state, enterProgress, exitProgress])

    const isActive =
      state === "entering" || state === "playing" || state === "exiting"

    if (!isActive || !plan) return null

    return (
      <>
        {/* Vignette overlay (DOM layer) */}
        <LightingModulatorOverlay
          active={isActive}
          progress={lightingProgress}
        />

        {/* Caption rail */}
        <CaptionRail
          active={state === "playing"}
          cues={plan.cues}
          nowMs={clockMs}
        />

        {/* Probability strip — always visible during briefing */}
        <ProbabilityStrip visible={isActive} />

        {/* Pause/Stop controls */}
        {state === "playing" && (
          <div style={DS.controls}>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              style={DS.controlBtn}
            >
              {paused ? "▶" : "⏸"}
            </button>
            <button
              type="button"
              onClick={() => {
                exitStartRef.current = performance.now()
                transitionTo("exiting")
                ttsCancel()
              }}
              style={DS.controlBtn}
            >
              ■
            </button>
            <span style={DS.timer}>
              {formatTime(clockMs)} / {formatTime(plan.totalDurationMs)}
            </span>
          </div>
        )}
      </>
    )
  },
)

BriefingDirector.displayName = "BriefingDirector"
export default BriefingDirector

/* ── R3F children for in-canvas subsystems ── */

export { default as CinematicCamera } from "./CinematicCamera"
export { LightingModulatorR3F } from "./LightingModulator"
export { default as OverlayEngine } from "./OverlayEngine"

/* ── Helpers ── */

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

/* ── Inline styles ── */

const FONT = "'Inter', system-ui, sans-serif"

const DS: Record<string, React.CSSProperties> = {
  controls: {
    position: "absolute",
    bottom: 48,
    right: 32,
    zIndex: 25,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 8,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(34,211,238,0.12)",
  },

  controlBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    border: "1px solid rgba(34,211,238,0.15)",
    background: "rgba(34,211,238,0.06)",
    color: "rgba(34,211,238,0.8)",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: FONT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  timer: {
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(148,180,214,0.5)",
    fontFamily: FONT,
    letterSpacing: "0.06em",
    marginLeft: 4,
  },
}
