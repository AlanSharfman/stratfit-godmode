// src/pages/studio/StudioPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Studio MVP Shell (Phase E0 — God Mode)
//
// Primary interactive surface: Levers → Run → Terrain + Signals + Narrative.
// Reuses existing engine pipeline (phase1ScenarioStore.runSimulation).
// No new stores. No UI-side calculations. Demo-safe.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"

import { ROUTES } from "@/routes/routeContract"
import { useBaselineStore } from "@/state/baselineStore"
import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import {
  usePhase1ScenarioStore,
  DECISION_INTENT_OPTIONS,
  type DecisionIntentType,
} from "@/state/phase1ScenarioStore"
import {
  decisionLeverSchemas,
  defaultLeverValues,
  type LeverSchema,
} from "@/config/decisionLeverSchemas"
import LeverSliderGroup from "@/components/decision/LeverSliderGroup"

import TerrainStage from "@/terrain/TerrainStage"
import TerrainNavWidget from "@/terrain/TerrainNavWidget"
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline"
import { selectTerrainMetrics } from "@/selectors/terrainSelectors"
import CommandGlassPanel from "@/components/intelligence/CommandGlassPanel"
import { useIntelligencePresentation } from "@/hooks/useIntelligencePresentation"
import { useCommandAutoEvaluate } from "@/hooks/useCommandAutoEvaluate"
import { useCommandStore } from "@/store/commandStore"
import CommandModeStrip from "@/components/command/CommandModeStrip"
import HeatmapOverlay from "@/components/command/HeatmapOverlay"
import CodeOverlay from "@/components/command/CodeOverlay"
import { selectRiskScore } from "@/selectors/riskSelectors"
import RiskIntelligencePanel from "@/components/Risk/RiskIntelligencePanel"
import ProvenanceBadge from "@/components/system/ProvenanceBadge"

// ── Timeline Simulation Engine ──
import { useStudioTimelineStore } from "@/stores/studioTimelineStore"
import { useTimelineTerrainMetrics } from "@/hooks/useTimelineTerrainMetrics"
import { useTimelineResolutionWarning } from "@/hooks/useTimelineResolutionWarning"
import { useTimelinePerformanceSafety } from "@/hooks/useTimelinePerformanceSafety"
import TimelineScrubber from "@/components/studio/TimelineScrubber"
import SimulationPlayback from "@/components/studio/SimulationPlayback"
import TimelineMetrics from "@/components/studio/TimelineMetrics"
import TimelineInsights from "@/components/studio/TimelineInsights"
import type { TimelineResolution } from "@/core/simulation/timelineTypes"

/* ── formatLeverValue now imported from LeverSliderGroup ── */

/* ── Component ───────────────────────────────────────────── */

export default function StudioPage() {
  const baseline = useCanonicalBaseline()
  const baselineHydrated = useBaselineStore((s) => s.isHydrated)
  const hydrateBaseline = useBaselineStore((s) => s.hydrate)
  const hydrateScenarios = usePhase1ScenarioStore((s) => s.hydrate)
  const scenarioStoreHydrated = usePhase1ScenarioStore((s) => s.isHydrated)

  const createScenario = usePhase1ScenarioStore((s) => s.createScenario)
  const setActiveScenarioId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)
  const runSimulation = usePhase1ScenarioStore((s) => s.runSimulation)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  )

  // ── Hydrate stores ──
  useEffect(() => { hydrateBaseline() }, [hydrateBaseline])
  useEffect(() => { hydrateScenarios() }, [hydrateScenarios])

  // ── Local lever state ──
  const [intentType, setIntentType] = useState<DecisionIntentType>("growth_investment")
  const [leverValues, setLeverValues] = useState<Record<string, number>>(
    () => defaultLeverValues("growth_investment"),
  )
  const [scenarioLabel, setScenarioLabel] = useState("Studio Scenario")
  const [isRunning, setIsRunning] = useState(false)

  const activeSchema = useMemo(
    () => decisionLeverSchemas[intentType] ?? [],
    [intentType],
  )

  // Reset levers on intent change
  useEffect(() => {
    setLeverValues(defaultLeverValues(intentType))
  }, [intentType])

  const updateLever = useCallback((id: string, value: number) => {
    setLeverValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const resetLevers = useCallback(() => {
    setLeverValues(defaultLeverValues(intentType))
  }, [intentType])

  // ── Run Simulation ──
  const handleRun = useCallback(() => {
    if (!baseline || isRunning) return
    setIsRunning(true)

    const scenarioId = createScenario({
      decision: scenarioLabel || "Studio scenario",
      decisionIntentType: intentType,
      decisionIntentLabel:
        DECISION_INTENT_OPTIONS.find((o) => o.value === intentType)?.label ?? "Other",
      leverValues,
      createdAt: Date.now(),
    })

    setActiveScenarioId(scenarioId)
    runSimulation(scenarioId)

    // Clear running after sim completes (1.4s engine + buffer)
    setTimeout(() => setIsRunning(false), 1800)
  }, [baseline, isRunning, scenarioLabel, intentType, leverValues, createScenario, setActiveScenarioId, runSimulation])

  // ── Terrain metrics derivation (same logic as PositionPage) ──
  const baselineInputs = useBaselineStore((s) => s.baselineInputs)

  const terrainMetrics = useMemo<TerrainMetrics | undefined>(() => {
    // PRIORITY 1: Engine-computed metrics from active scenario
    const engineMetrics = activeScenario?.simulationResults?.terrainMetrics
    if (
      activeScenario &&
      (activeScenario.status === "running" || activeScenario.status === "complete") &&
      engineMetrics
    ) {
      return {
        elevationScale: engineMetrics.elevationScale,
        roughness: engineMetrics.roughness,
        ridgeIntensity: engineMetrics.ridgeIntensity,
        volatility: engineMetrics.volatility,
        liquidityDepth: baselineInputs
          ? Math.min(
              ((Number(baselineInputs.cash) || 0) /
                (Number(baselineInputs.burnRate) || Number((baselineInputs as any).monthlyBurn) || 1)) / 12,
              2,
            )
          : 1,
        growthSlope: baselineInputs
          ? (Math.abs(Number(baselineInputs.growthRate) || 0) <= 1
              ? Number(baselineInputs.growthRate) || 0
              : (Number(baselineInputs.growthRate) || 0) / 100)
          : 0,
      }
    }

    // PRIORITY 2: Derive from baseline
    return baselineInputs ? deriveTerrainMetrics(baselineInputs as any) : undefined
  }, [activeScenario?.status, activeScenario?.simulationResults?.terrainMetrics, baselineInputs])

  // ── Intelligence presentation (narrative brief) ──
  const simulationCompletedAt = activeScenario?.simulationResults?.completedAt || null
  const presentation = useIntelligencePresentation({ completedAt: simulationCompletedAt })

  // ── Command Centre Auto-Evaluate ──
  const activeSimResults = activeScenario?.simulationResults ?? null
  useCommandAutoEvaluate(activeSimResults)
  const commandMode = useCommandStore((s) => s.currentMode)
  const riskScoreForOverlays = selectRiskScore(activeSimResults?.kpis ?? null)

  // ── Run stamp ──
  const runStamp = useMemo(() => {
    if (!activeScenario?.simulationResults?.completedAt) return null
    const res = activeScenario.simulationResults
    return {
      scenarioId: activeScenario.id,
      completedAt: res.completedAt,
      seed: activeScenario.simulationResults.terrain.seed,
    }
  }, [activeScenario?.id, activeScenario?.simulationResults])

  // ── Timeline Simulation Engine ──
  const tlResolution = useStudioTimelineStore((s) => s.resolution)
  const tlHorizon = useStudioTimelineStore((s) => s.horizon)
  const tlTimeline = useStudioTimelineStore((s) => s.timeline)
  const tlCurrentStep = useStudioTimelineStore((s) => s.currentStep)
  const tlEngineResults = useStudioTimelineStore((s) => s.engineResults)
  const tlSetResolution = useStudioTimelineStore((s) => s.setResolution)
  const tlSetHorizon = useStudioTimelineStore((s) => s.setHorizon)
  const tlGenerate = useStudioTimelineStore((s) => s.generateTimeline)

  const timelineTerrainMetrics = useTimelineTerrainMetrics()
  const resolutionWarning = useTimelineResolutionWarning()
  const perfSafety = useTimelinePerformanceSafety()

  const tlCurrentPoint = useMemo(() => {
    return tlEngineResults?.timeline[tlCurrentStep] ?? null
  }, [tlEngineResults, tlCurrentStep])

  const tlPreviousPoint = useMemo(() => {
    if (!tlEngineResults || tlCurrentStep <= 0) return null
    return tlEngineResults.timeline[tlCurrentStep - 1] ?? null
  }, [tlEngineResults, tlCurrentStep])

  // Merge terrain metrics: timeline function overrides static scenario metrics
  const effectiveTerrainMetrics = useMemo(() => {
    if (timelineTerrainMetrics) return timelineTerrainMetrics
    return terrainMetrics
  }, [timelineTerrainMetrics, terrainMetrics])

  // Static snapshot for overlays that need scalar .volatility / .roughness values
  const overlayMetrics: TerrainMetrics | null = useMemo(() => {
    if (!effectiveTerrainMetrics) return null
    if (typeof effectiveTerrainMetrics === "function") return effectiveTerrainMetrics(0.5)
    return effectiveTerrainMetrics
  }, [effectiveTerrainMetrics])

  // ── Loading / redirect guards ──
  if (!scenarioStoreHydrated || !baselineHydrated) {
    return (
      <div style={S.loadingShell}>
        <div style={{ textAlign: "center" }}>
          <div style={S.spinner} />
          <span style={{ fontSize: 14, opacity: 0.6, color: "#e2e8f0" }}>Hydrating stores…</span>
          <style>{`@keyframes stSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (baselineHydrated && !baseline) {
    return (
      <div style={S.loadingShell}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>△</div>
          <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 600, color: "#fff" }}>Baseline Required</h2>
          <p style={{ opacity: 0.5, fontSize: 14, lineHeight: 1.5, marginBottom: 24, color: "#e2e8f0" }}>
            Complete the Initiate step to establish your company baseline before using Studio.
          </p>
          <Link to={ROUTES.INITIATE} style={S.linkBtn}>Go to Initiate →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>

      {/* ═══ TOP: Studio Header Strip ═══ */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <Link to={ROUTES.POSITION} style={S.logoLink}>
            <span style={S.logoText}>STRATFIT</span>
            <span style={S.logoSub}>STUDIO</span>
          </Link>
        </div>

        <nav style={S.headerNav}>
          <NavLink to={ROUTES.INITIATE} style={S.navItem}>Initiate</NavLink>
          <span style={S.navDivider} aria-hidden="true" />
          <NavLink to={ROUTES.POSITION} style={S.navItem}>Position</NavLink>
          <span style={S.navDivider} aria-hidden="true" />
          <NavLink to={ROUTES.DECISION} style={S.navItem}>Decision</NavLink>
          <span style={S.navDivider} aria-hidden="true" />
          <NavLink to={ROUTES.STUDIO} style={({ isActive }) => isActive ? S.navItemActive : S.navItem}>Studio</NavLink>
          <span style={S.navDivider} aria-hidden="true" />
          <NavLink to={ROUTES.COMPARE} style={S.navItem}>Compare</NavLink>
          <span style={S.navDivider} aria-hidden="true" />
          <NavLink to={ROUTES.RISK} style={S.navItem}>Risk</NavLink>
          <span style={S.navDivider} aria-hidden="true" />
          <NavLink to={ROUTES.VALUATION} style={S.navItem}>Valuation</NavLink>
          <span style={S.navDivider} aria-hidden="true" />
          <NavLink to={ROUTES.COMMAND} style={S.navItem}>Command Centre</NavLink>
        </nav>

        <div style={S.headerRight}>
          {/* Run stamp */}
          {runStamp && (
            <div style={S.stamp}>
              <span style={S.stampLabel}>SEED</span>
              <span style={S.stampValue}>{(runStamp.seed >>> 0).toString(16).padStart(8, "0")}</span>
              <span style={S.stampSep}>|</span>
              <span style={S.stampLabel}>RUN</span>
              <span style={S.stampValue}>
                {new Date(runStamp.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          )}

          {/* Run button */}
          <button
            type="button"
            onClick={handleRun}
            disabled={!baseline || isRunning}
            style={{
              ...S.runBtn,
              opacity: (!baseline || isRunning) ? 0.5 : 1,
              cursor: (!baseline || isRunning) ? "not-allowed" : "pointer",
            }}
          >
            {isRunning ? "Running…" : "Run Simulation"}
          </button>
        </div>
      </header>

      {/* ═══ 3-COLUMN BODY ═══ */}
      <div style={S.body}>

        {/* ── LEFT: Lever Panel ── */}
        <aside style={S.leftRail}>
          {/* Intent selector */}
          <div style={S.sectionHeader}>
            <span style={S.sectionIcon}>▸</span>
            <span style={S.sectionTitle}>Decision Type</span>
          </div>
          <select
            value={intentType}
            onChange={(e) => setIntentType(e.target.value as DecisionIntentType)}
            style={S.select}
          >
            {DECISION_INTENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Scenario label */}
          <div style={{ ...S.sectionHeader, marginTop: 16 }}>
            <span style={S.sectionIcon}>▸</span>
            <span style={S.sectionTitle}>Scenario Label</span>
          </div>
          <input
            type="text"
            value={scenarioLabel}
            onChange={(e) => setScenarioLabel(e.target.value)}
            style={S.textInput}
            placeholder="Studio scenario"
          />

          {/* ── Timeline Config ── */}
          <div style={{ ...S.sectionHeader, marginTop: 18 }}>
            <span style={S.sectionIcon}>◈</span>
            <span style={S.sectionTitle}>Timeline</span>
          </div>

          <div style={S.timelineConfigRow}>
            <label style={S.timelineLabel}>Resolution</label>
            <select
              value={tlResolution}
              onChange={(e) => tlSetResolution(e.target.value as TimelineResolution)}
              style={{ ...S.select, marginBottom: 0 }}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div style={{ ...S.timelineConfigRow, marginTop: 6 }}>
            <label style={S.timelineLabel}>Horizon (years)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={tlHorizon}
              onChange={(e) => tlSetHorizon(Number(e.target.value))}
              style={{ ...S.textInput, width: 60, textAlign: "center" }}
            />
          </div>

          {/* Resolution warning */}
          {resolutionWarning.active && (
            <div style={S.resolutionWarning}>
              ⚠ {resolutionWarning.message}
            </div>
          )}

          {/* Performance warning */}
          {perfSafety.reduced && (
            <div style={S.resolutionWarning}>
              ⚡ {perfSafety.warning}
            </div>
          )}

          <button
            type="button"
            onClick={tlGenerate}
            style={S.generateBtn}
          >
            Generate Timeline
          </button>

          {/* Levers */}
          <div style={{ ...S.sectionHeader, marginTop: 18 }}>
            <span style={S.sectionIcon}>▸</span>
            <span style={S.sectionTitle}>Scenario Levers</span>
            <span style={S.intentTag}>
              {DECISION_INTENT_OPTIONS.find((o) => o.value === intentType)?.label ?? "Other"}
            </span>
          </div>

          {activeSchema.length > 0 ? (
            <>
              <LeverSliderGroup
                levers={activeSchema}
                values={leverValues}
                onChange={updateLever}
                grouped
              />
              <button type="button" onClick={resetLevers} style={S.resetBtn}>
                Reset to defaults
              </button>
            </>
          ) : (
            <div style={S.leverPlaceholder}>
              Select a decision type to configure levers.
            </div>
          )}

          {/* Status indicator */}
          <div style={S.statusStrip}>
            <div style={{
              ...S.statusDot,
              background: activeScenario?.status === "complete" ? "#22c55e"
                : activeScenario?.status === "running" ? "#fbbf24"
                : "#475569",
            }} />
            <span style={S.statusLabel}>
              {activeScenario?.status === "complete" ? "Simulation complete"
                : activeScenario?.status === "running" ? "Simulation running…"
                : "Ready"}
            </span>
          </div>
        </aside>

        {/* ── CENTER: Terrain + Timeline ── */}
        <main style={S.center}>
          <div style={S.terrainViewport}>
            <TerrainStage
              lockCamera={false}
              pathsEnabled={false}
              terrainMetrics={effectiveTerrainMetrics ?? {
                elevationScale: 1,
                roughness: 1,
                liquidityDepth: 1,
                growthSlope: 0,
                volatility: 0,
              }}
            >
              <CameraCompositionRig />
              <SkyAtmosphere />
            </TerrainStage>
            <div style={S.canvasVignette} />
            {/* Terrain navigation D-pad */}
            <TerrainNavWidget />
            {/* ── Command Mode overlays ── */}
            <HeatmapOverlay
              terrainMetrics={overlayMetrics}
              riskScore={riskScoreForOverlays}
              visible={commandMode === "heatmap"}
            />
            <CodeOverlay
              kpis={activeSimResults?.kpis ?? null}
              terrainMetrics={overlayMetrics}
              riskScore={riskScoreForOverlays}
              visible={commandMode === "code"}
            />
            {/* ── Command Mode Strip ── */}
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
              <CommandModeStrip engineResults={activeSimResults} />
            </div>
          </div>

          {/* ═══ TIMELINE CONTROL BAR ═══ */}
          {tlTimeline.length > 0 && (
            <div style={S.timelineBar}>
              <SimulationPlayback />
              <TimelineScrubber />
            </div>
          )}

          {/* ═══ BOTTOM: Timeline Intelligence + KPI Panel ═══ */}
          {tlEngineResults && (
            <div style={S.bottomPanel}>
              <div style={S.bottomLeft}>
                <TimelineInsights
                  engineTimeline={tlEngineResults.timeline}
                  timelineSteps={tlTimeline}
                  currentStep={tlCurrentStep}
                />
              </div>
              <div style={S.bottomRight}>
                <TimelineMetrics
                  currentPoint={tlCurrentPoint}
                  previousPoint={tlPreviousPoint}
                />
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT: Signal Brief / Narrative ── */}
        <aside style={S.rightRail}>
          <div style={S.sectionHeader}>
            <span style={S.sectionIcon}>◆</span>
            <span style={S.sectionTitle}>Intelligence Brief</span>
          </div>
          <div style={S.briefScroll}>
            {activeScenario?.status === "complete" ? (
              <CommandGlassPanel
                phase={presentation.phase}
                onTypewriterComplete={() => presentation.requestSettle()}
              />
            ) : (
              <div style={S.briefPlaceholder}>
                <div style={S.briefPlaceholderIcon}>◇</div>
                <div style={S.briefPlaceholderText}>
                  Run a simulation to generate intelligence brief.
                </div>
              </div>
            )}
          </div>

          {/* ── Risk Intelligence (Phase 300) ── */}
          <div style={{ padding: "10px 0 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <RiskIntelligencePanel />
          </div>
        </aside>

      </div>

      {/* Provenance badge */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 4px' }}>
        <ProvenanceBadge />
      </div>

      {/* Legal */}
      <div style={S.legal}>
        All projections, probabilities and scenario outcomes are generated by STRATFIT's Monte Carlo simulation engine and do not constitute financial advice.
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES — institutional god-mode, no CSS module dependency
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"
const MONO = "ui-monospace, 'JetBrains Mono', monospace"
const CYAN = "rgba(34, 211, 238, 0.85)"
const CYAN_DIM = "rgba(34, 211, 238, 0.15)"
const GLASS_BG = "rgba(6, 12, 20, 0.7)"
const GLASS_BORDER = "1px solid rgba(182, 228, 255, 0.1)"
const VOID = "#081020"

const S: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    background: `linear-gradient(180deg, ${VOID} 0%, #0c1a2e 50%, #0d1b2a 100%)`,
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
    background: `linear-gradient(180deg, ${VOID} 0%, #0d1b2a 100%)`,
    color: "#e2e8f0",
    fontFamily: FONT,
  },

  spinner: {
    width: 24,
    height: 24,
    border: "2px solid rgba(34,211,238,0.3)",
    borderTopColor: "#22d3ee",
    borderRadius: "50%",
    animation: "stSpin 0.8s linear infinite",
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

  /* ── Header ── */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    padding: "0 16px",
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(12px)",
    borderBottom: GLASS_BORDER,
    flexShrink: 0,
    zIndex: 10,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  logoLink: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    textDecoration: "none",
  },

  logoText: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "2px",
    color: "#fff",
  },

  logoSub: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.2em",
    color: CYAN,
  },

  headerNav: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap" as const,
  },

  navItem: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    textDecoration: "none",
    color: "rgba(255,255,255,0.6)",
    transition: "color 0.2s",
  },

  navItemActive: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    textDecoration: "none",
    color: CYAN,
  },

  navDivider: {
    display: "inline-block",
    width: 1,
    height: 16,
    background: "rgba(255, 255, 255, 0.12)",
    flexShrink: 0,
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  stamp: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: MONO,
    fontSize: 10,
    color: "rgba(148,180,214,0.5)",
  },

  stampLabel: {
    fontWeight: 700,
    letterSpacing: "0.1em",
    fontSize: 8,
    color: "rgba(148,180,214,0.4)",
    textTransform: "uppercase" as const,
  },

  stampValue: {
    color: "rgba(226,240,255,0.7)",
  },

  stampSep: {
    color: "rgba(255,255,255,0.1)",
    margin: "0 2px",
  },

  runBtn: {
    padding: "6px 18px",
    borderRadius: 6,
    border: `1px solid ${CYAN_DIM}`,
    background: "rgba(34,211,238,0.08)",
    color: CYAN,
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    transition: "background 200ms ease, border-color 200ms ease",
  },

  /* ── Body ── */
  body: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "260px 1fr 300px",
    minHeight: 0,
    overflow: "hidden",
  },

  /* ── Left rail ── */
  leftRail: {
    gridColumn: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
    padding: "14px 14px 10px",
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(14px)",
    borderRight: GLASS_BORDER,
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(100,180,255,0.12) transparent",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  sectionIcon: {
    fontSize: 10,
    color: CYAN,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(148,180,214,0.65)",
  },

  intentTag: {
    marginLeft: "auto",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "rgba(34,211,238,0.5)",
    textTransform: "uppercase" as const,
  },

  select: {
    width: "100%",
    padding: "7px 10px",
    borderRadius: 5,
    border: GLASS_BORDER,
    background: GLASS_BG,
    color: "#e2e8f0",
    fontFamily: FONT,
    fontSize: 12,
    outline: "none",
    marginBottom: 4,
  },

  textInput: {
    width: "100%",
    padding: "7px 10px",
    borderRadius: 5,
    border: GLASS_BORDER,
    background: GLASS_BG,
    color: "#e2e8f0",
    fontFamily: FONT,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box" as const,
  },

  leverGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    marginTop: 4,
  },

  leverRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },

  leverHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  },

  leverLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(226,240,255,0.75)",
  },

  leverValue: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(226,240,255,0.85)",
  },

  slider: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    appearance: "auto" as const,
    accentColor: "#22d3ee",
    cursor: "pointer",
    background: "transparent",
  },

  leverRange: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 9,
    color: "rgba(148,180,214,0.35)",
    fontFamily: MONO,
  },

  resetBtn: {
    marginTop: 6,
    padding: "5px 10px",
    borderRadius: 4,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "rgba(255,255,255,0.35)",
    fontFamily: FONT,
    fontSize: 10,
    cursor: "pointer",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },

  leverPlaceholder: {
    padding: "16px 8px",
    fontSize: 12,
    color: "rgba(148,180,214,0.4)",
    textAlign: "center" as const,
  },

  statusStrip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: "auto",
    paddingTop: 14,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },

  statusLabel: {
    fontSize: 10,
    color: "rgba(148,180,214,0.5)",
    letterSpacing: "0.04em",
  },

  /* ── Center ── */
  center: {
    gridColumn: 2,
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 0,
    background: VOID,
    overflow: "hidden",
  },

  terrainViewport: {
    position: "relative" as const,
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    border: "2px solid rgba(220,230,245,0.35)",
    boxShadow: "0 0 0 2px rgba(255,255,255,0.15), 0 0 0 5px rgba(6,10,16,0.85), 0 18px 80px rgba(0,0,0,0.55)",
    background: VOID,
    minHeight: 0,
  },

  canvasVignette: {
    position: "absolute" as const,
    inset: 0,
    pointerEvents: "none" as const,
    borderRadius: 12,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, transparent 12%), linear-gradient(to top, rgba(0,0,0,0.34) 0%, transparent 16%)",
    zIndex: 1,
  },

  /* ── Right rail ── */
  rightRail: {
    gridColumn: 3,
    display: "flex",
    flexDirection: "column" as const,
    padding: "14px 12px 10px",
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(14px)",
    borderLeft: GLASS_BORDER,
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(100,180,255,0.12) transparent",
  },

  briefScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto" as const,
    marginTop: 8,
  },

  briefPlaceholder: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    gap: 12,
  },

  briefPlaceholderIcon: {
    fontSize: 24,
    color: "rgba(34,211,238,0.25)",
  },

  briefPlaceholderText: {
    fontSize: 12,
    color: "rgba(148,180,214,0.4)",
    textAlign: "center" as const,
    lineHeight: 1.5,
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

  /* ── Timeline Config ── */
  timelineConfigRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },

  timelineLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(148,180,214,0.55)",
    letterSpacing: "0.04em",
    flexShrink: 0,
  },

  resolutionWarning: {
    marginTop: 6,
    padding: "6px 8px",
    borderRadius: 4,
    background: "rgba(250, 204, 21, 0.08)",
    border: "1px solid rgba(250, 204, 21, 0.2)",
    fontSize: 10,
    color: "rgba(250, 204, 21, 0.85)",
    lineHeight: 1.4,
  },

  generateBtn: {
    marginTop: 8,
    padding: "7px 14px",
    borderRadius: 6,
    border: "1px solid rgba(34,211,238,0.2)",
    background: "rgba(34,211,238,0.08)",
    color: CYAN,
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    transition: "background 200ms ease",
    width: "100%",
  },

  /* ── Timeline Bar ── */
  timelineBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 12px",
    margin: "0 8px 4px",
    borderRadius: 8,
    background: "rgba(6, 12, 20, 0.7)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(182, 228, 255, 0.08)",
    flexShrink: 0,
  },

  /* ── Bottom Panel ── */
  bottomPanel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: "0 8px 8px",
    flexShrink: 0,
    maxHeight: 200,
    overflow: "hidden",
  },

  bottomLeft: {
    borderRadius: 8,
    background: "rgba(6, 12, 20, 0.6)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(182, 228, 255, 0.08)",
    overflowY: "auto" as const,
    maxHeight: 190,
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(100,180,255,0.12) transparent",
  },

  bottomRight: {
    borderRadius: 8,
    overflowY: "auto" as const,
    maxHeight: 190,
  },
}
