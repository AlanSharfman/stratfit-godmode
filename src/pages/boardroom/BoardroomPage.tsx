import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"
import { AnimatePresence } from "framer-motion"

import PageShell from "@/components/nav/PageShell"
const BriefingTheatre = lazy(() => import("@/components/command/BriefingTheatre"))
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { getExecutiveSummary, getKpiCommentary } from "@/domain/intelligence/kpiCommentary"
import { computeActionRecommendations } from "@/engine/sensitivityAnalysis"
import { timeSimulation, buildKpiSnapshot, findFirstCliff } from "@/engine/timeSimulation"
import { useKpiAudio } from "@/hooks/useKpiAudio"
import ScenarioTimelineSlider from "@/components/scenarios/ScenarioTimelineSlider"
import { useScenarioTimeline } from "@/hooks/useScenarioTimeline"
import { useScenarioTimelineStore } from "@/state/scenarioTimelineStore"
import { buildScenarioTimeline } from "@/engine/buildScenarioTimeline"
import ProbabilitySummaryCard from "@/components/probability/ProbabilitySummaryCard"
import SimulationDisclaimerBar from "@/components/legal/SimulationDisclaimerBar"

type BoardMode = "cinematic" | "report" | "briefing"

const KPI_DISPLAY: Record<KpiKey, { label: string; fmt: (k: PositionKpis) => string }> = {
  cash: { label: "Cash Balance", fmt: (k) => `$${(k.cashOnHand / 1000).toFixed(0)}K` },
  runway: { label: "Runway", fmt: (k) => `${k.runwayMonths.toFixed(1)} months` },
  growth: { label: "Growth Rate", fmt: (k) => `${k.growthRatePct.toFixed(1)}%` },
  arr: { label: "ARR", fmt: (k) => `$${(k.arr / 1000).toFixed(0)}K` },
  revenue: { label: "Monthly Revenue", fmt: (k) => `$${(k.revenueMonthly / 1000).toFixed(0)}K` },
  burn: { label: "Monthly Burn", fmt: (k) => `$${(k.burnMonthly / 1000).toFixed(0)}K` },
  churn: { label: "Churn Rate", fmt: (k) => `${k.churnPct.toFixed(1)}%` },
  grossMargin: { label: "Gross Margin", fmt: (k) => `${k.grossMarginPct.toFixed(1)}%` },
  headcount: { label: "Headcount", fmt: (k) => `${k.headcount}` },
  enterpriseValue: { label: "Enterprise Value", fmt: (k) => k.valuationEstimate ? `$${(k.valuationEstimate / 1000).toFixed(0)}K` : "N/A" },
}

function generateBoardQuestions(kpis: PositionKpis): string[] {
  const questions: string[] = []
  if (kpis.runwayMonths < 12) questions.push("What is your plan to extend runway beyond 12 months?")
  if (kpis.churnPct > 5) questions.push(`Churn is at ${kpis.churnPct.toFixed(1)}% — what's driving customer attrition and what's the retention strategy?`)
  if (kpis.growthRatePct < 15) questions.push("Growth is below 15% — what levers are available to accelerate?")
  if (kpis.burnMonthly > kpis.revenueMonthly) questions.push("Burn exceeds revenue — when do you expect to reach cash-flow positive?")
  if (kpis.grossMarginPct < 60) questions.push(`Gross margin at ${kpis.grossMarginPct.toFixed(0)}% is below SaaS benchmarks — what's the path to 70%+?`)
  if (kpis.efficiencyRatio < 0.7) questions.push("Efficiency ratio is low — how are you measuring and improving unit economics?")
  if (questions.length < 3) {
    questions.push("What are the top three risks to achieving this quarter's targets?")
    questions.push("How does the competitive landscape affect your growth assumptions?")
    questions.push("What would you do differently with an additional $1M in capital?")
  }
  return questions.slice(0, 5)
}

export default function BoardroomPage() {
  const [mode, setMode] = useState<BoardMode>("cinematic")
  const { baseline } = useSystemBaseline()
  const liveKpis = useMemo(() => baseline ? buildPositionViewModel(baseline as any).kpis : null, [baseline])

  const [revealedKpis, setRevealedKpis] = useState<Set<KpiKey>>(new Set())
  const [revealIndex, setRevealIndex] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [narrativeText, setNarrativeText] = useState("")
  const { speak, stop } = useKpiAudio(liveKpis)
  const revealTimerRef = useRef<number | null>(null)

  const fullRevealed = useMemo(() => new Set(KPI_KEYS), [])

  const {
    timeline: boardTimeline,
    activeKpis: timelineKpis,
    handleVoice: handleTimelineVoice,
    isNarrating: isTimelineNarrating,
  } = useScenarioTimeline(liveKpis)
  const setTimelineStore = useScenarioTimelineStore((s) => s.setTimeline)

  useEffect(() => {
    if (!liveKpis) return
    const tl = buildScenarioTimeline(liveKpis, {}, "Board Outlook")
    setTimelineStore(tl)
  }, [liveKpis, setTimelineStore])

  const recommendations = useMemo(() => liveKpis ? computeActionRecommendations(liveKpis, 3) : [], [liveKpis])
  const boardQuestions = useMemo(() => liveKpis ? generateBoardQuestions(liveKpis) : [], [liveKpis])

  const healthCategories = useMemo(() => {
    if (!liveKpis) return { strong: [] as KpiKey[], watch: [] as KpiKey[], critical: [] as KpiKey[] }
    const strong: KpiKey[] = [], watch: KpiKey[] = [], critical: KpiKey[] = []
    for (const kpi of KPI_KEYS) {
      const level = getHealthLevel(kpi, liveKpis)
      if (level === "strong" || level === "healthy") strong.push(kpi)
      else if (level === "watch") watch.push(kpi)
      else critical.push(kpi)
    }
    return { strong, watch, critical }
  }, [liveKpis])

  const outlook = useMemo(() => {
    if (!liveKpis) return null
    const snapshot = buildKpiSnapshot({
      cashBalance: liveKpis.cashOnHand, runwayMonths: liveKpis.runwayMonths,
      growthRatePct: liveKpis.growthRatePct, arr: liveKpis.arr,
      revenueMonthly: liveKpis.revenueMonthly, burnMonthly: liveKpis.burnMonthly,
      churnPct: liveKpis.churnPct, grossMarginPct: liveKpis.grossMarginPct,
      headcount: liveKpis.headcount, enterpriseValue: liveKpis.valuationEstimate,
    })
    const timeline = timeSimulation(snapshot, { direct: {} }, 12)
    const cliff = findFirstCliff(timeline)
    const m12 = timeline[timeline.length - 1]
    let text = cliff
      ? `At current trajectory, ${KPI_ZONE_MAP[cliff.kpi].label} reaches critical at month ${cliff.month}.`
      : "No critical tipping points in the 12-month horizon."
    if (m12) text += ` Projected month 12: Cash $${(m12.kpis.cash / 1000).toFixed(0)}K, Runway ${m12.kpis.runway.toFixed(1)} months.`
    return { text, cliff, m12Kpis: m12?.kpis ?? null }
  }, [liveKpis])

  const startCinematic = useCallback(() => {
    setRevealedKpis(new Set()); setRevealIndex(0); setIsRevealing(true)
    setNarrativeText("Building your mountain...")
  }, [])

  useEffect(() => {
    if (!isRevealing || !liveKpis) return
    if (revealIndex >= KPI_KEYS.length) {
      setIsRevealing(false)
      setNarrativeText(getExecutiveSummary(liveKpis, KPI_KEYS.length).narrative)
      return
    }
    revealTimerRef.current = window.setTimeout(() => {
      const kpi = KPI_KEYS[revealIndex]
      setRevealedKpis((prev) => new Set([...prev, kpi]))
      setNarrativeText(getKpiCommentary(kpi, liveKpis) ?? "")
      speak(kpi)
      setRevealIndex((i) => i + 1)
    }, revealIndex === 0 ? 500 : 6000)
    return () => { if (revealTimerRef.current) clearTimeout(revealTimerRef.current) }
  }, [isRevealing, revealIndex, liveKpis, speak])

  const handleDownload = useCallback(() => {
    const el = document.getElementById("boardroom-report")
    if (!el) return
    const printStyles = `
      @media print {
        body { background: #fff !important; color: #1a1a2e !important; font-family: Inter, system-ui, sans-serif; padding: 32px; margin: 0; }
        * { color: #1a1a2e !important; border-color: #ddd !important; }
        h1 { font-weight: 200; letter-spacing: 0.15em; text-transform: uppercase; font-size: 24px; margin-bottom: 8px; }
        h3 { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #0891b2 !important; margin-bottom: 12px; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
        [style*="background"] { background: transparent !important; }
        button { display: none !important; }
      }
    `
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>STRATFIT Board Pack — ${new Date().toLocaleDateString()}</title><style>body{font-family:Inter,system-ui,sans-serif;background:#0B1520;color:#c8dcf0;padding:48px;max-width:800px;margin:0 auto}h1{font-weight:200;letter-spacing:0.15em;text-transform:uppercase}h3{font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#22d3ee80}hr{border:none;border-top:1px solid rgba(34,211,238,0.08);margin:24px 0}${printStyles}</style></head><body>${el.innerHTML}<script>window.onload=()=>window.print()<\/script></body></html>`
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }, [])

  if (!liveKpis) {
    return <PageShell><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(200,220,240,0.3)", fontSize: 14 }}>Complete initiation to generate board pack</div></PageShell>
  }

  return (
    <PageShell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {/* Mode Toggle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0", gap: 0, background: "rgba(12,20,34,0.7)", borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
          {(["cinematic", "briefing", "report"] as BoardMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "10px 32px", background: mode === m ? "rgba(34,211,238,0.08)" : "transparent",
              border: "none", color: mode === m ? "#22d3ee" : "rgba(200,220,240,0.35)",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
            }}>{m === "briefing" ? "Intelligence Brief" : m}</button>
          ))}
        </div>

        {/* Intelligence Briefing Theatre */}
        <AnimatePresence>
          {mode === "briefing" && (
            <Suspense fallback={<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(34,211,238,0.3)", fontSize: 13 }}>Loading briefing…</div>}>
              <BriefingTheatre kpis={liveKpis} onClose={() => setMode("cinematic")} />
            </Suspense>
          )}
        </AnimatePresence>

        {mode === "cinematic" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 500 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <TerrainStage
                progressive revealedKpis={revealedKpis}
                focusedKpi={revealIndex > 0 && revealIndex <= KPI_KEYS.length ? KPI_KEYS[revealIndex - 1] : null}
                zoneKpis={timelineKpis ?? liveKpis} cameraPreset={POSITION_PROGRESSIVE_PRESET}
                autoRotateSpeed={isRevealing ? 0.5 : 0.2} hideMarkers heatmapEnabled={false}
                driftMode="cinematic"
              ><SkyAtmosphere /></TerrainStage>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 48px", background: "linear-gradient(transparent 0%, rgba(12,20,34,0.92) 100%)", zIndex: 5 }}>
              <div style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.7, color: "rgba(200,220,240,0.8)", maxWidth: 700 }}>{narrativeText}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {!isRevealing ? (
                  <button onClick={startCinematic} style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 6, padding: "8px 18px", color: "#22d3ee", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                    ▶ Start Cinematic
                  </button>
                ) : (
                  <button onClick={() => { setIsRevealing(false); stop() }} style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 6, padding: "8px 18px", color: "#22d3ee", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                    ■ Stop
                  </button>
                )}
              </div>
            </div>
            </div>
            <ScenarioTimelineSlider onVoice={handleTimelineVoice} isNarrating={isTimelineNarrating} />
          </div>
        ) : (
          <div id="boardroom-report" style={{ maxWidth: 800, margin: "24px auto 48px", padding: "48px", background: "linear-gradient(135deg, rgba(10,18,32,0.95), rgba(6,14,28,0.98))", border: "1px solid rgba(34,211,238,0.1)", borderRadius: 12, boxShadow: "0 4px 32px rgba(0,0,0,0.4)" }}>
            <div style={{ textAlign: "center", marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid rgba(34,211,238,0.08)" }}>
              <div style={{ fontSize: 28, fontWeight: 200, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(200,220,240,0.9)", marginBottom: 8 }}>Board Pack</div>
              <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(34,211,238,0.5)" }}>
                Strategic Assessment · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            </div>

            {/* Executive Summary */}
            <Section title="Executive Summary">
              <Narrative>{getExecutiveSummary(liveKpis).narrative}</Narrative>
            </Section>

            {/* Key Metrics */}
            <Section title="Key Metrics">
              {KPI_KEYS.map((kpi) => (
                <MetricRow key={kpi} label={KPI_DISPLAY[kpi].label} value={KPI_DISPLAY[kpi].fmt(liveKpis)} />
              ))}
            </Section>

            {/* Risk Zones */}
            <Section title="Risk Assessment">
              {healthCategories.critical.map((k) => <RiskBadge key={k} label={KPI_ZONE_MAP[k].label} level="critical" />)}
              {healthCategories.watch.map((k) => <RiskBadge key={k} label={KPI_ZONE_MAP[k].label} level="watch" />)}
              {healthCategories.strong.map((k) => <RiskBadge key={k} label={KPI_ZONE_MAP[k].label} level="strong" />)}
            </Section>

            {/* 12-Month Outlook */}
            {outlook && (
              <Section title="12-Month Outlook">
                <Narrative>{outlook.text}</Narrative>
                {outlook.cliff && (
                  <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 6, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.1)", color: "#f87171", fontSize: 12 }}>
                    ⚠ Tipping point: {KPI_ZONE_MAP[outlook.cliff.kpi].label} at month {outlook.cliff.month}
                  </div>
                )}
              </Section>
            )}

            {/* Top Actions */}
            <Section title="Recommended Actions">
              {recommendations.map((rec) => (
                <div key={rec.kpi} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(34,211,238,0.1)", color: "#22d3ee", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{rec.rank}</span>
                  <span style={{ fontSize: 13, color: "rgba(200,220,240,0.7)", lineHeight: 1.5 }}>
                    <strong>{rec.headline}</strong> — {rec.impactDescription}
                  </span>
                </div>
              ))}
            </Section>

            {/* What The Board Will Ask */}
            <Section title="Anticipated Board Questions">
              {boardQuestions.map((q, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 13, color: "rgba(200,220,240,0.6)", lineHeight: 1.6 }}>
                  <span style={{ color: "rgba(34,211,238,0.5)", marginRight: 8 }}>Q{i + 1}.</span> {q}
                </div>
              ))}
            </Section>

            {/* Probability Overview */}
            <Section title="Probability Overview">
              <ProbabilitySummaryCard
                metrics={[
                  { label: "Survival Probability", value: outlook?.cliff ? `${Math.max(5, Math.round(100 - (12 - outlook.cliff.month) * 8))}%` : "High" },
                  { label: "Runway Risk", value: outlook?.cliff ? `Month ${outlook.cliff.month}` : "Low" },
                  { label: "EBITDA Positive Probability", value: "—" }, // TODO: wire from Monte Carlo
                  { label: "Revenue Target Probability", value: "—" }, // TODO: wire from Monte Carlo
                ]}
                simulationCount={1000}
                modelConfidence="Medium"
                dataCompleteness={liveKpis ? "Complete" : "Partial"}
              />
            </Section>

            {/* Confidence */}
            <Section title="Confidence">
              <Narrative>This assessment is based on baseline data provided during initiation. Confidence increases with richer input data and simulation calibration.</Narrative>
            </Section>

            <div style={{ marginBottom: 16 }}>
              <SimulationDisclaimerBar variant="default" />
            </div>

            <button onClick={handleDownload} style={{
              display: "block", width: "100%", marginTop: 32, padding: "16px 0",
              background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.06))",
              border: "1px solid rgba(34,211,238,0.25)", borderRadius: 8, color: "#22d3ee",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: "pointer", textAlign: "center",
            }}>↓ Download Board Pack</button>

            <div style={{ textAlign: "center", marginTop: 32, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(34,211,238,0.3)" }}>
              STRATFIT · Powered by Business Physics
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

/* ── Tiny helper components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.6)", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Narrative({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(200,220,240,0.7)" }}>{children}</div>
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <span style={{ fontSize: 13, color: "rgba(200,220,240,0.6)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(200,220,240,0.9)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  )
}

function RiskBadge({ label, level }: { label: string; level: "critical" | "watch" | "strong" }) {
  const colors = { critical: { bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.1)", text: "#f87171" }, watch: { bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.1)", text: "#fbbf24" }, strong: { bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.1)", text: "#34d399" } }
  const c = colors[level]
  return (
    <div style={{ padding: "10px 14px", marginBottom: 6, borderRadius: 6, fontSize: 12, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      ● {label} — {level.toUpperCase()}
    </div>
  )
}

