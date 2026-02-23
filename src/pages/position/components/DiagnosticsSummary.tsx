import React from "react"
import type { PositionViewModel } from "../overlays/positionState"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: PositionViewModel | null
}

export default function DiagnosticsSummary({ vm }: Props) {
  if (!vm?.diagnostics?.length) return null

  return (
    <div className={styles.diagnostics}>
      {vm.diagnostics.map((d) => (
        <div key={d.key} className={`${styles.signal} ${styles[d.tone]}`}>
          <div className={styles.signalLabel}>{d.title}</div>
          <div className={styles.signalDesc}>{d.text}</div>
          <div className={styles.signalMeta}>{d.metricLine}</div>
        </div>
      ))}
    </div>
  )
}
