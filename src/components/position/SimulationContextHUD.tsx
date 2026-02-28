import React, { useMemo } from "react"
import type { StatusTone } from "@/pages/position/overlays/positionState"
import type { SimulationStatus } from "@/state/phase1ScenarioStore"
import { useTypewriter } from "@/hooks/useTypewriter"
import styles from "./SimulationContextHUD.module.css"

/* ─────────────────────────────────────────────────────────
   SimulationContextHUD — Terrain top-right overlay
   3 rows: Risk Assessment · Simulation Status · AI Insight
   ───────────────────────────────────────────────────────── */

const TONE_LABEL: Record<StatusTone, string> = {
  strong: "Strong",
  watch: "Watch",
  risk: "Risk",
}

const TONE_COLOR: Record<StatusTone, string> = {
  strong: "#34d399",
  watch: "#fbbf24",
  risk: "#ef4444",
}

const SIM_LABEL: Record<SimulationStatus, string> = {
  draft: "Idle",
  running: "Running\u2026",
  complete: "Completed",
  error: "Failed",
}

const SIM_COLOR: Record<SimulationStatus, string> = {
  draft: "#94a3b8",
  running: "#fbbf24",
  complete: "#22c55e",
  error: "#ef4444",
}

interface Props {
  riskTone: StatusTone
  riskLabel: string
  simulationStatus: SimulationStatus
  completedAt?: number | null
  insightText: string
  /** Unique key per simulation run — triggers typewriter */
  runKey: string | number | null
}

export default function SimulationContextHUD({
  riskTone,
  riskLabel,
  simulationStatus,
  completedAt,
  insightText,
  runKey,
}: Props) {
  const effectiveStatus: SimulationStatus =
    simulationStatus === "complete" && !completedAt ? "running" : simulationStatus

  const { displayText } = useTypewriter({
    text: insightText,
    speed: 20,
    delay: 250,
    enabled: !!insightText && runKey !== null,
  })

  const timestamp = useMemo(() => {
    if (!completedAt) return null
    return new Date(completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }, [completedAt])

  return (
    <div className={styles.hud} aria-label="Simulation Context">
      {/* Row 1: Risk Assessment */}
      <div className={styles.row}>
        <div
          className={styles.dot}
          style={{ background: TONE_COLOR[riskTone], boxShadow: `0 0 6px ${TONE_COLOR[riskTone]}` }}
        />
        <span className={styles.rowLabel}>{riskLabel}</span>
        {riskLabel !== "Assessing" && (
          <span className={styles.rowTone} style={{ color: TONE_COLOR[riskTone] }}>
            {TONE_LABEL[riskTone]}
          </span>
        )}
      </div>

      {/* Row 2: Simulation Status */}
      <div className={styles.row}>
        <div
          className={`${styles.dot}${effectiveStatus === "running" ? ` ${styles.dotPulse}` : ""}`}
          style={{ background: SIM_COLOR[effectiveStatus], boxShadow: `0 0 6px ${SIM_COLOR[effectiveStatus]}` }}
        />
        <span className={styles.rowLabel}>Simulation</span>
        <span className={styles.rowValue} style={{ color: SIM_COLOR[effectiveStatus] }}>
          {SIM_LABEL[effectiveStatus]}
        </span>
        {timestamp && effectiveStatus === "complete" && (
          <span className={styles.rowTimestamp}>{timestamp}</span>
        )}
      </div>

      {/* Row 3: AI Insight */}
      {insightText && (
        <div className={styles.insightRow}>
          <span className={styles.insightText}>{displayText || "\u00A0"}</span>
        </div>
      )}
    </div>
  )
}
