import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useSearchParams } from "react-router-dom"
import { AnimatePresence } from "framer-motion"

import PageShell from "@/components/nav/PageShell"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"
import type { CascadeImpulse } from "@/terrain/ProgressiveTerrainSurface"
import { SCENARIO_TEMPLATES, type ScenarioTemplate } from "@/engine/scenarioTemplates"
import { timeSimulation, buildKpiSnapshot, type TimelineState } from "@/engine/timeSimulation"
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
  askWhatIf, hasWhatIfApiKey, whatIfAnswerToTemplate,
  getWhatIfLog, clearWhatIfLog, subscribeWhatIfLog,
  type WhatIfAnswer, type WhatIfTerrainOverlay, type WhatIfLogEntry,
} from "@/engine/whatif"
import {
  useScenarioLibraryStore,
  toARRRange,
  toGrowthRange,
  type NetworkInsight,
} from "@/stores/scenarioLibraryStore"

import StrategicMoveConsole from "@/components/whatif/StrategicMoveConsole"
import AIIntelligencePanel from "@/components/whatif/AIIntelligencePanel"
import CommandConsole from "@/components/command/CommandConsole"
import styles from "./WhatIfPage.module.css"

/* ═══════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════ */

interface StackedScenario {
  id: string
  question: string
  template: ScenarioTemplate
  forces: Partial<Record<KpiKey, number>>
}

const KPI_LABELS: Record<KpiKey, string> = {
  cash: "Cash", runway: "Runway", growth: "Growth", arr: "ARR",
  revenue: "Revenue", burn: "Burn", churn: "Churn",
  grossMargin: "Margin", headcount: "Team", enterpriseValue: "EV",
}

function formatDelta(kpi: KpiKey, v: number): string {
  const abs = Math.abs(v)
  if (["cash", "revenue", "burn", "arr", "enterpriseValue"].includes(kpi)) {
    if (abs >= 1e6) return `${v > 0 ? "+" : "-"}$${(abs / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${v > 0 ? "+" : "-"}$${(abs / 1e3).toFixed(0)}K`
    return `${v > 0 ? "+" : "-"}$${abs.toFixed(0)}`
  }
  if (["churn", "growth", "grossMargin"].includes(kpi)) return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`
  if (kpi === "headcount") return `${v > 0 ? "+" : ""}${Math.round(v)}`
  if (kpi === "runway") return `${v > 0 ? "+" : ""}${v.toFixed(1)} mo`
  return `${v > 0 ? "+" : ""}${v}`
}

function buildNarrative(template: ScenarioTemplate, propagated: Map<KpiKey, number>): string {
  const top = Array.from(propagated.entries())
    .filter(([k]) => !Object.keys(template.forces).includes(k))
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 4)
  if (top.length === 0) return `"${template.question}" — direct impact only, no downstream cascade detected.`
  const parts = top.map(([k, d]) => `${KPI_ZONE_MAP[k].label} ${d > 0 ? "rises" : "falls"}`)
  return `"${template.question}" ripples through the mountain: ${parts.join(", ")}. The terrain is reshaping to show the cascading reality.`
}

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

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

  /* ═══ Scenario Injection ═══ */

  const injectScenario = useCallback((template: ScenarioTemplate) => {
    const scenario: StackedScenario = {
      id: `${template.id}-${Date.now()}`,
      question: template.question,
      template,
      forces: { ...template.forces },
    }
    setStack((prev) => [...prev, scenario])
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
  }, [clearTimeline])

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
      { type: "Operational Change", label: sourceLabel, value: formatDelta(lastCascadeSource.kpi, lastCascadeSource.delta), color: lastCascadeSource.delta > 0 ? "#34d399" : "#f87171" },
      { type: "Financial Impact", label: firstDownstream ? (KPI_ZONE_MAP[firstDownstream[0]]?.label ?? firstDownstream[0]) : "Cascading", value: firstDownstream ? formatDelta(firstDownstream[0], firstDownstream[1]) : "", color: firstDownstream && firstDownstream[1] > 0 ? "#34d399" : "#f87171" },
      ...downstream.slice(1).map(([k, d]) => ({
        type: "KPI Delta",
        label: KPI_ZONE_MAP[k]?.label ?? k,
        value: formatDelta(k, d),
        color: d > 0 ? "#34d399" : "#f87171",
      })),
      { type: "Enterprise Outcome", label: "Terrain reshapes", value: evLabel, color: "#a78bfa" },
    ]
  }, [lastCascadeSource, stack, cumulativePropagation])

  /* ═══ RENDER ═══ */

  return (
    <PageShell>
      <div className={styles.root}>

        {/* ═══ TOP — Page Header ═══ */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>What-If Scenario Engine</h1>
          <p className={styles.pageSubtitle}>
            Simulate strategic decisions and observe how they reshape the business terrain.
          </p>
        </div>

        {/* ═══ CENTER — 3D Terrain Viewport ═══ */}
        <div className={styles.terrainSection}>
          <TerrainStage
            progressive
            revealedKpis={revealedKpis}
            focusedKpi={null}
            zoneKpis={timelineKpis ?? projectedKpis ?? baseKpis}
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

        {/* ═══ ACTION — 3-column: Interpretation | Console | AI ═══ */}
        <div className={styles.actionSection}>

          {/* LEFT — Scenario Interpretation Card */}
          <div className={styles.interpretationColumn}>
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
                <div className={styles.interpretationEmptyText}>
                  Enter a strategic move to see the interpretation.
                </div>
              </div>
            )}
          </div>

          {/* CENTER — Strategic Scenario Input */}
          <div className={styles.consoleColumn}>
            <StrategicMoveConsole
              query={query}
              onQueryChange={setQuery}
              onSubmit={handleSubmit}
              onSelectTemplate={(t) => showInterpretation(t, null, 0.9)}
              loading={aiLoading}
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
                  {aiLoading ? "Analysing scenario outcomes..." : narrative}
                </span>
              </div>
            )}

            {scenarioTimeline && (
              <ScenarioTimelineSlider
                onVoice={handleTimelineVoice}
                isNarrating={isTimelineNarrating}
              />
            )}
          </div>

          {/* RIGHT — AI Intelligence Panel */}
          <div className={styles.aiColumn}>
            <AIIntelligencePanel
              answer={aiAnswer}
              loading={aiLoading}
              propagation={cumulativePropagation}
              hasSimulation={stack.length > 0}
              confidence={overallConfidence}
              onVoicePlay={() => lastCascadeSource && narrateCascade(lastCascadeSource.kpi, lastCascadeSource.delta)}
              onVoiceStop={stopNarration}
              isNarrating={isNarrating}
              onFollowUp={handleFollowUp}
              formatDelta={formatDelta}
            />
          </div>
        </div>

        {/* ═══ BOTTOM — Vertical Impact Chain ═══ */}
        {showImpactChain && chainNodes.length > 0 && (
          <div className={styles.impactSection}>
            <div className={styles.impactHeader}>
              <span className={styles.impactTitle}>Impact Propagation Chain</span>
              <button
                className={styles.impactToggle}
                onClick={() => setShowImpactChain(false)}
              >
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

        <div className={styles.disclaimer}>
          Directional strategic guidance only · Simulation-based interpretation · Not financial, legal, or investment advice
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

/* ═══════════════════════════════════════════════
   Debug Panel
   ═══════════════════════════════════════════════ */

function WhatIfDebugPanel() {
  const log = useSyncExternalStore(subscribeWhatIfLog, getWhatIfLog)

  return (
    <div className={styles.debugPanel}>
      <div className={styles.debugHeader}>
        <span>What-If Debug Log ({log.length} entries)</span>
        <button onClick={clearWhatIfLog} className={styles.debugClearBtn}>Clear</button>
      </div>
      <div className={styles.debugScroll}>
        {log.length === 0 && (
          <div style={{ padding: 16, color: "rgba(200,220,240,0.3)", fontSize: 11, textAlign: "center" }}>
            No what-if calls recorded yet.
          </div>
        )}
        {[...log].reverse().map((entry) => (
          <WhatIfDebugEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function WhatIfDebugEntry({ entry }: { entry: WhatIfLogEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.debugEntry}>
      <div className={styles.debugEntryHeader} onClick={() => setExpanded((v) => !v)}>
        <span className={entry.parseSuccess ? styles.debugSuccess : styles.debugFail}>
          {entry.parseSuccess ? "OK" : "FAIL"}
        </span>
        <span className={styles.debugQuestion}>{entry.question}</span>
        <span className={styles.debugMeta}>
          {entry.latencyMs.toFixed(0)}ms · {entry.model} · retry {entry.retryCount}
          {entry.tokenUsage && ` · ${entry.tokenUsage.total_tokens ?? "?"} tok`}
        </span>
        <span style={{ fontSize: 10, opacity: 0.3 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div className={styles.debugBody}>
          <div className={styles.debugSection}>
            <div className={styles.debugSectionTitle}>System Prompt</div>
            <pre className={styles.debugPre}>{entry.systemPrompt}</pre>
          </div>
          <div className={styles.debugSection}>
            <div className={styles.debugSectionTitle}>User Message</div>
            <pre className={styles.debugPre}>{entry.userMessage}</pre>
          </div>
          <div className={styles.debugSection}>
            <div className={styles.debugSectionTitle}>Raw Response</div>
            <pre className={styles.debugPre}>{entry.rawResponse ?? "(null)"}</pre>
          </div>
          {entry.parseErrors.length > 0 && (
            <div className={styles.debugSection}>
              <div className={styles.debugSectionTitle} style={{ color: "#f87171" }}>Errors</div>
              <pre className={styles.debugPre} style={{ color: "#f87171" }}>{entry.parseErrors.join("\n")}</pre>
            </div>
          )}
          {entry.parsedAnswer && (
            <div className={styles.debugSection}>
              <div className={styles.debugSectionTitle}>Parsed Answer</div>
              <pre className={styles.debugPre}>{JSON.stringify(entry.parsedAnswer, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
