import React from "react"
import type { PositionViewModel } from "../overlays/positionState"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: PositionViewModel | null
}

export default function PositionHeaderBar({ vm }: Props) {
  if (!vm) return null

  return (
    <div className={styles.headerBar} aria-label="System status">
      <div className={styles.metric}>
        <span className={styles.label}>State</span>
        <span className={styles.value}>{vm.state}</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Confidence</span>
        <span className={styles.value}>
          {vm.confidencePct}% · {vm.confidenceBand}
        </span>
      </div>
    </div>
  )
}
