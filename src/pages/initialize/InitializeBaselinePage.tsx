import React from "react"
import styles from "./InitializeBaselinePage.module.css"
import { useOnboardingStore } from "../../state/onboardingStore"

function formatCurrency(value: number) {
  if (!value) return "—"
  return `$${value.toLocaleString()}`
}

function formatPercent(value: number) {
  if (!value) return "—"
  return `${value.toFixed(1)}%`
}

function formatNumber(value: number) {
  if (!value) return "—"
  return value.toLocaleString()
}

export default function InitializeBaselinePage() {
  const {
    cash,
    netBurn,
    arr,
    growth,
    churn,
    headcount,
    showAdvanced,
    toggleAdvanced
  } = useOnboardingStore()

  const runway =
    netBurn > 0
      ? Math.floor(cash / netBurn)
      : 0

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        Initialize Baseline
      </div>

      <div className={styles.metricsGrid}>
        <MetricCard label="Cash" value={formatCurrency(cash)} />
        <MetricCard label="Net Burn" value={formatCurrency(netBurn)} />
        <MetricCard label="ARR" value={formatCurrency(arr)} />
        <MetricCard label="Growth" value={formatPercent(growth)} />
        <MetricCard label="Churn" value={formatPercent(churn)} />
        <MetricCard label="Headcount" value={formatNumber(headcount)} />
        <MetricCard label="Runway (Months)" value={runway ? runway : "—"} />
      </div>

      <div className={styles.toggleRow}>
        <button
          className={styles.toggleButton}
          onClick={toggleAdvanced}
        >
          {showAdvanced ? "Hide Advanced" : "Show Advanced"}
        </button>
      </div>

      {showAdvanced && (
        <div className={styles.metricsGrid} style={{ marginTop: 30 }}>
          <MetricCard label="Advanced Metrics Placeholder" value="—" />
        </div>
      )}
    </div>
  )
}

interface MetricProps {
  label: string
  value: string | number
}

function MetricCard({ label, value }: MetricProps) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
    </div>
  )
}
