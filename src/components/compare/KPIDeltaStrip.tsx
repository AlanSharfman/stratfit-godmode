import React from "react"
import styles from "./CompareView.module.css"

/**
 * God Mode tolerant KPI delta strip
 * Accepts partial metrics so CompareView never hard-crashes
 */

export interface MetricsShape {
  arr?: number
  revenue?: number
  burn?: number
  runway?: number
  valuation?: number
  [key: string]: any
}

interface KPIDeltaStripProps {
  leftMetrics: MetricsShape | null | undefined
  rightMetrics: MetricsShape | null | undefined
  leftName?: string
  rightName?: string
}

function format(n?: number) {
  if (n === undefined || n === null) return "—"
  return Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(n)
}

function delta(a?: number, b?: number) {
  if (a === undefined || b === undefined) return null
  return b - a
}

export default function KPIDeltaStrip({
  leftMetrics,
  rightMetrics,
  leftName,
  rightName
}: KPIDeltaStripProps) {

  const rows = [
    { label: "ARR", a: leftMetrics?.arr, b: rightMetrics?.arr },
    { label: "Revenue", a: leftMetrics?.revenue, b: rightMetrics?.revenue },
    { label: "Burn", a: leftMetrics?.burn, b: rightMetrics?.burn },
    { label: "Runway", a: leftMetrics?.runway, b: rightMetrics?.runway },
    { label: "Valuation", a: leftMetrics?.valuation, b: rightMetrics?.valuation },
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
            <span>{format(r.a)}</span>
            <span className={positive ? styles.deltaPositive : styles.deltaNegative}>
              {d === null ? "—" : format(d)}
            </span>
            <span>{format(r.b)}</span>
          </div>
        )
      })}
    </div>
  )
}
