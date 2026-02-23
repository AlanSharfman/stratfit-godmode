import React from "react"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: any | null
}

export default function DiagnosticsSummary({ vm }: Props) {
  if (!vm?.diagnostics) return null

  return (
    <div className={styles.diagnostics}>
      {Object.values(vm.diagnostics).map((d: any) => (
        <div key={d.label} className={`${styles.signal} ${styles[d.tone]}`}>
          <div className={styles.signalLabel}>{d.label}</div>
          <div className={styles.signalDesc}>{d.description}</div>
        </div>
      ))}
    </div>
  )
}
