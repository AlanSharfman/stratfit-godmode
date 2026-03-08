import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"
import { AnimatePresence } from "framer-motion"

import PageShell from "@/components/nav/PageShell"
import { usePhase1ScenarioStore, type SimulationResults } from "@/state/phase1ScenarioStore"
import { computeDeltas, type DeltaMetrics } from "@/engine/compareDeltas"
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
import { timeSimulation, buildKpiSnapshot, findFirstCliff, deriveSurvivalProbability } from "@/engine/timeSimulation"
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
  nrr: { label: "NRR", fmt: (k) => `${k.nrrPct.toFixed(0)}%` },
  efficiency: { label: "Revenue / Employee", fmt: (k) => `$${(k.efficiencyRatio / 1000).toFixed(0)}K` },
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

  // ── Active scenario (from What If or Studio) ──────────────────────────
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)
  const scenarios        = usePhase1ScenarioStore((s) => s.scenarios)
  const activeScenario   = useMemo(
    () => (activeScenarioId ? scenarios.find((s) => s.id === activeScenarioId) ?? null : null),
    [activeScenarioId, scenarios],
  )

  // ── Canonical KPI source ──────────────────────────────────────────────
  // Priority: active scenario simulation results → baseline
  // This ensures Boardroom reflects the current What If / Studio scenario.
  const liveKpis = useMemo((): ReturnType<typeof buildPositionViewModel>["kpis"] | null => {
    if (!baseline) return null
    const baseKpis = buildPositionViewModel(baseline as any).kpis
    const sk = activeScenario?.simulationResults?.kpis
    if (!sk) return baseKpis
    // Merge scenario simulation KPIs over the baseline shape.
    // SimulationKpis uses 0-1 decimals for percentages; PositionKpis uses 0-100.
    const pct = (v: number) => (Math.abs(v) <= 1 ? v * 100 : v)
    return {
      ...baseKpis,
      cashOnHand:      sk.cash,
      burnMonthly:     sk.monthlyBurn,
      revenueMonthly:  sk.revenue,
      grossMarginPct:  pct(sk.grossMargin),
      growthRatePct:   pct(sk.growthRate),
      churnPct:        pct(sk.churnRate),
      headcount:       sk.headcount,
      runwayMonths:    sk.runway ?? (sk.monthlyBurn > 0 ? sk.cash / sk.monthlyBurn : baseKpis.runwayMonths),
      arr:             sk.revenue * 12,
    }
  }, [activeScenario, baseline])

  const isScenarioMode = activeScenario !== null

  // ── Always-baseline KPIs (for delta comparison) ──────────────────────────
  // Separate from liveKpis so both sides of the delta are always available.
  const baseKpis = useMemo(
    () => (baseline ? buildPositionViewModel(baseline as any).kpis : null),
    [baseline],
  )

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

  // ── Boardroom structured payload ─────────────────────────────────────────
  // Single source of truth for all report sections.
  // All delta values sourced from canonical simulationResults + computeDeltas.
  // Falls back gracefully to KPI-derived values when projections are absent.
  const boardroomPayload = useMemo(() => {
    if (!liveKpis || !baseKpis) return null

    // ── Build simulation results for each side ──────────────────────────────
    // Baseline: prefer the "baseline-projection" scenario (has p10/p50/p90).
    // Fallback: synthesise a minimal SimulationResults from baseKpis.
    const baselineProjectionScenario = scenarios.find((s) => s.id === "baseline-projection") ?? null
    const baselineSimResults: SimulationResults | null =
      baselineProjectionScenario?.simulationResults ?? ((): SimulationResults => ({
        completedAt:   0,
        horizonMonths: 24,
        summary:       "Baseline",
        kpis: {
          cash:        baseKpis.cashOnHand,
          monthlyBurn: baseKpis.burnMonthly,
          revenue:     baseKpis.revenueMonthly,
          grossMargin: baseKpis.grossMarginPct / 100,
          growthRate:  baseKpis.growthRatePct  / 100,
          churnRate:   baseKpis.churnPct       / 100,
          headcount:   baseKpis.headcount,
          arpa:        baseline?.operating?.acv ?? 0,
          runway:      baseKpis.runwayMonths,
        },
        terrain: { seed: 0, multipliers: { cash: 1, burn: 1, growth: 1 } },
      }))()

    const scenarioSimResults = activeScenario?.simulationResults ?? null

    // ── Delta engine — canonical 6 metrics, projection-sourced ─────────────
    const deltaMetrics: DeltaMetrics | null = computeDeltas(
      baselineSimResults,
      scenarioSimResults ?? baselineSimResults, // compare against itself when no scenario
    )

    // ── Map DeltaMetrics → DeltaRow[] for the UI table ──────────────────────
    type DeltaUnit = "currency" | "percent" | "months" | "score"
    interface DeltaRow {
      metric:        string
      baselineValue: number
      scenarioValue: number
      absDelta:      number
      pctDelta:      number | null
      unit:          DeltaUnit
      upIsGood:      boolean
    }

    const majorDeltas: DeltaRow[] = deltaMetrics
      ? [
          deltaMetrics.revenueDelta,
          deltaMetrics.ebitdaDelta,
          deltaMetrics.cashDelta,
          deltaMetrics.runwayDelta,
          deltaMetrics.riskDelta,
          deltaMetrics.enterpriseValueDelta,
        ].map((d) => ({
          metric:        d.label,
          baselineValue: d.baseline,
          scenarioValue: d.scenario,
          absDelta:      d.absDelta,
          pctDelta:      d.pctDelta,
          unit:          d.unit as DeltaUnit,
          upIsGood:      d.upIsGood,
        }))
      : []

    // ── Movement signals — projections first, KPI fallback ──────────────────
    const baseProj  = baselineSimResults?.projections
    const scenProj  = scenarioSimResults?.projections

    const runwayBaseline = baseProj?.runwayMonths ?? baseKpis.runwayMonths
    const runwayScenario = scenProj?.runwayMonths ?? liveKpis.runwayMonths

    const evBaseline = baseProj?.enterpriseValueEstimate
      ?? (baseKpis.arr * Math.max(2, Math.min(30, (baseKpis.growthRatePct / 100) * 40)))
    const evScenario = scenProj?.enterpriseValueEstimate
      ?? (liveKpis.arr * Math.max(2, Math.min(30, (liveKpis.growthRatePct / 100) * 40)))
    const evPct = Math.abs(evBaseline) > 0.0001
      ? ((evScenario - evBaseline) / Math.abs(evBaseline)) * 100
      : 0

    // ── Risk movement — health-level categorisation (unchanged) + riskDelta ─
    const categHlth = (k: PositionKpis) => {
      const critical: string[] = [], watch: string[] = [], strong: string[] = []
      for (const key of KPI_KEYS) {
        const lvl = getHealthLevel(key, k)
        if (lvl === "strong" || lvl === "healthy") strong.push(key)
        else if (lvl === "watch") watch.push(key)
        else critical.push(key)
      }
      return { critical, watch, strong }
    }
    const baseHealth     = categHlth(baseKpis)
    const scenarioHealth = categHlth(liveKpis)
    const newCritical    = scenarioHealth.critical.filter((k) => !baseHealth.critical.includes(k))
    const resolved       = baseHealth.critical.filter((k) => !scenarioHealth.critical.includes(k))

    // ── Scenario summary — deterministic narrative from delta engine ─────────
    // Replaces the placeholder "Simulation complete — ..." string.
    const buildScenarioSummary = (): string | null => {
      if (!isScenarioMode || !deltaMetrics) return null
      const parts: string[] = []
      const { revenueDelta: rev, runwayDelta: rwy, enterpriseValueDelta: ev, riskDelta: risk } = deltaMetrics
      if (rev.pctDelta != null && Math.abs(rev.pctDelta) > 0.1) {
        const dir = rev.absDelta >= 0 ? "increases" : "decreases"
        parts.push(`Revenue ${dir} ${Math.abs(rev.pctDelta).toFixed(1)}% to ${fmtBoardVal(rev.scenario, "currency")} MRR.`)
      }
      if (ev.pctDelta != null && Math.abs(ev.pctDelta) > 0.1) {
        const dir = ev.absDelta >= 0 ? "rises" : "falls"
        parts.push(`Enterprise value ${dir} ${Math.abs(ev.pctDelta).toFixed(1)}% to ${fmtBoardVal(ev.scenario, "currency")}.`)
      }
      if (Math.abs(rwy.absDelta) >= 1) {
        const dir = rwy.absDelta >= 0 ? "extends" : "compresses"
        parts.push(`Runway ${dir} by ${Math.abs(Math.round(rwy.absDelta))}mo to ${Math.round(rwy.scenario)}mo.`)
      }
      if (Math.abs(risk.absDelta) >= 1) {
        const dir = risk.absDelta >= 0 ? "improves" : "deteriorates"
        parts.push(`Risk score ${dir} by ${Math.abs(risk.absDelta).toFixed(0)} points.`)
      }
      return parts.join(" ") || "Scenario simulation complete."
    }

    // ── Data completeness ────────────────────────────────────────────────────
    const hasProjections = !!scenProj
    const populated = majorDeltas.filter((d) => d.scenarioValue !== 0).length
    const completeness = Math.round((populated / Math.max(majorDeltas.length, 1)) * 100)

    return {
      generatedAt:      Date.now(),
      isScenarioMode,
      baselineSummary:  getExecutiveSummary(baseKpis).narrative,
      scenarioDecision: activeScenario?.decision ?? null,
      scenarioSummary:  buildScenarioSummary(),
      /** Canonical 6-metric deltas from the delta engine (projection-sourced). */
      majorDeltas,
      /** Raw DeltaMetrics object exposed for AI commentary layer. */
      deltaMetrics,
      riskMovement: {
        baselineCritical: baseHealth.critical,
        scenarioCritical: scenarioHealth.critical,
        newCritical,
        resolved,
        /** Projection-sourced risk score delta (positive = improvement). */
        riskScoreDelta: deltaMetrics?.riskDelta.absDelta ?? null,
      },
      runwayMovement: {
        baseline: runwayBaseline,
        scenario: runwayScenario,
        delta:    runwayScenario - runwayBaseline,
      },
      enterpriseValueMovement: {
        baseline: evBaseline,
        scenario: evScenario,
        delta:    evScenario - evBaseline,
        pct:      evPct,
      },
      hasProjections,
      dataCompleteness: `${completeness}%`,
      /** p10/p50/p90 bands for probability cards — null when no projections. */
      probabilityBands: scenProj?.probabilityBands ?? null,
    }
  }, [liveKpis, baseKpis, isScenarioMode, activeScenario, scenarios, baseline])

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
    const survivalProbability = deriveSurvivalProbability(timeline)
    const m12 = timeline[timeline.length - 1]
    let text = cliff
      ? `At current trajectory, ${KPI_ZONE_MAP[cliff.kpi].label} reaches critical at month ${cliff.month}.`
      : "No critical tipping points in the 12-month horizon."
    if (m12) text += ` Projected month 12: Cash $${(m12.kpis.cash / 1000).toFixed(0)}K, Runway ${m12.kpis.runway.toFixed(1)} months.`
    return { text, cliff, survivalProbability, m12Kpis: m12?.kpis ?? null }
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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>STRATFIT Board Pack — ${new Date().toLocaleDateString()}</title><style>body{font-family:Inter,system-ui,sans-serif;background:#0B1520;color:#c8dcf0;padding:48px;max-width:800px;margin:0 auto}h1{font-weight:200;letter-spacing:0.15em;text-transform:uppercase}h3{font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#22d3ee80}hr{border:none;border-top:1px solid rgba(34,211,238,0.08);margin:24px 0}${printStyles}</style></head><body>${el.innerHTML}<script>window.onload=()=>window.print()</script></body></html>`
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
        {/* Mode Toggle + scenario indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0", gap: 0, background: "rgba(12,20,34,0.7)", borderBottom: "1px solid rgba(34,211,238,0.06)", position: "relative" }}>
          {(["cinematic", "briefing", "report"] as BoardMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "10px 32px", background: mode === m ? "rgba(34,211,238,0.08)" : "transparent",
              border: "none", color: mode === m ? "#22d3ee" : "rgba(200,220,240,0.35)",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
            }}>{m === "briefing" ? "Intelligence Brief" : m}</button>
          ))}
          {/* Scenario source indicator — shown when board pack reflects a What If / Studio scenario */}
          {isScenarioMode && (
            <span style={{
              position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
              fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "3px 10px", borderRadius: 20,
              background: "rgba(110,91,255,0.10)", border: "1px solid rgba(110,91,255,0.28)",
              color: "#6E5BFF",
            }}>
              SCENARIO: {activeScenario?.decision?.slice(0, 28) ?? "Active"}
            </span>
          )}
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
            <div style={{ padding: "0 48px 8px" }}>
              <SimulationDisclaimerBar variant="compact" />
            </div>
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

            {/* Scenario Under Review — only when a scenario is active */}
            {boardroomPayload?.isScenarioMode && boardroomPayload.scenarioDecision && (
              <Section title="Scenario Under Review">
                <div style={{ padding: "10px 14px", borderRadius: 6, background: "rgba(110,91,255,0.05)", border: "1px solid rgba(110,91,255,0.2)", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#EAF4FF", marginBottom: 4 }}>
                    {boardroomPayload.scenarioDecision}
                  </div>
                  {boardroomPayload.scenarioSummary && (
                    <div style={{ fontSize: 12, color: "rgba(157,183,209,0.75)", lineHeight: 1.6 }}>
                      {boardroomPayload.scenarioSummary}
                    </div>
                  )}
                </div>
                <Narrative>{boardroomPayload.baselineSummary}</Narrative>
              </Section>
            )}

            {/* Baseline vs Scenario Delta Table — only when scenario is active */}
            {boardroomPayload?.isScenarioMode && boardroomPayload.majorDeltas.length > 0 && (
              <Section title="Baseline vs Scenario — Key Deltas">
                {/* Headline movement signals */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {(() => {
                    const runway = boardroomPayload.runwayMovement
                    const ev = boardroomPayload.enterpriseValueMovement
                    const risk = boardroomPayload.riskMovement
                    const signals: { label: string; value: string; positive: boolean }[] = []
                    if (runway) {
                      const sign = runway.delta >= 0 ? "+" : ""
                      signals.push({ label: "Runway", value: `${sign}${Math.round(runway.delta)}mo`, positive: runway.delta >= 0 })
                    }
                    if (ev && ev.pct !== 0) {
                      const sign = ev.pct >= 0 ? "+" : ""
                      signals.push({ label: "Enterprise Value", value: `${sign}${ev.pct.toFixed(1)}%`, positive: ev.pct >= 0 })
                    }
                    if (risk) {
                      if (risk.newCritical.length > 0)
                        signals.push({ label: "New Risk Zones", value: `+${risk.newCritical.length}`, positive: false })
                      if (risk.resolved.length > 0)
                        signals.push({ label: "Resolved Risks", value: `${risk.resolved.length} resolved`, positive: true })
                    }
                    return signals.map((s) => (
                      <span key={s.label} style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: s.positive ? "rgba(183,255,60,0.07)" : "rgba(110,91,255,0.07)",
                        border: `1px solid ${s.positive ? "rgba(183,255,60,0.22)" : "rgba(110,91,255,0.22)"}`,
                        color: s.positive ? "#B7FF3C" : "#6E5BFF",
                      }}>
                        {s.label}: {s.value}
                      </span>
                    ))
                  })()}
                </div>
                {/* Delta table */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(34,211,238,0.1)" }}>
                      {["Metric", "Baseline", "Scenario", "Δ Abs", "Δ %"].map((h, i) => (
                        <th key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", padding: "5px 8px", textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {boardroomPayload.majorDeltas.map((d) => {
                      const isPos = d.upIsGood ? d.absDelta > 0.001 : d.absDelta < -0.001
                      const isNeg = d.upIsGood ? d.absDelta < -0.001 : d.absDelta > 0.001
                      const deltaColor = isPos ? "#B7FF3C" : isNeg ? "#6E5BFF" : "rgba(148,180,214,0.4)"
                      const sign = d.absDelta > 0 ? "+" : ""
                      const fmtV = (v: number) => fmtBoardVal(v, d.unit)
                      const fmtD = () => {
                        if (d.unit === "percent") return `${sign}${d.absDelta.toFixed(1)}pp`
                        if (d.unit === "months")  return `${sign}${Math.round(d.absDelta)}mo`
                        if (d.unit === "score")   return `${sign}${d.absDelta.toFixed(0)}pts`
                        return `${sign}${fmtV(d.absDelta)}`
                      }
                      return (
                        <tr key={d.metric} style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
                          <td style={{ fontSize: 12, color: "rgba(226,240,255,0.7)", padding: "6px 8px" }}>{d.metric}</td>
                          <td style={{ fontSize: 12, color: "rgba(148,180,214,0.55)", padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtV(d.baselineValue)}</td>
                          <td style={{ fontSize: 12, color: "rgba(226,240,255,0.85)", padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtV(d.scenarioValue)}</td>
                          <td style={{ fontSize: 12, fontWeight: 700, color: deltaColor, padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtD()}</td>
                          <td style={{ fontSize: 12, fontWeight: 700, color: deltaColor, padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {d.pctDelta != null ? `${d.pctDelta > 0 ? "+" : ""}${d.pctDelta.toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Section>
            )}

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
                  <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 6, background: "rgba(110,91,255,0.06)", border: "1px solid rgba(110,91,255,0.22)", color: "#6E5BFF", fontSize: 12 }}>
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
                  { label: "Survival Probability", value: `${outlook?.survivalProbability ?? 0}%`, probability: outlook?.survivalProbability ?? 0 },
                  { label: "Runway Risk", value: outlook?.cliff ? `Month ${outlook.cliff.month}` : "Low" },
                  // Revenue P90 upside at month 12 (from probability bands when projections exist)
                  ...(boardroomPayload?.probabilityBands ? (() => {
                    const pb = boardroomPayload.probabilityBands
                    const rev0   = pb.p50.revenue[0]  ?? 0
                    const rev12P50 = pb.p50.revenue[12] ?? rev0
                    const rev12P90 = pb.p90.revenue[12] ?? rev0
                    const rev12P10 = pb.p10.revenue[12] ?? rev0
                    const p50Chg = rev0 > 0 ? ((rev12P50 - rev0) / rev0) * 100 : 0
                    const p90Chg = rev0 > 0 ? ((rev12P90 - rev0) / rev0) * 100 : 0
                    const p10Chg = rev0 > 0 ? ((rev12P10 - rev0) / rev0) * 100 : 0
                    // EBITDA positive months in p50
                    const ebitdaPosMo = pb.p50.ebitda.filter(v => v > 0).length
                    return [
                      { label: "Revenue Growth (P50/12mo)", value: `${p50Chg >= 0 ? "+" : ""}${p50Chg.toFixed(1)}%`, probability: Math.max(0, Math.min(100, 50 + p50Chg)) },
                      { label: "Revenue Upside (P90/12mo)", value: `${p90Chg >= 0 ? "+" : ""}${p90Chg.toFixed(1)}%` },
                      { label: "Revenue Floor (P10/12mo)",  value: `${p10Chg >= 0 ? "+" : ""}${p10Chg.toFixed(1)}%` },
                      { label: "EBITDA Positive Months (P50)", value: `${ebitdaPosMo}/${pb.p50.ebitda.length}mo` },
                    ]
                  })() : []),
                ]}
                modelConfidence={healthCategories.critical.length === 0 ? "High" : healthCategories.critical.length <= 2 ? "Medium" : "Low"}
                dataCompleteness={liveKpis ? "Complete" : "Partial"}
              />
            </Section>

            {/* Confidence */}
            <Section title="Confidence">
              <Narrative>
                {boardroomPayload?.isScenarioMode
                  ? `This board pack reflects the active scenario: "${boardroomPayload.scenarioDecision}". Data completeness: ${boardroomPayload.dataCompleteness}. Deltas are derived from simulation results against the canonical baseline. Confidence increases with additional scenario iterations and Monte Carlo calibration.`
                  : "This assessment reflects baseline data entered during initiation. No active scenario is applied. Run a What If scenario to generate comparative deltas and scenario-specific recommendations."}
              </Narrative>
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

/* ── Value formatter for delta table ── */

function fmtBoardVal(v: number, unit: "currency" | "percent" | "months" | "count" | "score"): string {
  if (unit === "currency") {
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
    return `$${v.toFixed(0)}`
  }
  if (unit === "percent") return `${v.toFixed(1)}%`
  if (unit === "months")  return `${Math.round(v)}mo`
  if (unit === "score")   return v.toFixed(0)
  return String(Math.round(v))
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
  const colors = { critical: { bg: "rgba(110,91,255,0.06)", border: "rgba(110,91,255,0.22)", text: "#6E5BFF" }, watch: { bg: "rgba(157,183,209,0.05)", border: "rgba(157,183,209,0.18)", text: "#9DB7D1" }, strong: { bg: "rgba(183,255,60,0.05)", border: "rgba(183,255,60,0.18)", text: "#B7FF3C" } }
  const c = colors[level]
  return (
    <div style={{ padding: "10px 14px", marginBottom: 6, borderRadius: 6, fontSize: 12, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      ● {label} — {level.toUpperCase()}
    </div>
  )
}

