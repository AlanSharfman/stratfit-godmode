// src/components/insight/IntelligenceSpotlight.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT GOD MODE — Intelligence Spotlight (Terrain-Projected)
//
// After simulation completes the AI Insight panel projects directly onto
// the bottom-right of the terrain viewport as a translucent glass overlay.
// The mountain shows through. After 25 s it smoothly returns to the rail.
//
// Architecture: receives the terrain viewport ref and uses createPortal
// to render the content inside it — fully contained within the terrain.
// Pure CSS transitions + React state — no R3F / shader dependencies.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import styles from "./IntelligenceSpotlight.module.css"

/* ── Config ── */
const ENTRY_DELAY_MS = 2800     // delay after sim complete before projection
const AUTO_DISMISS_MS = 25000   // 25 s on terrain then return
const PROGRESS_INTERVAL = 60    // countdown tick rate

export interface IntelligenceSpotlightProps {
  /** Key that changes on simulation completion (e.g. completedAt timestamp) */
  triggerKey: number | string | null
  /** Ref to the terrain viewport div — portal target */
  terrainRef: React.RefObject<HTMLDivElement | null>
  /** Whether reduced-motion is preferred */
  reducedMotion?: boolean
  /** Content to render */
  children: React.ReactNode
}

const IntelligenceSpotlight: React.FC<IntelligenceSpotlightProps> = memo(({
  triggerKey,
  terrainRef,
  reducedMotion = false,
  children,
}) => {
  const [projected, setProjected] = useState(false)
  const [entering, setEntering] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(0)
  const lastTriggerRef = useRef<number | string | null>(null)
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const entryDoneRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAllTimers = useCallback(() => {
    if (entryTimerRef.current) { clearTimeout(entryTimerRef.current); entryTimerRef.current = null }
    if (dismissTimerRef.current) { clearTimeout(dismissTimerRef.current); dismissTimerRef.current = null }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
    if (entryDoneRef.current) { clearTimeout(entryDoneRef.current); entryDoneRef.current = null }
  }, [])

  /* ── Project onto terrain ── */
  const projectOntoTerrain = useCallback(() => {
    if (!terrainRef.current) return
    setProgress(0)
    setEntering(true)
    setExiting(false)
    setProjected(true)

    entryDoneRef.current = setTimeout(
      () => setEntering(false),
      reducedMotion ? 50 : 800,
    )

    const start = Date.now()
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min(1, elapsed / AUTO_DISMISS_MS))
    }, PROGRESS_INTERVAL)

    dismissTimerRef.current = setTimeout(() => returnToRail(), AUTO_DISMISS_MS)
  }, [reducedMotion, terrainRef])

  /* ── Return to right rail ── */
  const returnToRail = useCallback(() => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
    if (dismissTimerRef.current) { clearTimeout(dismissTimerRef.current); dismissTimerRef.current = null }
    setExiting(true)
    setProgress(0)
    setTimeout(() => {
      setProjected(false)
      setExiting(false)
    }, reducedMotion ? 50 : 600)
  }, [reducedMotion])

  /* ── Trigger on simulation completion ── */
  useEffect(() => {
    if (!triggerKey || triggerKey === lastTriggerRef.current) return
    lastTriggerRef.current = triggerKey
    clearAllTimers()
    entryTimerRef.current = setTimeout(
      () => projectOntoTerrain(),
      reducedMotion ? 300 : ENTRY_DELAY_MS,
    )
    return () => clearAllTimers()
  }, [triggerKey, reducedMotion, clearAllTimers, projectOntoTerrain])

  useEffect(() => () => clearAllTimers(), [clearAllTimers])

  /* ── Manual project ── */
  const handleProject = useCallback(() => {
    if (projected) return
    projectOntoTerrain()
  }, [projected, projectOntoTerrain])

  /* ── ESC to close ── */
  useEffect(() => {
    if (!projected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") returnToRail() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [projected, returnToRail])

  const isActive = projected || exiting

  return (
    <>
      {/* ── In-rail: content or ghost ── */}
      <div className={styles.railSlot} data-projected={isActive}>
        {!isActive && children}

        {isActive && (
          <div className={styles.ghostPlaceholder}>
            <div className={styles.ghostReticle} aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="rgba(34,211,238,0.2)" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx="16" cy="16" r="6" stroke="rgba(34,211,238,0.35)" strokeWidth="1" />
                <circle cx="16" cy="16" r="2" fill="rgba(34,211,238,0.5)">
                  <animate attributeName="r" values="2;3;2" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.25;0.5" dur="2.2s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <div className={styles.ghostLabel}>PROJECTED ON TERRAIN</div>
            <button type="button" className={styles.recallBtn} onClick={returnToRail}>
              RECALL
            </button>
          </div>
        )}

        {!isActive && (
          <button
            type="button"
            className={styles.expandBtn}
            onClick={handleProject}
            aria-label="Project intelligence onto terrain"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>PROJECT</span>
          </button>
        )}
      </div>

      {/* ── Terrain projection — portaled into the viewport div ── */}
      {isActive && terrainRef.current && createPortal(
        <div
          className={`${styles.terrainProjection} ${entering ? styles.entering : ""} ${exiting ? styles.exiting : ""}`}
          role="region"
          aria-label="Intelligence Projection"
        >
          {/* ── Translucent panel ── */}
          <div className={styles.glassPanel}>
            {/* HUD corners */}
            <span className={`${styles.corner} ${styles.cornerTL}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerTR}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerBL}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerBR}`} aria-hidden="true" />

            {/* Scan line */}
            <div className={styles.scanLine} aria-hidden="true" />

            {/* ── Header ── */}
            <div className={styles.panelHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.headerPulse} />
                <span className={styles.headerTitle}>SCENARIO INTELLIGENCE</span>
                <span className={styles.liveTag}>LIVE</span>
              </div>
              <button type="button" className={styles.returnBtn} onClick={returnToRail}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M4 1H1v3M8 1h3v3M11 8v3H8M4 11H1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>RETURN</span>
              </button>
            </div>

            {/* ── Countdown ── */}
            <div className={styles.countdownTrack}>
              <div className={styles.countdownFill} style={{ transform: `scaleX(${1 - progress})` }} />
            </div>

            {/* ── Content ── */}
            <div className={styles.panelContent}>
              {children}
            </div>
          </div>
        </div>,
        terrainRef.current,
      )}
    </>
  )
})

IntelligenceSpotlight.displayName = "IntelligenceSpotlight"
export default IntelligenceSpotlight
