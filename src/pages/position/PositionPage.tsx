import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Link, NavLink } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"

import { ROUTES } from "@/routes/routeContract"

import TerrainStage from "@/terrain/TerrainStage"
import TerrainTuningPanel from "@/terrain/TerrainTuningPanel"
import TerrainNavWidget from "@/terrain/TerrainNavWidget"
import { DEFAULT_TUNING } from "@/terrain/terrainTuning"
import type { TerrainTuningParams } from "@/terrain/terrainTuning"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline"
import type { TimeGranularity } from "@/terrain/TimelineTicks"

import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useScenarioOverridesStore } from "@/state/scenarioOverridesStore"

import KPIHealthRail from "@/components/kpi/KPIHealthRail"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import PositionExecSummary from "@/components/position/PositionExecSummary"
import SystemProbabilityNotice from "@/components/system/ProbabilityNotice"
import { selectTerrainMetrics } from "@/selectors/terrainSelectors"
import IdleMotionLayer from "./IdleMotionLayer"
import {
  buildPositionViewModel,
} from "./overlays/positionState"

import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useKpiAudio } from "@/hooks/useKpiAudio"
import { KPI_KEYS as ALL_KPI_KEYS, getHealthLevel, KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"
import { timeSimulation, buildKpiSnapshot, findFirstCliff, deriveSurvivalProbability } from "@/engine/timeSimulation"
import ProvenanceBadge from "@/components/system/ProvenanceBadge"
import { getExecutiveSummary } from "@/domain/intelligence/kpiCommentary"
import TerrainZoneLabels from "@/components/terrain/TerrainZoneLabels"
import BenchmarkPanel from "@/components/network/BenchmarkPanel"
import ProbabilitySummaryCard from "@/components/probability/ProbabilitySummaryCard"
import SimulationDisclaimerBar from "@/components/legal/SimulationDisclaimerBar"
import PositionIntelligenceConsole, { type PositionProbabilityOverview } from "@/components/position/PositionIntelligenceConsole"
import { useSimulationEngineStore } from "@/state/simulationEngineStore"
import { useTerrainLensStore } from "@/state/terrainLensStore"
import TerrainLensLaser from "@/components/terrain/TerrainLensLaser"
import TerrainInsightCard from "@/components/terrain/TerrainInsightCard"
import TerrainLensHint from "@/components/terrain/TerrainLensHint"
import styles from "./PositionOverlays.module.css"

const POSITION_AZIMUTH_LIMIT = Math.PI / 9
// Polar limits: fixed range giving ~15° up and ~15° down from the preset angle.
// Previously computed as ±π/72 (±2.5°) which was too tight — the preferred view
// was always at the bottom of the allowed range, requiring manual correction.
const POSITION_MIN_POLAR = 1.09  // ~62° from vertical — moderate top-down view
const POSITION_MAX_POLAR = 1.62  // ~93° from vertical — near-horizontal landscape

export default function PositionPage() {
  const navigate = useNavigate()
  const simRunCount = useSimulationEngineStore((s) => s.runCount)
  const [granularity] = useState<TimeGranularity>("quarter")
  const [rippleKey, setRippleKey] = useState(0)
  const [terrainTuning, setTerrainTuning] = useState<TerrainTuningParams>({ ...DEFAULT_TUNING })
  const viewportRef = useRef<HTMLDivElement>(null)
  const [revealedKpis] = useState<Set<KpiKey>>(() => new Set(ALL_KPI_KEYS))
  const [showKpiMarkers, setShowKpiMarkers] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)

  // ── Terrain Lens store (click-toggle for insight card only) ──
  const { activeLens: focusedKpi, toggleLens } = useTerrainLensStore()

  // ── Hover state — laser is ONLY driven by hover, never by click-toggle ──
  const [hoveredKpi, setHoveredKpi] = useState<KpiKey | null>(null)
  const [markerScreenPos, setMarkerScreenPos] = useState<{ x: number; y: number } | null>(null)

  // Cache last known screen position per KPI so re-hovering is instant
  const markerPosCache = useRef<Map<KpiKey, { x: number; y: number }>>(new Map())

  // Laser only shows while cursor is actively over a KPI — no fallback to click-toggle
  const activeLaserKpi = hoveredKpi

  const prevFocusedRef = useRef<KpiKey | null>(null)

  // When the hovered KPI changes: immediately use cached position (no frame delay),
  // or clear the position when nothing is hovered.
  useEffect(() => {
    if (hoveredKpi) {
      const cached = markerPosCache.current.get(hoveredKpi)
      if (cached) setMarkerScreenPos(cached)
      // If not cached yet, markerScreenPos stays as-is until the 3D beacon projects
    } else {
      setMarkerScreenPos(null)
    }
  }, [hoveredKpi])

  const handleFocusedMarkerScreen = useCallback((pos: { x: number; y: number } | null) => {
    if (pos) {
      // Cache per-KPI so next hover on same KPI is instant
      if (hoveredKpi) markerPosCache.current.set(hoveredKpi, pos)
      setMarkerScreenPos(pos)
    } else {
      // Only clear if nothing is hovered — don't clear while switching between KPIs
      if (!hoveredKpi) setMarkerScreenPos(null)
    }
  }, [hoveredKpi])

  // Safety net: if cursor leaves the viewport entirely, clear hover state
  const handleViewportMouseLeave = useCallback(() => {
    setHoveredKpi(null)
  }, [])

  // ── ResizeObserver: update Three.js renderer when right rail expands/collapses ──
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      window.dispatchEvent(new Event("resize"))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    function onRipple() { setRippleKey((k) => k + 1) }
    window.addEventListener("sf:terrain-ripple", onRipple)
    return () => window.removeEventListener("sf:terrain-ripple", onRipple)
  }, [])

  // ── Canonical baseline: SystemBaselineProvider is the single source of truth ──
  const { baseline: baselineV1Raw } = useSystemBaseline()

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
    if (lastSimRunRef.current === active.id) return
    lastSimRunRef.current = active.id
    runSimulation(active.id)
  }, [scenarioStoreHydrated, activeScenarioId, scenarios, runSimulation])

  useEffect(() => {
    hydrateScenarios()
  }, [hydrateScenarios])

  // Redirect handled by PositionRoute — no duplicate navigate here

  const { overrideScenarios, activeOverrideScenarioId } = useScenarioOverridesStore(
    useShallow((s) => ({
      overrideScenarios: s.scenarios,
      activeOverrideScenarioId: s.activeScenarioId,
    })),
  )

  // Derive flat terrain-compatible inputs from BaselineV1 so deriveTerrainMetrics works
  const baselineFlat = useMemo(() => {
    if (!baselineV1Raw) return null
    const f = baselineV1Raw.financial
    return {
      cash:        f.cashOnHand,
      monthlyBurn: f.monthlyBurn,
      burnRate:    f.monthlyBurn,
      revenue:     f.arr / 12,
      growthRate:  f.growthRatePct,   // toFactor() handles % → decimal
      grossMargin: f.grossMarginPct,  // toFactor() handles % → decimal
      churnRate:   baselineV1Raw.operating.churnPct,
      headcount:   f.headcount,
      arpa:        baselineV1Raw.operating.acv,
    }
  }, [baselineV1Raw])

  const effectiveInputs = useMemo(() => {
    if (!baselineFlat) return null
    const active = overrideScenarios.find((s) => s.id === activeOverrideScenarioId)
    return active ? ({ ...baselineFlat, ...active.overrides } as const) : baselineFlat
  }, [baselineFlat, overrideScenarios, activeOverrideScenarioId])

  // ══ Terrain source-of-truth: single selector, scenario-first ══
  const scenarioTerrainRef = useRef<{ scenarioId: string; metrics: TerrainMetrics } | null>(null)

  const terrainMetrics = useMemo(() => {
    if (activeScenarioId && scenarioTerrainRef.current?.scenarioId === activeScenarioId) {
      return scenarioTerrainRef.current.metrics
    }

    const engineMetrics = activeScenario?.simulationResults?.terrainMetrics
    if (
      activeScenarioId &&
      (activeScenario?.status === "running" || activeScenario?.status === "complete") &&
      engineMetrics
    ) {
      const metrics: TerrainMetrics = Object.freeze({
        elevationScale: engineMetrics.elevationScale,
        roughness: engineMetrics.roughness,
        ridgeIntensity: engineMetrics.ridgeIntensity,
        volatility: engineMetrics.volatility,
        liquidityDepth: effectiveInputs
          ? Math.min(
              ((Number(effectiveInputs.cash) || 0) /
                (Number(effectiveInputs.burnRate) || Number((effectiveInputs as any).monthlyBurn) || 1)) / 12,
              2,
            )
          : 1,
        growthSlope: effectiveInputs
          ? (Math.abs(Number(effectiveInputs.growthRate) || 0) <= 1
              ? Number(effectiveInputs.growthRate) || 0
              : (Number(effectiveInputs.growthRate) || 0) / 100)
          : 0,
      })
      scenarioTerrainRef.current = { scenarioId: activeScenarioId!, metrics }
      return metrics
    }

    const terrainData = selectTerrainMetrics(activeScenario?.simulationResults ?? null)
    const hasMultipliers =
      activeScenarioId &&
      (activeScenario?.status === "running" || activeScenario?.status === "complete") &&
      terrainData?.multipliers &&
      effectiveInputs

    if (hasMultipliers) {
      const m = terrainData!.multipliers
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

    return effectiveInputs ? deriveTerrainMetrics(effectiveInputs as any) : undefined
  }, [activeScenarioId, activeScenario?.status, activeScenario?.simulationResults?.terrainMetrics, effectiveInputs])

  const vm = useMemo(() => {
    if (!baselineV1Raw) return null
    return buildPositionViewModel(baselineV1Raw, { riskIndexFromEngine: null })
  }, [baselineV1Raw])

  // ── Live KPIs: HARD RULE — always derived from baseline (Initiate inputs).
  // KPI box values must always correspond 1-to-1 with the Initiate page entries.
  // Simulation results drive terrain shape and scenarios, NOT the KPI display.
  const liveKpis = useMemo(() => vm?.kpis ?? null, [vm?.kpis])

  const intelligenceText = useMemo(() => {
    if (!liveKpis) return ""
    return getExecutiveSummary(liveKpis).narrative
  }, [liveKpis])

  const { speak: speakKpi, stop: stopKpi } = useKpiAudio(liveKpis)
  const speakTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    clearTimeout(speakTimerRef.current)
    if (audioEnabled && focusedKpi && prevFocusedRef.current !== focusedKpi) {
      speakTimerRef.current = setTimeout(() => speakKpi(focusedKpi), 350)
    }
    prevFocusedRef.current = focusedKpi
  }, [focusedKpi, speakKpi, audioEnabled])
  useEffect(() => {
    if (!audioEnabled) { clearTimeout(speakTimerRef.current); stopKpi() }
  }, [audioEnabled, stopKpi])
  useEffect(() => () => { clearTimeout(speakTimerRef.current); stopKpi() }, [stopKpi])

  useEffect(() => {
    if (!focusedKpi) {
      setMarkerScreenPos(null)
    }
  }, [focusedKpi])

  // Auto-rotation: faster during build, near-still after all revealed
  const autoRotateSpeed = useMemo(
    () => revealedKpis.size >= 12 ? 0.05 : (revealedKpis.size > 0 ? 0.4 : 0),
    [revealedKpis.size],
  )

  // ── Position Intelligence: cliff detector, health pulse, survival ──
  const positionIntel = useMemo(() => {
    if (!liveKpis) return null

    const healthCounts = { strong: 0, watch: 0, critical: 0 }
    for (const k of ALL_KPI_KEYS) {
      const h = getHealthLevel(k, liveKpis)
      if (h === "strong") healthCounts.strong++
      else if (h === "critical") healthCounts.critical++
      else healthCounts.watch++
    }
    const healthScore = Math.round(((healthCounts.strong * 10 + healthCounts.watch * 5) / (ALL_KPI_KEYS.length * 10)) * 100)

    const snapshot = buildKpiSnapshot({
      cashBalance: liveKpis.cashOnHand, runwayMonths: liveKpis.runwayMonths,
      growthRatePct: liveKpis.growthRatePct, arr: liveKpis.arr,
      revenueMonthly: liveKpis.revenueMonthly, burnMonthly: liveKpis.burnMonthly,
      churnPct: liveKpis.churnPct, grossMarginPct: liveKpis.grossMarginPct,
      headcount: liveKpis.headcount, enterpriseValue: liveKpis.valuationEstimate,
    })
    const timeline = timeSimulation(snapshot, { direct: {}, monthlyGrowthRates: { cash: -0.02, burn: 0.01, churn: 0.005 } }, 12)
    const cliff = findFirstCliff(timeline)

    const criticalZones = ALL_KPI_KEYS
      .filter((k) => getHealthLevel(k, liveKpis) === "critical")
      .map((k) => KPI_ZONE_MAP[k].label)

    const survivalProbability = deriveSurvivalProbability(timeline)

    const filledKpis = [
      liveKpis.cashOnHand, liveKpis.runwayMonths, liveKpis.arr,
      liveKpis.revenueMonthly, liveKpis.burnMonthly, liveKpis.grossMarginPct,
      liveKpis.growthRatePct, liveKpis.churnPct, liveKpis.headcount, liveKpis.valuationEstimate,
    ]
    const dataCompletenessPct = Math.round((filledKpis.filter((v) => v != null && v !== 0).length / filledKpis.length) * 100)

    const terrainVariant: import("@/terrain/terrainMaterials").TerrainColorVariant =
      healthScore >= 68 ? "white" : healthScore >= 42 ? "frost" : "default"

    return { healthScore, healthCounts, cliff, criticalZones, survivalProbability, timeline, dataCompletenessPct, terrainVariant }
  }, [liveKpis])

  const positionProbability = useMemo<PositionProbabilityOverview | null>(() => {
    const simulationKpis = activeScenario?.simulationResults?.kpis

    const snapshot = simulationKpis
      ? buildKpiSnapshot({
          cashBalance: simulationKpis.cash,
          runwayMonths: simulationKpis.runway ?? 0,
          growthRatePct: simulationKpis.growthRate,
          arr: simulationKpis.revenue * 12,
          revenueMonthly: simulationKpis.revenue,
          burnMonthly: simulationKpis.monthlyBurn,
          churnPct: simulationKpis.churnRate,
          grossMarginPct: simulationKpis.grossMargin,
          headcount: simulationKpis.headcount,
          enterpriseValue: simulationKpis.revenue * 12 * 8,
        })
      : liveKpis
        ? buildKpiSnapshot({
            cashBalance: liveKpis.cashOnHand,
            runwayMonths: liveKpis.runwayMonths,
            growthRatePct: liveKpis.growthRatePct,
            arr: liveKpis.arr,
            revenueMonthly: liveKpis.revenueMonthly,
            burnMonthly: liveKpis.burnMonthly,
            churnPct: liveKpis.churnPct,
            grossMarginPct: liveKpis.grossMarginPct,
            headcount: liveKpis.headcount,
            enterpriseValue: liveKpis.valuationEstimate,
          })
        : null

    if (!snapshot) return null

    const timeline = timeSimulation(snapshot, { direct: {}, monthlyGrowthRates: { cash: -0.02, burn: 0.01, churn: 0.005 } }, 12)
    const cliff = findFirstCliff(timeline)
    const survivalProbability = deriveSurvivalProbability(timeline)

    const completenessFields = simulationKpis
      ? [
          simulationKpis.cash,
          simulationKpis.runway,
          simulationKpis.revenue,
          simulationKpis.monthlyBurn,
          simulationKpis.grossMargin,
          simulationKpis.growthRate,
          simulationKpis.churnRate,
          simulationKpis.headcount,
          simulationKpis.arpa,
        ]
      : liveKpis
        ? [
            liveKpis.cashOnHand,
            liveKpis.runwayMonths,
            liveKpis.arr,
            liveKpis.revenueMonthly,
            liveKpis.burnMonthly,
            liveKpis.grossMarginPct,
            liveKpis.growthRatePct,
            liveKpis.churnPct,
            liveKpis.headcount,
            liveKpis.valuationEstimate,
          ]
        : []

    const dataCompletenessPct = completenessFields.length > 0
      ? Math.round((completenessFields.filter((value) => value != null && value !== 0).length / completenessFields.length) * 100)
      : 0

    return {
      survivalProbability,
      cliff,
      runwayRiskLabel: cliff ? `Month ${cliff.month}` : "Contained",
      runwayRiskProbability: cliff ? Math.max(10, 100 - survivalProbability) : 15,
      modelConfidence: dataCompletenessPct >= 85 ? "High" : dataCompletenessPct >= 60 ? "Medium" : "Low",
      dataCompletenessPct,
      subtitle: simulationKpis
        ? "Aligned to the active scenario simulation currently shaping the Position terrain."
        : "Aligned to the current baseline position because no active scenario results are available yet.",
    }
  }, [activeScenario?.simulationResults?.kpis, liveKpis])

  // Guard: no baseline → redirect handled by useEffect above, show loading in the meantime
  if (!baselineV1Raw) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(180deg, #0a0e17 0%, #0f1520 100%)",
        color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>△</div>
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
            Go to Initiate →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* Atmospheric depth veil — pushes JPEG mountain visually behind live terrain */}
      <div className={styles.bgDepthVeil} aria-hidden="true" />

      {/* ═══ LAYER 2: God Mode 3-column instrument grid ═══ */}
      <div className={styles.uiLayer}>

        {/* ══════════════════════════════════════════════════
            LEFT RAIL — Intelligence Panel (KPIs + Briefing)
            ══════════════════════════════════════════════════ */}
        <div className={styles.leftCol}>
          {/* Logo lockup */}
          <Link to={ROUTES.POSITION} className={styles.logoLockup}>
            <img src="/stratfit-logo.png" alt="STRATFIT" className={styles.logoImg} />
            <div>
              <div className={styles.logoName}>STRATFIT</div>
              <div className={styles.logoSub}>SCENARIO INTELLIGENCE</div>
            </div>
          </Link>

          {/* Intelligence Executive Summary removed per user request */}

          <div className={styles.kpiRailDock} aria-label="KPI Health Rail">
            <KPIHealthRail kpis={liveKpis} focusedKpi={focusedKpi} revealedKpis={revealedKpis} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            CENTER — Terrain Canvas (dominant, immersive)
            ══════════════════════════════════════════════════ */}
        <div className={styles.centreCol}>
          {/* Top nav row */}
          <nav className={styles.pageNav} aria-label="Primary navigation">
            <NavLink to={ROUTES.INITIATE} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Initiate</NavLink>
            <NavLink to={ROUTES.POSITION} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Position</NavLink>
            <NavLink to={ROUTES.WHAT_IF} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>What If</NavLink>
            <NavLink to={ROUTES.ACTIONS} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Actions</NavLink>
            <NavLink to={ROUTES.TIMELINE} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Timeline</NavLink>
            <NavLink to={ROUTES.RISK} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Risk</NavLink>
            <NavLink to={ROUTES.COMPARE} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Compare</NavLink>
          </nav>

          {/* Terrain canvas — fills available space */}
          <div ref={viewportRef} className={styles.terrainViewport} aria-label="Position terrain" style={{ position: "relative" }} onMouseLeave={handleViewportMouseLeave}>
            <TerrainStage
              progressive
              transparentBackground
              cinematicLighting
              colorVariant={positionIntel?.terrainVariant ?? "default"}
              revealedKpis={revealedKpis}
              focusedKpi={activeLaserKpi}
              onFocusKpi={setHoveredKpi}
              minAzimuthAngle={-POSITION_AZIMUTH_LIMIT}
              maxAzimuthAngle={POSITION_AZIMUTH_LIMIT}
              minPolarAngle={POSITION_MIN_POLAR}
              maxPolarAngle={POSITION_MAX_POLAR}
              rotateSpeed={0.55}
              onFocusedMarkerScreen={handleFocusedMarkerScreen}
              zoneKpis={liveKpis}
              heatmapEnabled={false}
              cameraPreset={POSITION_PROGRESSIVE_PRESET}
              autoRotateSpeed={0}
              showKpiMarkers={showKpiMarkers}
              hideMarkers
              tuning={terrainTuning}
              terrainMetrics={{
                ...(terrainMetrics ?? {
                  elevationScale: 1,
                  roughness: 1,
                  liquidityDepth: 1,
                  growthSlope: 0,
                  volatility: 0,
                }),
                ridgeIntensity: terrainTuning.ridgeIntensity,
                valleyDepth: terrainTuning.valleyDepth,
                peakSoftness: terrainTuning.peakSoftness,
                noiseFrequency: terrainTuning.noiseFrequency,
                microDetailStrength: terrainTuning.microDetailStrength,
                elevationScale: terrainTuning.elevationScale * (terrainMetrics?.elevationScale ?? 1),
                roughness: terrainTuning.terrainRoughness * 2 * (terrainMetrics?.roughness ?? 1),
              } satisfies TerrainMetrics}
              granularity={granularity}
              driftMode="oscillate"
            />
            <TerrainZoneLabels kpis={liveKpis} revealedKpis={revealedKpis} focusedKpi={focusedKpi} hoveredKpi={hoveredKpi} onFocusKpi={setHoveredKpi} onClickKpi={(kpi) => {
              if (kpi) {
                toggleLens(kpi)
                return
              }
              if (focusedKpi) {
                toggleLens(focusedKpi)
              }
            }} />
            <TerrainLensHint />
            {activeLaserKpi && markerScreenPos && (
              <TerrainLensLaser kpi={activeLaserKpi} markerPos={markerScreenPos} viewportRef={viewportRef} />
            )}
            {focusedKpi && markerScreenPos && liveKpis && (
              <TerrainInsightCard kpi={focusedKpi} kpis={liveKpis} markerPos={markerScreenPos} />
            )}
            <div className={styles.canvasVignette} aria-hidden="true" />
            <IdleMotionLayer viewportRef={viewportRef} />
            <div className={styles.filmGrain} aria-hidden="true" />
            {rippleKey > 0 && (
              <div key={rippleKey} className={styles.terrainRipple} aria-hidden="true" />
            )}
            <TerrainTuningPanel params={terrainTuning} onChange={setTerrainTuning} />
            <button
              onClick={() => setShowKpiMarkers(v => !v)}
              title={showKpiMarkers ? "Hide KPI markers" : "Show KPI markers"}
              style={{
                position: "absolute", top: 16, right: 60, zIndex: 100,
                width: 36, height: 36, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: showKpiMarkers ? "rgba(34,211,238,0.12)" : "rgba(14,22,36,0.72)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                border: `1px solid ${showKpiMarkers ? "rgba(34,211,238,0.35)" : "rgba(100,180,255,0.15)"}`,
                color: showKpiMarkers ? "#22d3ee" : "#6BB8FF",
                cursor: "pointer", fontSize: 14, outline: "none", padding: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </button>
            <button
              onClick={() => setAudioEnabled(v => !v)}
              title={audioEnabled ? "Mute voice narration" : "Enable voice narration"}
              style={{
                position: "absolute", top: 16, right: 104, zIndex: 100,
                width: 36, height: 36, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: audioEnabled ? "rgba(34,211,238,0.12)" : "rgba(14,22,36,0.72)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                border: `1px solid ${audioEnabled ? "rgba(34,211,238,0.35)" : "rgba(100,180,255,0.15)"}`,
                color: audioEnabled ? "#22d3ee" : "#6BB8FF",
                cursor: "pointer", fontSize: 14, outline: "none", padding: 0,
              }}
            >
              {audioEnabled ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
            <TerrainNavWidget />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT RAIL — Actions Panel (placeholder)
            ══════════════════════════════════════════════════ */}
        <div className={styles.rightCol}>
          {positionIntel && liveKpis && (
            <PositionIntelligenceConsole
              kpis={liveKpis}
              intel={positionIntel}
              probability={positionProbability ?? undefined}
              simRunCount={simRunCount > 0 ? simRunCount : undefined}
              onOpenWhatIf={() => navigate(ROUTES.WHAT_IF)}
            />
          )}
        </div>
      </div>

      {/* Provenance badge */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 4px' }}>
        <ProvenanceBadge />
      </div>

      {/* Legal disclaimer */}
      <div className={styles.legalDisclaimer}>
        All projections, probabilities and scenario outcomes are generated by STRATFIT's Monte Carlo simulation engine and do not constitute financial advice. Results are illustrative and based on user-supplied inputs. Past performance is not indicative of future results.
      </div>
      <SystemProbabilityNotice />

    </div>
  )
}
