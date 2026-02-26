import React from "react"
import styles from "./PositionScene.module.css"
import { useBaselineStore } from "@/state/baselineStore"

export default function PositionLeftRail() {
  const baselineInputs = useBaselineStore((s) => s.baselineInputs)
  if (!baselineInputs) return null

  const cash = baselineInputs.cash
  const runwayMonths = baselineInputs.runwayMonths
  const burnRate = baselineInputs.burnRate
  const revenueMonthly = baselineInputs.revenue
  const riskProfile = baselineInputs.riskProfile

  const arr = revenueMonthly != null ? revenueMonthly * 12 : null
  const survival = riskProfileToSurvival(riskProfile)

  return (
    <aside className={styles.leftRail}>
      <div className={styles.railSection}>
        <div className={styles.railTitle}>Baseline Intelligence</div>

        <Metric label="Cash" value={fmtMoneyCompact(cash)} />

        <Metric
          label="Runway"
          value={
            <span className={styles.badgeRow}>
              <span className={styles.badgePrimary}>{fmtInt(runwayMonths)} mo</span>
              <span className={styles.badgeMuted}>at current burn</span>
            </span>
          }
        />

        <Metric label="Burn" value={fmtMoneyCompact(burnRate)} />

        <Metric
          label="Revenue"
          value={
            <span className={styles.stackValue}>
              <span className={styles.stackTop}>{fmtMoneyCompact(revenueMonthly)}</span>
              <span className={styles.stackSub}>Monthly</span>
            </span>
          }
        />

        <Metric
          label="ARR"
          value={
            <span className={styles.stackValue}>
              <span className={styles.stackTop}>{fmtMoneyCompact(arr)}</span>
              <span className={styles.stackSub}>Annualised</span>
            </span>
          }
        />

        <Metric
          label="Survival"
          value={
            survival != null ? (
              <span className={styles.badgeRow}>
                <span className={badgeForSurvival(survival, styles)}>
                  {Math.round(survival * 100)}%
                </span>
                <span className={styles.badgeMuted}>baseline risk</span>
              </span>
            ) : (
              "—"
            )
          }
        />
      </div>
    </aside>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className={styles.metricRow}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  )
}

function fmtInt(n?: number) {
  if (n == null || Number.isNaN(n)) return "—"
  return String(Math.round(n))
}

function fmtMoneyCompact(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "—"
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}b`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}m`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return `${sign}$${Math.round(abs).toLocaleString()}`
}

// Display heuristic ONLY (no sim / no model)
function riskProfileToSurvival(riskProfile: any): number | null {
  if (riskProfile == null) return null
  const v = String(riskProfile).toLowerCase()
  if (v.includes("low")) return 0.85
  if (v.includes("med")) return 0.65
  if (v.includes("high")) return 0.45
  return null
}

function badgeForSurvival(s: number, css: Record<string, string>) {
  if (s >= 0.75) return css.badgeGood
  if (s >= 0.55) return css.badgeWarn
  return css.badgeRisk
}