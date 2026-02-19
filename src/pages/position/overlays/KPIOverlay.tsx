import React from "react"
import styles from "../PositionOverlays.module.css"
import type { PositionViewModel } from "./positionState"

function fmtMoney(n: number, compact = true): string {
  if (!Number.isFinite(n)) return "—"
  const abs = Math.abs(n)
  if (compact) {
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  }
  return `${Math.round(n).toLocaleString()}`
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return `${n.toFixed(0)}%`
}

export default function KPIOverlay({ vm }: { vm: PositionViewModel | null }) {
  const k = vm?.kpis
  return (
    <div className={styles.kpiStrip}>
      <div className={styles.kpiCell}>
        <div className={styles.kpiLabel}>ARR</div>
        <div className={styles.kpiValue}>{k ? `$${fmtMoney(k.arr)}` : "—"}</div>
        <div className={styles.kpiSub}>Annual recurring</div>
      </div>
      <div className={styles.kpiCell}>
        <div className={styles.kpiLabel}>Runway</div>
        <div className={styles.kpiValue}>
          {k ? (Number.isFinite(k.runwayMonths) ? `${k.runwayMonths.toFixed(1)}m` : "—") : "—"}
        </div>
        <div className={styles.kpiSub}>Months at burn</div>
      </div>
      <div className={styles.kpiCell}>
        <div className={styles.kpiLabel}>Burn</div>
        <div className={styles.kpiValue}>{k ? `$${fmtMoney(k.burnMonthly)}` : "—"}</div>
        <div className={styles.kpiSub}>Monthly</div>
      </div>
      <div className={styles.kpiCell}>
        <div className={styles.kpiLabel}>EBITDA</div>
        <div className={styles.kpiValue}>{k ? `$${fmtMoney(k.ebitdaMonthly)}` : "—"}</div>
        <div className={styles.kpiSub}>Monthly approx</div>
      </div>
      <div className={styles.kpiCell}>
        <div className={styles.kpiLabel}>Risk Index</div>
        <div className={styles.kpiValue}>{k ? fmtPct(k.riskIndex) : "—"}</div>
        <div className={styles.kpiSub}>Health / survival</div>
      </div>
    </div>
  )
}
