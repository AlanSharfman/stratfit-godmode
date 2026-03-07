import React, { useMemo } from "react"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { getExecutiveSummary } from "@/domain/intelligence/kpiCommentary"
import { getHealthLevel, KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"
import ProbabilitySummaryCard from "@/components/probability/ProbabilitySummaryCard"
import SimulationDisclaimerBar from "@/components/legal/SimulationDisclaimerBar"

type CliffInfo = {
  month: number
  kpi: KpiKey
} | null

type PositionIntel = {
  healthScore: number
  healthCounts: { strong: number; watch: number; critical: number }
  cliff: CliffInfo
  criticalZones: string[]
  survivalProbability: number
  dataCompletenessPct: number
}

export type PositionProbabilityOverview = {
  survivalProbability: number
  cliff: CliffInfo
  runwayRiskLabel: string
  runwayRiskProbability: number
  modelConfidence: "High" | "Medium" | "Low"
  dataCompletenessPct: number
  subtitle: string
}

type Props = {
  kpis: PositionKpis
  intel: PositionIntel
  probability?: PositionProbabilityOverview
  simRunCount?: number
  onOpenWhatIf: () => void
}

type RiskAxis = {
  key: string
  label: string
  value: number
}

type SummaryTone = "critical" | "challenging" | "stable" | "strong"

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function buildPolygonPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return ""
  return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} ${points.slice(1).map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")} Z`
}

function buildRiskAxes(kpis: PositionKpis, intel: PositionIntel, survivalProbability: number): RiskAxis[] {
  const liquidity = clamp((Math.min(kpis.runwayMonths, 24) / 24) * 100)
  const growth = clamp(((kpis.growthRatePct ?? 0) + 5) * 5)
  const revenueCoverage = kpis.revenueMonthly > 0 ? kpis.burnMonthly / kpis.revenueMonthly : 2.5
  const efficiency = clamp(((kpis.grossMarginPct ?? 0) * 0.55) + (revenueCoverage <= 1 ? 32 : Math.max(0, 28 - (revenueCoverage - 1) * 18)))
  const resilience = clamp(survivalProbability * 0.7 + intel.healthScore * 0.3)
  const market = clamp((Math.min(kpis.arr, 2_000_000) / 2_000_000) * 55 + (Math.min(kpis.valuationEstimate, 20_000_000) / 20_000_000) * 45)

  return [
    { key: "liquidity", label: "Liquidity", value: liquidity },
    { key: "growth", label: "Growth", value: growth },
    { key: "efficiency", label: "Efficiency", value: efficiency },
    { key: "resilience", label: "Resilience", value: resilience },
    { key: "market", label: "Market", value: market },
  ]
}

function toneColor(tone: SummaryTone) {
  switch (tone) {
    case "critical":
      return "#ff9b7a"
    case "challenging":
      return "#f7c66b"
    case "strong":
      return "#78dfc3"
    default:
      return "#78cfff"
  }
}

function toneLabel(tone: SummaryTone) {
  switch (tone) {
    case "critical":
      return "Critical"
    case "challenging":
      return "Challenging"
    case "strong":
      return "Strong"
    default:
      return "Stable"
  }
}

function buildObservations(kpis: PositionKpis, intel: PositionIntel) {
  const observations: Array<{ title: string; body: string; tone: "positive" | "watch" | "neutral" }> = []

  if (intel.cliff) {
    observations.push({
      title: "Earliest Pressure Point",
      body: `${KPI_ZONE_MAP[intel.cliff.kpi].label} reaches the first modeled cliff in month ${intel.cliff.month}. Fix that constraint before pushing a larger strategic move.`,
      tone: "watch",
    })
  } else {
    observations.push({
      title: "Forward Stability",
      body: `No KPI crosses a critical threshold inside the 12-month projection window. The business has room to optimize deliberately, not defensively.`,
      tone: "positive",
    })
  }

  if (intel.criticalZones.length > 0) {
    observations.push({
      title: "Attention Concentration",
      body: `Stress is concentrated in ${intel.criticalZones.join(", ")}. Tightening those zones is the fastest route to a stronger overall position.`,
      tone: "watch",
    })
  } else {
    observations.push({
      title: "Risk Distribution",
      body: `No zone is currently critical. Most remaining risk sits in watch territory and is manageable with disciplined execution over the next two quarters.`,
      tone: "neutral",
    })
  }

  const strongSignals: string[] = []
  if (getHealthLevel("cash", kpis) === "strong") strongSignals.push("cash reserves")
  if (getHealthLevel("runway", kpis) === "strong") strongSignals.push("runway coverage")
  if (getHealthLevel("growth", kpis) === "strong") strongSignals.push("growth velocity")
  if (getHealthLevel("grossMargin", kpis) === "strong") strongSignals.push("gross margin quality")
  if (getHealthLevel("enterpriseValue", kpis) === "strong") strongSignals.push("enterprise value posture")

  observations.push({
    title: strongSignals.length > 0 ? "Strategic Leverage" : "Execution Readiness",
    body: strongSignals.length > 0
      ? `Your clearest support comes from ${strongSignals.join(", ")}. Those are the proof points to lean on in board, fundraising, and GTM decisions.`
      : `There is no clear surplus zone yet. The next move should create one obvious area of strength rather than spreading effort thinly.`,
    tone: strongSignals.length > 0 ? "positive" : "neutral",
  })

  return observations.slice(0, 3)
}

function buildExecutiveBrief(kpis: PositionKpis, intel: PositionIntel, summary: { label: string }) {
  const opening = `${summary.label} operating position with ${intel.survivalProbability}% modeled 12-month survival and ${Number.isFinite(kpis.runwayMonths) ? `${kpis.runwayMonths.toFixed(1)} months` : "extended"} of runway.`

  if (intel.cliff) {
    return `${opening} The next decision should primarily reduce pressure around ${KPI_ZONE_MAP[intel.cliff.kpi].label.toLowerCase()}.`
  }

  if (intel.criticalZones.length > 0) {
    return `${opening} The immediate objective is to move ${intel.criticalZones.join(", ")} out of the critical band.`
  }

  return `${opening} The operating posture is stable enough to shift attention from containment toward selective advantage-building.`
}

function RiskProfileChart({ axes }: { axes: RiskAxis[] }) {
  const width = 320
  const height = 224
  const cx = width / 2
  const cy = height / 2 + 6
  const radius = 76
  const rings = [0.33, 0.66, 1]

  const axisLines = axes.map((axis, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / axes.length
    return {
      ...axis,
      end: polar(cx, cy, radius, angle),
      labelPoint: polar(cx, cy, radius + 24, angle),
      point: polar(cx, cy, radius * (axis.value / 100), angle),
    }
  })

  const polygon = buildPolygonPath(axisLines.map((axis) => axis.point))

  return (
    <div style={{ borderRadius: 20, padding: 14, background: "radial-gradient(circle at 50% 44%, rgba(84,185,255,0.18), rgba(9,21,38,0.26) 56%, rgba(5,10,18,0.54) 100%)", border: "1px solid rgba(120,180,255,0.14)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Position risk profile spider chart" style={{ display: "block", width: "100%", height: "auto" }}>
        {rings.map((ring) => (
          <circle key={ring} cx={cx} cy={cy} r={radius * ring} fill="none" stroke="rgba(165,205,255,0.14)" strokeWidth="1" />
        ))}
        {axisLines.map((axis) => (
          <line key={axis.key} x1={cx} y1={cy} x2={axis.end.x} y2={axis.end.y} stroke="rgba(120,180,255,0.18)" strokeWidth="1" />
        ))}
        <path d={polygon} fill="rgba(89,205,255,0.18)" stroke="rgba(146,232,255,0.92)" strokeWidth="2.25" />
        {axisLines.map((axis) => (
          <circle key={`${axis.key}-point`} cx={axis.point.x} cy={axis.point.y} r="3.8" fill="rgba(239,251,255,0.98)" stroke="rgba(120,225,255,0.72)" strokeWidth="1.5" />
        ))}
        {axisLines.map((axis) => (
          <text key={`${axis.key}-label`} x={axis.labelPoint.x} y={axis.labelPoint.y} textAnchor="middle" fontSize="10" fill="rgba(226,239,255,0.82)" style={{ letterSpacing: "0.08em", fontWeight: 700 }}>
            {axis.label}
          </text>
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6, marginTop: 6 }}>
        {axes.map((axis) => (
          <div key={axis.key} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 10, color: "rgba(188,211,236,0.6)", letterSpacing: "0.04em" }}>{axis.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e7f7ff" }}>{Math.round(axis.value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PositionIntelligenceConsole({ kpis, intel, probability, simRunCount, onOpenWhatIf }: Props) {
  const summary = useMemo(() => getExecutiveSummary(kpis), [kpis])
  const displaySurvivalProbability = probability?.survivalProbability ?? intel.survivalProbability
  const displayCliff = probability?.cliff ?? intel.cliff
  const displayDataCompletenessPct = probability?.dataCompletenessPct ?? intel.dataCompletenessPct
  const displayModelConfidence = probability?.modelConfidence ?? (intel.healthScore >= 60 ? "High" : intel.healthScore >= 35 ? "Medium" : "Low")
  const axes = useMemo(() => buildRiskAxes(kpis, intel, displaySurvivalProbability), [kpis, intel, displaySurvivalProbability])
  const observations = useMemo(() => buildObservations(kpis, intel), [kpis, intel])
  const executiveBrief = useMemo(() => buildExecutiveBrief(kpis, intel, summary), [kpis, intel, summary])
  const accent = toneColor(summary.tone)
  const summaryToneLabel = toneLabel(summary.tone)
  const survivalTone = displaySurvivalProbability >= 70 ? "#78dfc3" : displaySurvivalProbability >= 40 ? "#f7c66b" : "#ff9b7a"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "2px 2px 10px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <section style={{ padding: 18, borderRadius: 20, background: "linear-gradient(180deg, rgba(15,28,46,0.94) 0%, rgba(9,16,29,0.88) 100%)", border: "1px solid rgba(120,180,255,0.16)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(135,195,255,0.62)", marginBottom: 8 }}>Executive Summary</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <div style={{ fontSize: 25, lineHeight: 1.02, fontWeight: 550, color: "#f3fbff" }}>Position: {summary.label}</div>
              <div style={{ padding: "5px 10px", borderRadius: 999, background: `${accent}12`, border: `1px solid ${accent}30`, color: accent, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>{summaryToneLabel}</div>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(219,235,249,0.82)", lineHeight: 1.5, maxWidth: 460 }}>{executiveBrief}</div>
          </div>
          <div style={{ minWidth: 96, padding: "10px 12px", borderRadius: 16, background: `${accent}14`, border: `1px solid ${accent}35`, textAlign: "center", boxShadow: `inset 0 1px 0 ${accent}18` }}>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginBottom: 4 }}>Health</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#f3fbff", lineHeight: 1 }}>{intel.healthScore}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <div style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", minWidth: 0 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(184,207,231,0.52)", marginBottom: 6 }}>12-Month Survival</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: survivalTone }}>{displaySurvivalProbability}%</div>
          </div>
          <div style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", minWidth: 0 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(184,207,231,0.52)", marginBottom: 6 }}>Risk Mix</div>
            <div style={{ fontSize: 12, color: "#e7f7ff", lineHeight: 1.5 }}>{intel.healthCounts.strong} strong / {intel.healthCounts.watch} watch / {intel.healthCounts.critical} critical</div>
          </div>
          <div style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", minWidth: 0 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(184,207,231,0.52)", marginBottom: 6 }}>Model Coverage</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#dff8ff" }}>{displayDataCompletenessPct}%</div>
          </div>
        </div>
      </section>

      <section style={{ padding: 18, borderRadius: 20, background: "linear-gradient(180deg, rgba(12,22,38,0.92) 0%, rgba(8,16,30,0.86) 100%)", border: "1px solid rgba(120,180,255,0.14)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 14px 34px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(135,195,255,0.6)", marginBottom: 8 }}>Risk Profile</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#eef9ff" }}>Executive Shape</div>
          </div>
          <div style={{ padding: "6px 10px", borderRadius: 999, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: survivalTone, border: `1px solid ${survivalTone}35`, background: `${survivalTone}10` }}>
              {displayCliff ? `Cliff Month ${displayCliff.month}` : "No Near-Term Cliff"}
          </div>
        </div>
        <RiskProfileChart axes={axes} />
      </section>

      <section style={{ padding: 16, borderRadius: 20, background: "linear-gradient(180deg, rgba(12,20,34,0.92) 0%, rgba(8,15,27,0.86) 100%)", border: "1px solid rgba(120,180,255,0.14)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 14px 34px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(135,195,255,0.6)", marginBottom: 12 }}>Key Observations</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {observations.map((observation) => {
            const observationColor = observation.tone === "positive" ? "#78dfc3" : observation.tone === "watch" ? "#f7c66b" : "#89c6ff"
            return (
              <div key={observation.title} style={{ display: "grid", gridTemplateColumns: "10px 1fr", gap: 10, padding: 12, borderRadius: 16, background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.05)", minWidth: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: observationColor, boxShadow: `0 0 14px ${observationColor}55`, marginTop: 4 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 650, color: "#eff9ff", marginBottom: 4 }}>{observation.title}</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.45, color: "rgba(214,231,248,0.8)" }}>{observation.body}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ padding: 12, borderRadius: 18, background: "linear-gradient(180deg, rgba(12,18,30,0.90) 0%, rgba(8,12,22,0.84) 100%)", border: "1px solid rgba(120,180,255,0.12)" }}>
        <ProbabilitySummaryCard
          title="Survival Probability"
          subtitle={probability?.subtitle ?? "Modelled from the current position state shown on this terrain view."}
          metrics={[
            { label: "Survival Probability", value: `${displaySurvivalProbability}%`, probability: displaySurvivalProbability },
            { label: "Runway Risk", value: probability?.runwayRiskLabel ?? (displayCliff ? `Month ${displayCliff.month}` : "Contained"), probability: probability?.runwayRiskProbability ?? (displayCliff ? Math.max(10, 100 - displaySurvivalProbability) : 15) },
          ]}
          simulationCount={simRunCount && simRunCount > 0 ? simRunCount : undefined}
          modelConfidence={displayModelConfidence}
          dataCompleteness={`${displayDataCompletenessPct}%`}
        />
      </section>

      <div style={{ marginTop: -2 }}>
        <SimulationDisclaimerBar variant="compact" />
      </div>

      <section style={{ padding: 16, borderRadius: 20, background: "linear-gradient(145deg, rgba(10,28,45,0.97) 0%, rgba(8,18,30,0.90) 100%)", border: "1px solid rgba(95,216,255,0.22)", boxShadow: "0 0 28px rgba(56, 180, 248, 0.14), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(135,195,255,0.6)", marginBottom: 8 }}>Strategic Simulation</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#eef9ff", marginBottom: 8 }}>Pressure-test the next move</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(214,231,248,0.8)", marginBottom: 14 }}>
          Run the current position through What-If and see whether the next decision improves the pressure points identified above.
        </div>
        <button
          type="button"
          onClick={onOpenWhatIf}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", background: "linear-gradient(90deg, #9ae8ff 0%, #48c4ff 100%)", color: "#082130", fontSize: 13, fontWeight: 800, letterSpacing: "0.04em", cursor: "pointer", boxShadow: "0 10px 24px rgba(57,186,247,0.24)" }}
        >
          Open What-If Simulator
        </button>
      </section>
    </div>
  )
}