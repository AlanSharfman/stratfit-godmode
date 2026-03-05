import React, { useCallback, useMemo, useState } from "react"

import PageShell from "@/components/nav/PageShell"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"

interface SliderConfig {
  kpi: KpiKey
  label: string
  min: number
  max: number
  step: number
  unit: string
}

const SLIDERS: SliderConfig[] = [
  { kpi: "revenue", label: "Revenue Change", min: -100000, max: 100000, step: 5000, unit: "$" },
  { kpi: "burn", label: "Burn Change", min: -50000, max: 50000, step: 2000, unit: "$" },
  { kpi: "growth", label: "Growth Rate", min: -30, max: 50, step: 1, unit: "%" },
  { kpi: "churn", label: "Churn Rate", min: -10, max: 15, step: 0.5, unit: "%" },
  { kpi: "cash", label: "Cash Injection", min: -500000, max: 5000000, step: 50000, unit: "$" },
  { kpi: "grossMargin", label: "Gross Margin", min: -20, max: 20, step: 1, unit: "%" },
  { kpi: "headcount", label: "Headcount Change", min: -20, max: 30, step: 1, unit: "" },
]

function formatSliderValue(value: number, unit: string): string {
  if (unit === "$") {
    const abs = Math.abs(value)
    const sign = value >= 0 ? "+" : "-"
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`
    return `${sign}$${abs}`
  }
  if (unit === "%") return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`
}

export default function StudioPage() {
  const [forces, setForces] = useState<Record<KpiKey, number>>(() => {
    const init: Record<string, number> = {}
    for (const s of SLIDERS) init[s.kpi] = 0
    return init as Record<KpiKey, number>
  })

  const { baseline } = useSystemBaseline()
  const baseKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])

  // Propagate all forces and compute modified KPIs
  const modifiedKpis = useMemo<PositionKpis | null>(() => {
    if (!baseKpis) return null
    const allAffected = new Map<KpiKey, number>()
    for (const [kpi, delta] of Object.entries(forces) as [KpiKey, number][]) {
      if (Math.abs(delta) < 0.001) continue
      const { affected } = propagateForce(KPI_GRAPH, kpi, delta)
      for (const [k, d] of affected) allAffected.set(k, (allAffected.get(k) ?? 0) + d)
    }

    const kpiFieldMap: Record<KpiKey, keyof PositionKpis> = {
      cash: "cashOnHand", runway: "runwayMonths", growth: "growthRatePct", arr: "arr",
      revenue: "revenueMonthly", burn: "burnMonthly", churn: "churnPct",
      grossMargin: "grossMarginPct", headcount: "headcount", enterpriseValue: "valuationEstimate",
    }

    const result = { ...baseKpis }
    for (const [k, d] of allAffected) {
      const field = kpiFieldMap[k]
      if (field) (result as any)[field] = (result as any)[field] + d
    }
    return result
  }, [baseKpis, forces])

  const hasChanges = Object.values(forces).some((v) => Math.abs(v) > 0.001)

  const resetAll = useCallback(() => {
    const reset: Record<string, number> = {}
    for (const s of SLIDERS) reset[s.kpi] = 0
    setForces(reset as Record<KpiKey, number>)
  }, [])

  const saveAsScenario = useCallback(() => {
    const name = prompt("Name this scenario:")
    if (!name) return
    const active = Object.entries(forces).filter(([, v]) => Math.abs(v) > 0.001)
    if (active.length === 0) return
    const saved = JSON.parse(localStorage.getItem("stratfit-saved-scenarios") || "[]")
    saved.push({ name, forces: Object.fromEntries(active), timestamp: Date.now() })
    localStorage.setItem("stratfit-saved-scenarios", JSON.stringify(saved))
  }, [forces])

  // Health comparison
  const healthChanges = useMemo(() => {
    if (!baseKpis || !modifiedKpis) return []
    return KPI_KEYS.map((kpi) => {
      const before = getHealthLevel(kpi, baseKpis)
      const after = getHealthLevel(kpi, modifiedKpis)
      return { kpi, before, after, changed: before !== after }
    })
  }, [baseKpis, modifiedKpis])

  if (!baseKpis) {
    return <PageShell><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(200,220,240,0.3)", fontSize: 14 }}>Complete initiation to use the studio</div></PageShell>
  }

  return (
    <PageShell>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Force sliders */}
        <div style={{ width: 320, flexShrink: 0, overflow: "auto", padding: "20px 16px", background: "rgba(4,8,16,0.5)", borderRight: "1px solid rgba(34,211,238,0.04)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 6 }}>Manual Force Builder</div>
          <div style={{ fontSize: 11, color: "rgba(200,220,240,0.25)", marginBottom: 20, lineHeight: 1.5 }}>
            Drag a slider. Watch the terrain respond instantly. Every force propagates through the dependency graph.
          </div>

          {SLIDERS.map((slider) => {
            const val = forces[slider.kpi] ?? 0
            const isActive = Math.abs(val) > 0.001
            return (
              <div key={slider.kpi} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: isActive ? "rgba(200,220,240,0.85)" : "rgba(200,220,240,0.5)" }}>{slider.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                    color: val > 0 ? "#34d399" : val < 0 ? "#f87171" : "rgba(200,220,240,0.3)",
                  }}>{formatSliderValue(val, slider.unit)}</span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={val}
                  onChange={(e) => setForces((prev) => ({ ...prev, [slider.kpi]: parseFloat(e.target.value) }))}
                  style={{ width: "100%", accentColor: isActive ? "#22d3ee" : "rgba(200,220,240,0.2)", height: 3, cursor: "pointer" }}
                />
              </div>
            )
          })}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={resetAll}
              style={{
                flex: 1, padding: "10px 0", background: "rgba(15,25,45,0.5)", border: "1px solid rgba(34,211,238,0.08)",
                borderRadius: 6, color: "rgba(200,220,240,0.5)", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              }}
            >Reset</button>
            <button
              onClick={saveAsScenario}
              disabled={!hasChanges}
              style={{
                flex: 1, padding: "10px 0",
                background: hasChanges ? "rgba(34,211,238,0.08)" : "rgba(15,25,45,0.3)",
                border: `1px solid ${hasChanges ? "rgba(34,211,238,0.2)" : "rgba(34,211,238,0.04)"}`,
                borderRadius: 6, color: hasChanges ? "#22d3ee" : "rgba(200,220,240,0.2)",
                fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: hasChanges ? "pointer" : "not-allowed",
              }}
            >Save Scenario</button>
          </div>
        </div>

        {/* Centre: Terrain — responds in real time */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "absolute", top: 10, left: 14, zIndex: 10, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
            background: "rgba(4,8,16,0.85)",
            color: hasChanges ? "#22d3ee" : "rgba(200,220,240,0.4)",
            border: `1px solid ${hasChanges ? "rgba(34,211,238,0.2)" : "rgba(200,220,240,0.08)"}`,
          }}>
            {hasChanges ? "LIVE RESPONSE" : "BASELINE"}
          </div>
          <TerrainStage
            progressive
            revealedKpis={revealedKpis}
            focusedKpi={null}
            zoneKpis={modifiedKpis}
            cameraPreset={POSITION_PROGRESSIVE_PRESET}
            autoRotateSpeed={0.2}
            showDependencyLines={hasChanges}
            hideMarkers
            heatmapEnabled={false}
          >
            <SkyAtmosphere />
          </TerrainStage>
          <TerrainZoneLegend kpis={modifiedKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />
        </div>

        {/* Right: Health changes */}
        <div style={{ width: 260, flexShrink: 0, overflow: "auto", padding: "20px 14px", background: "rgba(4,8,16,0.5)", borderLeft: "1px solid rgba(34,211,238,0.04)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 14 }}>Zone Health</div>
          {healthChanges.map(({ kpi, before, after, changed }) => {
            const colorMap: Record<string, string> = { critical: "#f87171", watch: "#fbbf24", healthy: "#22d3ee", strong: "#34d399" }
            return (
              <div key={kpi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 11, color: "rgba(200,220,240,0.5)" }}>{KPI_ZONE_MAP[kpi].label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: colorMap[before], textTransform: "uppercase" }}>{before}</span>
                  {changed && (
                    <>
                      <span style={{ fontSize: 10, color: "rgba(200,220,240,0.2)" }}>→</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: colorMap[after], textTransform: "uppercase" }}>{after}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
