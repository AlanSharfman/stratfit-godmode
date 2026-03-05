import React, { useMemo, useState } from "react"

import PageShell from "@/components/nav/PageShell"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel, type HealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"
import { SCENARIO_TEMPLATES, type ScenarioTemplate } from "@/engine/scenarioTemplates"
import RiskCascadeViz from "@/components/viz/RiskCascadeViz"
import AlertsDashboard from "@/components/alerts/AlertsDashboard"

interface RiskCategory {
  key: string
  label: string
  score: number
  trend: "improving" | "stable" | "worsening"
  drivers: string[]
}

function computeRiskDecomposition(kpis: PositionKpis): RiskCategory[] {
  const h = (k: KpiKey): HealthLevel => getHealthLevel(k, kpis)
  const healthScore = (k: KpiKey): number => {
    const l = h(k)
    return l === "critical" ? 15 : l === "watch" ? 40 : l === "healthy" ? 70 : 90
  }

  return [
    {
      key: "financial",
      label: "Financial Risk",
      score: Math.round((healthScore("cash") + healthScore("runway") + healthScore("burn")) / 3),
      trend: kpis.runwayMonths < 6 ? "worsening" : kpis.runwayMonths > 18 ? "improving" : "stable",
      drivers: [
        kpis.runwayMonths < 6 ? "Runway critically low" : "Runway adequate",
        kpis.burnMonthly > kpis.revenueMonthly * 1.5 ? "Burn exceeds revenue significantly" : "Burn within range",
      ],
    },
    {
      key: "concentration",
      label: "Concentration Risk",
      score: Math.round(healthScore("revenue") * 0.4 + healthScore("arr") * 0.3 + healthScore("churn") * 0.3),
      trend: kpis.churnPct > 8 ? "worsening" : "stable",
      drivers: [
        kpis.churnPct > 8 ? "High churn increases dependency on new revenue" : "Churn within healthy range",
        "Revenue diversification analysis requires customer-level data",
      ],
    },
    {
      key: "execution",
      label: "Execution Risk",
      score: Math.round((healthScore("efficiency") + healthScore("growth")) / 2),
      trend: kpis.efficiencyRatio < 0.5 ? "worsening" : kpis.efficiencyRatio > 1 ? "improving" : "stable",
      drivers: [
        kpis.efficiencyRatio < 0.5 ? "Efficiency ratio below threshold" : "Operational efficiency healthy",
        kpis.growthRatePct < 10 ? "Growth rate below target" : "Growth momentum present",
      ],
    },
    {
      key: "market",
      label: "Market Risk",
      score: Math.round((healthScore("growth") + healthScore("grossMargin") + healthScore("enterpriseValue")) / 3),
      trend: kpis.growthRatePct > 20 ? "improving" : kpis.growthRatePct < 5 ? "worsening" : "stable",
      drivers: [
        kpis.grossMarginPct < 50 ? "Gross margin below SaaS benchmark" : "Margins healthy",
        kpis.growthRatePct > 20 ? "Strong growth signals market fit" : "Growth rate needs acceleration",
      ],
    },
    {
      key: "competitive",
      label: "Competitive Risk",
      score: Math.round((healthScore("grossMargin") + healthScore("growth") + healthScore("efficiency")) / 3),
      trend: "stable",
      drivers: [
        "Competitive positioning inferred from margin and growth",
        kpis.grossMarginPct > 65 ? "High margins suggest defensible position" : "Margin pressure may indicate competitive threats",
      ],
    },
  ]
}

const STRESS_TESTS: { label: string; template: ScenarioTemplate }[] = [
  { label: "Lose largest customer", template: SCENARIO_TEMPLATES.find((t) => t.id === "key-customer-loss")! },
  { label: "Security breach", template: SCENARIO_TEMPLATES.find((t) => t.id === "security-breach")! },
  { label: "Market downturn", template: SCENARIO_TEMPLATES.find((t) => t.id === "market-downturn")! },
  { label: "Fundraising fails", template: SCENARIO_TEMPLATES.find((t) => t.id === "cash-crunch")! },
  { label: "Co-founder departs", template: SCENARIO_TEMPLATES.find((t) => t.id === "cofounder-leaves")! },
].filter((s) => s.template)

function computeStressImpact(kpis: PositionKpis, template: ScenarioTemplate): { survivorKpis: PositionKpis; severity: "survivable" | "critical" | "terminal" } {
  const allAffected = new Map<KpiKey, number>()
  for (const [kpi, delta] of Object.entries(template.forces) as [KpiKey, number][]) {
    const { affected } = propagateForce(KPI_GRAPH, kpi, delta)
    for (const [k, d] of affected) allAffected.set(k, (allAffected.get(k) ?? 0) + d)
  }

  const kpiFieldMap: Record<KpiKey, keyof PositionKpis> = {
    cash: "cashOnHand", runway: "runwayMonths", growth: "growthRatePct", arr: "arr",
    revenue: "revenueMonthly", burn: "burnMonthly", churn: "churnPct",
    grossMargin: "grossMarginPct", efficiency: "efficiencyRatio", enterpriseValue: "valuationEstimate",
  }

  const result = { ...kpis }
  for (const [k, d] of allAffected) {
    const field = kpiFieldMap[k]
    if (field) (result as any)[field] = (result as any)[field] + d
  }

  const criticals = KPI_KEYS.filter((k) => getHealthLevel(k, result) === "critical").length
  const severity = criticals >= 4 ? "terminal" : criticals >= 2 ? "critical" : "survivable"
  return { survivorKpis: result, severity }
}

export default function RiskPage() {
  const [selectedStress, setSelectedStress] = useState<number | null>(null)

  const { baseline } = useSystemBaseline()
  const baseKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])

  const riskCategories = useMemo(() => {
    if (!baseKpis) return []
    return computeRiskDecomposition(baseKpis)
  }, [baseKpis])

  const overallRisk = useMemo(() => {
    if (riskCategories.length === 0) return 0
    return Math.round(riskCategories.reduce((sum, c) => sum + c.score, 0) / riskCategories.length)
  }, [riskCategories])

  const stressResults = useMemo(() => {
    if (!baseKpis) return []
    return STRESS_TESTS.map((test) => ({
      ...test,
      ...computeStressImpact(baseKpis, test.template),
    }))
  }, [baseKpis])

  const activeStress = selectedStress !== null ? stressResults[selectedStress] : null

  if (!baseKpis) {
    return <PageShell><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(200,220,240,0.3)", fontSize: 14 }}>Complete initiation to view risk analysis</div></PageShell>
  }

  return (
    <PageShell>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Risk decomposition */}
        <div style={{ width: 340, flexShrink: 0, overflow: "auto", padding: "20px 16px", background: "rgba(4,8,16,0.5)", borderRight: "1px solid rgba(34,211,238,0.04)" }}>
          {/* Overall score */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 8 }}>Overall Health Score</div>
            <div style={{
              fontSize: 48, fontWeight: 200, color: overallRisk > 70 ? "#34d399" : overallRisk > 45 ? "#fbbf24" : "#f87171",
              fontVariantNumeric: "tabular-nums", lineHeight: 1,
            }}>{overallRisk}</div>
            <div style={{ fontSize: 10, color: "rgba(200,220,240,0.3)", marginTop: 4 }}>/100</div>
          </div>

          {/* Category breakdown */}
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 12 }}>Risk Decomposition</div>
          {riskCategories.map((cat) => (
            <div key={cat.key} style={{ marginBottom: 14, padding: "12px", background: "rgba(15,25,45,0.5)", borderRadius: 8, border: "1px solid rgba(34,211,238,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(200,220,240,0.8)" }}>{cat.label}</span>
                <span style={{
                  fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                  color: cat.score > 70 ? "#34d399" : cat.score > 45 ? "#fbbf24" : "#f87171",
                }}>{cat.score}</span>
              </div>
              {/* Bar */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2, marginBottom: 8 }}>
                <div style={{
                  height: 3, borderRadius: 2, width: `${cat.score}%`, transition: "width 0.5s",
                  background: cat.score > 70 ? "#34d399" : cat.score > 45 ? "#fbbf24" : "#f87171",
                }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: cat.trend === "improving" ? "#34d399" : cat.trend === "worsening" ? "#f87171" : "#fbbf24",
                }}>
                  {cat.trend === "improving" ? "↗" : cat.trend === "worsening" ? "↘" : "→"} {cat.trend}
                </span>
              </div>
              {cat.drivers.map((d, i) => (
                <div key={i} style={{ fontSize: 10, color: "rgba(200,220,240,0.35)", lineHeight: 1.5 }}>· {d}</div>
              ))}
            </div>
          ))}
          {/* Risk Cascade Network */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(34,211,238,0.04)" }}>
            <RiskCascadeViz kpis={baseKpis} />
          </div>

          {/* Alerts */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(34,211,238,0.04)" }}>
            <AlertsDashboard kpis={baseKpis} compact />
          </div>
        </div>

        {/* Centre: Terrain with heat map */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "absolute", top: 10, left: 14, zIndex: 10, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
            background: "rgba(4,8,16,0.85)", border: "1px solid rgba(200,220,240,0.08)",
            color: activeStress ? (activeStress.severity === "terminal" ? "#f87171" : activeStress.severity === "critical" ? "#fbbf24" : "#34d399") : "rgba(200,220,240,0.45)",
          }}>
            {activeStress ? `STRESS: ${activeStress.label.toUpperCase()}` : "CURRENT TERRAIN"}
          </div>
          <TerrainStage
            progressive
            revealedKpis={revealedKpis}
            focusedKpi={null}
            zoneKpis={activeStress?.survivorKpis ?? baseKpis}
            cameraPreset={POSITION_PROGRESSIVE_PRESET}
            autoRotateSpeed={0.2}
            showDependencyLines={false}
            hideMarkers
            heatmapEnabled
          >
            <SkyAtmosphere />
          </TerrainStage>
          <TerrainZoneLegend kpis={activeStress?.survivorKpis ?? baseKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />
        </div>

        {/* Right: Stress tests */}
        <div style={{ width: 300, flexShrink: 0, overflow: "auto", padding: "20px 16px", background: "rgba(4,8,16,0.5)", borderLeft: "1px solid rgba(34,211,238,0.04)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 14 }}>
            Auto Stress-Test
          </div>
          <div style={{ fontSize: 11, color: "rgba(200,220,240,0.3)", marginBottom: 16, lineHeight: 1.5 }}>
            5 worst-case scenarios run automatically. Click to see how your terrain responds to each.
          </div>
          {stressResults.map((test, i) => (
            <div
              key={test.label}
              onClick={() => setSelectedStress(selectedStress === i ? null : i)}
              style={{
                padding: "14px 12px",
                marginBottom: 8,
                background: selectedStress === i ? "rgba(34,211,238,0.04)" : "rgba(15,25,45,0.5)",
                border: `1px solid ${selectedStress === i ? "rgba(34,211,238,0.15)" : "rgba(34,211,238,0.04)"}`,
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(200,220,240,0.8)" }}>{test.label}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "2px 8px", borderRadius: 3,
                  color: test.severity === "terminal" ? "#f87171" : test.severity === "critical" ? "#fbbf24" : "#34d399",
                  background: test.severity === "terminal" ? "rgba(248,113,113,0.08)" : test.severity === "critical" ? "rgba(251,191,36,0.08)" : "rgba(52,211,153,0.08)",
                }}>
                  {test.severity}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(200,220,240,0.35)", lineHeight: 1.5 }}>
                {test.template.description}
              </div>
              {selectedStress === i && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {Object.entries(test.template.forces).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10 }}>
                      <span style={{ color: "rgba(200,220,240,0.4)" }}>{KPI_ZONE_MAP[k as KpiKey]?.label ?? k}</span>
                      <span style={{ fontWeight: 600, color: (v as number) > 0 ? "#34d399" : "#f87171" }}>
                        {(v as number) > 0 ? "+" : ""}{v as number}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
