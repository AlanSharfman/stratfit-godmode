import React, { useMemo } from "react"
import type { DiagnosticCardVM, PositionViewModel } from "../overlays/positionState"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: PositionViewModel | null
  maxItems?: number
}

const TONE_ORDER: Record<DiagnosticCardVM["tone"], number> = {
  risk: 0,
  watch: 1,
  strong: 2,
}

function rankDiagnostics(items: DiagnosticCardVM[]): DiagnosticCardVM[] {
  return [...items].sort((a, b) => {
    const ta = TONE_ORDER[a.tone]
    const tb = TONE_ORDER[b.tone]
    if (ta !== tb) return ta - tb
    return a.title.localeCompare(b.title)
  })
}

export default function DiagnosticsSummary({ vm, maxItems = 4 }: Props) {
  const items = useMemo(() => {
    if (!vm?.diagnostics?.length) return []
    return rankDiagnostics(vm.diagnostics).slice(0, maxItems)
  }, [vm, maxItems])

  if (!items.length) return null

  return (
    <div className={styles.diagnostics} aria-label="Position diagnostic summary">
      {items.map((d) => (
        <div key={d.key} className={`${styles.signal} ${styles[d.tone]}`}>
          <div className={styles.signalTop}>
            <div className={styles.signalTitle}>{d.title}</div>
            <div className={styles.signalMetric}>{d.metricLine}</div>
          </div>
          <div className={styles.signalDesc}>{d.text}</div>
        </div>
      ))}
    </div>
  )
}
