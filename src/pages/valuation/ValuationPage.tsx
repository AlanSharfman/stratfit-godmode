import React, { useMemo } from "react"

import PageShell from "@/components/nav/PageShell"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import { KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"
import { timeSimulation, buildKpiSnapshot } from "@/engine/timeSimulation"

interface ValuationResult {
  baseEV: number
  bearEV: number
  bullEV: number
  multiple: number
  fundingReadiness: number
  readinessFactors: { label: string; pass: boolean; detail: string }[]
}

function computeValuation(kpis: PositionKpis): ValuationResult {
  const arr = kpis.arr || kpis.revenueMonthly * 12

  let multiple = 5
  if (kpis.growthRatePct > 40) multiple += 4
  else if (kpis.growthRatePct > 20) multiple += 2
  else if (kpis.growthRatePct > 10) multiple += 1

  if (kpis.churnPct < 3) multiple += 2
  else if (kpis.churnPct < 5) multiple += 1
  else if (kpis.churnPct > 10) multiple -= 2

  if (kpis.grossMarginPct > 75) multiple += 2
  else if (kpis.grossMarginPct > 60) multiple += 1
  else if (kpis.grossMarginPct < 40) multiple -= 2

  if (kpis.efficiencyRatio > 1) multiple += 1

  multiple = Math.max(2, Math.min(25, multiple))

  const baseEV = arr * multiple
  const bearEV = arr * Math.max(2, multiple * 0.6)
  const bullEV = arr * Math.min(25, multiple * 1.5)

  const factors: ValuationResult["readinessFactors"] = [
    { label: "Runway > 18 months", pass: kpis.runwayMonths > 18, detail: `${kpis.runwayMonths.toFixed(1)} months` },
    { label: "Growth > 15% MoM", pass: kpis.growthRatePct > 15, detail: `${kpis.growthRatePct.toFixed(1)}%` },
    { label: "Churn < 5%", pass: kpis.churnPct < 5, detail: `${kpis.churnPct.toFixed(1)}%` },
    { label: "Gross Margin > 60%", pass: kpis.grossMarginPct > 60, detail: `${kpis.grossMarginPct.toFixed(1)}%` },
    { label: "Efficiency > 0.7x", pass: kpis.efficiencyRatio > 0.7, detail: `${kpis.efficiencyRatio.toFixed(2)}x` },
    { label: "ARR > $500K", pass: arr > 500_000, detail: `$${(arr / 1000).toFixed(0)}K` },
    { label: "Burn < Revenue", pass: kpis.burnMonthly < kpis.revenueMonthly, detail: `$${(kpis.burnMonthly / 1000).toFixed(0)}K / $${(kpis.revenueMonthly / 1000).toFixed(0)}K` },
  ]

  const passCount = factors.filter((f) => f.pass).length
  const fundingReadiness = Math.round((passCount / factors.length) * 100)

  return { baseEV, bearEV, bullEV, multiple, fundingReadiness, readinessFactors: factors }
}

function formatEV(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export default function ValuationPage() {
  const { baseline } = useSystemBaseline()
  const baseKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])
  const valuation = useMemo(() => baseKpis ? computeValuation(baseKpis) : null, [baseKpis])

  if (!baseKpis || !valuation) {
    return <PageShell><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(200,220,240,0.3)", fontSize: 14 }}>Complete initiation to view valuation</div></PageShell>
  }

  return (
    <PageShell>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Valuation metrics */}
        <div style={{ width: 380, flexShrink: 0, overflow: "auto", padding: "24px 20px", background: "rgba(4,8,16,0.5)", borderRight: "1px solid rgba(34,211,238,0.04)" }}>
          {/* EV headline */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 8 }}>Enterprise Value (Base Case)</div>
            <div style={{ fontSize: 42, fontWeight: 200, color: "#22d3ee", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {formatEV(valuation.baseEV)}
            </div>
            <div style={{ fontSize: 11, color: "rgba(200,220,240,0.35)", marginTop: 6 }}>
              {valuation.multiple.toFixed(1)}x ARR multiple
            </div>
          </div>

          {/* Range */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, padding: "16px", background: "rgba(15,25,45,0.5)", borderRadius: 8, border: "1px solid rgba(34,211,238,0.04)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#f87171", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Bear</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#f87171" }}>{formatEV(valuation.bearEV)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#fbbf24", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Base</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#fbbf24" }}>{formatEV(valuation.baseEV)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#34d399", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Bull</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#34d399" }}>{formatEV(valuation.bullEV)}</div>
            </div>
          </div>

          {/* Funding Readiness */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)" }}>Funding Readiness</span>
              <span style={{
                fontSize: 20, fontWeight: 700,
                color: valuation.fundingReadiness > 70 ? "#34d399" : valuation.fundingReadiness > 40 ? "#fbbf24" : "#f87171",
              }}>{valuation.fundingReadiness}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
              <div style={{
                height: 4, borderRadius: 2, width: `${valuation.fundingReadiness}%`, transition: "width 0.5s",
                background: valuation.fundingReadiness > 70 ? "#34d399" : valuation.fundingReadiness > 40 ? "#fbbf24" : "#f87171",
              }} />
            </div>
          </div>

          {/* Readiness checklist */}
          {valuation.readinessFactors.map((f) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{f.pass ? "✓" : "✗"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: f.pass ? "rgba(200,220,240,0.7)" : "rgba(200,220,240,0.4)" }}>{f.label}</div>
                <div style={{ fontSize: 10, color: "rgba(200,220,240,0.25)" }}>{f.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Centre: Investor-lens terrain */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "absolute", top: 10, left: 14, zIndex: 10, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
            background: "rgba(4,8,16,0.85)", color: "rgba(34,211,238,0.5)", border: "1px solid rgba(34,211,238,0.1)",
          }}>
            Investor Lens
          </div>
          <TerrainStage
            progressive
            revealedKpis={revealedKpis}
            focusedKpi={null}
            zoneKpis={baseKpis}
            cameraPreset={POSITION_PROGRESSIVE_PRESET}
            autoRotateSpeed={0.25}
            showDependencyLines
            hideMarkers={false}
            heatmapEnabled
          >
            <SkyAtmosphere />
          </TerrainStage>
          <TerrainZoneLegend kpis={baseKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />
        </div>
      </div>
    </PageShell>
  )
}
