import React from "react"
import styles from "./CompareView.module.css"

/**
 * God Mode tolerant KPI delta strip
 * Accepts partial metrics so CompareView never hard-crashes
 */

export interface MetricsShape {
  runway?: number
  riskIndex?: number
  momentum?: number
  burnQuality?: number
  enterpriseValue?: number
  cashPosition?: number
  earningsPower?: number
  [key: string]: any
}

interface KPIDeltaStripProps {
  leftMetrics: MetricsShape | null | undefined
  rightMetrics: MetricsShape | null | undefined
  leftName?: string
  rightName?: string
}

function fmtNumber(n?: number, digits: number = 1) {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—"
  return Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(n)
}

function fmtMoneyCompact(n?: number) {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—"
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

function delta(a?: number, b?: number) {
  if (a === undefined || b === undefined) return null
  return b - a
}

export default function KPIDeltaStrip({
  leftMetrics,
  rightMetrics,
  leftName,
  rightName,
}: KPIDeltaStripProps) {
  const rows: Array<{
    label: string
    a?: number
    b?: number
    fmt: (n?: number) => string
  }> = [
    { label: "Runway (mo)", a: leftMetrics?.runway, b: rightMetrics?.runway, fmt: (n) => fmtNumber(n, 1) },
    { label: "Risk Index", a: leftMetrics?.riskIndex, b: rightMetrics?.riskIndex, fmt: (n) => fmtNumber(n, 1) },
    { label: "Momentum", a: leftMetrics?.momentum, b: rightMetrics?.momentum, fmt: (n) => fmtNumber(n, 1) },
    { label: "Burn Quality", a: leftMetrics?.burnQuality, b: rightMetrics?.burnQuality, fmt: (n) => fmtNumber(n, 1) },
    { label: "Enterprise Value", a: leftMetrics?.enterpriseValue, b: rightMetrics?.enterpriseValue, fmt: fmtMoneyCompact },
    { label: "Cash Position", a: leftMetrics?.cashPosition, b: rightMetrics?.cashPosition, fmt: fmtMoneyCompact },
  ]

  return (
    <div className={styles.kpiDeltaStrip}>
      <div className={styles.kpiDeltaHeader}>
        <span>{leftName ?? "Left"}</span>
        <span>Δ</span>
        <span>{rightName ?? "Right"}</span>
      </div>

      {rows.map((r) => {
        const d = delta(r.a, r.b)
        const positive = d !== null && d > 0

        return (
          <div key={r.label} className={styles.kpiDeltaRow}>
            <span className={styles.kpiLabel}>{r.label}</span>
            <span>{r.fmt(r.a)}</span>
            <span className={positive ? styles.deltaPositive : styles.deltaNegative}>
              {d === null ? "—" : r.fmt(d)}
            </span>
            <span>{r.fmt(r.b)}</span>
          </div>
        )
      })}
    </div>
  )
}
