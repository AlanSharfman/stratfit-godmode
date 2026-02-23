import React from "react"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: any | null
}

export default function PositionHeaderBar({ vm }: Props) {
  if (!vm) return null

  return (
    <div className={styles.headerBar}>
      <div className={styles.metric}>
        <span className={styles.label}>Runway</span>
        <span className={styles.value}>{vm.runwayMonths?.toFixed(1)} mo</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Risk Index</span>
        <span className={styles.value}>{vm.riskIndex?.toFixed(1)}</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Confidence</span>
        <span className={styles.value}>{vm.confidencePct}%</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>ARR</span>
        <span className={styles.value}>
          {vm.arr ? `$${(vm.arr / 1_000_000).toFixed(2)}M` : "—"}
        </span>
      </div>
    </div>
  )
}
