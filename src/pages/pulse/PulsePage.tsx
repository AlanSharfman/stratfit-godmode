import React, { useMemo } from "react"

import PageShell from "@/components/nav/PageShell"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel, type HealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { computeActionRecommendations } from "@/engine/sensitivityAnalysis"

function generateWeeklyQuestions(kpis: PositionKpis): string[] {
  const qs: string[] = []
  if (kpis.churnPct > 5) qs.push("What if we invest in reducing churn by 50%?")
  if (kpis.runwayMonths < 12) qs.push("What if we raise an emergency bridge round?")
  if (kpis.growthRatePct < 10) qs.push("What if we double marketing spend this month?")
  if (kpis.burnMonthly > kpis.revenueMonthly) qs.push("What if we cut burn to reach profitability?")
  if (kpis.grossMarginPct < 60) qs.push("What if we renegotiate vendor contracts to improve margin?")
  qs.push("What if we lose our biggest client this week?")
  qs.push("What if we close the pipeline deal we've been chasing?")
  return qs.slice(0, 3)
}

function getWeeklyDelta(kpis: PositionKpis): { kpi: KpiKey; direction: "up" | "down" | "flat"; label: string }[] {
  return KPI_KEYS.map((kpi) => {
    const health = getHealthLevel(kpi, kpis)
    const direction = health === "critical" ? "down" as const : health === "strong" ? "up" as const : "flat" as const
    return { kpi, direction, label: KPI_ZONE_MAP[kpi].label }
  })
}

export default function PulsePage() {
  const { baseline } = useSystemBaseline()
  const liveKpis = useMemo(() => baseline ? buildPositionViewModel(baseline as any).kpis : null, [baseline])
  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])

  const recommendations = useMemo(() => liveKpis ? computeActionRecommendations(liveKpis, 1) : [], [liveKpis])
  const weeklyQuestions = useMemo(() => liveKpis ? generateWeeklyQuestions(liveKpis) : [], [liveKpis])
  const deltas = useMemo(() => liveKpis ? getWeeklyDelta(liveKpis) : [], [liveKpis])
  const priorityAction = recommendations[0] ?? null

  const today = new Date()
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1)
  const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  const overallTone = useMemo(() => {
    if (!liveKpis) return "neutral"
    const criticals = KPI_KEYS.filter((k) => getHealthLevel(k, liveKpis) === "critical").length
    const strongs = KPI_KEYS.filter((k) => getHealthLevel(k, liveKpis) === "strong").length
    if (criticals >= 3) return "critical"
    if (strongs >= 5) return "strong"
    return "steady"
  }, [liveKpis])

  const toneColors = { critical: "#f87171", steady: "#fbbf24", strong: "#34d399", neutral: "rgba(200,220,240,0.3)" }
  const toneLabels = { critical: "Urgent attention needed", steady: "Holding steady — stay focused", strong: "Strong position — maintain momentum", neutral: "" }

  if (!liveKpis) {
    return <PageShell><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(200,220,240,0.3)", fontSize: 14 }}>Complete initiation to see your weekly pulse</div></PageShell>
  }

  return (
    <PageShell>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Weekly digest */}
        <div style={{ width: 380, flexShrink: 0, overflow: "auto", padding: "24px 20px", background: "rgba(4,8,16,0.5)", borderRight: "1px solid rgba(34,211,238,0.04)" }}>
          {/* Week header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 6 }}>Weekly Pulse</div>
            <div style={{ fontSize: 22, fontWeight: 200, color: "rgba(200,220,240,0.85)", letterSpacing: "0.05em" }}>Week of {weekLabel}</div>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: toneColors[overallTone], letterSpacing: "0.06em" }}>
              {toneLabels[overallTone]}
            </div>
          </div>

          {/* Zone health delta */}
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 12 }}>Terrain Zones</div>
          {deltas.map((d) => (
            <div key={d.kpi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: 12, color: "rgba(200,220,240,0.6)" }}>{d.label}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: d.direction === "up" ? "#34d399" : d.direction === "down" ? "#f87171" : "#fbbf24",
              }}>
                {d.direction === "up" ? "↗ Strong" : d.direction === "down" ? "↘ At Risk" : "→ Stable"}
              </span>
            </div>
          ))}

          {/* Priority action */}
          {priorityAction && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 10 }}>Priority Action This Week</div>
              <div style={{ padding: "14px", background: "rgba(15,25,45,0.6)", border: "1px solid rgba(34,211,238,0.08)", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(200,220,240,0.9)", marginBottom: 4 }}>{priorityAction.headline}</div>
                <div style={{ fontSize: 11, color: "rgba(200,220,240,0.4)", lineHeight: 1.5 }}>{priorityAction.impactDescription}</div>
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: "#34d399" }}>+{priorityAction.totalElevationGain}% terrain elevation</div>
              </div>
            </div>
          )}

          {/* Suggested questions */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 10 }}>Ask Your Mountain This Week</div>
            {weeklyQuestions.map((q, i) => (
              <div key={i} style={{
                padding: "10px 12px", marginBottom: 6, background: "rgba(15,25,45,0.5)",
                border: "1px solid rgba(34,211,238,0.06)", borderRadius: 8,
                fontSize: 12, color: "rgba(200,220,240,0.7)", cursor: "pointer",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,211,238,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(34,211,238,0.06)")}
              >
                {q}
              </div>
            ))}
          </div>
        </div>

        {/* Centre: This week's terrain */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "absolute", top: 10, left: 14, zIndex: 10, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
            background: "rgba(4,8,16,0.85)", color: toneColors[overallTone],
            border: `1px solid ${toneColors[overallTone]}30`,
          }}>
            This Week's Terrain
          </div>
          <TerrainStage
            progressive revealedKpis={revealedKpis} focusedKpi={null}
            zoneKpis={liveKpis} cameraPreset={POSITION_PROGRESSIVE_PRESET}
            autoRotateSpeed={0.15} showDependencyLines={false} hideMarkers heatmapEnabled={false}
          ><SkyAtmosphere /></TerrainStage>
          <TerrainZoneLegend kpis={liveKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />
        </div>
      </div>
    </PageShell>
  )
}
