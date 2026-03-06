import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Link, NavLink } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"

import { ROUTES } from "@/routes/routeContract"

import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
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
import { timeSimulation, buildKpiSnapshot, findFirstCliff } from "@/engine/timeSimulation"
import ProvenanceBadge from "@/components/system/ProvenanceBadge"
import IntelligenceConsole from "@/components/intelligence/IntelligenceConsole"
import { getExecutiveSummary } from "@/domain/intelligence/kpiCommentary"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import TerrainHealthBar from "@/components/terrain/TerrainHealthBar"
import TerrainZoneLabels from "@/components/terrain/TerrainZoneLabels"
import BenchmarkPanel from "@/components/network/BenchmarkPanel"
import ProbabilitySummaryCard from "@/components/probability/ProbabilitySummaryCard"
import SimulationDisclaimerBar from "@/components/legal/SimulationDisclaimerBar"
import { useSimulationEngineStore } from "@/state/simulationEngineStore"
import styles from "./PositionOverlays.module.css"

/* ─── Laser Beam Overlay ─── */
const LASER_DASH_KEYFRAMES = `
@keyframes sf-laser-march {
  to { stroke-dashoffset: -40; }
}
@keyframes sf-laser-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`

let _laserStyleInjected = false
function ensureLaserStyles() {
  if (_laserStyleInjected) return
  _laserStyleInjected = true
  const s = document.createElement("style")
  s.textContent = LASER_DASH_KEYFRAMES
  document.head.appendChild(s)
}

function KpiLaserOverlay({ kpi, markerPos, viewportRef }: {
  kpi: KpiKey
  markerPos: { x: number; y: number }
  viewportRef: React.RefObject<HTMLDivElement | null>
}) {
  const [pillPos, setPillPos] = React.useState<{ x: number; y: number } | null>(null)

  React.useEffect(() => {
    ensureLaserStyles()
  }, [])

  React.useEffect(() => {
    const vpEl = viewportRef.current
    if (!vpEl) return
    const pillEl = vpEl.querySelector(`[data-kpi-pill="${kpi}"]`) as HTMLElement | null
    if (!pillEl) return
    const vpRect = vpEl.getBoundingClientRect()
    const pillRect = pillEl.getBoundingClientRect()
    setPillPos({
      x: pillRect.left + pillRect.width / 2 - vpRect.left,
      y: pillRect.top + pillRect.height / 2 - vpRect.top,
    })
  }, [kpi, viewportRef])

  if (!pillPos) return null

  const sx = pillPos.x
  const sy = pillPos.y
  const tx = markerPos.x
  const ty = markerPos.y
  const dx = tx - sx
  const dy = ty - sy
  const len = Math.sqrt(dx * dx + dy * dy)

  return (
    <svg
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        zIndex: 20, pointerEvents: "none",
        animation: "sf-laser-fade-in 0.15s ease-out both",
      }}
    >
      <defs>
        <filter id="sf-laser-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b1" />
          <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="b2" />
          <feMerge>
            <feMergeNode in="b1" />
            <feMergeNode in="b2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sf-laser-flare" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="sf-laser-grad" x1={sx} y1={sy} x2={tx} y2={ty} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.3" />
          <stop offset="10%" stopColor="#22D3EE" stopOpacity="1" />
          <stop offset="90%" stopColor="#67E8F9" stopOpacity="1" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Wide outer glow */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke="#22D3EE" strokeWidth={8} opacity={0.18}
        filter="url(#sf-laser-glow)" />

      {/* Mid glow */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke="#22D3EE" strokeWidth={4} opacity={0.45}
        filter="url(#sf-laser-glow)" />

      {/* Core beam */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke="url(#sf-laser-grad)" strokeWidth={2.5}
        filter="url(#sf-laser-glow)" />

      {/* White-hot center */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke="#ECFEFF" strokeWidth={1} opacity={0.85} />

      {/* Animated energy pulse dashes */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke="#67E8F9" strokeWidth={2}
        strokeDasharray="6 14"
        style={{ animation: "sf-laser-march 0.4s linear infinite" }}
        opacity={0.7} />

      {/* Source flare (pill) */}
      <circle cx={sx} cy={sy} r={8} fill="#22D3EE" opacity={0.35} filter="url(#sf-laser-flare)" />
      <circle cx={sx} cy={sy} r={4} fill="#ECFEFF" opacity={0.6} />

      {/* Target flare (marker) */}
      <circle cx={tx} cy={ty} r={12} fill="#22D3EE" opacity={0.4} filter="url(#sf-laser-flare)" />
      <circle cx={tx} cy={ty} r={5} fill="#ECFEFF" opacity={0.7} />

      {/* Arrowhead at target */}
      <polygon
        points={(() => {
          if (len < 1) return "0,0 0,0 0,0"
          const nx = dx / len
          const ny = dy / len
          const px = -ny
          const py = nx
          const tipX = tx
          const tipY = ty
          const backX = tx - nx * 14
          const backY = ty - ny * 14
          return `${tipX},${tipY} ${backX + px * 7},${backY + py * 7} ${backX - px * 7},${backY - py * 7}`
        })()}
        fill="#22D3EE" opacity={0.9}
        filter="url(#sf-laser-glow)"
      />
    </svg>
  )
}

export default function PositionPage() {
  const navigate = useNavigate()
  const simRunCount = useSimulationEngineStore((s) => s.runCount)
  const [granularity] = useState<TimeGranularity>("quarter")
  const [rippleKey, setRippleKey] = useState(0)
  const [terrainTuning, setTerrainTuning] = useState<TerrainTuningParams>({ ...DEFAULT_TUNING })
  const viewportRef = useRef<HTMLDivElement>(null)
  const [focusedKpi, setFocusedKpi] = useState<KpiKey | null>(null)
  const [revealedKpis] = useState<Set<KpiKey>>(() => new Set(ALL_KPI_KEYS))
  const [showKpiMarkers, setShowKpiMarkers] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)

  const prevFocusedRef = useRef<KpiKey | null>(null)

  // ── Laser beam state ──
  const [laserKpi, setLaserKpi] = useState<KpiKey | null>(null)
  const [markerScreenPos, setMarkerScreenPos] = useState<{ x: number; y: number } | null>(null)
  const laserTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleClickKpi = useCallback((kpi: KpiKey | null) => {
    clearTimeout(laserTimerRef.current)
    if (kpi) {
      setLaserKpi(kpi)
      setFocusedKpi(kpi)
      laserTimerRef.current = setTimeout(() => {
        setLaserKpi(null)
        setFocusedKpi(null)
        setMarkerScreenPos(null)
      }, 2500)
    } else {
      setLaserKpi(null)
      setFocusedKpi(null)
      setMarkerScreenPos(null)
    }
  }, [])

  const handleHoverKpi = useCallback((kpi: KpiKey | null) => {
    if (laserKpi) return
    setFocusedKpi(kpi)
  }, [laserKpi])

  useEffect(() => () => clearTimeout(laserTimerRef.current), [])

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

  // Redirect to /initiate if no baseline is established
  useEffect(() => {
    if (baselineV1Raw === null) navigate("/initiate")
  }, [baselineV1Raw, navigate])

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
  useEffect(() => {
    if (audioEnabled && focusedKpi && prevFocusedRef.current !== focusedKpi) {
      speakKpi(focusedKpi)
    }
    prevFocusedRef.current = focusedKpi
  }, [focusedKpi, speakKpi, audioEnabled])
  useEffect(() => {
    if (!audioEnabled) stopKpi()
  }, [audioEnabled, stopKpi])
  useEffect(() => () => { stopKpi() }, [stopKpi])

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

    const survivalProbability = cliff
      ? Math.max(5, Math.round(100 - (12 - cliff.month) * 8))
      : healthScore > 60 ? Math.min(95, healthScore + 10) : Math.max(30, healthScore)

    const filledKpis = [
      liveKpis.cashOnHand, liveKpis.runwayMonths, liveKpis.arr,
      liveKpis.revenueMonthly, liveKpis.burnMonthly, liveKpis.grossMarginPct,
      liveKpis.growthRatePct, liveKpis.churnPct, liveKpis.headcount, liveKpis.valuationEstimate,
    ]
    const dataCompletenessPct = Math.round((filledKpis.filter((v) => v != null && v !== 0).length / filledKpis.length) * 100)

    return { healthScore, healthCounts, cliff, criticalZones, survivalProbability, timeline, dataCompletenessPct }
  }, [liveKpis])

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
            <img src="/stratfit-logo.png" alt="STRATFIT" className={styles.logoImg} />
            <div>
              <div className={styles.logoName}>STRATFIT</div>
              <div className={styles.logoSub}>SCENARIO INTELLIGENCE</div>
            </div>
          </Link>

          {/* Intelligence Executive Summary */}
          <PositionExecSummary kpis={liveKpis} revealedCount={revealedKpis.size} />

          <div className={styles.kpiRailDock} aria-label="KPI Health Rail">
            <KPIHealthRail kpis={liveKpis} focusedKpi={focusedKpi} onFocusKpi={handleHoverKpi} revealedKpis={revealedKpis} />
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
          <div ref={viewportRef} className={styles.terrainViewport} aria-label="Position terrain" style={{ position: "relative" }}>
            <TerrainStage
              progressive
              revealedKpis={revealedKpis}
              focusedKpi={focusedKpi}
              onFocusKpi={handleHoverKpi}
              onClickKpi={handleClickKpi}
              onFocusedMarkerScreen={setMarkerScreenPos}
              zoneKpis={liveKpis}
              heatmapEnabled={false}
              cameraPreset={POSITION_PROGRESSIVE_PRESET}
              autoRotateSpeed={autoRotateSpeed}
              showDependencyLines
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
              driftMode="micro"
            >
              <SkyAtmosphere />
            </TerrainStage>
            <TerrainHealthBar kpis={liveKpis} revealedKpis={revealedKpis} />
            <TerrainZoneLabels kpis={liveKpis} revealedKpis={revealedKpis} focusedKpi={focusedKpi} onFocusKpi={handleHoverKpi} onClickKpi={handleClickKpi} />
            <TerrainZoneLegend kpis={liveKpis} revealedKpis={revealedKpis} focusedKpi={focusedKpi} onFocusKpi={handleHoverKpi} />
            {laserKpi && markerScreenPos && (
              <KpiLaserOverlay kpi={laserKpi} markerPos={markerScreenPos} viewportRef={viewportRef} />
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
          {positionIntel && (
            <div style={{ padding: "20px 16px", fontFamily: "'Inter', system-ui, sans-serif" }}>
              {/* Health Pulse */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 8 }}>Health Pulse</div>
                <div style={{
                  fontSize: 44, fontWeight: 200, letterSpacing: "-0.02em",
                  color: positionIntel.healthScore >= 70 ? "#34d399" : positionIntel.healthScore >= 40 ? "#fbbf24" : "#f87171",
                }}>{positionIntel.healthScore}</div>
                <div style={{ fontSize: 10, color: "rgba(200,220,240,0.35)", marginTop: 2 }}>/ 100</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
                  <span style={{ fontSize: 10, color: "#34d399" }}>{positionIntel.healthCounts.strong} strong</span>
                  <span style={{ fontSize: 10, color: "#fbbf24" }}>{positionIntel.healthCounts.watch} watch</span>
                  <span style={{ fontSize: 10, color: "#f87171" }}>{positionIntel.healthCounts.critical} critical</span>
                </div>
              </div>

              {/* Survival Probability */}
              <div style={{ padding: "14px", background: "rgba(15,25,45,0.5)", border: "1px solid rgba(34,211,238,0.06)", borderRadius: 8, marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.4)", marginBottom: 6 }}>12-Month Survival</div>
                <div style={{
                  fontSize: 32, fontWeight: 300,
                  color: positionIntel.survivalProbability >= 70 ? "#34d399" : positionIntel.survivalProbability >= 40 ? "#fbbf24" : "#f87171",
                }}>{positionIntel.survivalProbability}%</div>
                <div style={{ fontSize: 10, color: "rgba(200,220,240,0.3)", marginTop: 4 }}>probability of sustained operation</div>
              </div>

              {/* Cliff Detector */}
              <div style={{ padding: "14px", background: "rgba(15,25,45,0.5)", border: `1px solid ${positionIntel.cliff ? "rgba(248,113,113,0.15)" : "rgba(34,211,238,0.06)"}`, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: positionIntel.cliff ? "#f87171" : "rgba(34,211,238,0.4)", marginBottom: 6 }}>Cliff Detector</div>
                {positionIntel.cliff ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171", marginBottom: 4 }}>
                      Month {positionIntel.cliff.month}: {KPI_ZONE_MAP[positionIntel.cliff.kpi].label}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(200,220,240,0.4)", lineHeight: 1.5 }}>
                      At current trajectory, {KPI_ZONE_MAP[positionIntel.cliff.kpi].label.toLowerCase()} hits critical threshold in {positionIntel.cliff.month} month{positionIntel.cliff.month !== 1 ? "s" : ""}.
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "#34d399" }}>No critical cliffs detected in 12-month projection</div>
                )}
              </div>

              {/* Critical Zones */}
              {positionIntel.criticalZones.length > 0 && (
                <div style={{ padding: "14px", background: "rgba(15,25,45,0.5)", border: "1px solid rgba(248,113,113,0.1)", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f87171", marginBottom: 8 }}>Zones Requiring Attention</div>
                  {positionIntel.criticalZones.map((z) => (
                    <div key={z} style={{ padding: "6px 0", fontSize: 12, color: "rgba(200,220,240,0.6)", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", flexShrink: 0 }} />
                      {z}
                    </div>
                  ))}
                </div>
              )}

              {/* Network Intelligence - Benchmark */}
              <div style={{ marginTop: 20, padding: "14px", background: "rgba(15,25,45,0.5)", border: "1px solid rgba(34,211,238,0.06)", borderRadius: 8 }}>
                <BenchmarkPanel kpis={liveKpis!} compact />
              </div>

              {/* Probability Overview */}
              <div style={{ marginTop: 20 }}>
                <ProbabilitySummaryCard
                  metrics={[
                    { label: "Survival Probability", value: `${positionIntel.survivalProbability}%`, probability: positionIntel.survivalProbability },
                    { label: "Runway Risk", value: positionIntel.cliff ? `Month ${positionIntel.cliff.month}` : "Low", probability: positionIntel.cliff ? Math.max(10, 100 - positionIntel.survivalProbability) : 15 },
                    // TODO: EBITDA Positive Probability — requires Monte Carlo engine
                    // TODO: Enterprise Value Target Probability — requires Monte Carlo engine
                  ]}
                  simulationCount={simRunCount > 0 ? simRunCount : undefined}
                  modelConfidence={positionIntel.healthScore >= 60 ? "High" : positionIntel.healthScore >= 35 ? "Medium" : "Low"}
                  dataCompleteness={`${positionIntel.dataCompletenessPct}%`}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <SimulationDisclaimerBar variant="compact" />
              </div>

              {/* What-If CTA */}
              <div
                style={{
                  marginTop: 24,
                  padding: "22px 20px",
                  background: "rgba(8, 20, 38, 0.82)",
                  border: "1px solid rgba(54, 226, 255, 0.28)",
                  boxShadow: "0 0 24px rgba(0, 200, 255, 0.16)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 16,
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 10 }}>
                  Strategic Simulation
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#dff8ff", lineHeight: 1.3, marginBottom: 8 }}>
                  Test a Strategic Move
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(220, 240, 255, 0.82)", marginBottom: 18 }}>
                  Simulate a business decision using the What-If engine and see how the terrain responds before you commit.
                </div>
                <button
                  onClick={() => navigate(ROUTES.WHAT_IF)}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    background: "linear-gradient(90deg, #2ce3ff, #00bcd4)",
                    color: "#06202b",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.04em",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    boxShadow: "0 0 18px rgba(0, 200, 255, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.03)"
                    e.currentTarget.style.boxShadow = "0 0 28px rgba(0, 200, 255, 0.5)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)"
                    e.currentTarget.style.boxShadow = "0 0 18px rgba(0, 200, 255, 0.35)"
                  }}
                >
                  Open What-If Simulator
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
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

      {intelligenceText && <IntelligenceConsole insightText={intelligenceText} />}
    </div>
  )
}
