import React from "react"
import styles from "./PositionScene.module.css"
import { useSystemBaseline } from "@/state/systemBaseline"

export default function PositionLeftRail() {
  const baseline = useSystemBaseline()

  if (!baseline) return null

  const {
    cash,
    runwayMonths,
    burnMonthly,
    revenue,
    arr,
    survivalProbability,
  } = baseline

  return (
    <aside className={styles.leftRail}>
      <div className={styles.railSection}>
        <div className={styles.railTitle}>Baseline Intelligence</div>

        <Metric label="Cash" value={formatCurrency(cash)} />
        <Metric label="Runway" value={`${runwayMonths} mo`} />
        <Metric label="Burn" value={formatCurrency(burnMonthly)} />
        <Metric
          label="Revenue / ARR"
          value={`${formatCurrency(revenue)} / ${formatCurrency(arr)}`}
        />
        <Metric
          label="Survival"
          value={`${Math.round((survivalProbability ?? 0) * 100)}%`}
        />
      </div>
    </aside>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metricRow}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  )
}

function formatCurrency(n?: number) {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}
