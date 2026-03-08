// src/pages/compare/ComparePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Command Centre (Split ↔ Ghost ↔ Ultimate)
//
// Top 60%:  Terrain area
//   Split mode  → side-by-side CompareTerrainPanels (2 or 3)
//   Ghost mode  → single canvas with translucent ghost overlays
// Bottom 40%: Analytics layer
//   Bottom-left  (60%): CompareTablePanel (KPI deltas)
//   Bottom-right (40%): CompareInsightPanel (AI narrative)
//
// Ultimate mode: Executive Briefing — cinematic terrain presentation.
// Query params:  ?view=split|ghost  &n=2|3
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/routes/routeContract"
import PageShell from "@/components/nav/PageShell"
import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import { usePhase1ScenarioStore, type SimulationKpis } from "@/state/phase1ScenarioStore"
import { useCompareStore, type ComparePair, type CompareViewMode } from "@/store/compareStore"
import { deriveTerrainMetrics, type TerrainMetrics } from "@/terrain/terrainFromBaseline"

import CompareTerrainArea from "@/components/compare/CompareTerrainArea"
import OptimalCompareView from "@/components/compare/OptimalCompareView"
import CompareGhostHeaderBar from "@/components/compare/CompareGhostHeaderBar"
import CompareTablePanel from "@/components/compare/CompareTablePanel"
import CompareInsightPanel from "@/components/compare/CompareInsightPanel"
import { type ScenarioOption } from "@/components/compare/CompareScenarioSelect"
import ProbabilityNotice from "@/components/legal/ProbabilityNotice"
import SimulationDisclaimerBar from "@/components/legal/SimulationDisclaimerBar"
import ProbabilitySummaryCard from "@/components/probability/ProbabilitySummaryCard"
import ProvenanceBadge from "@/components/system/ProvenanceBadge"
import SimulationStatusWidget from "@/components/system/SimulationStatusWidget"
import SimulationRunOverlay from "@/components/system/SimulationRunOverlay"
import SimulationPipelineWidget from "@/components/system/SimulationPipelineWidget"
// SystemProbabilityNotice removed — using ProbabilityNotice from legal instead
import CommandConsole from "@/components/command/CommandConsole"
import ScenarioIntelligencePanel from "@/components/intelligence/ScenarioIntelligencePanel"
import IntelligenceConsole from "@/components/intelligence/IntelligenceConsole"
import { useCompareIntelligence } from "@/hooks/useCompareIntelligence"
import { useVoiceBriefingStore } from "@/store/voiceBriefingStore"
import { buildPositionViewModel } from "@/pages/position/overlays/positionState"
import { getExecutiveSummary } from "@/domain/intelligence/kpiCommentary"
import { buildKpiSnapshot, findFirstCliff, timeSimulation, deriveSurvivalProbability } from "@/engine/timeSimulation"
import CompareQueryPanel from "@/features/compare/CompareQueryPanel"
import BriefingDirector from "@/features/intelligence/BriefingDirector"
import { generateInvestorPlanStub } from "@/features/intelligence/generateInvestorPlanStub"
import type { BriefingPlan } from "@/features/intelligence/BriefingDirector"
import type { IntelligenceState } from "@/features/intelligence/intelligenceState"
import type { HighlightState } from "@/features/compare/highlightContract"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"
import TimelineSyncStrip from "@/components/timeline/TimelineSyncStrip"
import ScenarioTimelineSlider from "@/components/scenarios/ScenarioTimelineSlider"
import { useScenarioTimelineStore } from "@/state/scenarioTimelineStore"

/* ── Component ───────────────────────────────────────────── */

const TERRAIN_GLOW_STYLE_ID = "sf-terrain-voice-glow-kf"
function ensureTerrainGlowKeyframes() {
  if (typeof document === "undefined") return
  if (document.getElementById(TERRAIN_GLOW_STYLE_ID)) return
  const s = document.createElement("style")
  s.id = TERRAIN_GLOW_STYLE_ID
  s.textContent = `
    @keyframes sf-terrain-voice-glow {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `
  document.head.appendChild(s)
}

export default function ComparePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => ensureTerrainGlowKeyframes(), [])

  const handleCommand = useCallback((command: string) => {
    navigate(`${ROUTES.WHAT_IF}?q=${encodeURIComponent(command)}`)
  }, [navigate])

  // ── Highlight state (insight → terrain linking) ──
  const [highlight, setHighlight] = useState<HighlightState>({})
  // ── Q&A panel state ──
  const [showQA, setShowQA] = useState(false)
  // ── Ultimate mode (Executive Briefing) ──
  const [compareMode, setCompareMode] = useState<"standard" | "ultimate" | "optimal">("standard")
  const [briefingActive, setBriefingActive] = useState(false)
  const [briefingPlan, setBriefingPlan] = useState<BriefingPlan | null>(null)
  const [briefingState, setBriefingState] = useState<IntelligenceState>("idle")

  const baseline = useCanonicalBaseline()

  const intelligenceText = useMemo(() => {
    if (!baseline) return ""
    const kpis = buildPositionViewModel(baseline as any).kpis
    return getExecutiveSummary(kpis).narrative
  }, [baseline])

  // Derive flat terrain inputs from BaselineV1
  const baselineInputs = useMemo(() => {
    if (!baseline) return null
    const f = baseline.financial
    const o = baseline.operating
    return {
      cash:        f.cashOnHand,
      monthlyBurn: f.monthlyBurn,
      burnRate:    f.monthlyBurn,
      revenue:     f.arr / 12,
      grossMargin: f.grossMarginPct,
      growthRate:  f.growthRatePct,
      churnRate:   o.churnPct,
      headcount:   f.headcount,
      arpa:        o.acv,
    }
  }, [baseline])

  const hydrateScenarios = usePhase1ScenarioStore((s) => s.hydrate)
  const scenarioStoreHydrated = usePhase1ScenarioStore((s) => s.isHydrated)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)

  const {
    aId, bId, cId,
    setAId, setBId, setCId,
    compareCount, setCompareCount,
    activePair, setActivePair,
    viewMode, setViewMode,
    swap, rotate,
  } = useCompareStore()

  const is3Mode = compareCount === 3

  // ── Sync query params → store on mount ──
  useEffect(() => {
    const qView = searchParams.get("view")
    if (qView === "split" || qView === "ghost") setViewMode(qView)
    const qN = searchParams.get("n")
    if (qN === "2") setCompareCount(2)
    else if (qN === "3") setCompareCount(3)
    // Only on mount
  }, [])

  // ── Sync store → query params ──
  const syncParams = useCallback(
    (nextView: CompareViewMode, nextN: 2 | 3) => {
      setSearchParams(
        (prev) => {
          prev.set("view", nextView)
          prev.set("n", String(nextN))
          return prev
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    syncParams(viewMode, compareCount)
  }, [viewMode, compareCount, syncParams])

  // ── Hydrate stores ──
  useEffect(() => { hydrateScenarios() }, [hydrateScenarios])

  // ── Default B to active scenario on first mount ──
  useEffect(() => {
    if (bId === null && activeScenarioId) setBId(activeScenarioId)
  }, [bId, activeScenarioId, setBId])

  // ── Completed scenarios for dropdowns ──
  const completedScenarios = useMemo(
    () => scenarios.filter((s) => s.status === "complete" && s.simulationResults),
    [scenarios],
  )

  const scenarioOptions = useMemo<ScenarioOption[]>(
    () => completedScenarios.map((s) => ({ id: s.id, label: s.decision.slice(0, 28) })),
    [completedScenarios],
  )

  // ── Resolve scenarios ──
  const scenarioA = useMemo(() => (aId ? scenarios.find((s) => s.id === aId) ?? null : null), [aId, scenarios])
  const scenarioB = useMemo(() => (bId ? scenarios.find((s) => s.id === bId) ?? null : null), [bId, scenarios])
  const scenarioC = useMemo(() => (cId ? scenarios.find((s) => s.id === cId) ?? null : null), [cId, scenarios])

  // ── Terrain metrics derivation helper ──
  const deriveMetrics = useCallback((scenario: typeof scenarioA): TerrainMetrics => {
    if (scenario?.simulationResults?.terrainMetrics) {
      const em = scenario.simulationResults.terrainMetrics
      const scenarioKpis = scenario.simulationResults.kpis
      const scenarioCash = Number(scenarioKpis?.cash) || 0
      const scenarioBurn = Number(scenarioKpis?.monthlyBurn) || 0
      const scenarioGrowth = Number(scenarioKpis?.growthRate) || 0
      return {
        elevationScale: em.elevationScale,
        roughness: em.roughness,
        ridgeIntensity: em.ridgeIntensity,
        volatility: em.volatility,
        liquidityDepth: scenarioBurn > 0
          ? Math.min((scenarioCash / scenarioBurn) / 12, 2)
          : 1,
        growthSlope: Math.abs(scenarioGrowth) <= 1 ? scenarioGrowth : scenarioGrowth / 100,
      }
    }
    if (baselineInputs) return deriveTerrainMetrics(baselineInputs as any)
    return { elevationScale: 1, roughness: 1, liquidityDepth: 1, growthSlope: 0, volatility: 0 }
  }, [baselineInputs])

  const metricsA = useMemo(() => deriveMetrics(scenarioA), [scenarioA, deriveMetrics])
  const metricsB = useMemo(() => deriveMetrics(scenarioB), [scenarioB, deriveMetrics])
  const metricsC = useMemo(() => deriveMetrics(scenarioC), [scenarioC, deriveMetrics])

  // ── Events ──
  const eventsA = useMemo<TerrainEvent[]>(() => scenarioA?.simulationResults?.events ?? [], [scenarioA])
  const eventsB = useMemo<TerrainEvent[]>(() => scenarioB?.simulationResults?.events ?? [], [scenarioB])
  const eventsC = useMemo<TerrainEvent[]>(() => scenarioC?.simulationResults?.events ?? [], [scenarioC])

  // ── Baseline KPIs via canonical view model (same path as Position + Boardroom) ──
  // Replaces inline manual unit-conversion (/ 100) which could diverge from buildPositionViewModel.
  const baselineSimKpis = useMemo((): SimulationKpis | null => {
    if (!baseline) return null
    const pk = buildPositionViewModel(baseline as any).kpis
    return {
      cash:        pk.cashOnHand,
      monthlyBurn: pk.burnMonthly,
      revenue:     pk.revenueMonthly,
      grossMargin: pk.grossMarginPct / 100,
      growthRate:  pk.growthRatePct  / 100,
      churnRate:   pk.churnPct       / 100,
      headcount:   pk.headcount,
      arpa:        baseline.operating?.acv ?? 0,
      runway:      pk.runwayMonths,
    }
  }, [baseline])

  // ── KPIs ──
  const deriveKpis = useCallback((scenario: typeof scenarioA): SimulationKpis | null => {
    // Scenario slot → use simulation results
    if (scenario?.simulationResults?.kpis) return scenario.simulationResults.kpis
    // Baseline slot (null scenario) → use canonical baseline KPIs
    if (!scenario) return baselineSimKpis
    return null
  }, [baselineSimKpis])

  const kpisA = useMemo(() => deriveKpis(scenarioA), [scenarioA, deriveKpis])
  const kpisB = useMemo(() => deriveKpis(scenarioB), [scenarioB, deriveKpis])
  const kpisC = useMemo(() => deriveKpis(scenarioC), [scenarioC, deriveKpis])

  // ── Labels ──
  const labelA = aId === null ? "Baseline" : (scenarioA?.decision ?? "Scenario").slice(0, 20)
  const labelB = bId === null ? "Baseline" : (scenarioB?.decision ?? "Scenario").slice(0, 20)
  const labelC = cId === null ? "Baseline" : (scenarioC?.decision ?? "Scenario").slice(0, 20)

  // ── Active pair KPIs (for analytics panels) ──
  const { pairKpisL, pairKpisR, pairLabelL, pairLabelR } = useMemo(() => {
    if (activePair === "AC") return { pairKpisL: kpisA, pairKpisR: kpisC, pairLabelL: labelA, pairLabelR: labelC }
    if (activePair === "BC") return { pairKpisL: kpisB, pairKpisR: kpisC, pairLabelL: labelB, pairLabelR: labelC }
    return { pairKpisL: kpisA, pairKpisR: kpisB, pairLabelL: labelA, pairLabelR: labelB }
  }, [activePair, kpisA, kpisB, kpisC, labelA, labelB, labelC])

  // ── AI Compare Intelligence ──
  const compareIntel = useCompareIntelligence(pairKpisL, pairKpisR, pairLabelL, pairLabelR)
  const isVoiceSpeaking = useVoiceBriefingStore((s) => s.isSpeaking)

  const handleApplyRecommended = useCallback((scenarioLabel: string) => {
    navigate(`${ROUTES.WHAT_IF}?q=${encodeURIComponent(scenarioLabel)}`)
  }, [navigate])

  // ── Command Centre Auto-Evaluate ──
  const activeSimResults = scenarioB?.simulationResults ?? scenarioA?.simulationResults ?? null

  // ── Headline ──
  const headline = useMemo(() => {
    if (!pairKpisL || !pairKpisR) return "Select scenarios to compare."
    const revL = pairKpisL.revenue
    const revR = pairKpisR.revenue
    const pct = revL > 0 ? (((revR - revL) / revL) * 100).toFixed(1) : "0"
    const dir = revR >= revL ? "higher" : "lower"
    return `${pairLabelR} projects ${Math.abs(Number(pct))}% ${dir} revenue than ${pairLabelL}.`
  }, [pairKpisL, pairKpisR, pairLabelL, pairLabelR])

  const probabilityOverview = useMemo(() => {
    if (!pairKpisR) return null

    const snapshot = buildKpiSnapshot({
      cashBalance: pairKpisR.cash,
      runwayMonths: pairKpisR.runway ?? 0,
      growthRatePct: pairKpisR.growthRate * 100,
      arr: pairKpisR.revenue * 12,
      revenueMonthly: pairKpisR.revenue,
      burnMonthly: pairKpisR.monthlyBurn,
      churnPct: pairKpisR.churnRate * 100,
      grossMarginPct: pairKpisR.grossMargin * 100,
      headcount: pairKpisR.headcount,
    })
    const timeline = timeSimulation(snapshot, { direct: {} }, 12)
    const cliff = findFirstCliff(timeline)
    const survivalProbability = deriveSurvivalProbability(timeline)

    const fields = [
      pairKpisR.cash,
      pairKpisR.monthlyBurn,
      pairKpisR.revenue,
      pairKpisR.grossMargin,
      pairKpisR.growthRate,
      pairKpisR.churnRate,
      pairKpisR.headcount,
      pairKpisR.arpa,
      pairKpisR.runway,
    ]
    const dataCompleteness = `${Math.round((fields.filter((value) => value != null && value !== 0).length / fields.length) * 100)}%`

    return {
      subjectLabel: pairLabelR,
      survivalProbability,
      runwayRiskLabel: cliff ? `${pairLabelR}: Month ${cliff.month}` : `${pairLabelR}: Low`,
      runwayRiskProbability: cliff ? Math.max(10, 100 - survivalProbability) : 15,
      dataCompleteness,
    }
  }, [pairKpisR, pairLabelR])

  // ── Available pairs ──
  const availablePairs: ComparePair[] = is3Mode ? ["AB", "AC", "BC"] : ["AB"]

  const isGhost = viewMode === "ghost"
  const isUltimate = compareMode === "ultimate"
  const isBriefingPlaying = briefingState === "entering" || briefingState === "playing" || briefingState === "exiting"

  // ── Generate briefing plan ──
  const handleGenerateBriefing = useCallback(() => {
    const plan = generateInvestorPlanStub(pairKpisL, pairKpisR, pairLabelL, pairLabelR)
    setBriefingPlan(plan)
    setBriefingActive(true)
  }, [pairKpisL, pairKpisR, pairLabelL, pairLabelR])

  const handleBriefingComplete = useCallback(() => {
    setBriefingActive(false)
    setBriefingPlan(null)
  }, [])

  const handleBriefingStateChange = useCallback((state: IntelligenceState) => {
    setBriefingState(state)
  }, [])

  // ── Loading guards ──
  if (!scenarioStoreHydrated) {
    return (
      <div style={S.loadingShell}>
        <div style={{ textAlign: "center" }}>
          <div style={S.spinner} />
          <span style={{ fontSize: 14, opacity: 0.6, color: "#e2e8f0" }}>Hydrating stores…</span>
          <style>{`@keyframes cmpSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (!baseline) {
    return (
      <div style={S.loadingShell}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>△</div>
          <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 600, color: "#fff" }}>Baseline Required</h2>
          <p style={{ opacity: 0.5, fontSize: 14, lineHeight: 1.5, marginBottom: 24, color: "#e2e8f0" }}>
            Complete the Initiate step and run at least one scenario before using Compare.
          </p>
          <Link to={ROUTES.INITIATE} style={S.linkBtn}>Go to Initiate →</Link>
        </div>
      </div>
    )
  }

  const swapSlot = !isGhost ? (
    is3Mode
      ? <button type="button" onClick={rotate} style={S.swapBtn} title="Rotate A→B→C→A">↻ Rotate</button>
      : <button type="button" onClick={swap}   style={S.swapBtn} title="Swap A ↔ B">⇄ Swap</button>
  ) : null

  return (
    <PageShell rightSlot={swapSlot}>
    <div style={S.page}>

      {/* Simulation engine overlays */}
      <SimulationStatusWidget />
      <SimulationRunOverlay />
      <SimulationPipelineWidget />

      {/* ═══ CONTROL BAR ═══ */}
      <div style={S.controlBar}>
        <div style={S.controlGroup}>
          <span style={S.controlLabel}>Mode</span>
          <div style={S.modeToggle}>
            <button
              type="button"
              onClick={() => { setCompareMode("standard"); setBriefingActive(false) }}
              style={compareMode === "standard" ? S.ctrlBtnActive : S.ctrlBtn}
              disabled={isBriefingPlaying}
            >Standard</button>
            <button
              type="button"
              onClick={() => setCompareMode("ultimate")}
              style={compareMode === "ultimate" ? S.ctrlBtnUltimate : S.ctrlBtn}
              disabled={isBriefingPlaying}
            >Ultimate</button>
            <button
              type="button"
              onClick={() => setCompareMode("optimal")}
              style={compareMode === "optimal" ? S.ctrlBtnOptimal : S.ctrlBtn}
              disabled={isBriefingPlaying}
            >vs Optimal</button>
          </div>
        </div>

        <div style={S.controlGroup}>
          <span style={S.controlLabel}>View</span>
          <div style={S.modeToggle}>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              style={viewMode === "split" ? S.ctrlBtnActive : S.ctrlBtn}
              title="Split — side-by-side terrains"
            >Split</button>
            <button
              type="button"
              onClick={() => setViewMode("ghost")}
              style={viewMode === "ghost" ? S.ctrlBtnActive : S.ctrlBtn}
              title="Ghost — overlay terrains"
            >Ghost</button>
          </div>
        </div>

        <div style={S.controlGroup}>
          <span style={S.controlLabel}>Scenarios</span>
          <div style={S.modeToggle}>
            <button
              type="button"
              onClick={() => setCompareCount(2)}
              style={compareCount === 2 ? S.ctrlBtnActive : S.ctrlBtn}
            >2-Way</button>
            <button
              type="button"
              onClick={() => setCompareCount(3)}
              style={compareCount === 3 ? S.ctrlBtnActive : S.ctrlBtn}
            >3-Way</button>
          </div>
        </div>

        <div style={S.controlSpacer} />

        <div style={S.headlineArea}>
          <span style={S.headlineText}>{headline}</span>
          {isGhost && !isBriefingPlaying && (
            <span style={S.headlineBadge}>GHOST OVERLAY</span>
          )}
          {isUltimate && !isBriefingPlaying && (
            <button
              type="button"
              onClick={handleGenerateBriefing}
              style={S.generateBtn}
              disabled={!pairKpisL || !pairKpisR}
            >
              Generate Executive Briefing
            </button>
          )}
          {isBriefingPlaying && (
            <span style={S.briefingBadge}>EXECUTIVE BRIEFING</span>
          )}
        </div>
      </div>

      {/* ═══ MAIN GRID: Terrain (60%) + Analytics (40%) ═══ */}
      <div style={{
        ...S.commandGrid,
        ...(isBriefingPlaying ? { gridTemplateRows: "1fr" } : {}),
      }}>

        {/* ── TOP: Terrain Area ── */}
        <div style={{ ...S.terrainRow, position: "relative" as const }}>
          {/* Voice briefing terrain glow overlay */}
          {isVoiceSpeaking && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                pointerEvents: "none",
                background: "radial-gradient(ellipse at 50% 30%, rgba(108,198,255,0.08) 0%, transparent 70%)",
                boxShadow: "inset 0 0 60px rgba(108,198,255,0.06)",
                borderRadius: "inherit",
                animation: "sf-terrain-voice-glow 3s ease-in-out infinite",
              }}
            />
          )}
          {/* Ghost mode: compact header bar above canvas */}
          {isGhost && (
            <CompareGhostHeaderBar
              nScenarios={compareCount}
              activePair={activePair}
              selectedAId={aId}
              selectedBId={bId}
              selectedCId={cId}
              scenarioOptions={scenarioOptions}
              onSelectA={setAId}
              onSelectB={setBId}
              onSelectC={setCId}
              onPairChange={setActivePair}
              onSwap={swap}
              onRotate={rotate}
            />
          )}

          {compareMode === "optimal" ? (
            <OptimalCompareView />
          ) : (
            <CompareTerrainArea
              viewMode={viewMode}
              nScenarios={compareCount}
              activePair={activePair}
              selectedAId={aId}
              selectedBId={bId}
              selectedCId={cId}
              metricsA={metricsA}
              metricsB={metricsB}
              metricsC={metricsC}
              eventsA={eventsA}
              eventsB={eventsB}
              eventsC={eventsC}
              scenarioOptions={scenarioOptions}
              onSelectA={setAId}
              onSelectB={setBId}
              onSelectC={setCId}
              highlightTarget={highlight.active}
              highlightTs={highlight.ts}
              briefingActive={briefingActive}
              briefingPlan={briefingPlan}
            />
          )}
        </div>

        {/* ── TIMELINE SYNC STRIP ── */}
        <TimelineSyncStrip mode="all" showGenerate />
        <CompareScenarioTimeline />

        {/* ── BOTTOM: Analytics (hidden during briefing) ── */}
        <div style={{
          ...S.analyticsRow,
          ...(isBriefingPlaying ? { display: "none" } : {}),
        }}>
          {/* Left 60%: Table */}
          <div style={S.analyticsLeft}>
            <CompareTablePanel
              kpisLeft={pairKpisL}
              kpisRight={pairKpisR}
              labelLeft={pairLabelL}
              labelRight={pairLabelR}
              activePair={activePair}
              is3Way={is3Mode}
              onPairChange={setActivePair}
            />
          </div>

          {/* Right 40%: AI Insights + Q&A button + Probability Notice */}
          <div style={S.analyticsRight}>
            <CompareInsightPanel
              kpisA={pairKpisL}
              kpisB={pairKpisR}
              labelA={pairLabelL}
              labelB={pairLabelR}
              summaryA={activePair === "BC" ? scenarioB?.simulationResults?.summary : scenarioA?.simulationResults?.summary}
              summaryB={activePair === "AC" ? scenarioC?.simulationResults?.summary : activePair === "BC" ? scenarioC?.simulationResults?.summary : scenarioB?.simulationResults?.summary}
              activePair={activePair}
              onHighlight={setHighlight}
            />

            {/* Probability Overview */}
            {probabilityOverview && (
              <div style={{ padding: "6px 8px 0" }}>
                <ProbabilitySummaryCard
                  title="Comparison Probability Overview"
                  subtitle="Compare probabilistic outcomes across scenarios."
                  metrics={[
                    {
                      label: "Survival Probability",
                      value: `${probabilityOverview.subjectLabel}: ${probabilityOverview.survivalProbability}%`,
                      probability: probabilityOverview.survivalProbability,
                    },
                    {
                      label: "Runway Risk",
                      value: probabilityOverview.runwayRiskLabel,
                      probability: probabilityOverview.runwayRiskProbability,
                    },
                    // TODO: Revenue Target Probability — requires Monte Carlo per-scenario
                    // TODO: Enterprise Value Target Probability — requires Monte Carlo per-scenario
                  ]}
                  dataCompleteness={probabilityOverview.dataCompleteness}
                />
              </div>
            )}

            {/* Q&A trigger + Probability notice */}
            <div style={S.insightFooter}>
              <button
                type="button"
                onClick={() => setShowQA(true)}
                style={S.qaBtn}
                title="Ask a structured question about this comparison"
              >
                <span style={S.qaBtnIcon}>◈</span>
                Ask about comparison
              </button>
              <ProbabilityNotice mode="tooltip" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Briefing Director ── */}
      <BriefingDirector
        active={briefingActive}
        plan={briefingPlan}
        onComplete={handleBriefingComplete}
        onStateChange={handleBriefingStateChange}
        ttsEnabled
      />

      {/* ── Q&A Modal ── */}
      {showQA && !isBriefingPlaying && (
        <CompareQueryPanel
          kpisA={pairKpisL}
          kpisB={pairKpisR}
          labelA={pairLabelL}
          labelB={pairLabelR}
          onClose={() => setShowQA(false)}
          onHighlight={setHighlight}
        />
      )}

      {/* Provenance badge */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 4px' }}>
        <ProvenanceBadge />
      </div>

      {/* Legal */}
      <div style={{ position: "absolute", bottom: 36, left: 16, right: 16, zIndex: 6 }}>
        <SimulationDisclaimerBar variant="compact" />
      </div>

      <CommandConsole onSubmit={handleCommand} />
      {intelligenceText && <IntelligenceConsole insightText={intelligenceText} />}

      <ScenarioIntelligencePanel
        analysis={compareIntel.analysis}
        loading={compareIntel.loading}
        error={compareIntel.error}
        onApplyScenario={handleApplyRecommended}
      />
    </div>
    </PageShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"
const CYAN = "rgba(34, 211, 238, 0.85)"
const CYAN_DIM = "rgba(34, 211, 238, 0.15)"
const GLASS_BORDER = "1px solid rgba(182, 228, 255, 0.1)"
const VOID = "#081020"

const S: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    width: "100%",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    background: `linear-gradient(180deg, ${VOID} 0%, #0a1628 100%)`,
    fontFamily: FONT,
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
  },

  loadingShell: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(180deg, ${VOID} 0%, #0a1628 100%)`,
    color: "#e2e8f0",
    fontFamily: FONT,
  },

  spinner: {
    width: 24,
    height: 24,
    border: "2px solid rgba(34,211,238,0.3)",
    borderTopColor: "#22d3ee",
    borderRadius: "50%",
    animation: "cmpSpin 0.8s linear infinite",
    margin: "0 auto 16px",
  },

  linkBtn: {
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
    color: "#000",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    cursor: "pointer",
  },

  swapBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    border: `1px solid ${CYAN_DIM}`,
    background: "rgba(34,211,238,0.06)",
    color: CYAN,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT,
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "background 200ms ease",
  },

  /* ── Control Bar ── */
  controlBar: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "8px 24px",
    background: "rgba(0,0,0,0.35)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    flexShrink: 0,
    zIndex: 9,
  },

  controlGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  controlLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "rgba(148,180,214,0.4)",
    fontFamily: FONT,
    flexShrink: 0,
  },

  controlSpacer: { flex: 1 },

  modeToggle: {
    display: "flex",
    gap: 0,
    borderRadius: 6,
    overflow: "hidden",
    border: GLASS_BORDER,
  },

  ctrlBtn: {
    padding: "7px 16px",
    border: "none",
    background: "rgba(0,0,0,0.3)",
    color: "rgba(148,180,214,0.5)",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.04em",
    transition: "background 200ms ease, color 200ms ease",
  },

  ctrlBtnActive: {
    padding: "7px 16px",
    border: "none",
    background: "rgba(34,211,238,0.12)",
    color: CYAN,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.04em",
  },

  ctrlBtnUltimate: {
    padding: "7px 16px",
    border: "none",
    background: "rgba(16,185,129,0.12)",
    color: "rgba(16,185,129,0.9)",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.04em",
  },

  ctrlBtnOptimal: {
    padding: "7px 16px",
    border: "none",
    background: "rgba(34,211,238,0.12)",
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.04em",
  },

  headlineArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
    minWidth: 0,
  },

  headlineText: {
    fontSize: 12,
    fontWeight: 500,
    color: "rgba(148,180,214,0.55)",
    fontFamily: FONT,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis" as const,
  },

  headlineBadge: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(129,140,248,0.7)",
    background: "rgba(129,140,248,0.08)",
    padding: "3px 10px",
    borderRadius: 4,
    textTransform: "uppercase" as const,
    flexShrink: 0,
  },

  briefingBadge: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(16,185,129,0.85)",
    background: "rgba(16,185,129,0.1)",
    padding: "3px 10px",
    borderRadius: 4,
    textTransform: "uppercase" as const,
    flexShrink: 0,
  },

  generateBtn: {
    padding: "6px 16px",
    borderRadius: 6,
    border: "1px solid rgba(16,185,129,0.25)",
    background: "rgba(16,185,129,0.08)",
    color: "rgba(16,185,129,0.9)",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.04em",
    transition: "background 200ms ease",
    flexShrink: 0,
    whiteSpace: "nowrap" as const,
  },

  /* ── Command Grid — mountain dominant ── */
  commandGrid: {
    flex: 1,
    display: "grid",
    gridTemplateRows: "1fr auto minmax(160px, 0.35fr)",
    minHeight: 0,
    overflow: "hidden",
    gap: 2,
    padding: "2px",
  },

  terrainRow: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },

  analyticsRow: {
    display: "grid",
    gridTemplateColumns: "3fr 2fr",
    gap: 2,
    minHeight: 0,
    overflow: "hidden",
  },

  analyticsLeft: {
    minHeight: 0,
    overflow: "hidden",
  },

  analyticsRight: {
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  insightFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 8px",
    flexShrink: 0,
  },

  qaBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid rgba(34,211,238,0.12)",
    background: "rgba(34,211,238,0.04)",
    color: "rgba(34,211,238,0.7)",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.04em",
    transition: "background 180ms ease, color 180ms ease",
  },

  qaBtnIcon: {
    fontSize: 12,
  },

  /* ── Legal ── */
  legal: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: "6px 20px",
    fontSize: 9,
    letterSpacing: "0.04em",
    color: "rgba(255,255,255,0.15)",
    textAlign: "center" as const,
    pointerEvents: "none" as const,
    zIndex: 5,
  },
}

function CompareScenarioTimeline() {
  const timeline = useScenarioTimelineStore((s) => s.timeline)
  if (!timeline) return null
  return <ScenarioTimelineSlider />
}
