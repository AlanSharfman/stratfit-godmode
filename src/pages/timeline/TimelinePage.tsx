import React, { useMemo, useState, lazy, Suspense } from "react"

import PageShell from "@/components/nav/PageShell"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { timeSimulation, buildKpiSnapshot, findFirstCliff, type TimelineState, type KpiSnapshot } from "@/engine/timeSimulation"
const HeatmapTimeline = lazy(() => import("@/components/viz/HeatmapTimeline"))

type CaseType = "bear" | "base" | "bull"

const CASE_CONFIGS: Record<CaseType, { label: string; color: string; growthRates: Partial<Record<KpiKey, number>> }> = {
  bear: {
    label: "Bear Case",
    color: "#6E5BFF",   // strategic purple — replaces banned red
    growthRates: { revenue: -0.03, burn: 0.02, churn: 0.01, growth: -0.02, cash: -0.04 },
  },
  base: {
    label: "Base Case",
    color: "#9DB7D1",   // muted white — replaces banned amber
    growthRates: { revenue: 0.02, burn: 0.005, churn: -0.002, growth: 0.01, cash: -0.01 },
  },
  bull: {
    label: "Bull Case",
    color: "#B7FF3C",   // lime positive
    growthRates: { revenue: 0.08, burn: 0.01, churn: -0.01, growth: 0.03, cash: 0.02, arr: 0.06 },
  },
}

const KPI_LABELS: Record<KpiKey, string> = {
  cash: "Cash", runway: "Runway", growth: "Growth", arr: "ARR",
  revenue: "Revenue", burn: "Burn", churn: "Churn",
  grossMargin: "Margin", headcount: "Team", nrr: "NRR", efficiency: "Efficiency", enterpriseValue: "EV",
}

function snapshotToPosition(s: KpiSnapshot, base: PositionKpis): PositionKpis {
  const gp = s.revenue * Math.min(s.grossMargin / 100, 1)
  return {
    arr: s.arr, burnMonthly: s.burn, runwayMonths: s.runway,
    ebitdaMonthly: gp - Math.max(s.burn - gp, 0),
    riskIndex: base.riskIndex, cashOnHand: s.cash,
    revenueMonthly: s.revenue, survivalScore: base.survivalScore,
    grossMarginPct: s.grossMargin, valuationEstimate: s.enterpriseValue,
    growthRatePct: s.growth, churnPct: s.churn,
    headcount: s.headcount, nrrPct: base.nrrPct,
    efficiencyRatio: base.efficiencyRatio,
  }
}

export default function TimelinePage() {
  const [selectedCase, setSelectedCase] = useState<CaseType>("base")
  const [month, setMonth] = useState(0)

  const { baseline } = useSystemBaseline()
  const baseKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])

  const baseSnapshot = useMemo(() => {
    if (!baseKpis) return null
    return buildKpiSnapshot({
      cashBalance: baseKpis.cashOnHand, runwayMonths: baseKpis.runwayMonths,
      growthRatePct: baseKpis.growthRatePct, arr: baseKpis.arr,
      revenueMonthly: baseKpis.revenueMonthly, burnMonthly: baseKpis.burnMonthly,
      churnPct: baseKpis.churnPct, grossMarginPct: baseKpis.grossMarginPct,
      headcount: baseKpis.headcount, enterpriseValue: baseKpis.valuationEstimate,
    })
  }, [baseKpis])

  const timelines = useMemo(() => {
    if (!baseSnapshot) return {} as Record<CaseType, TimelineState[]>
    const result: Record<string, TimelineState[]> = {}
    for (const [caseKey, config] of Object.entries(CASE_CONFIGS)) {
      result[caseKey] = timeSimulation(baseSnapshot, { direct: {}, monthlyGrowthRates: config.growthRates }, 12)
    }
    return result as Record<CaseType, TimelineState[]>
  }, [baseSnapshot])

  const activeTimeline = timelines[selectedCase] ?? []
  const cliff = useMemo(() => findFirstCliff(activeTimeline), [activeTimeline])

  const projectedKpis = useMemo<PositionKpis | null>(() => {
    if (!activeTimeline.length || !baseKpis) return null
    const state = activeTimeline[Math.min(month, activeTimeline.length - 1)]
    if (!state) return null
    return snapshotToPosition(state.kpis, baseKpis)
  }, [activeTimeline, month, baseKpis])

  // Sparkline data for key KPIs
  const sparkKpis: KpiKey[] = ["cash", "runway", "revenue", "growth", "burn"]
  const sparkData = useMemo(() => {
    const data: Record<KpiKey, number[]> = {} as any
    for (const kpi of sparkKpis) {
      data[kpi] = activeTimeline.map((s) => s.kpis[kpi])
    }
    return data
  }, [activeTimeline])

  if (!baseKpis) {
    return <PageShell><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(200,220,240,0.3)", fontSize: 14 }}>Complete initiation to view timeline projections</div></PageShell>
  }

  return (
    <PageShell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Case selector */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0", gap: 0, background: "rgba(12,20,34,0.7)", borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
          {(Object.entries(CASE_CONFIGS) as [CaseType, typeof CASE_CONFIGS.bear][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => { setSelectedCase(key); setMonth(0) }}
              style={{
                padding: "10px 28px",
                background: selectedCase === key ? `${config.color}12` : "transparent",
                border: "none",
                borderBottom: selectedCase === key ? `2px solid ${config.color}` : "2px solid transparent",
                color: selectedCase === key ? config.color : "rgba(200,220,240,0.35)",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Terrain + spark lines */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{
              position: "absolute", top: 10, left: 14, zIndex: 10, fontSize: 9, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
              background: "rgba(12,20,34,0.85)", color: CASE_CONFIGS[selectedCase].color,
              border: `1px solid ${CASE_CONFIGS[selectedCase].color}30`,
            }}>
              {CASE_CONFIGS[selectedCase].label} · Month {month}
            </div>
            <TerrainStage
              progressive
              revealedKpis={revealedKpis}
              focusedKpi={null}
              zoneKpis={projectedKpis ?? baseKpis}
              ghostKpis={month > 0 ? baseKpis : null}
              cameraPreset={POSITION_PROGRESSIVE_PRESET}
              autoRotateSpeed={0.15}
              showDependencyLines={false}
              hideMarkers
              heatmapEnabled={false}
            >
              <SkyAtmosphere />
            </TerrainStage>
            <TerrainZoneLegend kpis={projectedKpis ?? baseKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />
          </div>

          {/* Spark line panel */}
          <div style={{ width: 260, flexShrink: 0, overflow: "auto", padding: "16px 14px", background: "rgba(12,20,34,0.5)", borderLeft: "1px solid rgba(34,211,238,0.04)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 14 }}>
              KPI Trajectories
            </div>
            {sparkKpis.map((kpi) => {
              const vals = sparkData[kpi] ?? []
              if (vals.length === 0) return null
              const min = Math.min(...vals)
              const max = Math.max(...vals)
              const range = max - min || 1
              const w = 200
              const h = 36
              const points = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ")
              const currentVal = vals[Math.min(month, vals.length - 1)]
              const health = projectedKpis ? getHealthLevel(kpi, projectedKpis) : "healthy"
              const healthColor = health === "critical" ? "#6E5BFF" : health === "watch" ? "#9DB7D1" : health === "strong" ? "#B7FF3C" : "#21D4FD"
              return (
                <div key={kpi} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "rgba(200,220,240,0.5)" }}>{KPI_LABELS[kpi]}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: healthColor, fontVariantNumeric: "tabular-nums" }}>
                      {["cash", "revenue", "burn", "arr", "enterpriseValue"].includes(kpi) ? `$${(currentVal / 1000).toFixed(0)}K` : kpi === "growth" ? `${currentVal.toFixed(1)}%` : `${currentVal.toFixed(1)}`}
                    </span>
                  </div>
                  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
                    <polyline points={points} fill="none" stroke={CASE_CONFIGS[selectedCase].color} strokeWidth={1.5} opacity={0.6} />
                    {month < vals.length && (
                      <circle
                        cx={(month / (vals.length - 1)) * w}
                        cy={h - ((vals[month] - min) / range) * h}
                        r={3} fill={CASE_CONFIGS[selectedCase].color}
                      />
                    )}
                  </svg>
                </div>
              )
            })}

            {cliff && (
              <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 6, background: "rgba(110,91,255,0.06)", border: "1px solid rgba(110,91,255,0.22)", color: "#6E5BFF", fontSize: 11, lineHeight: 1.5 }}>
                ▲ {KPI_ZONE_MAP[cliff.kpi].label} hits critical at month {cliff.month}
              </div>
            )}

            {/* Heatmap */}
            <div style={{ marginTop: 20, padding: "12px 0", borderTop: "1px solid rgba(34,211,238,0.04)" }}>
              <Suspense fallback={null}>
                <HeatmapTimeline kpis={baseKpis} months={12} compact />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Timeline scrub */}
        <div style={{ padding: "12px 24px 18px", background: "rgba(12,20,34,0.9)", borderTop: "1px solid rgba(34,211,238,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.4)", whiteSpace: "nowrap" }}>PROJECTION</span>
            <div style={{ flex: 1, position: "relative", height: 28, display: "flex", alignItems: "center" }}>
              <input
                type="range" min={0} max={12} step={1} value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                style={{ width: "100%", accentColor: CASE_CONFIGS[selectedCase].color, height: 4, cursor: "pointer" }}
              />
              {/* Cliff marker */}
              {cliff && (
                <div style={{
                  position: "absolute", left: `${(cliff.month / 12) * 100}%`, top: 0, bottom: 0,
                  width: 2, background: "#6E5BFF", borderRadius: 1, transform: "translateX(-50%)", pointerEvents: "none",
                }} title={`Cliff: ${cliff.kpi} at month ${cliff.month}`} />
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(200,220,240,0.8)", fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "right" }}>
              Month {month}
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
