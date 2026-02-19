import React from "react"
import styles from "../PositionOverlays.module.css"
import type { PositionViewModel, StatusTone } from "./positionState"

function dotFromTone(t: StatusTone): string {
  if (t === "strong") return `${styles.dot} ${styles.dotStrong}`
  if (t === "watch") return `${styles.dot} ${styles.dotWatch}`
  return `${styles.dot} ${styles.dotRisk}`
}

export default function DiagnosticsStack({ vm }: { vm: PositionViewModel | null }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>Diagnostics</div>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.diagStack}>
          {(vm?.diagnostics ?? []).map((d) => (
            <div className={styles.diagCard} key={d.key}>
              <div className={styles.diagTitleRow}>
                <div className={styles.diagTitle}>
                  <span className={dotFromTone(d.tone)} />
                  {d.title}
                </div>
              </div>
              <div className={styles.diagText}>{d.text}</div>
              <div className={styles.diagMetric}>{d.metricLine}</div>
            </div>
          ))}

          {!vm && (
            <div className={styles.diagCard}>
              <div className={styles.diagTitleRow}>
                <div className={styles.diagTitle}>
                  <span className={`${styles.dot} ${styles.dotWatch}`} />
                  Awaiting baseline
                </div>
              </div>
              <div className={styles.diagText}>
                Initialise to enable liquidity, growth, cost and efficiency diagnostics.
              </div>
              <div className={styles.diagMetric}>Route: /initialize</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
