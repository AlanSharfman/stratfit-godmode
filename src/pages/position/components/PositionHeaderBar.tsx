import React from "react"
import type { PositionViewModel } from "../overlays/positionState"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: PositionViewModel | null
}

export default function PositionHeaderBar({ vm }: Props) {
  if (!vm) return null
  const { kpis, confidencePct } = vm

  return (
    <div className={styles.headerBar}>
      <div className={styles.metric}>
        <span className={styles.label}>Runway</span>
        <span className={styles.value}>
          {Number.isFinite(kpis.runwayMonths) && kpis.runwayMonths < 999
            ? `${kpis.runwayMonths.toFixed(1)} mo`
            : "—"}
        </span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Risk Index</span>
        <span className={styles.value}>{kpis.riskIndex.toFixed(1)}</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Confidence</span>
        <span className={styles.value}>{confidencePct}%</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>ARR</span>
        <span className={styles.value}>
          {kpis.arr ? `$${(kpis.arr / 1_000_000).toFixed(2)}M` : "—"}
        </span>
      </div>
    </div>
  )
}
