import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AnimatePresence } from "framer-motion"

import PageShell from "@/components/nav/PageShell"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import { usePhase1ScenarioStore, type Phase1Scenario, type SimulationKpis } from "@/state/phase1ScenarioStore"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"
import type { CascadeImpulse } from "@/terrain/ProgressiveTerrainSurface"
import { SCENARIO_TEMPLATES, type ScenarioTemplate } from "@/engine/scenarioTemplates"
import { timeSimulation, buildKpiSnapshot, findFirstCliff, deriveSurvivalProbability, type TimelineState } from "@/engine/timeSimulation"
import ScenarioTimelineSlider from "@/components/scenarios/ScenarioTimelineSlider"
import { useScenarioTimeline } from "@/hooks/useScenarioTimeline"
import ImpactChain from "@/components/cascade/ImpactChain"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import { useCascadeNarration } from "@/hooks/useCascadeNarration"
import ScenarioGallery from "@/components/scenarios/ScenarioGallery"
import { usePersistenceStore } from "@/stores/persistenceStore"
import { detectScenarioIntent, type DetectedIntent } from "@/engine/scenarioIntentDetector"
import { mergeWithMatrixForces } from "@/engine/scenarioImpactMatrix"
import ScenarioInterpretationCard, { type ScenarioInterpretation } from "@/components/scenarios/ScenarioInterpretationCard"
import {
  validateScenarioPrompt,
  runScenarioSimulation,
  preAiValidationCheck,
  buildAiFailureFallback,
  updateAuditEntry,
  type SimulationResult,
} from "@/engine/safety"
import {
  askWhatIf, hasWhatIfApiKey,
  type WhatIfAnswer, type WhatIfTerrainOverlay,
  parseScenarioLevers, type ParsedLeverOutput,
} from "@/engine/whatif"
import { runSimulation } from "@/engine/simulationService"
import { computeDeltas } from "@/engine/compareDeltas"
import {
  useScenarioLibraryStore,
  toARRRange,
  toGrowthRange,
  type NetworkInsight,
} from "@/stores/scenarioLibraryStore"

import StrategicMoveConsole from "@/components/whatif/StrategicMoveConsole"
import AIIntelligencePanel from "@/components/whatif/AIIntelligencePanel"
import { ScenarioOutputPanel } from "@/components/whatif/ScenarioOutputPanel"
import CommandConsole from "@/components/command/CommandConsole"
import styles from "./WhatIfPage.module.css"
import { type StackedScenario, KPI_LABELS, formatDelta, buildNarrative } from "./whatIfHelpers"
import WhatIfDebugPanel from "./WhatIfDebugPanel"
import ProbabilitySummaryCard from "@/components/probability/ProbabilitySummaryCard"
import SimulationDisclaimerBar from "@/components/legal/SimulationDisclaimerBar"

export default function WhatIfPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const [stack, setStack] = useState<StackedScenario[]>([])
  const [cascadeImpulse, setCascadeImpulse] = useState<CascadeImpulse | null>(null)
  const [narrative, setNarrative] = useState("")
  const [timelineMonth, setTimelineMonth] = useState(0)
  const [showImpactChain, setShowImpactChain] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [lastCascadeSource, setLastCascadeSource] = useState<{ kpi: KpiKey; delta: number } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  // simRunning: true from scenario inject until projections land in the store.
  // Covers the synchronous runSimulation() call + one Zustand store flush.
  const [simRunning, setSimRunning] = useState(false)
  const [simFlash, setSimFlash] = useState(false)
  const [aiAnswer, setAiAnswer] = useState<WhatIfAnswer | null>(null)
  const [aiOverlays, setAiOverlays] = useState<WhatIfTerrainOverlay[]>([])
  const { narrate: narrateCascade, stop: stopNarration, isNarrating } = useCascadeNarration()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingInterpretation, setPendingInterpretation] = useState<ScenarioInterpretation | null>(null)
  const libraryRecord = useScenarioLibraryStore((s) => s.record)
  const libraryGetInsight = useScenarioLibraryStore((s) => s.getInsight)

  const { baseline } = useSystemBaseline()
  const baseKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  // ── Canonical store bridge ──────────────────────────────────────────────
  // WhatIf stack is ephemeral (React state). This bridge writes the cumulative
  // projected scenario into phase1ScenarioStore so Position, Compare, and
  // Boardroom can all read a consistent active scenario without polling this page.
  const upsertScenario   = usePhase1ScenarioStore((s) => s.upsertScenario)
  const setActiveScenId  = usePhase1ScenarioStore((s) => s.setActiveScenarioId)
  // Stable session ID — one per component mount (i.e. one per WhatIf visit)
  const sessionId = useRef(`whatif-session-${Date.now()}`)

  // ── Canonical output: read simulation results from store ─────────────────
  // After runSimulation() fires, the store is patched with projections.
  // These selectors re-evaluate whenever the scenarios array changes so the
  // output panel reflects the latest completed simulation automatically.
  const sessionSimResults = usePhase1ScenarioStore(
    (s) => s.scenarios.find((sc) => sc.id === sessionId.current)?.simulationResults ?? null,
  )
  const baselineSimResults = usePhase1ScenarioStore(
    (s) => s.scenarios.find((sc) => sc.id === "baseline-projection")?.simulationResults ?? null,
  )
  // Accumulated lever interpretation — updated each time a scenario is injected.
  // Merged into the canonical store bridge so Studio can pre-populate sliders.
  const parsedLeversRef = useRef<ParsedLeverOutput | null>(null)

  const {
    timeline: scenarioTimeline,
    activeKpis: timelineKpis,
    generateTimeline,
    clearTimeline,
    handleVoice: handleTimelineVoice,
    isNarrating: isTimelineNarrating,
  } = useScenarioTimeline(baseKpis)

  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])

  const cumulativeForces = useMemo(() => {
    const forces: Partial<Record<KpiKey, number>> = {}
    for (const s of stack) {
      for (const [k, v] of Object.entries(s.forces) as [KpiKey, number][]) {
        forces[k] = (forces[k] ?? 0) + v
      }
    }
    return forces
  }, [stack])

  const cumulativePropagation = useMemo(() => {
    const all = new Map<KpiKey, number>()
    for (const [kpi, delta] of Object.entries(cumulativeForces) as [KpiKey, number][]) {
      const { affected } = propagateForce(KPI_GRAPH, kpi, delta)
      for (const [k, d] of affected) {
        all.set(k, (all.get(k) ?? 0) + d)
      }
    }
    return all
  }, [cumulativeForces])

  const timeline = useMemo<TimelineState[]>(() => {
    if (!baseKpis || stack.length === 0) return []
    const snapshot = buildKpiSnapshot({
      cashBalance: baseKpis.cashOnHand, runwayMonths: baseKpis.runwayMonths,
      growthRatePct: baseKpis.growthRatePct, arr: baseKpis.arr,
      revenueMonthly: baseKpis.revenueMonthly, burnMonthly: baseKpis.burnMonthly,
      churnPct: baseKpis.churnPct, grossMarginPct: baseKpis.grossMarginPct,
      headcount: baseKpis.headcount, enterpriseValue: baseKpis.valuationEstimate,
    })
    return timeSimulation(snapshot, { direct: cumulativeForces }, 24)
  }, [baseKpis, stack, cumulativeForces])

  const projectedKpis = useMemo<PositionKpis | null>(() => {
    if (!timeline.length || !baseKpis) return null
    const state = timeline[Math.min(timelineMonth, timeline.length - 1)]
    if (!state) return null
    const s = state.kpis
    const gp = s.revenue * Math.min(s.grossMargin / 100, 1)
    return {
      arr: s.arr, burnMonthly: s.burn, runwayMonths: s.runway,
      ebitdaMonthly: gp - Math.max(s.burn - gp, 0),
      riskIndex: baseKpis.riskIndex, cashOnHand: s.cash,
      revenueMonthly: s.revenue, survivalScore: baseKpis.survivalScore,
      grossMarginPct: s.grossMargin, valuationEstimate: s.enterpriseValue,
      growthRatePct: s.growth, churnPct: s.churn,
      headcount: s.headcount, nrrPct: baseKpis.nrrPct,
      efficiencyRatio: baseKpis.efficiencyRatio,
    }
  }, [timeline, timelineMonth, baseKpis])

  const terrainDisplayKpis = timelineKpis ?? projectedKpis ?? baseKpis

  const terrainVariant = useMemo(() => {
    if (!terrainDisplayKpis) return "default" as const

    const healthCounts = { strong: 0, watch: 0, critical: 0 }
    for (const key of KPI_KEYS) {
      const health = getHealthLevel(key, terrainDisplayKpis)
      if (health === "strong") healthCounts.strong++
      else if (health === "critical") healthCounts.critical++
      else healthCounts.watch++
    }

    const healthScore = Math.round(((healthCounts.strong * 10 + healthCounts.watch * 5) / (KPI_KEYS.length * 10)) * 100)
    if (healthScore >= 68) return "white" as const
    if (healthScore >= 42) return "frost" as const
    return "default" as const
  }, [terrainDisplayKpis])

  /* ═══ Scenario Injection ═══ */

  const injectScenario = useCallback((template: ScenarioTemplate) => {
    // Mark simulation as in-flight. Cleared by the useEffect below once
    // sessionSimResults.projections is written by runSimulation().
    setSimRunning(true)

    const scenario: StackedScenario = {
      id: `${template.id}-${Date.now()}`,
      question: template.question,
      template,
      forces: { ...template.forces },
    }
    setStack((prev) => [...prev, scenario])

    // ── Parse lever values from scenario text ─────────────────────────────
    // Runs deterministically — no API call. Output is stored in parsedLeversRef
    // so the canonical store bridge can include leverValues in the scenario record.
    // This allows Studio to pre-populate its sliders when navigating from WhatIf.
    const parsed = parseScenarioLevers(template.question)
    parsedLeversRef.current = parsed
    if (process.env.NODE_ENV === "development") {
      console.debug("[STRATFIT] parseScenarioLevers", {
        input:        parsed.inputText,
        source:       parsed.source,
        confidence:   parsed.confidence,
        matchedRules: parsed.matchedRules,
        levers:       parsed.levers,
        warnings:     parsed.warnings,
      })
    }
    setQuery("")
    setTimelineMonth(0)

    const allAffected = new Map<KpiKey, number>()
    const allHops = new Map<KpiKey, number>()
    for (const [kpi, delta] of Object.entries(template.forces) as [KpiKey, number][]) {
      const { affected, hops } = propagateForce(KPI_GRAPH, kpi, delta)
      for (const [k, d] of affected) {
        allAffected.set(k, (allAffected.get(k) ?? 0) + d)
        const ex = allHops.get(k); const nh = hops.get(k) ?? 0
        if (ex === undefined || nh < ex) allHops.set(k, nh)
      }
    }
    setCascadeImpulse({ propagation: { affected: allAffected, hops: allHops }, startTime: performance.now() / 1000 })
    setSimFlash(true)
    setTimeout(() => setSimFlash(false), 2000)
    setNarrative(buildNarrative(template, allAffected))
    const firstForce = Object.entries(template.forces)[0] as [KpiKey, number] | undefined
    if (firstForce) {
      setLastCascadeSource({ kpi: firstForce[0], delta: firstForce[1] })
      setShowImpactChain(true)
      narrateCascade(firstForce[0], firstForce[1])
    }
    setTimeout(() => setCascadeImpulse(null), 3000)

    generateTimeline(template.forces, template.question)

    if (baseKpis) {
      const arrBand = toARRRange(baseKpis.arr)
      const growthBand = toGrowthRange(baseKpis.growthRatePct)
      const deltas: Partial<Record<KpiKey, number>> = {}
      for (const [k, d] of allAffected) deltas[k] = d
      libraryRecord({
        scenarioType: template.category,
        industry: "technology",
        arrRange: arrBand,
        growthRange: growthBand,
        baselineMetrics: {
          arr: baseKpis.arr, revenueMonthly: baseKpis.revenueMonthly,
          growthRatePct: baseKpis.growthRatePct, burnMonthly: baseKpis.burnMonthly,
          runwayMonths: baseKpis.runwayMonths, cashOnHand: baseKpis.cashOnHand,
          grossMarginPct: baseKpis.grossMarginPct, valuationEstimate: baseKpis.valuationEstimate,
        },
        resultingDeltas: deltas,
      })
    }
  }, [generateTimeline, baseKpis, libraryRecord, narrateCascade])

  /* ═══ Interpretation Flow ═══ */

  const showInterpretation = useCallback((
    template: ScenarioTemplate,
    intent: DetectedIntent | null,
    confidence: number,
  ) => {
    setPendingInterpretation({ template, intent, confidence })
  }, [])

  const handleInterpretationConfirm = useCallback((template: ScenarioTemplate) => {
    setPendingInterpretation(null)
    injectScenario(template)
  }, [injectScenario])

  const handleInterpretationCancel = useCallback(() => {
    setPendingInterpretation(null)
  }, [])

  /* ═══ Submit Pipeline ═══ */

  const handleSubmit = useCallback(async () => {
    if (!query.trim()) return

    const match = SCENARIO_TEMPLATES.find((t) =>
      t.question.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(t.question.toLowerCase().slice(0, 20))
    )
    if (match) { showInterpretation(match, null, 1.0); setAiAnswer(null); return }

    const validation = validateScenarioPrompt(query)
    if (validation.validationClass !== "valid") {
      setNarrative(validation.reason)
      if (validation.suggestedNextPrompts?.length) {
        setNarrative(`${validation.reason} Try: "${validation.suggestedNextPrompts[0]}"`)
      }
      return
    }

    const simResult = runScenarioSimulation({ prompt: query, baseKpis })
    if (simResult.blocked) {
      setNarrative(simResult.blockReason ?? simResult.validation.reason)
      return
    }

    showInterpretation(simResult.template, simResult.intent, simResult.confidence.score)

    if (hasWhatIfApiKey()) {
      const aiCheck = preAiValidationCheck(simResult)
      if (!aiCheck.canCallAi) {
        if (aiCheck.fallback) setNarrative(aiCheck.fallback.summary)
        updateAuditEntry(simResult.scenarioObject.id, { aiCalled: false })
        return
      }

      setAiLoading(true)
      setAiAnswer(null)
      setAiOverlays([])
      try {
        const result = await askWhatIf({
          question: query,
          context: {
            baseline: baseline as any,
            kpis: baseKpis,
            scenarioCategory: simResult.intent?.scenarioType,
          },
        })
        const answer = result.answer
        setAiAnswer(answer)
        setAiOverlays(answer.terrain_overlays ?? [])
        setNarrative(answer.summary)
        updateAuditEntry(simResult.scenarioObject.id, { aiCalled: true, aiResponseValid: true })
      } catch {
        const fallback = buildAiFailureFallback(simResult)
        setNarrative(fallback.summary)
        updateAuditEntry(simResult.scenarioObject.id, { aiCalled: true, aiResponseValid: false, aiFallbackUsed: true })
      } finally {
        setAiLoading(false)
      }
    }
  }, [query, showInterpretation, baseline, baseKpis])

  const handleCommandConsole = useCallback((command: string) => {
    setQuery(command)
    setTimeout(() => {
      const match = SCENARIO_TEMPLATES.find((t) =>
        t.question.toLowerCase().includes(command.toLowerCase()) || command.toLowerCase().includes(t.question.toLowerCase().slice(0, 20))
      )
      if (match) { showInterpretation(match, null, 1.0); return }

      const validation = validateScenarioPrompt(command)
      if (validation.validationClass !== "valid") {
        setNarrative(validation.reason)
        return
      }

      const simResult = runScenarioSimulation({ prompt: command, baseKpis })
      if (simResult.blocked) {
        setNarrative(simResult.blockReason ?? simResult.validation.reason)
        return
      }
      showInterpretation(simResult.template, simResult.intent, simResult.confidence.score)
    }, 0)
  }, [showInterpretation, baseKpis])

  useEffect(() => {
    const q = searchParams.get("q")
    if (q && baseline) {
      setSearchParams({}, { replace: true })
      handleCommandConsole(q)
    }
  }, [searchParams, baseline, setSearchParams, handleCommandConsole])

  /* ═══ Actions ═══ */

  const clearAll = useCallback(() => {
    setStack([]); setNarrative(""); setTimelineMonth(0)
    setAiAnswer(null); setAiOverlays([]); setLastCascadeSource(null)
    setShowImpactChain(false); clearTimeline()
    // Deactivate the session scenario so other pages fall back to baseline
    setActiveScenId(null)
  }, [clearTimeline, setActiveScenId])

  // ── Write stack → canonical scenario store ─────────────────────────────
  // Fires whenever the cumulative projected KPIs change (i.e. on every stack
  // push/pop and every timeline slider move). Keeps phase1ScenarioStore's
  // active scenario in sync so Position/Compare/Boardroom see current state.
  useEffect(() => {
    if (!projectedKpis || stack.length === 0) return

    const pk = projectedKpis
    const simKpis: SimulationKpis = {
      cash:        pk.cashOnHand,
      monthlyBurn: pk.burnMonthly,
      revenue:     pk.revenueMonthly,
      grossMargin: pk.grossMarginPct / 100,
      growthRate:  pk.growthRatePct  / 100,
      churnRate:   pk.churnPct       / 100,
      headcount:   pk.headcount,
      arpa:        baseline?.operating?.acv ?? 0,
      runway:      pk.runwayMonths,
    }

    const scenario: Phase1Scenario = {
      id:        sessionId.current,
      createdAt: Date.now(),
      decision:  stack.map((s) => s.question).join(" + "),
      status:    "complete",
      // Lever values from the most recent parseScenarioLevers call.
      // Studio uses these to pre-populate sliders when user navigates there.
      leverValues: parsedLeversRef.current?.allLevers ?? undefined,
      simulationResults: {
        completedAt:   Date.now(),
        horizonMonths: 24,
        summary:       stack.map((s) => s.question).join(", "),
        kpis:          simKpis,
        terrain: {
          seed: sessionId.current.split("").reduce((a, c) => ((a << 5) + a + c.charCodeAt(0)) | 0, 5381) >>> 0,
          multipliers: { cash: 1, burn: 1, growth: 1 },
        },
      },
    }

    upsertScenario(scenario)
    setActiveScenId(sessionId.current)
    // Compute forward projections (p10/p50/p90) and write to simulationResults.projections.
    // Called after upsertScenario so the KPIs are guaranteed present in the store.
    runSimulation(sessionId.current)
  }, [projectedKpis, stack, baseline, upsertScenario, setActiveScenId])

  // Clear simRunning once the store confirms projections are written.
  // runSimulation() is synchronous so this fires in the same tick or the
  // next render — gives the UI one frame of "Running…" then flips to results.
  useEffect(() => {
    if (simRunning && sessionSimResults?.projections) {
      setSimRunning(false)
    }
  }, [simRunning, sessionSimResults])

  const persistSave = usePersistenceStore((s) => s.saveScenario)
  const saveScenario = useCallback(() => {
    if (stack.length === 0) return
    const name = prompt("Name this scenario:")
    if (!name) return
    persistSave({ name, description: `${stack.length} stacked forces`, forces: cumulativeForces, tags: [] })
    setNarrative(`Scenario "${name}" saved.`)
  }, [stack, cumulativeForces, persistSave])

  const handleFollowUp = useCallback((q: string) => {
    setQuery(q)
    inputRef.current?.focus()
  }, [])

  /* ═══ Derived State ═══ */

  const overallConfidence = useMemo(() => {
    if (!aiAnswer) return null
    const impacts = aiAnswer.kpi_impacts
    if (impacts.length === 0) return null
    const high = impacts.filter((i) => i.confidence === "high").length
    const ratio = high / impacts.length
    if (ratio >= 0.7) return "high" as const
    if (ratio >= 0.4) return "medium" as const
    return "low" as const
  }, [aiAnswer])

  const probabilityOverview = useMemo(() => {
    if (!baseKpis || timeline.length === 0) return null

    const cliff = findFirstCliff(timeline)
    const survivalProbability = deriveSurvivalProbability(timeline)

    const fields = [
      baseKpis.cashOnHand,
      baseKpis.runwayMonths,
      baseKpis.arr,
      baseKpis.revenueMonthly,
      baseKpis.burnMonthly,
      baseKpis.grossMarginPct,
      baseKpis.growthRatePct,
      baseKpis.churnPct,
      baseKpis.headcount,
      baseKpis.valuationEstimate,
    ]
    const dataCompleteness = `${Math.round((fields.filter((value) => value != null && value !== 0).length / fields.length) * 100)}%`

    return {
      survivalProbability,
      runwayRiskLabel: cliff ? `Month ${cliff.month}` : "Low",
      runwayRiskProbability: cliff ? Math.max(10, 100 - survivalProbability) : 15,
      modelConfidence:
        overallConfidence === "high"
          ? "High"
          : overallConfidence === "medium"
            ? "Medium"
            : overallConfidence === "low"
              ? "Low"
              : undefined,
      dataCompleteness,
    }
  }, [baseKpis, timeline, overallConfidence])

  const chainNodes = useMemo(() => {
    if (!lastCascadeSource || stack.length === 0) return []
    const latest = stack[stack.length - 1]
    const sourceLabel = KPI_ZONE_MAP[lastCascadeSource.kpi]?.label ?? lastCascadeSource.kpi
    const downstream = Array.from(cumulativePropagation.entries())
      .filter(([k]) => !Object.keys(latest.forces).includes(k))
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
      .slice(0, 3)

    const firstDownstream = downstream[0]
    const netEV = cumulativePropagation.get("enterpriseValue" as KpiKey)
    const evLabel = netEV != null ? formatDelta("enterpriseValue" as KpiKey, netEV) : `${downstream.length} zones affected`

    return [
      { type: "Strategic Move", label: latest.question, value: "", color: "#22D3EE" },
      { type: "Operational Change", label: sourceLabel, value: formatDelta(lastCascadeSource.kpi, lastCascadeSource.delta), color: lastCascadeSource.delta > 0 ? "#B7FF3C" : "#6E5BFF" },
      { type: "Financial Impact", label: firstDownstream ? (KPI_ZONE_MAP[firstDownstream[0]]?.label ?? firstDownstream[0]) : "Cascading", value: firstDownstream ? formatDelta(firstDownstream[0], firstDownstream[1]) : "", color: firstDownstream && firstDownstream[1] > 0 ? "#B7FF3C" : "#6E5BFF" },
      ...downstream.slice(1).map(([k, d]) => ({
        type: "KPI Delta",
        label: KPI_ZONE_MAP[k]?.label ?? k,
        value: formatDelta(k, d),
        color: d > 0 ? "#B7FF3C" : "#6E5BFF",
      })),
      { type: "Enterprise Outcome", label: "Terrain reshapes", value: evLabel, color: "#a78bfa" },
    ]
  }, [lastCascadeSource, stack, cumulativePropagation])

  // ── Canonical output deltas → pre-formatted metric strings ──────────────
  // computeDeltas reads projections (p50 month-0) > kpis > heuristics.
  // formatMetric converts a MetricDelta into the display string:
  //   "$1.2M (+15.3%)"  /  "14 mos (-2 mos)"
  // Falls back to scenario-only values when no baseline is available.
  const outputDeltas = useMemo(
    () => stack.length > 0 ? computeDeltas(baselineSimResults, sessionSimResults) : null,
    [stack.length, baselineSimResults, sessionSimResults],
  )

  const scenarioMetrics = useMemo(() => {
    // Need at least session results in store to show anything
    if (!sessionSimResults) return undefined

    function fmtCurrency(v: number): string {
      const a = Math.abs(v)
      if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
      if (a >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
      return `$${Math.round(v).toLocaleString()}`
    }

    function fmtUnit(v: number, unit: string): string {
      if (unit === "currency") return fmtCurrency(v)
      if (unit === "months")   return `${Math.round(v)} mos`
      if (unit === "score")    return `${v.toFixed(0)} pts`
      return String(Math.round(v))
    }

    function fmtDeltaStr(absDelta: number, pctDelta: number | null, unit: string): string {
      if (Math.abs(absDelta) < 0.0001) return ""
      const sign = absDelta > 0 ? "+" : ""
      if (unit === "currency" && pctDelta != null) return `(${sign}${pctDelta.toFixed(1)}%)`
      return `(${sign}${fmtUnit(absDelta, unit)})`
    }

    function strWithDelta(scenario: number, absDelta: number, pctDelta: number | null, unit: string): string {
      const val   = fmtUnit(scenario, unit)
      const delta = fmtDeltaStr(absDelta, pctDelta, unit)
      return delta ? `${val} ${delta}` : val
    }

    // ── Path A: baseline available → show value + delta ──────────────────
    if (outputDeltas) {
      const { revenueDelta: rv, ebitdaDelta: eb, cashDelta: ca, runwayDelta: rw, enterpriseValueDelta: ev } = outputDeltas
      return {
        revenue:         strWithDelta(rv.scenario, rv.absDelta, rv.pctDelta, rv.unit),
        ebitda:          strWithDelta(eb.scenario, eb.absDelta, eb.pctDelta, eb.unit),
        liquidity:       strWithDelta(ca.scenario, ca.absDelta, ca.pctDelta, ca.unit),
        runway:          strWithDelta(rw.scenario, rw.absDelta, rw.pctDelta, rw.unit),
        enterpriseValue: strWithDelta(ev.scenario, ev.absDelta, ev.pctDelta, ev.unit),
      }
    }

    // ── Path B: no baseline → show scenario values alone ─────────────────
    // Prefer projections (p50 month-0); fall back to raw KPIs.
    const k = sessionSimResults.kpis
    const p = sessionSimResults.projections
    const growthFrac = Math.abs(k.growthRate) <= 1 ? k.growthRate : k.growthRate / 100
    const evHeuristic = k.revenue * 12 * Math.max(2, Math.min(30, growthFrac * 40))
    return {
      revenue:         fmtCurrency(p?.revenueProjection?.[0] ?? k.revenue),
      ebitda:          fmtCurrency(p?.ebitdaProjection?.[0]  ?? (k.revenue - k.monthlyBurn)),
      liquidity:       fmtCurrency(p?.cashProjection?.[0]    ?? k.cash),
      runway:          `${Math.round(p?.runwayMonths ?? k.runway ?? 0)} mos`,
      enterpriseValue: fmtCurrency(p?.enterpriseValueEstimate ?? evHeuristic),
    }
  }, [outputDeltas, sessionSimResults])

  const scenarioLabel = useMemo(
    () => stack.length > 0 ? stack.map((s) => s.question).join(" + ") : undefined,
    [stack],
  )

  /* ═══ RENDER ═══ */

  return (
    <PageShell>
      <div className={styles.root}>

        {/* ═══ TOP — Page Header ═══ */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Strategic Scenario Engine</h1>
          <p className={styles.pageSubtitle}>
            Model strategic decisions and see how they reshape your business.
          </p>
        </div>

        {/* ═══ CENTER — 3D Terrain Viewport ═══ */}
        <div className={`${styles.terrainSection}${simFlash ? ` ${styles.simActive}` : ""}`}>
          <TerrainStage
            progressive
            revealedKpis={revealedKpis}
            focusedKpi={null}
            colorVariant={terrainVariant}
            zoneKpis={terrainDisplayKpis}
            ghostKpis={stack.length > 0 ? baseKpis : null}
            cameraPreset={POSITION_PROGRESSIVE_PRESET}
            autoRotateSpeed={0.15}
            cascadeImpulse={cascadeImpulse}
            showDependencyLines={stack.length > 0}
            hideMarkers
            heatmapEnabled={false}
            strategicPathSlices={scenarioTimeline?.slices ?? null}
            driftMode="micro"
          >
            <SkyAtmosphere />
          </TerrainStage>
          <TerrainZoneLegend kpis={projectedKpis ?? baseKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />

          {stack.length > 0 && (
            <div className={styles.terrainLabel}>
              {timelineMonth > 0
                ? `MONTH ${timelineMonth}`
                : `+${stack.length} DECISION${stack.length > 1 ? "S" : ""}`}
            </div>
          )}
        </div>

        {/* ═══ ACTION — 2-column: Controls | Scenario Output ═══ */}
        <div className="grid grid-cols-2 gap-8 px-5 py-4">

          {/* LEFT — Scenario Controls */}
          <div className={styles.leftColumn}>

            {/* Scenario Command Console */}
            <StrategicMoveConsole
              query={query}
              onQueryChange={setQuery}
              onSubmit={handleSubmit}
              onSelectTemplate={(t) => showInterpretation(t, null, 0.9)}
              loading={aiLoading}
              simRunning={simRunning}
              hasStack={stack.length > 0}
              onSave={saveScenario}
              onClear={clearAll}
              onBrowse={() => setShowGallery(true)}
              stackCount={stack.length}
            />

            {narrative && (
              <div className={styles.narrativeBar}>
                {aiLoading && <span className={styles.loadingDot} />}
                <span className={styles.narrativeText}>
                  {aiLoading ? "Processing simulation..." : narrative}
                </span>
              </div>
            )}

            {scenarioTimeline && (
              <ScenarioTimelineSlider
                onVoice={handleTimelineVoice}
                isNarrating={isTimelineNarrating}
              />
            )}

            {/* Scenario Interpretation */}
            {pendingInterpretation ? (
              <ScenarioInterpretationCard
                interpretation={pendingInterpretation}
                onConfirm={handleInterpretationConfirm}
                onCancel={handleInterpretationCancel}
              />
            ) : (
              <div className={styles.interpretationEmpty}>
                <div className={styles.interpretationEmptyTitle}>Scenario Interpretation</div>
                <div className={styles.interpretationEmptySubtitle}>
                  STRATFIT will structure your scenario before simulation.
                </div>
              </div>
            )}

            {/* Impact Chain */}
            {showImpactChain && chainNodes.length > 0 && (
              <div className={styles.impactSection}>
                <div className={styles.impactHeader}>
                  <span className={styles.impactTitle}>Decision Impact Chain</span>
                  <button className={styles.impactToggle} onClick={() => setShowImpactChain(false)}>
                    Hide
                  </button>
                </div>
                <div className={styles.chainFlow}>
                  {chainNodes.map((node, i) => (
                    <React.Fragment key={i}>
                      <div className={styles.chainNode}>
                        <span className={styles.chainNodeType}>{node.type}</span>
                        <span className={styles.chainNodeLabel}>{node.label}</span>
                        {node.value && <span className={styles.chainNodeValue} style={{ color: node.color }}>{node.value}</span>}
                      </div>
                      {i < chainNodes.length - 1 && <div className={styles.chainArrow}>↓</div>}
                    </React.Fragment>
                  ))}
                </div>
                {lastCascadeSource && (
                  <ImpactChain
                    sourceKpi={lastCascadeSource.kpi}
                    delta={lastCascadeSource.delta}
                    height={160}
                    animate
                  />
                )}
              </div>
            )}

          </div>

          {/* RIGHT — Scenario Output Panel (always visible, sticky) */}
          <div className="self-start sticky top-0 flex flex-col gap-3">
            <ScenarioOutputPanel
              title={scenarioLabel}
              summary={aiAnswer?.summary ?? (stack.length > 0 ? narrative : undefined)}
              metrics={scenarioMetrics}
              loading={simRunning}
            >
              {/* AI follow-up questions + voice — only when AI answer available */}
              {aiAnswer && (
                <AIIntelligencePanel
                  answer={aiAnswer}
                  loading={false}
                  propagation={cumulativePropagation}
                  hasSimulation
                  confidence={overallConfidence}
                  onVoicePlay={() => lastCascadeSource && narrateCascade(lastCascadeSource.kpi, lastCascadeSource.delta)}
                  onVoiceStop={stopNarration}
                  isNarrating={isNarrating}
                  onFollowUp={handleFollowUp}
                  formatDelta={formatDelta}
                />
              )}
              {aiAnswer && <SimulationDisclaimerBar variant="ai" />}
            </ScenarioOutputPanel>
          </div>

        </div>

        {/* Disclaimers */}
        <div className={styles.footerDisclaimer}>
          <SimulationDisclaimerBar variant="default" />
        </div>
      </div>

      <AnimatePresence>
        {showGallery && (
          <ScenarioGallery onSelect={injectScenario} onClose={() => setShowGallery(false)} />
        )}
      </AnimatePresence>

      {showDebugPanel && <WhatIfDebugPanel />}

      <CommandConsole onSubmit={handleCommandConsole} loading={aiLoading} />
    </PageShell>
  )
}
