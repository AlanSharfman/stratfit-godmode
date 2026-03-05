import React, { useMemo } from "react"
import { motion } from "framer-motion"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { timeSimulation, buildKpiSnapshot } from "@/engine/timeSimulation"

interface HeatmapTimelineProps {
  kpis: PositionKpis
  months?: number
  compact?: boolean
}

const HEALTH_COLORS = {
  strong: "rgba(52,211,153,0.7)",
  healthy: "rgba(52,211,153,0.35)",
  watch: "rgba(251,191,36,0.5)",
  critical: "rgba(248,113,113,0.6)",
}

const KPI_TO_SNAPSHOT: Record<KpiKey, string> = {
  cash: "cash", runway: "runway", growth: "growth", arr: "arr",
  revenue: "revenue", burn: "burn", churn: "churn",
  grossMargin: "grossMargin", efficiency: "efficiency", enterpriseValue: "enterpriseValue",
}

function snapshotToKpis(snap: Record<string, number>): PositionKpis {
  return {
    cashOnHand: snap.cash ?? 0,
    runwayMonths: snap.runway ?? 0,
    growthRatePct: snap.growth ?? 0,
    arr: snap.arr ?? 0,
    revenueMonthly: snap.revenue ?? 0,
    burnMonthly: snap.burn ?? 0,
    churnPct: snap.churn ?? 0,
    grossMarginPct: snap.grossMargin ?? 0,
    efficiencyRatio: snap.efficiency ?? 0,
    valuationEstimate: snap.enterpriseValue ?? 0,
    ebitdaMonthly: 0,
    riskIndex: 50,
    survivalScore: 50,
  }
}

export default function HeatmapTimeline({ kpis, months = 12, compact = false }: HeatmapTimelineProps) {
  const timeline = useMemo(() => {
    const snapshot = buildKpiSnapshot({
      cashBalance: kpis.cashOnHand, runwayMonths: kpis.runwayMonths,
      growthRatePct: kpis.growthRatePct, arr: kpis.arr,
      revenueMonthly: kpis.revenueMonthly, burnMonthly: kpis.burnMonthly,
      churnPct: kpis.churnPct, grossMarginPct: kpis.grossMarginPct,
      efficiencyRatio: kpis.efficiencyRatio, enterpriseValue: kpis.valuationEstimate,
    })
    return timeSimulation(snapshot, { direct: {}, monthlyGrowthRates: { cash: -0.02, burn: 0.01, churn: 0.003 } }, months)
  }, [kpis, months])

  const grid = useMemo(() => {
    return KPI_KEYS.map((kpi) => ({
      kpi,
      label: compact ? kpi.slice(0, 4).toUpperCase() : KPI_ZONE_MAP[kpi].label,
      cells: timeline.map((t) => {
        const projected = snapshotToKpis(t.kpis)
        return getHealthLevel(kpi, projected)
      }),
    }))
  }, [timeline, compact])

  const cellW = compact ? 18 : 28
  const cellH = compact ? 14 : 20
  const labelW = compact ? 48 : 110

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {!compact && (
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.5)", marginBottom: 10 }}>
          Health Heatmap · {months}-Month Projection
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        {/* Month headers */}
        <div style={{ display: "flex", paddingLeft: labelW, marginBottom: 2 }}>
          {timeline.map((t, i) => (
            <div key={i} style={{
              width: cellW, textAlign: "center",
              fontSize: 8, color: "rgba(200,220,240,0.2)",
              fontFamily: "ui-monospace, monospace",
            }}>
              {t.month}
            </div>
          ))}
        </div>

        {/* Rows */}
        {grid.map(({ kpi, label, cells }) => (
          <div key={kpi} style={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
            <div style={{
              width: labelW, flexShrink: 0,
              fontSize: compact ? 8 : 10, color: "rgba(200,220,240,0.4)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              paddingRight: 6,
            }}>
              {label}
            </div>
            {cells.map((health, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 + KPI_KEYS.indexOf(kpi) * 0.01 }}
                style={{
                  width: cellW - 1, height: cellH - 1,
                  borderRadius: 2,
                  background: HEALTH_COLORS[health],
                  marginRight: 1,
                }}
                title={`${KPI_ZONE_MAP[kpi].label} · Month ${timeline[i].month} · ${health}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      {!compact && (
        <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center" }}>
          {(Object.entries(HEALTH_COLORS) as [string, string][]).map(([level, color]) => (
            <div key={level} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 9, color: "rgba(200,220,240,0.3)", textTransform: "capitalize" }}>{level}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
