import React from "react"
import type { WhatIfAnswer } from "@/engine/whatif"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"
import VoiceBriefingButton from "./VoiceBriefingButton"
import styles from "./AIIntelligencePanel.module.css"

interface AIIntelligencePanelProps {
  answer: WhatIfAnswer | null
  loading: boolean
  propagation: Map<KpiKey, number>
  hasSimulation: boolean
  confidence: "high" | "medium" | "low" | null
  onVoicePlay?: () => void
  onVoiceStop?: () => void
  isNarrating?: boolean
  onFollowUp?: (question: string) => void
  formatDelta: (kpi: KpiKey, v: number) => string
}

export default function AIIntelligencePanel({
  answer,
  loading,
  propagation,
  hasSimulation,
  confidence,
  onVoicePlay,
  onVoiceStop,
  isNarrating = false,
  onFollowUp,
  formatDelta,
}: AIIntelligencePanelProps) {
  if (!hasSimulation && !loading) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>Strategic Intelligence</span>
        </div>
        <div className={styles.subtitle}>AI-powered analysis of simulation results.</div>
        <div className={styles.empty}>
          Run a simulation to generate strategic intelligence.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>Strategic Intelligence</span>
          <span className={styles.loadingDot} />
        </div>
        <div className={styles.subtitle}>AI-powered analysis of simulation results.</div>
        <div className={styles.loadingText}>Processing simulation...</div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Strategic Intelligence</span>
        {confidence && (
          <span className={
            confidence === "high" ? styles.confidenceHigh
              : confidence === "medium" ? styles.confidenceMedium
                : styles.confidenceLow
          }>
            {confidence}
          </span>
        )}
      </div>

      {answer ? (
        <div className={styles.content}>
          <div className={styles.headline}>
            {answer.summary.split(".")[0]}.
          </div>
          <div className={styles.summary}>{answer.summary}</div>

          {answer.kpi_impacts.length > 0 && (
            <div className={styles.driversSection}>
              <div className={styles.sectionTitle}>Key Drivers</div>
              {answer.kpi_impacts.map((imp, i) => (
                <div key={i} className={styles.driverRow}>
                  <span className={styles.driverKpi}>{imp.kpi}</span>
                  <span className={`${styles.driverDelta} ${imp.direction === "up" ? styles.deltaUp : imp.direction === "down" ? styles.deltaDown : styles.deltaFlat}`}>
                    {imp.direction === "flat" ? "—" : `${imp.direction === "up" ? "↑" : "↓"} ${imp.magnitude ?? ""}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {answer.assumptions && answer.assumptions.length > 0 && (
            <div className={styles.assumptionsBox}>
              <div className={styles.sectionTitle} style={{ color: "rgba(245,158,11,0.6)" }}>Assumptions</div>
              {answer.assumptions.map((a, i) => (
                <div key={i} className={styles.assumption}>• {a}</div>
              ))}
            </div>
          )}

          {answer.next_questions && answer.next_questions.length > 0 && onFollowUp && (
            <div className={styles.followUpSection}>
              <div className={styles.sectionTitle}>Follow-up Questions</div>
              {answer.next_questions.map((q, i) => (
                <button
                  key={i}
                  className={styles.followUpBtn}
                  onClick={() => onFollowUp(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className={styles.voiceRow}>
            <VoiceBriefingButton
              isPlaying={isNarrating}
              onPlay={onVoicePlay}
              onStop={onVoiceStop}
            />
          </div>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.sectionTitle}>Net Impact Summary</div>
          {Array.from(propagation.entries())
            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
            .slice(0, 8)
            .map(([kpi, delta]) => (
              <div key={kpi} className={styles.driverRow}>
                <span className={styles.driverKpi}>{KPI_ZONE_MAP[kpi]?.label ?? kpi}</span>
                <span className={`${styles.driverDelta} ${delta >= 0 ? styles.deltaUp : styles.deltaDown}`}>
                  {formatDelta(kpi, delta)}
                </span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
