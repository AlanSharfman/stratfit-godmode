import React from "react"
import styles from "../PositionOverlays.module.css"
import type { PositionViewModel } from "./positionState"

function dotClass(tone: PositionViewModel["stateTone"]): string {
  if (tone === "strong") return `${styles.dot} ${styles.dotStrong}`
  if (tone === "watch") return `${styles.dot} ${styles.dotWatch}`
  return `${styles.dot} ${styles.dotRisk}`
}

export default function PositionBriefingPanel({ vm }: { vm: PositionViewModel | null }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>Position Briefing</div>
      </div>
      <div className={styles.panelBody}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className={vm ? dotClass(vm.stateTone) : `${styles.dot} ${styles.dotWatch}`} />
          <div className={styles.stateLabel}>{vm ? vm.state : "Baseline not loaded"}</div>
        </div>
        <ul className={styles.summaryList}>
          {(vm?.bullets ?? ["Initialise baseline to generate executive summary."]).map((b, idx) => (
            <li key={idx}>{b}</li>
          ))}
        </ul>
        <div className={styles.confRow}>
          <span>Confidence</span>
          <span className={styles.confPill}>
            {vm ? `${vm.confidenceBand} · ${vm.confidencePct}%` : "—"}
          </span>
        </div>

        {vm?.objectives && (
          <div className={styles.briefingSection}>
            <div className={styles.briefingTitle}>Objective</div>

            <div className={styles.briefingRow}>
              <span>Mode:</span>
              <span>{vm.objectives.mode}</span>
            </div>

            <div className={styles.briefingRow}>
              <span>Lens:</span>
              <span>{vm.objectives.lens}</span>
            </div>

            <div className={styles.briefingRow}>
              <span>Horizon:</span>
              <span>{vm.objectives.horizonMonths} months</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
