import React, { useCallback, useMemo, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"

import PageShell from "@/components/nav/PageShell"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce, getDownstream } from "@/engine/kpiDependencyGraph"
import type { CascadeImpulse } from "@/terrain/ProgressiveTerrainSurface"
import { SCENARIO_TEMPLATES, type ScenarioTemplate } from "@/engine/scenarioTemplates"
import { timeSimulation, buildKpiSnapshot, type TimelineState } from "@/engine/timeSimulation"
import TimelineSlider from "@/components/scenarios/TimelineSlider"
import { useTypewriterHint } from "@/hooks/useTypewriterHint"
import ImpactChain from "@/components/cascade/ImpactChain"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import { useCascadeNarration } from "@/hooks/useCascadeNarration"
import ScenarioLibrary from "@/components/persistence/ScenarioLibrary"
import ScenarioGallery from "@/components/scenarios/ScenarioGallery"
import { usePersistenceStore } from "@/stores/persistenceStore"
import { parseNaturalLanguage } from "@/engine/naturalLanguageForceMapper"
import styles from "./WhatIfPage.module.css"

interface StackedScenario {
  id: string
  question: string
  template: ScenarioTemplate
  forces: Partial<Record<KpiKey, number>>
}

const KPI_LABELS: Record<KpiKey, string> = {
  cash: "Cash", runway: "Runway", growth: "Growth", arr: "ARR",
  revenue: "Revenue", burn: "Burn", churn: "Churn",
  grossMargin: "Margin", headcount: "Team", nrr: "NRR",
  efficiency: "Efficiency", enterpriseValue: "EV",
}

function formatDelta(kpi: KpiKey, v: number): string {
  const abs = Math.abs(v)
  if (["cash", "revenue", "burn", "arr", "enterpriseValue"].includes(kpi)) {
    if (abs >= 1e6) return `${v > 0 ? "+" : "-"}$${(abs / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${v > 0 ? "+" : "-"}$${(abs / 1e3).toFixed(0)}K`
    return `${v > 0 ? "+" : "-"}$${abs.toFixed(0)}`
  }
  if (["churn", "growth", "grossMargin", "nrr"].includes(kpi)) return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`
  if (kpi === "headcount") return `${v > 0 ? "+" : ""}${Math.round(v)}`
  if (kpi === "efficiency") return `${v > 0 ? "+" : ""}${v.toFixed(2)}`
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

export default function WhatIfPage() {
  const [query, setQuery] = useState("")
  const [stack, setStack] = useState<StackedScenario[]>([])
  const [cascadeImpulse, setCascadeImpulse] = useState<CascadeImpulse | null>(null)
  const [narrative, setNarrative] = useState("")
  const [timelineMonth, setTimelineMonth] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showImpactChain, setShowImpactChain] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [lastCascadeSource, setLastCascadeSource] = useState<{ kpi: KpiKey; delta: number } | null>(null)
  const { narrate: narrateCascade, stop: stopNarration, isNarrating } = useCascadeNarration()
  const inputRef = useRef<HTMLInputElement>(null)

  const { baseline } = useSystemBaseline()
  const baseKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])

  const placeholder = useTypewriterHint({
    phrases: [
      "What if we lose our biggest client?",
      "What if we raise prices 20%?",
      "What if we hire 3 sales reps?",
      "What if we raise a Series A?",
      "What if churn doubles overnight?",
      "What if we cut burn to reach profitability?",
    ],
  })

  // Suggestions based on query
  const suggestions = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return SCENARIO_TEMPLATES
      .filter((t) => t.question.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.includes(q))
      .slice(0, 6)
  }, [query])

  // Compute cumulative forces from the entire stack
  const cumulativeForces = useMemo(() => {
    const forces: Partial<Record<KpiKey, number>> = {}
    for (const s of stack) {
      for (const [k, v] of Object.entries(s.forces) as [KpiKey, number][]) {
        forces[k] = (forces[k] ?? 0) + v
      }
    }
    return forces
  }, [stack])

  // Full propagation of cumulative forces
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

  // Timeline simulation
  const timeline = useMemo<TimelineState[]>(() => {
    if (!baseKpis || stack.length === 0) return []
    const snapshot = buildKpiSnapshot({
      cashBalance: baseKpis.cashOnHand, runwayMonths: baseKpis.runwayMonths,
      growthRatePct: baseKpis.growthRatePct, arr: baseKpis.arr,
      revenueMonthly: baseKpis.revenueMonthly, burnMonthly: baseKpis.burnMonthly,
      churnPct: baseKpis.churnPct, grossMarginPct: baseKpis.grossMarginPct,
      headcount: baseKpis.headcount, nrrPct: baseKpis.nrrPct,
      efficiencyRatio: baseKpis.efficiencyRatio, enterpriseValue: baseKpis.valuationEstimate,
    })
    return timeSimulation(snapshot, { direct: cumulativeForces }, 24)
  }, [baseKpis, stack, cumulativeForces])

  // Projected KPIs for terrain
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
      headcount: s.headcount, nrrPct: s.nrr,
      efficiencyRatio: s.efficiency,
    }
  }, [timeline, timelineMonth, baseKpis])

  // Inject a scenario into the stack
  const injectScenario = useCallback((template: ScenarioTemplate) => {
    const scenario: StackedScenario = {
      id: `${template.id}-${Date.now()}`,
      question: template.question,
      template,
      forces: { ...template.forces },
    }
    setStack((prev) => [...prev, scenario])
    setQuery("")
    setShowSuggestions(false)
    setTimelineMonth(0)

    // Fire cascade animation
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
  }, [])

  const handleSubmit = useCallback(() => {
    if (!query.trim()) return

    const match = SCENARIO_TEMPLATES.find((t) =>
      t.question.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(t.question.toLowerCase().slice(0, 20))
    )
    if (match) { injectScenario(match); return }
    if (suggestions.length > 0) { injectScenario(suggestions[0]); return }

    const parsed = parseNaturalLanguage(query)
    if (parsed.confidence > 0 && Object.keys(parsed.forces).length > 0) {
      const syntheticTemplate: ScenarioTemplate = {
        id: `nlp-${Date.now()}`,
        question: query,
        category: "market",
        forces: parsed.forces,
        description: parsed.reasoning,
      }
      injectScenario(syntheticTemplate)
      if (parsed.confidence < 0.5) {
        setNarrative(`Low confidence interpretation: ${parsed.reasoning}. Try rephrasing for better accuracy.`)
      }
      return
    }

    setNarrative("Could not interpret that scenario. Try phrasing as a specific business decision, e.g. \"What if we lose our biggest client?\"")
  }, [query, suggestions, injectScenario])

  const undoLast = useCallback(() => {
    setStack((prev) => prev.slice(0, -1))
    setNarrative(stack.length <= 1 ? "" : "Scenario removed. Terrain reverting to previous state.")
    setTimelineMonth(0)
  }, [stack])

  const clearAll = useCallback(() => {
    setStack([])
    setNarrative("")
    setTimelineMonth(0)
  }, [])

  const persistSave = usePersistenceStore((s) => s.saveScenario)

  const saveScenario = useCallback(() => {
    if (stack.length === 0) return
    const name = prompt("Name this scenario:")
    if (!name) return
    persistSave({ name, description: `${stack.length} stacked forces`, forces: cumulativeForces, tags: [] })
    setNarrative(`Scenario "${name}" saved.`)
  }, [stack, cumulativeForces, persistSave])

  const handleLoadScenario = useCallback((forces: Partial<Record<KpiKey, number>>) => {
    setStack([{
      id: `loaded-${Date.now()}`,
      question: "Loaded scenario",
      template: SCENARIO_TEMPLATES[0],
      forces,
    }])
    setNarrative("Loaded saved scenario — forces applied.")
  }, [])

  // Force visualizer edges
  const activeEdges = useMemo(() => {
    const edges: { from: KpiKey; to: KpiKey; delta: number }[] = []
    for (const [kpi] of Object.entries(cumulativeForces) as [KpiKey, number][]) {
      const downstream = getDownstream(KPI_GRAPH, kpi)
      for (const edge of downstream) {
        const delta = cumulativePropagation.get(edge.to) ?? 0
        if (Math.abs(delta) > 0.001) {
          edges.push({ from: edge.from, to: edge.to, delta })
        }
      }
    }
    return edges
  }, [cumulativeForces, cumulativePropagation])

  return (
    <PageShell>
      <div className={styles.root}>
        {/* Command Bar */}
        <div className={styles.commandBar} style={{ position: "relative" }}>
          <input
            ref={inputRef}
            className={styles.commandInput}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
            placeholder={placeholder}
          />
          <button
            className={styles.injectBtn}
            onClick={handleSubmit}
            disabled={!query.trim()}
          >
            Inject Force
          </button>
          <button
            className={styles.injectBtn}
            onClick={() => setShowGallery(true)}
            style={{ background: "rgba(167,139,250,0.12)", color: "rgba(167,139,250,0.9)", borderColor: "rgba(167,139,250,0.2)" }}
          >
            Browse Scenarios
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((t) => (
                <div
                  key={t.id}
                  className={styles.suggestionItem}
                  onMouseDown={() => injectScenario(t)}
                >
                  <div className={styles.suggestionQuestion}>{t.question}</div>
                  <div className={styles.suggestionMeta}>{t.category} · {t.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main layout */}
        <div className={styles.main}>
          {/* Left: Scenario Stack */}
          <div className={styles.stackPanel}>
            <div className={styles.stackTitle}>Scenario Stack ({stack.length})</div>
            {stack.length === 0 ? (
              <div className={styles.stackEmpty}>
                Ask a question above. Each decision stacks — forces compound, consequences cascade, and the mountain reveals the truth.
              </div>
            ) : (
              <>
                {stack.map((s, i) => (
                  <div key={s.id} className={styles.stackItem}>
                    <div className={styles.stackItemQuestion}>
                      <span style={{ color: "rgba(34,211,238,0.5)", marginRight: 6, fontSize: 10 }}>#{i + 1}</span>
                      {s.question}
                    </div>
                    <div className={styles.stackItemForces}>
                      {Object.entries(s.forces).map(([k, v]) => formatDelta(k as KpiKey, v)).join(" · ")}
                    </div>
                    {i === stack.length - 1 && (
                      <button className={styles.stackItemUndo} onClick={undoLast} title="Undo">×</button>
                    )}
                  </div>
                ))}
                <div className={styles.stackActions}>
                  <button className={styles.stackActionBtn} onClick={clearAll}>Clear All</button>
                  <button className={styles.stackActionBtn} onClick={saveScenario}>Save</button>
                </div>
              </>
            )}
            {/* Scenario Library */}
            <div style={{ marginTop: 12 }}>
              <ScenarioLibrary onLoadScenario={handleLoadScenario} currentForces={cumulativeForces} />
            </div>
          </div>

          {/* Centre: Dual Terrain + Narrative + Timeline */}
          <div className={styles.centreColumn}>
            <div className={styles.dualTerrain}>
              <div className={styles.terrainPane} style={{ position: "relative" }}>
                <div className={styles.labelCurrent}>CURRENT STATE</div>
                <TerrainStage
                  progressive
                  revealedKpis={revealedKpis}
                  focusedKpi={null}
                  zoneKpis={baseKpis}
                  cameraPreset={POSITION_PROGRESSIVE_PRESET}
                  autoRotateSpeed={0.15}
                  showDependencyLines={false}
                  hideMarkers
                  heatmapEnabled={false}
                >
                  <SkyAtmosphere />
                </TerrainStage>
                <TerrainZoneLegend kpis={baseKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />
              </div>
              <div className={styles.terrainPane} style={{ position: "relative" }}>
                <div className={styles.labelProjected}>
                  {stack.length === 0 ? "PROJECTED" : timelineMonth > 0 ? `MONTH ${timelineMonth}` : `+${stack.length} DECISION${stack.length > 1 ? "S" : ""}`}
                </div>
                <TerrainStage
                  progressive
                  revealedKpis={revealedKpis}
                  focusedKpi={null}
                  zoneKpis={projectedKpis ?? baseKpis}
                  ghostKpis={stack.length > 0 ? baseKpis : null}
                  cameraPreset={POSITION_PROGRESSIVE_PRESET}
                  autoRotateSpeed={0.15}
                  cascadeImpulse={cascadeImpulse}
                  showDependencyLines={stack.length > 0}
                  hideMarkers
                  heatmapEnabled={false}
                >
                  <SkyAtmosphere />
                </TerrainStage>
                <TerrainZoneLegend kpis={projectedKpis ?? baseKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />
              </div>
            </div>

            {narrative && (
              <div className={styles.narrativeBar}>
                <span className={styles.narrativeText}>{narrative}</span>
                {lastCascadeSource && (
                  <>
                    <button
                      style={{
                        marginLeft: 12, background: "none", border: "1px solid rgba(34,211,238,0.2)",
                        borderRadius: 4, padding: "4px 10px", color: "#22d3ee", fontSize: 10,
                        fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0,
                      }}
                      onClick={() => setShowImpactChain((v) => !v)}
                    >
                      {showImpactChain ? "Hide Chain" : "Show Chain"}
                    </button>
                    <button
                      style={{
                        marginLeft: 6, background: "none", border: `1px solid ${isNarrating ? "rgba(248,113,113,0.3)" : "rgba(34,211,238,0.2)"}`,
                        borderRadius: 4, padding: "4px 10px", color: isNarrating ? "#f87171" : "#22d3ee", fontSize: 10,
                        fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0,
                      }}
                      onClick={() => isNarrating ? stopNarration() : narrateCascade(lastCascadeSource.kpi, lastCascadeSource.delta)}
                    >
                      {isNarrating ? "Stop" : "Narrate"}
                    </button>
                  </>
                )}
              </div>
            )}

            {showImpactChain && lastCascadeSource && (
              <div style={{
                background: "rgba(4,8,16,0.85)", border: "1px solid rgba(34,211,238,0.08)",
                borderRadius: 8, padding: "12px 8px", marginTop: 4,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.4)", marginBottom: 8, paddingLeft: 8 }}>
                  Impact Chain — Cause & Effect
                </div>
                <ImpactChain
                  sourceKpi={lastCascadeSource.kpi}
                  delta={lastCascadeSource.delta}
                  height={220}
                  animate
                />
              </div>
            )}

            {timeline.length > 0 && (
              <TimelineSlider
                timeline={timeline}
                currentMonth={timelineMonth}
                onMonthChange={setTimelineMonth}
              />
            )}
          </div>

          {/* Right: Cumulative Impact */}
          <div className={styles.impactPanel}>
            {stack.length === 0 ? (
              <div className={styles.emptyImpact}>
                The impact panel shows the cumulative effect of all stacked decisions on every KPI zone.
              </div>
            ) : (
              <>
                <div className={styles.panelTitle}>Net Impact</div>
                {Array.from(cumulativePropagation.entries())
                  .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                  .map(([kpi, delta]) => (
                    <div key={kpi} className={styles.impactRow}>
                      <span className={styles.impactKpi}>{KPI_LABELS[kpi]}</span>
                      <span className={`${styles.impactDelta} ${delta >= 0 ? styles.impactPositive : styles.impactNegative}`}>
                        {formatDelta(kpi, delta)}
                      </span>
                    </div>
                  ))
                }

                {activeEdges.length > 0 && (
                  <div className={styles.cascadeSection}>
                    <div className={styles.cascadeTitle}>Force Propagation</div>
                    {activeEdges.map((e, i) => (
                      <div key={i} className={styles.forceEdge}>
                        <span>{KPI_LABELS[e.from]}</span>
                        <span className={styles.forceArrow}>{e.delta > 0 ? "→+" : "→−"}</span>
                        <span>{KPI_LABELS[e.to]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <ScenarioGallery onSelect={injectScenario} onClose={() => setShowGallery(false)} />
        )}
      </AnimatePresence>
    </PageShell>
  )
}
