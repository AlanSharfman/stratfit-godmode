import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Link, NavLink } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"

import { ROUTES } from "@/routes/routeContract"

import TerrainStage from "@/terrain/TerrainStage"
import CameraCompositionRig from "@/pages/position-v2/rigs/CameraCompositionRig"
import TerrainBreathRig from "@/pages/position-v2/rigs/TerrainBreathRig"
import SkyAtmosphere from "@/pages/position-v2/rigs/SkyAtmosphere"
import TerrainTuningPanel from "@/terrain/v2/TerrainTuningPanel"
import TerrainNavWidget from "@/terrain/TerrainNavWidget"
import { DEFAULT_TUNING } from "@/terrain/v2/TerrainSurfaceV2"
import type { TerrainTuningParams } from "@/terrain/v2/TerrainSurfaceV2"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline"
import type { TimeGranularity } from "@/terrain/TimelineTicks"

// Legacy scenarioStore removed — MVP reads from phase1ScenarioStore only
import { useBaselineStore } from "@/state/baselineStore"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useScenarioOverridesStore } from "@/state/scenarioOverridesStore"
import { useViewTogglesStore } from "@/state/viewTogglesStore"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { useSemanticBalance, DEFAULT_SHL_WEIGHTS } from "@/render/shl"
import type { SemanticLayerKey } from "@/render/shl"

import CommandCentrePanel from "@/components/diagnostics/CommandCentrePanel"
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel"
import {
  classifyQuestion,
  QuestionCategory,
} from "@/domain/question/questionClassifier"
import { buildQuestionContext } from "@/domain/question/questionContext"
import { buildScenarioADraft } from "@/domain/scenario/scenarioDraft"
import { studioSessionStore } from "@/state/studioSessionStore"
import KPIOverlay from "./overlays/KPIOverlay"
import ExecutiveNarrativeCard from "./components/ExecutiveNarrativeCard"
import TimeScaleControl from "./overlays/TimeScaleControl"
import IdleMotionLayer from "./IdleMotionLayer"
import ScenarioBriefPanel from "@/components/position/ScenarioBriefPanel"
import KpiSnapshotPanel from "@/components/position/KpiSnapshotPanel"
import RiskIndicatorPanel from "@/components/position/RiskIndicatorPanel"
import SimulationStatusPanel from "@/components/position/SimulationStatusPanel"
import {
  buildPositionViewModel,
} from "./overlays/positionState"

import styles from "./PositionOverlays.module.css"

// Diagnostics panel is togglable via close button

/** Treat an SHL weight > 0 as "on" */
function shlIsOn(weight: number): boolean {
  return weight > 0
}

export default function PositionPage() {
  const navigate = useNavigate()
  const [granularity, setGranularity] = useState<TimeGranularity>("quarter")
  const [rippleKey, setRippleKey] = useState(0)
  const [commandCentreOpen, setCommandCentreOpen] = useState(true)
  const [terrainTuning, setTerrainTuning] = useState<TerrainTuningParams>({ ...DEFAULT_TUNING })
  const viewportRef = useRef<HTMLDivElement>(null)

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

    // Keep navState as fallback only
    navigate("/studio", {
      state: { questionContext: qc, scenarioDraft },
    })
  }, [navigate])

  const baseline = useBaselineStore((s) => s.baseline)
  const baselineHydrated = useBaselineStore((s) => s.isHydrated)
  const hydrateBaseline = useBaselineStore((s) => s.hydrate)

  const hydrateScenarios = usePhase1ScenarioStore((s) => s.hydrate)
  const scenarioStoreHydrated = usePhase1ScenarioStore((s) => s.isHydrated)
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)
  const runSimulation = usePhase1ScenarioStore((s) => s.runSimulation)

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  )

  // Auto-run simulation if activeScenario is still in "draft"
  const lastSimRunRef = useRef<string | null>(null)

  useEffect(() => {
    if (!scenarioStoreHydrated || !activeScenarioId) return
    const active = scenarios.find((s) => s.id === activeScenarioId)
    if (!active || active.status !== "draft") return
    if (lastSimRunRef.current === active.id) return // already triggered
    lastSimRunRef.current = active.id
    runSimulation(active.id)
  }, [scenarioStoreHydrated, activeScenarioId, scenarios, runSimulation])

  useEffect(() => {
    hydrateScenarios()
  }, [hydrateScenarios])

  // Always hydrate baseline — terrain pipeline needs real values.
  // Scenario-first priority in the terrain memo prevents baseline from
  // overwriting locked scenario metrics.
  useEffect(() => {
    hydrateBaseline()
  }, [hydrateBaseline])

  useEffect(() => {
    if (scenarioStoreHydrated && !activeScenarioId) navigate("/decision")
  }, [scenarioStoreHydrated, activeScenarioId, navigate])

  useEffect(() => {
    if (baselineHydrated && !baseline) navigate("/initiate")
  }, [baselineHydrated, baseline, navigate])

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

  // ══ Terrain source-of-truth: single selector, scenario-first ══
  //
  // Once a scenario completes, derived metrics are LOCKED in a ref keyed
  // by scenarioId.  Subsequent renders (baseline rehydration, store sync,
  // override changes) hit PRIORITY 1 and return the locked value instantly.
  // Only a NEW activeScenarioId clears the lock.
  const scenarioTerrainRef = useRef<{ scenarioId: string; metrics: TerrainMetrics } | null>(null)

  const terrainMetrics = useMemo(() => {
    // PRIORITY 1: Already locked for this scenario → stable, no recompute
    if (activeScenarioId && scenarioTerrainRef.current?.scenarioId === activeScenarioId) {
      return scenarioTerrainRef.current.metrics
    }

    // PRIORITY 2: Scenario has terrain multipliers (running OR complete) → derive & lock
    const hasMultipliers =
      activeScenarioId &&
      (activeScenario?.status === "running" || activeScenario?.status === "complete") &&
      activeScenario.simulationResults?.terrain?.multipliers &&
      effectiveInputs

    if (hasMultipliers) {
      const m = activeScenario!.simulationResults!.terrain.multipliers
      const baseBurn = Number(effectiveInputs!.burnRate) || Number(effectiveInputs!.monthlyBurn) || 0
      const morphed = {
        ...effectiveInputs!,
        cash:        (Number(effectiveInputs!.cash) || 0) * m.cash,
        burnRate:    baseBurn * m.burn,
        monthlyBurn: baseBurn * m.burn,
        growthRate:  (Number(effectiveInputs!.growthRate) || 0) * m.growth,
      }
      const metrics = Object.freeze(deriveTerrainMetrics(morphed as any))
      scenarioTerrainRef.current = { scenarioId: activeScenarioId!, metrics }
      return metrics
    }

    // PRIORITY 3: No scenario with multipliers → derive from raw baseline
    return effectiveInputs ? deriveTerrainMetrics(effectiveInputs as any) : undefined
  }, [activeScenarioId, activeScenario?.status, activeScenario?.simulationResults?.terrain, effectiveInputs])

  // DEV: log terrain source once per scenario transition
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        "TERRAIN SOURCE:",
        scenarioTerrainRef.current?.scenarioId === activeScenarioId ? "SCENARIO" : "BASELINE",
        activeScenarioId ? `(scenario ${activeScenarioId.slice(0, 8)})` : "(no scenario)",
      )
    }
  }, [activeScenarioId, activeScenario?.status])

  // V1 baseline from context — only used for legacy left-rail KPI overlay.
  // Will be replaced by Phase1 scenario KPI data in a future phase.
  const { baseline: baselineV1 } = useSystemBaseline()

  const vm = useMemo(() => {
    if (!baselineV1) return null
    return buildPositionViewModel(baselineV1, { riskIndexFromEngine: null })
  }, [baselineV1])

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

  // ── LIVE DEMO / VIDEO state ──
  const [videoActive, setVideoActive] = useState(false)
  const videoEverOpened = useRef(false)
  const [videoPulsing, setVideoPulsing] = useState(true)

  // Pulse cycle: 10s on → 10s off, repeat. Stops permanently once opened.
  useEffect(() => {
    if (videoEverOpened.current) {
      setVideoPulsing(false)
      return
    }
    let mounted = true
    const cycle = () => {
      if (!mounted || videoEverOpened.current) return
      setVideoPulsing(true)
      const onTimer = setTimeout(() => {
        if (!mounted || videoEverOpened.current) return
        setVideoPulsing(false)
        const offTimer = setTimeout(() => {
          if (!mounted || videoEverOpened.current) return
          cycle()
        }, 10_000)
        return () => clearTimeout(offTimer)
      }, 10_000)
      return () => clearTimeout(onTimer)
    }
    cycle()
    return () => { mounted = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVideoToggle = useCallback(() => {
    const next = !videoActive
    setVideoActive(next)
    if (next) {
      videoEverOpened.current = true
      setVideoPulsing(false)
    }
  }, [videoActive])

  // ── Diagnostic Groups (LIVE DEMO / FIELDS / TOPOGRAPHY) ──
  const diagnosticGroups = [
    {
      heading: "LIVE DEMO",
      items: [
        {
          id: "liveVideo",
          label: "VIDEO",
          value: videoActive,
          onChange: handleVideoToggle,
          className: videoPulsing ? "videoPulse" : "videoItem",
        },
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
        { id: "envelope", label: "Envelope", value: renderFlags.showEnvelope, onChange: () => renderFlags.toggle("showEnvelope") },
        { id: "annotations", label: "Annotations", value: renderFlags.showAnnotations, onChange: () => renderFlags.toggle("showAnnotations") },
        { id: "heatMap", label: "Heat Map", value: heatmapEnabled, onChange: () => toggleHeatmap() },
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

  if (!scenarioStoreHydrated || !baselineHydrated) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(180deg, #0a0e17 0%, #0f1520 100%)",
        color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 24, height: 24, border: "2px solid rgba(34,211,238,0.3)",
            borderTopColor: "#22d3ee", borderRadius: "50%",
            animation: "posLoadSpin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <span style={{ fontSize: 14, opacity: 0.6 }}>Hydrating stores\u2026</span>
          <style>{`@keyframes posLoadSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (baselineHydrated && !baseline) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(180deg, #0a0e17 0%, #0f1520 100%)",
        color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>\u25B3</div>
          <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 600, color: "#fff" }}>Baseline Required</h2>
          <p style={{ opacity: 0.5, fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
            Complete the Initiate step to establish your company baseline before viewing Position.
          </p>
          <button
            type="button"
            onClick={() => navigate("/initiate")}
            style={{
              padding: "12px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
              color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer",
              boxShadow: "0 2px 12px rgba(34,211,238,0.15)",
            }}
          >
            Go to Initiate \u2192
          </button>
        </div>
      </div>
    )
  }

  if (!activeScenarioId || !activeScenario) {
    return <div style={{ padding: 24 }}>No active scenario — redirecting\u2026</div>
  }

  return (
    <div className={styles.page}>
      {/* ═══ LAYER 1: Deep navy canvas backdrop ═══ */}
      <div className={styles.canvasLayer} />

      {/* ═══ ATMOSPHERE LAYERS — 2-layer haze + peak spotlight + refined vignette ═══ */}
      <div className={styles.atmoSky} aria-hidden="true" />
      <div className={styles.atmoHazeDeep} aria-hidden="true" />
      <div className={styles.atmoHazeHorizon} aria-hidden="true" />
      <div className={styles.atmoSpotlight} aria-hidden="true" />
      <div className={styles.atmoVignette} aria-hidden="true" />

      {/* ═══ LAYER 2: God Mode 3-column instrument grid ═══ */}
      <div className={styles.uiLayer}>

        {/* ══════════════════════════════════════════════════
            LEFT RAIL — Intelligence Panel (KPIs + Briefing)
            ══════════════════════════════════════════════════ */}
        <div className={styles.leftCol}>
          {/* Logo lockup */}
          <Link to={ROUTES.POSITION} className={styles.logoLockup}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32" overflow="hidden" style={{ display: "block" }} aria-hidden="true">
              <defs>
                <linearGradient id="pgTopGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FFFF" />
                  <stop offset="100%" stopColor="#0077FF" />
                </linearGradient>
                <filter id="pgNeonAura" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00FFFF" floodOpacity="0.4" />
                </filter>
              </defs>
              <polygon points="15,35 50,55 50,95 15,75" fill="#0D2C4C" stroke="#1A4A7C" strokeWidth="1" />
              <polygon points="50,55 85,35 85,75 50,95" fill="#061626" stroke="#0D2C4C" strokeWidth="1" />
              <polygon points="50,15 85,35 50,55 15,35" fill="url(#pgTopGlow)" filter="url(#pgNeonAura)" />
              <polyline points="15,35 50,55 85,35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
            </svg>
            <div>
              <div className={styles.logoName}>STRATFIT</div>
              <div className={styles.logoSub}>SCENARIO INTELLIGENCE</div>
            </div>
          </Link>

          {/* KPI instruments — vertical stacked telemetry */}
          <div className={styles.kpiRailDock} aria-label="KPI Intelligence">
            <KPIOverlay vm={vm} layout="rail" />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            CENTER — Terrain Canvas (dominant, immersive)
            ══════════════════════════════════════════════════ */}
        <div className={styles.centreCol}>
          {/* Top nav row */}
          <nav className={styles.pageNav} aria-label="Primary navigation">
            <NavLink to={ROUTES.INITIATE} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Initiate</NavLink>
            <NavLink to="/decision" className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Decision</NavLink>
            <NavLink to={ROUTES.POSITION} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Position</NavLink>
            <span className={styles.pageNavItem} style={{ opacity: 0.25, cursor: "default", pointerEvents: "none", marginLeft: "auto" }}>More coming soon</span>
          </nav>

          {/* Terrain canvas — fills available space */}
          <div ref={viewportRef} className={styles.terrainViewport} aria-label="Position terrain">
            <TerrainStage
              lockCamera={true}
              pathsEnabled={false}
              terrainMetrics={{
                ...(terrainMetrics ?? {
                  elevationScale: 1,
                  roughness: 1,
                  liquidityDepth: 1,
                  growthSlope: 0,
                  volatility: 0,
                }),
                // Live tuning overrides
                ridgeIntensity: terrainTuning.ridgeIntensity,
                valleyDepth: terrainTuning.valleyDepth,
                peakSoftness: terrainTuning.peakSoftness,
                noiseFrequency: terrainTuning.noiseFrequency,
                microDetailStrength: terrainTuning.microDetailStrength,
                elevationScale: terrainTuning.elevationScale * (terrainMetrics?.elevationScale ?? 1),
                roughness: terrainTuning.terrainRoughness * 2 * (terrainMetrics?.roughness ?? 1),
              } satisfies TerrainMetrics}
              granularity={granularity}
              signals={terrainSignals}
            >
              <CameraCompositionRig />
              <SkyAtmosphere />
            </TerrainStage>
            <div className={styles.canvasVignette} aria-hidden="true" />
            <IdleMotionLayer viewportRef={viewportRef} />
            <div className={styles.filmGrain} aria-hidden="true" />
            {rippleKey > 0 && (
              <div key={rippleKey} className={styles.terrainRipple} aria-hidden="true" />
            )}
            {/* Terrain tuning gear — overlay inside viewport */}
            <TerrainTuningPanel params={terrainTuning} onChange={setTerrainTuning} />
            {/* Terrain navigation D-pad — bottom-right of viewport */}
            <TerrainNavWidget />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT RAIL — Controls (Tuning, Toggles, Diagnostics)
            ══════════════════════════════════════════════════ */}
        <div className={styles.rightCol}>
          {/* ── Scenario Brief ── */}
          {activeScenario && (
            <ScenarioBriefPanel scenario={activeScenario} baseline={baseline} />
          )}

          {/* ── KPI Snapshot ── */}
          <KpiSnapshotPanel
            baseline={baseline}
            simulationKpis={activeScenario?.simulationResults?.kpis}
          />

          {/* ── Risk Indicator ── */}
          <RiskIndicatorPanel baseline={baseline} />

          {/* ── Simulation Status ── */}
          <SimulationStatusPanel
            scenario={activeScenario}
            onRunSimulation={activeScenario ? () => runSimulation(activeScenario.id) : undefined}
            onGoToInitiate={() => navigate("/initiate")}
          />

          {/* Command Centre — overlay toggles + diagnostics */}
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
                <span className={styles.chevron}>&#9656;</span>
              </button>
            )}
          </div>

          {/* Baseline intelligence */}
          <div className={styles.baselineIntelDock} aria-label="Baseline Intelligence">
            <BaselineIntelligencePanel />
          </div>
        </div>
      </div>
    </div>
  )
}
