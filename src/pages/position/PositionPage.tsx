import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Link, NavLink } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"

import { ROUTES } from "@/routes/routeContract"

import TerrainStage from "@/terrain/TerrainStage"
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline"
import type { TimeGranularity } from "@/terrain/TimelineTicks"

import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useScenarioStore } from "@/state/scenarioStore"
import { useBaselineStore } from "@/state/baselineStore"
import { useScenarioOverridesStore } from "@/state/scenarioOverridesStore"
import { useViewTogglesStore } from "@/state/viewTogglesStore"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { useSemanticBalance, DEFAULT_SHL_WEIGHTS } from "@/render/shl"
import type { SemanticLayerKey } from "@/render/shl"

import CommandCentrePanel from "@/components/diagnostics/CommandCentrePanel"
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel"
import CommandConsoleBar from "@/components/command/CommandConsoleBar"
import {
  classifyQuestion,
  QuestionCategory,
} from "@/domain/question/questionClassifier"
import { buildQuestionContext } from "@/domain/question/questionContext"
import { buildScenarioADraft } from "@/domain/scenario/scenarioDraft"
import { studioSessionStore } from "@/state/studioSessionStore"
import KPIOverlay from "./overlays/KPIOverlay"
import DiagnosticsSummary from "./components/DiagnosticsSummary"
import ExecutiveNarrativeCard from "./components/ExecutiveNarrativeCard"
import TerrainLegend from "./overlays/TerrainLegend"
import TimeScaleControl from "./overlays/TimeScaleControl"
import IntelligenceStrip from "@/components/position/IntelligenceStrip"
import {
  buildPositionViewModel,
} from "./overlays/positionState"

import styles from "./PositionOverlays.module.css"

// Diagnostics panel is togglable via close button

function extractRiskIndex(engineResults: unknown): number | null {
  const r = engineResults as any
  const v = r?.base?.kpis?.riskIndex?.value
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

/** Treat an SHL weight > 0 as "on" */
function shlIsOn(weight: number): boolean {
  return weight > 0
}

export default function PositionPage() {
  const navigate = useNavigate()
  const [granularity, setGranularity] = useState<TimeGranularity>("quarter")
  const [rippleKey, setRippleKey] = useState(0)
  const [commandCentreOpen, setCommandCentreOpen] = useState(true)

  useEffect(() => {
    function onRipple() { setRippleKey((k) => k + 1) }
    window.addEventListener("sf:terrain-ripple", onRipple)
    return () => window.removeEventListener("sf:terrain-ripple", onRipple)
  }, [])

  const handleQuestionSubmit = useCallback((question: string) => {
    const category: QuestionCategory = classifyQuestion(question)
    const qc = buildQuestionContext(question, category)
    const scenarioDraft = buildScenarioADraft(qc)

    // STEP 14: Seed canonical store BEFORE navigation (deterministic runtime)
    studioSessionStore.seed({
      questionContext: qc,
      scenarioA: scenarioDraft,
    })

    console.log("[Question Submitted]", question)
    console.log("[Classification Result]", category)
    console.log("[Store Seeded] studioSessionStore")

    // Keep navState as fallback only
    navigate("/studio", {
      state: { questionContext: qc, scenarioDraft },
    })
  }, [navigate])

  const { baseline } = useSystemBaseline()

  const baselineInputs = useBaselineStore((s) => s.baselineInputs)

  const { overrideScenarios, activeOverrideScenarioId } = useScenarioOverridesStore(
    useShallow((s) => ({
      overrideScenarios: s.scenarios,
      activeOverrideScenarioId: s.activeScenarioId,
    })),
  )

  const effectiveInputs = useMemo(() => {
    if (!baselineInputs) return null
    const active = overrideScenarios.find((s) => s.id === activeOverrideScenarioId)
    return active ? ({ ...baselineInputs, ...active.overrides } as const) : baselineInputs
  }, [baselineInputs, overrideScenarios, activeOverrideScenarioId])

  const terrainMetrics = useMemo(
    () => (effectiveInputs ? deriveTerrainMetrics(effectiveInputs) : undefined),
    [effectiveInputs],
  )

  const engineResults = useScenarioStore((s) => s.engineResults)

  const vm = useMemo(() => {
    if (!baseline) return null
    const riskIndexFromEngine = extractRiskIndex(engineResults)
    return buildPositionViewModel(baseline, { riskIndexFromEngine })
  }, [baseline, engineResults])

  const terrainSignals = useMemo(() => {
    const byKey = new Map((vm?.diagnostics ?? []).map((d) => [d.key, d]))
    const order = ["capitalEfficiency", "growthQuality", "liquidity", "costPressure"] as const
    return order
      .map((k) => byKey.get(k))
      .filter(Boolean)
      .map((d) => ({
        key: d!.key,
        label: d!.title,
        tone: d!.tone,
        detail: d!.text,
        metricLine: d!.metricLine,
      }))
  }, [vm])

  // ── Render flags store ──
  const renderFlags = useRenderFlagsStore()

  // ── SHL weights (semantic highlight layer) ──
  const shlWeights = useSemanticBalance((s) => s.weights)
  const setWeight = useSemanticBalance((s) => s.setWeight)

  const toggleShl = useCallback(
    (key: SemanticLayerKey) => (next: boolean) => {
      setWeight(key, next ? DEFAULT_SHL_WEIGHTS[key] : 0)
    },
    [setWeight],
  )

  // ── View toggles ──
  const heatmapEnabled = useViewTogglesStore((s) => s.heatmapEnabled)
  const toggleHeatmap = useViewTogglesStore((s) => s.toggleHeatmap)

  // ── Diagnostic Groups (NARRATIVE / FIELDS / TOPOGRAPHY) ──
  const diagnosticGroups = [
    {
      heading: "NARRATIVE",
      items: [
        { id: "heatMap", label: "Heat Map", value: heatmapEnabled, onChange: () => toggleHeatmap() },
        { id: "envelope", label: "Envelope", value: renderFlags.showEnvelope, onChange: () => renderFlags.toggle("showEnvelope") },
        { id: "watchDemo", label: "Watch Demo", value: renderFlags.watchDemo, onChange: () => renderFlags.toggle("watchDemo") },
        { id: "annotations", label: "Annotations", value: renderFlags.showAnnotations, onChange: () => renderFlags.toggle("showAnnotations") },
      ],
    },
    {
      heading: "FIELDS",
      items: [
        { id: "riskField", label: "Risk Field", value: shlIsOn(shlWeights.risk), onChange: toggleShl("risk") },
        { id: "confidence", label: "Confidence", value: shlIsOn(shlWeights.confidence), onChange: toggleShl("confidence") },
        { id: "markers", label: "Markers", value: renderFlags.showMarkers, onChange: () => renderFlags.toggle("showMarkers") },
        { id: "preview", label: "Preview", value: renderFlags.showPreview, onChange: () => renderFlags.toggle("showPreview") },
        { id: "flow", label: "Flow", value: shlIsOn(shlWeights.flow), onChange: toggleShl("flow") },
        { id: "diverge", label: "Diverge", value: shlIsOn(shlWeights.divergence), onChange: toggleShl("divergence") },
      ],
    },
    {
      heading: "TOPOGRAPHY",
      items: [
        { id: "heat", label: "Heat", value: shlIsOn(shlWeights.heat), onChange: toggleShl("heat") },
        { id: "resonance", label: "Resonance", value: shlIsOn(shlWeights.resonance), onChange: toggleShl("resonance") },
        { id: "topo", label: "Topo", value: shlIsOn(shlWeights.topography), onChange: toggleShl("topography") },
      ],
    },
  ]

  return (
    <div className={styles.page}>
      {/* ═══ Premium header line — spans full width above everything ═══ */}
      <div className={styles.headerLine} aria-hidden="true">
        <span>POSITION: FRAGILE</span>
        <span className={styles.headerSep}>|</span>
        <span>Confidence: High</span>
        <span className={styles.headerSep}>|</span>
        <span>Updated: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span className={styles.headerSep}>|</span>
        <span>Data: Manual / Xero</span>
      </div>

      {/* ═══ LAYER 1: Fixed full-bleed terrain canvas ═══ */}
      <div className={styles.canvasLayer}>
        <TerrainStage
          granularity={granularity}
          terrainMetrics={terrainMetrics}
          lockCamera
          signals={terrainSignals}
        />
        <div className={styles.canvasVignette} aria-hidden="true" />
        <div className={styles.terrainBezel} aria-hidden="true" />
        {rippleKey > 0 && (
          <div key={rippleKey} className={styles.terrainRipple} aria-hidden="true" />
        )}
      </div>

      {/* ═══ LAYER 2: 3-column frosted-glass UI ═══ */}
      <div className={styles.uiLayer}>
        {/* ── LEFT COLUMN ── */}
        <div className={styles.leftCol}>
          {/* Logo lockup */}
          <Link to={ROUTES.POSITION} className={styles.logoLockup}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32" style={{ display: "block" }} aria-hidden="true">
              <defs>
                <linearGradient id="pgTopGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FFFF" />
                  <stop offset="100%" stopColor="#0077FF" />
                </linearGradient>
                <filter id="pgNeonAura" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00FFFF" floodOpacity="0.5" />
                </filter>
              </defs>
              <polygon points="15,35 50,55 50,95 15,75" fill="#0D2C4C" stroke="#1A4A7C" strokeWidth="1" />
              <polygon points="50,55 85,35 85,75 50,95" fill="#061626" stroke="#0D2C4C" strokeWidth="1" />
              <polygon points="50,15 85,35 50,55 15,35" fill="url(#pgTopGlow)" filter="url(#pgNeonAura)" />
              <polyline points="15,35 50,55 85,35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
              <line x1="50" y1="55" x2="50" y2="95" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5" />
            </svg>
            <div>
              <div className={styles.logoName}>STRATFIT</div>
              <div className={styles.logoSub}>SCENARIO INTELLIGENCE</div>
            </div>
          </Link>

          <div className={styles.execSummaryDock} aria-label="Executive summary">
            <ExecutiveNarrativeCard vm={vm} />
          </div>

          <div className={styles.commandCentreDock} aria-label="Command Centre">
            {commandCentreOpen ? (
              <CommandCentrePanel
                groups={diagnosticGroups}
                title="Command Centre"
                onClose={() => setCommandCentreOpen(false)}
              />
            ) : (
              <button
                type="button"
                className={styles.collapseToggle}
                onClick={() => setCommandCentreOpen(true)}
              >
                <span>Command Centre</span>
                <span className={styles.chevron}>▸</span>
              </button>
            )}
          </div>

          <div className={styles.legendDock} aria-label="Terrain legend">
            <TerrainLegend />
          </div>
        </div>

        {/* ── CENTRE COLUMN — transparent, question bar ── */}
        <div className={styles.centreCol}>
          {/* Top nav row */}
          <nav className={styles.pageNav} aria-label="Primary navigation">
            <NavLink to={ROUTES.INITIATE} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Initiate</NavLink>
            <NavLink to={ROUTES.POSITION} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Position</NavLink>
            <NavLink to={ROUTES.COMPARE} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Compare</NavLink>
            <NavLink to={ROUTES.RISK} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Risk</NavLink>
            <NavLink to={ROUTES.VALUATION} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Valuation</NavLink>
            <NavLink to={ROUTES.INSIGHTS} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Insights</NavLink>
            <NavLink to={ROUTES.ASSESSMENT} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Assessment</NavLink>
            <NavLink to={ROUTES.COMING_FEATURES} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Coming Features</NavLink>
          </nav>

          {/* KPI HUD strip — must sit below the nav row */}
          <div className={styles.kpiDock} aria-label="KPI HUD">
            <KPIOverlay vm={vm} />
          </div>

          <IntelligenceStrip />

          <div className={styles.timeScaleDock} aria-label="Time scale control">
            <TimeScaleControl granularity={granularity} setGranularity={setGranularity} />
          </div>

          <CommandConsoleBar
            modeLabel="Decision Console"
            onSubmit={async (question) => { await handleQuestionSubmit(question) }}
          />

          {!vm && (
            <div className={styles.noBaselineHint}>
              No baseline loaded. Initialise to enable KPIs + diagnostics.
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className={styles.rightCol}>
          <div className={styles.baselineIntelDock} aria-label="Baseline Intelligence">
            <BaselineIntelligencePanel />
          </div>
        </div>
      </div>
    </div>
  )
}
