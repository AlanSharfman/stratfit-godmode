import React from "react"
import styles from "./PositionScene.module.css"
import { useBaselineStore } from "@/state/baselineStore"

export default function PositionLeftRail() {
  const baselineInputs = useBaselineStore((s) => s.baselineInputs)

  if (!baselineInputs) return null

  const cash = baselineInputs.cash
  const runwayMonths = baselineInputs.runwayMonths
  const burnRate = baselineInputs.burnRate
  const revenue = baselineInputs.revenue
  const riskProfile = baselineInputs.riskProfile

  // Minimal, deterministic display-only heuristic (NOT simulation):
  // If riskProfile is missing/unexpected, show "—".
  const survival = riskProfileToSurvival(riskProfile)

  return (
    <aside className={styles.leftRail}>
      <div className={styles.railSection}>
        <div className={styles.railTitle}>Baseline Intelligence</div>

        <Metric label="Cash" value={formatCurrency(cash)} />
        <Metric label="Runway" value={`${formatNumber(runwayMonths)} mo`} />
        <Metric label="Burn" value={formatCurrency(burnRate)} />

        <Metric
          label="Revenue / ARR"
          value={`${formatCurrency(revenue)} / ${formatCurrency(revenue * 12)}`}
        />

        <Metric label="Survival" value={survival != null ? `${Math.round(survival * 100)}%` : "—"} />
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
  if (n == null || Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

function formatNumber(n?: number) {
  if (n == null || Number.isNaN(n)) return 0
  return Math.round(n)
}

// NOTE: This is a display heuristic ONLY. No sim. No model.
// If your RiskProfile type differs, this will safely return null ("—").
function riskProfileToSurvival(riskProfile: any): number | null {
  if (riskProfile == null) return null
  const v = String(riskProfile).toLowerCase()
  if (v.includes("low")) return 0.85
  if (v.includes("med")) return 0.65
  if (v.includes("high")) return 0.45
  return null
}
