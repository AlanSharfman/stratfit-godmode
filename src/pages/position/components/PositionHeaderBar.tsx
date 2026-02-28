import React from "react"
import type { PositionViewModel } from "../overlays/positionState"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: PositionViewModel | null
}

function formatMoneyCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

export default function PositionHeaderBar({ vm }: Props) {
  if (!vm) return null

  const { kpis } = vm

  return (
    <div className={styles.headerBar} aria-label="Position headline metrics">
      <div className={styles.metric}>
        <span className={styles.label}>State</span>
        <span className={styles.value}>{vm.state}</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Runway</span>
        <span className={styles.value}>{kpis.runwayMonths.toFixed(1)} mo</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Risk Index</span>
        <span className={styles.value}>{kpis.riskIndex.toFixed(1)}</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>ARR</span>
        <span className={styles.value}>{formatMoneyCompact(kpis.arr)}</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Burn</span>
        <span className={styles.value}>{formatMoneyCompact(kpis.burnMonthly)}/mo</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>EBITDA</span>
        <span className={styles.value}>{formatMoneyCompact(kpis.ebitdaMonthly)}/mo</span>
      </div>

      <div className={styles.metric}>
        <span className={styles.label}>Probability</span>
        <span className={styles.value}>
          {vm.confidencePct}% · {vm.confidenceBand === "High" ? "Likely" : vm.confidenceBand === "Medium" ? "Mixed" : "Unlikely"}
        </span>
      </div>
    </div>
  )
}
