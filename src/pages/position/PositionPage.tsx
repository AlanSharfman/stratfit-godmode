import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Link, NavLink } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"

import { ROUTES } from "@/routes/routeContract"

import TerrainStage from "@/terrain/TerrainStage"
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import TerrainTuningPanel from "@/terrain/TerrainTuningPanel"
import TerrainNavWidget from "@/terrain/TerrainNavWidget"
import { DEFAULT_TUNING } from "@/terrain/terrainTuning"
import type { TerrainTuningParams } from "@/terrain/terrainTuning"
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
import CommandGlassPanel from "@/components/intelligence/CommandGlassPanel"
import { useIntelligencePresentation } from "@/hooks/useIntelligencePresentation"
import SimulationContextHUD from "@/components/position/SimulationContextHUD"
import KPIHealthRail from "@/components/kpi/KPIHealthRail"
import ProbabilityBand from "@/components/position/ProbabilityBand"
import BiasVectorBar from "@/components/position/BiasVectorBar"
import ExecutiveSummaryBar from "@/components/position/ExecutiveSummaryBar"
import { computePositionInstruments } from "@/components/position/computePositionInstruments"
import ScenarioContextPanel from "@/components/scenario/ScenarioContextPanel"
import SimulationStatusWidget from "@/components/system/SimulationStatusWidget"
import SimulationRunOverlay from "@/components/system/SimulationRunOverlay"
import SimulationPipelineWidget from "@/components/system/SimulationPipelineWidget"
import SystemProbabilityNotice from "@/components/system/ProbabilityNotice"
import { selectKpis } from "@/selectors/kpiSelectors"
import { selectTerrainMetrics } from "@/selectors/terrainSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"
import { useSelectSimulationKpis } from "@/selectors/simulationKpiSelector"
// ExecutiveNarrativeCard removed — intelligence rendered via CommandGlassPanel
import IdleMotionLayer from "./IdleMotionLayer"
import HorizonPulse from "@/components/terrain/overlays/HorizonPulse"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import {
  buildPositionViewModel,
} from "./overlays/positionState"

import PositionDebugHUD from "@/components/debug/PositionDebugHUD"
import { useDebugFlags } from "@/debug/debugSignals"
import { useCommandAutoEvaluate } from "@/hooks/useCommandAutoEvaluate"
import { useCommandStore } from "@/store/commandStore"
import CommandModeStrip from "@/components/command/CommandModeStrip"
import HeatmapOverlay from "@/components/command/HeatmapOverlay"
import CodeOverlay from "@/components/command/CodeOverlay"
import { selectTerrainEvents } from "@/selectors/terrainSelectors"
import { selectPrimarySignal } from "@/domain/intelligence/selectPrimarySignal"
import { buildTerrainExplanation } from "@/domain/intelligence/buildTerrainExplanation"
import { useIntelligenceStore } from "@/store/intelligenceStore"
import InsightTetherOverlay from "@/components/terrain/intelligence/InsightTetherOverlay"
import { eventToFocusPosition } from "@/domain/intelligence/eventFocus"
import LegendMini from "@/components/terrain/ui/LegendMini"
import TerrainRenderContractPanel from "@/components/debug/TerrainRenderContractPanel"
import { buildRenderContract } from "@/domain/terrain/buildRenderContract"
import { POSITION_PRESET } from "@/scene/camera/terrainCameraPresets"
import RiskIntelligencePanel from "@/components/Risk/RiskIntelligencePanel"
import ProvenanceBadge from "@/components/system/ProvenanceBadge"
import styles from "./PositionOverlays.module.css"

// Diagnostics panel is togglable via close button

/** Treat an SHL weight > 0 as "on" */
function shlIsOn(weight: number): boolean {
  return weight > 0
}

export default function PositionPage() {
  const navigate = useNavigate()
  const [granularity] = useState<TimeGranularity>("quarter")
  const [rippleKey, setRippleKey] = useState(0)
  const [commandCentreOpen, setCommandCentreOpen] = useState(true)
  const [terrainTuning, setTerrainTuning] = useState<TerrainTuningParams>({ ...DEFAULT_TUNING })
  const viewportRef = useRef<HTMLDivElement>(null)
  const insightScrollRef = useRef<HTMLDivElement>(null)
  const [userScrolling, setUserScrolling] = useState(false)
  const reducedMotion = useReducedMotion()
  const { debugHud } = useDebugFlags()

  /* ── Slide overlay state machine ──
     States: hidden → sliding-in → visible → typewriting → dwelling → sliding-out → hidden
     The overlay DOM is always mounted; visibility is controlled by CSS classes.
  */
  const [overlayVisible, setOverlayVisible] = useState(false)    // CSS slide-in class
  const [overlayMounted, setOverlayMounted] = useState(false)     // DOM mount
  const [overlayStrobe, setOverlayStrobe] = useState(false)       // Bezel strobe
  const [typewriterDone, setTypewriterDone] = useState(false)     // Typewriter finished
  const [overlayUserDismissed, setOverlayUserDismissed] = useState(false) // User manually closed
  const overlayUserDismissedRef = useRef(false) // Ref mirror for closure-safe reads
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const strobeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // ── Cinematic intelligence presentation state machine ──
  // IMPORTANT: Use || (not ??) so the `completedAt: 0` sentinel during "running"
  // status is treated as null.  Only a real timestamp triggers the cascade.
  // Without this, the overlay fires twice: once at 0, again at Date.now().
  const simulationCompletedAt = activeScenario?.simulationResults?.completedAt || null
  const presentation = useIntelligencePresentation({ completedAt: simulationCompletedAt })

  // ── Slide overlay helpers ──
  const clearSlideTimers = useCallback(() => {
    if (slideTimerRef.current) { clearTimeout(slideTimerRef.current); slideTimerRef.current = null }
    if (dwellTimerRef.current) { clearTimeout(dwellTimerRef.current); dwellTimerRef.current = null }
    if (strobeTimerRef.current) { clearTimeout(strobeTimerRef.current); strobeTimerRef.current = null }
  }, [])

  /** Slide the overlay OUT (visible on terrain) */
  const slideOverlayIn = useCallback(() => {
    clearSlideTimers()
    setOverlayUserDismissed(false)
    overlayUserDismissedRef.current = false
    setOverlayMounted(true)
    setTypewriterDone(false)
    // Trigger slide-in on next frame so the DOM is mounted first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOverlayVisible(true)
        setOverlayStrobe(true)
        // Remove strobe class after animation finishes (2.4s)
        strobeTimerRef.current = setTimeout(() => setOverlayStrobe(false), 2500)
      })
    })
  }, [clearSlideTimers])

  /** Slide the overlay BACK into the rail */
  const slideOverlayOut = useCallback(() => {
    clearSlideTimers()
    setOverlayVisible(false)
    setOverlayStrobe(false)
    // After CSS transition completes (1.2s), unmount
    slideTimerRef.current = setTimeout(() => {
      setOverlayMounted(false)
      setTypewriterDone(false)
    }, 1400)
  }, [clearSlideTimers])

  /** User manually opens overlay */
  const handleOverlayOpen = useCallback(() => {
    setOverlayUserDismissed(false)
    slideOverlayIn()
  }, [slideOverlayIn])

  /** User manually dismisses overlay */
  const handleOverlayDismiss = useCallback(() => {
    setOverlayUserDismissed(true)
    overlayUserDismissedRef.current = true
    slideOverlayOut()
  }, [slideOverlayOut])

  // Auto-open: 4 seconds after simulation completes (terrain settle)
  const lastAutoOpenRef = useRef<number | null>(null)

  useEffect(() => {
    if (simulationCompletedAt != null && simulationCompletedAt !== lastAutoOpenRef.current) {
      lastAutoOpenRef.current = simulationCompletedAt
      const openTimer = setTimeout(() => {
        // Read from ref (not stale closure) so a dismiss during the 4s delay is respected
        if (!overlayUserDismissedRef.current) {
          slideOverlayIn()
        }
      }, 4_000)
      return () => clearTimeout(openTimer)
    }
  }, [simulationCompletedAt, slideOverlayIn])

  // Dwell timer: 15 seconds after typewriter finishes → slide back
  useEffect(() => {
    if (typewriterDone && overlayVisible) {
      dwellTimerRef.current = setTimeout(() => {
        slideOverlayOut()
      }, 15_000)
      return () => {
        if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current)
      }
    }
  }, [typewriterDone, overlayVisible, slideOverlayOut])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearSlideTimers()
  }, [clearSlideTimers])

  // ── Follow-tail scroll — smooth scrollTo on simulation completion only ──
  // NOT on every re-render. Respects user manual scrolling.
  useEffect(() => {
    if (!overlayVisible) return
    const el = insightScrollRef.current
    if (!el) return

    // Reset user-scrolling flag when overlay opens
    setUserScrolling(false)

    const BOTTOM_THRESHOLD = 40
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD
      if (!atBottom) {
        setUserScrolling(true)
      }
    }

    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [overlayVisible])

  // Auto-scroll to bottom ONLY when a new simulation completes
  useEffect(() => {
    if (!simulationCompletedAt || !overlayVisible || userScrolling) return
    const el = insightScrollRef.current
    if (!el) return
    // Small delay to let content render
    const t = setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    }, 300)
    return () => clearTimeout(t)
  }, [simulationCompletedAt, overlayVisible, userScrolling])

  // ── Intelligence panel keyboard shortcut (I key) ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "i" || e.key === "I") {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return
        e.preventDefault()
        if (overlayVisible) {
          handleOverlayDismiss()
        } else {
          handleOverlayOpen()
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [overlayVisible, handleOverlayDismiss, handleOverlayOpen])

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

    // PRIORITY 2: Scenario has engine-computed terrainMetrics → use directly & lock
    const engineMetrics = activeScenario?.simulationResults?.terrainMetrics
    if (
      activeScenarioId &&
      (activeScenario?.status === "running" || activeScenario?.status === "complete") &&
      engineMetrics
    ) {
      // Merge engine metrics into full TerrainMetrics shape (supply defaults for legacy fields)
      const metrics: TerrainMetrics = Object.freeze({
        elevationScale: engineMetrics.elevationScale,
        roughness: engineMetrics.roughness,
        ridgeIntensity: engineMetrics.ridgeIntensity,
        volatility: engineMetrics.volatility,
        // Legacy fields — computed from baseline as fallback
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

    // PRIORITY 3 (legacy): Scenario has multipliers but no engine metrics → derive via heuristic
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

    // PRIORITY 4: No scenario → derive from raw baseline
    return effectiveInputs ? deriveTerrainMetrics(effectiveInputs as any) : undefined
  }, [activeScenarioId, activeScenario?.status, activeScenario?.simulationResults?.terrainMetrics, effectiveInputs])

  // DEV: log terrain source + selector proof + runId consistency once per scenario transition
  useEffect(() => {
    if (import.meta.env.DEV) {
      const simResults = activeScenario?.simulationResults ?? null
      const terrainData = selectTerrainMetrics(simResults)
      const simKpis = selectKpis(simResults?.kpis ?? null)
      const risk = selectRiskScore(simResults?.kpis ?? null, engineRunId)
      const runId = simResults?.completedAt ?? null

      // Quick hash for verification (djb2)
      const quickHash = (obj: unknown): string => {
        const s = JSON.stringify(obj)
        let h = 5381
        for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
        return (h >>> 0).toString(16).padStart(8, "0")
      }


    }
  }, [activeScenarioId, activeScenario?.status, activeScenario?.simulationResults, terrainMetrics])

  // ── Engine run id (when available) for risk selector wiring ──
  const engineRunId = activeScenario?.status === "complete"
    ? activeScenario.simulationResults?.completedAt?.toString()
    : undefined

  // ── Command Centre Auto-Evaluate ──
  const activeSimResults = activeScenario?.simulationResults ?? null
  useCommandAutoEvaluate(activeSimResults)
  const commandMode = useCommandStore((s) => s.currentMode)
  const riskScoreForOverlays = selectRiskScore(activeSimResults?.kpis ?? null, engineRunId)

  // ── A10.1: Primary terrain event + explanation ──
  const terrainEvents = useMemo(
    () => selectTerrainEvents(activeSimResults),
    [activeSimResults],
  )
  const primaryEvent = useMemo(
    () => selectPrimarySignal(terrainEvents),
    [terrainEvents],
  )
  const terrainExplanation = useMemo(() => {
    if (!primaryEvent) return null
    return buildTerrainExplanation({
      event: primaryEvent,
      monthLabel: (m: number) => `Month ${m + 1}`,
    })
  }, [primaryEvent])

  // ── A10.2: Event-locked intelligence mode ──
  const lockedEventId = useIntelligenceStore((s) => s.lockedEventId)
  const setLockedEventId = useIntelligenceStore((s) => s.setLockedEventId)

  // Resolve locked event from terrain events list
  const lockedEvent = useMemo(() => {
    if (!lockedEventId) return null
    return terrainEvents.find((e) => e.id === lockedEventId) ?? null
  }, [lockedEventId, terrainEvents])

  // Build explanation for locked event
  const lockedExplanation = useMemo(() => {
    if (!lockedEvent) return null
    return buildTerrainExplanation({
      event: lockedEvent,
      monthLabel: (m: number) => `Month ${m + 1}`,
    })
  }, [lockedEvent])

  // Display event = locked event (if valid) or auto primary
  const displayEvent = lockedEvent ?? primaryEvent
  const displayExplanation = lockedEvent ? lockedExplanation : terrainExplanation

  // ── A11: Render Contract (debug panel) ──
  const renderContract = useMemo(
    () =>
      buildRenderContract({
        engineResults: activeSimResults ?? undefined,
        completedAt: activeScenario?.simulationResults?.completedAt ?? null,
        eventCount: terrainEvents.length,
        hasTerrainMetrics: !!terrainMetrics,
        layers: {
          terrainMesh: true,
          p50Path: true,       // A12: always mounted
          signals: true,       // always mounted
          focusGlow: !!displayEvent,
          tether: !!displayEvent && overlayVisible,
          heatmap: commandMode === "heatmap",
          annotations: false,
          legend: true,        // A14.3: always mounted
        },
        mode: commandMode,
        toggles: {
          heatmapEnabled: commandMode === "heatmap",
          overlayVisible,
        },
        camera: {
          pos: POSITION_PRESET.pos,
          target: POSITION_PRESET.target,
          fov: POSITION_PRESET.fov,
        },
      }),
    [activeSimResults, activeScenario?.simulationResults?.completedAt, terrainEvents.length, terrainMetrics, displayEvent, overlayVisible, commandMode],
  )

  // A10.2.5: Scroll to top when lockedEventId changes
  useEffect(() => {
    if (lockedEventId !== null) {
      const el = insightScrollRef.current
      if (el) el.scrollTo({ top: 0, behavior: "smooth" })
      setUserScrolling(false) // re-enable auto-scroll when unlocked
    }
  }, [lockedEventId])

  // V1 baseline from context — fallback for KPIs only when NO scenario is active.
  const { baseline: baselineV1 } = useSystemBaseline()

  const vm = useMemo(() => {
    if (!baselineV1) return null
    return buildPositionViewModel(baselineV1, { riskIndexFromEngine: null })
  }, [baselineV1])

  // ── Live KPIs: simulation selector (single source), baseline fallback ──
  const simKpis = useSelectSimulationKpis()
  const liveKpis = useMemo(() => simKpis ?? vm?.kpis ?? null, [simKpis, vm?.kpis])

  // ── C+ Instrument precomputation (deterministic, no math in components) ──
  const baselineKpisForInstruments = useMemo(() => {
    if (!baseline) return null
    const bl = baseline as Record<string, unknown>
    return {
      cash: Number(bl.cash) || 0,
      monthlyBurn: Number(bl.monthlyBurn) || Number(bl.burnRate) || 0,
      revenue: Number(bl.revenue) || 0,
      grossMargin: Number(bl.grossMargin) || 0.5,
      growthRate: Number(bl.growthRate) || 0,
      churnRate: Number(bl.churnRate) || 0,
      headcount: Number(bl.headcount) || 0,
      arpa: Number(bl.arpa) || 0,
      runway: null as number | null,
    }
  }, [baseline])

  const instruments = useMemo(() => {
    const scenarioKpis = activeScenario?.simulationResults?.kpis
    if (!scenarioKpis) return null
    return computePositionInstruments(scenarioKpis, baselineKpisForInstruments)
  }, [activeScenario?.simulationResults?.kpis, baselineKpisForInstruments])

  // DEV: KPI wiring proof — confirms liveKpis source switches on simulation complete
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const source = (activeScenario?.status === "complete" && activeScenario.simulationResults?.kpis)
      ? "SIMULATION"
      : "BASELINE"

  }, [liveKpis, activeScenario?.status, activeScenario?.simulationResults])

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
  }, []) // mount-once: self-contained animation cycle, no external deps

  const handleVideoToggle = useCallback(() => {
    const next = !videoActive
    setVideoActive(next)
    if (next) {
      videoEverOpened.current = true
      setVideoPulsing(false)
    }
  }, [videoActive])

  // ── Auto-activation: once per simulation run, only turns ON, respects manual overrides ──
  // Tracks which layers the user has manually toggled off after auto-enable.
  const userTouchedRef = useRef<Set<string>>(new Set())
  const lastAutoRunRef = useRef<number | null>(null)

  // Wrap toggle handlers to record manual user touches
  const makeTrackedToggle = useCallback(
    (id: string, baseFn: () => void) => () => {
      userTouchedRef.current.add(id)
      baseFn()
    },
    [],
  )

  const makeTrackedShlToggle = useCallback(
    (id: string, key: SemanticLayerKey) => (next: boolean) => {
      userTouchedRef.current.add(id)
      setWeight(key, next ? DEFAULT_SHL_WEIGHTS[key] : 0)
    },
    [setWeight],
  )

  const trackedToggleHeatmap = useCallback(() => {
    userTouchedRef.current.add("heatMap")
    toggleHeatmap()
  }, [toggleHeatmap])

  // Auto-activation effect — fires once per completed simulation run
  useEffect(() => {
    if (!activeScenario || activeScenario.status !== "complete") return
    const completedAt = activeScenario.simulationResults?.completedAt
    if (!completedAt) return
    if (lastAutoRunRef.current === completedAt) return // already processed
    lastAutoRunRef.current = completedAt

    const simKpisRaw = activeScenario.simulationResults?.kpis
    if (!simKpisRaw) return

    // Read KPIs through canonical selector — selector-only access contract
    const autoKpis = selectKpis(simKpisRaw)
    const touched = userTouchedRef.current

    // Heat Map is user-opt-in only — no auto-enable
    const runway = autoKpis?.runwayMonths ?? null
    const runwayLow = runway !== null && runway < 12

    // Auto-enable Risk Field when downside dominates
    if (runwayLow && !touched.has("riskField") && !shlIsOn(shlWeights.risk)) {
      setWeight("risk", DEFAULT_SHL_WEIGHTS.risk)
    }

    // Auto-enable Diverge when scenario spread exists (scenario completed = spread available)
    if (!touched.has("diverge") && !shlIsOn(shlWeights.divergence)) {
      setWeight("divergence", DEFAULT_SHL_WEIGHTS.divergence)
    }

    // Auto-enable Confidence when data completeness is Low
    if (vm && vm.confidenceBand === "Low" && !touched.has("confidence") && !shlIsOn(shlWeights.confidence)) {
      setWeight("confidence", DEFAULT_SHL_WEIGHTS.confidence)
    }
  }, [
    activeScenario?.status,
    activeScenario?.simulationResults?.completedAt,
    activeScenario?.simulationResults?.kpis,
    vm?.confidenceBand,
  ]) // setWeight/shlWeights/shlIsOn omitted: stable Zustand selectors + setter

  // ── Diagnostic Groups (MODE / PRIMARY INSIGHT / SECONDARY) ──
  const diagnosticGroups = [
    {
      heading: "MODE",
      items: [
        {
          id: "liveVideo",
          label: "VIDEO",
          value: videoActive,
          onChange: handleVideoToggle,
          className: videoActive ? "videoOn" : (videoPulsing ? "videoPulse" : "videoItem"),
        },
      ],
    },
    {
      heading: "PRIMARY INSIGHT",
      items: [
        { id: "heatMap", label: "Heat Map", value: heatmapEnabled, onChange: trackedToggleHeatmap },
        { id: "riskField", label: "Risk Field", value: shlIsOn(shlWeights.risk), onChange: makeTrackedShlToggle("riskField", "risk") },
        { id: "confidence", label: "Confidence", value: shlIsOn(shlWeights.confidence), onChange: makeTrackedShlToggle("confidence", "confidence") },
      ],
    },
    {
      heading: "SECONDARY",
      items: [
        { id: "markers", label: "Markers", value: renderFlags.showMarkers, onChange: makeTrackedToggle("markers", () => renderFlags.toggle("showMarkers")) },
        { id: "flow", label: "Flow", value: shlIsOn(shlWeights.flow), onChange: makeTrackedShlToggle("flow", "flow") },
        { id: "diverge", label: "Diverge", value: shlIsOn(shlWeights.divergence), onChange: makeTrackedShlToggle("diverge", "divergence") },
        { id: "envelope", label: "Envelope", value: renderFlags.showEnvelope, onChange: makeTrackedToggle("envelope", () => renderFlags.toggle("showEnvelope")) },
        { id: "annotations", label: "Annotations", value: renderFlags.showAnnotations, onChange: makeTrackedToggle("annotations", () => renderFlags.toggle("showAnnotations")) },
        { id: "resonance", label: "Resonance", value: shlIsOn(shlWeights.resonance), onChange: makeTrackedShlToggle("resonance", "resonance") },
        { id: "topo", label: "Topo", value: shlIsOn(shlWeights.topography), onChange: makeTrackedShlToggle("topo", "topography") },
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

      {/* Simulation engine overlays */}
      <SimulationStatusWidget />
      <SimulationRunOverlay />
      <SimulationPipelineWidget />

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
          {/* Executive Summary Bar — tone-aware, top of rail */}
          {instruments && (
            <div className={styles.execSummaryDock}>
              <ExecutiveSummaryBar {...instruments.summary} />
            </div>
          )}

          {/* Logo lockup */}
          <Link to={ROUTES.POSITION} className={styles.logoLockup}>
            <img src="/stratfit-logo.png" alt="STRATFIT" className={styles.logoImg} />
            <div>
              <div className={styles.logoName}>STRATFIT</div>
              <div className={styles.logoSub}>SCENARIO INTELLIGENCE</div>
            </div>
          </Link>

          {/* KPI instruments — grouped health rail */}
          <div className={styles.kpiRailDock} aria-label="KPI Health Rail">
            <KPIHealthRail kpis={liveKpis} />

            {/* C+ Probability Bands — instrument gauges */}
            {instruments && (
              <div className={styles.instrumentDock}>
                {instruments.bands.map((band) => (
                  <ProbabilityBand key={band.metric} {...band} />
                ))}
                <BiasVectorBar {...instruments.bias} />
              </div>
            )}
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
            <NavLink to={ROUTES.DECISION} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Decision</NavLink>
            <NavLink to={ROUTES.STUDIO} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Studio</NavLink>
            <NavLink to={ROUTES.COMPARE} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Compare</NavLink>
            <NavLink to={ROUTES.RISK} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Risk</NavLink>
            <NavLink to={ROUTES.VALUATION} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Valuation</NavLink>
            <NavLink to={ROUTES.COMMAND} className={({ isActive }) => `${styles.pageNavItem}${isActive ? " " + styles.pageNavActive : ""}`}>Command Centre</NavLink>
          </nav>

          {/* Terrain canvas — fills available space */}
          <div ref={viewportRef} className={styles.terrainViewport} aria-label="Position terrain" style={{ position: "relative" }}>
            <TerrainStage
              pathsEnabled={true}
              focusedEvent={displayEvent}
              heatmapEnabled={heatmapEnabled || commandMode === "heatmap"}
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
            {/* ── HUD: Simulation context pill — transparent glass matching insight overlay ── */}
            <SimulationContextHUD
              riskTone={vm?.stateTone ?? "watch"}
              riskLabel={vm?.state ?? "Assessing"}
              simulationStatus={activeScenario?.status ?? "draft"}
              completedAt={activeScenario?.simulationResults?.completedAt ?? null}
              insightText={vm?.bullets?.[0] ?? ""}
              runKey={activeScenario?.simulationResults?.completedAt ?? null}
            />
            {/* ── Horizon Pulse — simulation completion flash ── */}
            <HorizonPulse
              triggerKey={activeScenario?.simulationResults?.completedAt ?? null}
              disabled={reducedMotion}
            />
            {/* ── Command Mode overlays ── */}
            <HeatmapOverlay
              terrainMetrics={terrainMetrics ?? null}
              riskScore={riskScoreForOverlays}
              visible={commandMode === "heatmap"}
            />
            <CodeOverlay
              kpis={activeSimResults?.kpis ?? null}
              terrainMetrics={terrainMetrics ?? null}
              riskScore={riskScoreForOverlays}
              visible={commandMode === "code"}
            />
            {/* ── Command Mode Strip ── */}
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
              <CommandModeStrip engineResults={activeSimResults} />
            </div>
            {/* ── Insight Tether — subtle line from overlay title to terrain focus ── */}
            <InsightTetherOverlay
              focusWorldPosition={displayEvent ? eventToFocusPosition(displayEvent) : null}
              enabled={!!displayEvent && overlayVisible}
              viewportRef={viewportRef as React.RefObject<HTMLDivElement>}
            />
            {/* DEV: Simulation proof overlay — hidden for demo */}
            {/* <SimulationProofOverlay
              scenario={activeScenario ?? null}
              baselineSnapshotId={baseline ? `bl_${typeof baseline === "object" ? "active" : "none"}` : null}
            /> */}
            {/* A14.3: Always-visible mini legend */}
            <LegendMini />
            {/* A11: Render contract debug panel (?debug=1) */}
            <TerrainRenderContractPanel contract={renderContract} label="Position" />

          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT RAIL — Controls (Tuning, Toggles, Diagnostics)
            ══════════════════════════════════════════════════ */}
        <div className={styles.rightCol}>
          {/* Command Centre — above fold */}
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

          {/* ═══ Risk Intelligence Panel — Phase 300 ═══ */}
          <div className={styles.riskIntelDock} aria-label="Risk Intelligence">
            <RiskIntelligencePanel />
          </div>

          {/* Scenario Context + Cinematic Insights */}
          <div
            className={styles.baselineIntelDock}
            aria-label="Scenario Insights"
          >
              <ScenarioContextPanel />
              {/* INSIGHTS toggle — only when overlay not visible */}
              {!overlayVisible && !overlayMounted && (
                <button
                  type="button"
                  className={styles.intelToggle}
                  onClick={handleOverlayOpen}
                >
                {/* Bejeweled insight diamond icon */}
                <span className={styles.insightIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="url(#gemFill)" stroke="url(#gemStroke)" strokeWidth="1.5" />
                    <path d="M3 9H21" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                    <path d="M12 2L8 9L12 22L16 9L12 2Z" fill="rgba(255,255,255,0.08)" />
                    <defs>
                      <linearGradient id="gemFill" x1="12" y1="2" x2="12" y2="22">
                        <stop offset="0%" stopColor="rgba(0,255,255,0.35)" />
                        <stop offset="100%" stopColor="rgba(99,102,241,0.2)" />
                      </linearGradient>
                      <linearGradient id="gemStroke" x1="3" y1="2" x2="21" y2="22">
                        <stop offset="0%" stopColor="rgba(0,255,255,0.8)" />
                        <stop offset="100%" stopColor="rgba(99,102,241,0.6)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <span>INSIGHTS</span>
                <span className={styles.kbdHint}>I</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          INTELLIGENCE OVERLAY — Slides out from right rail over terrain
          4s after terrain → slide out → typewriter → 15s dwell → slide back
          ══════════════════════════════════════════════════ */}
      {overlayMounted && (
        <div
          className={[
            styles.insightOverlay,
            overlayVisible ? styles.insightSlideIn : "",
            overlayStrobe ? styles.insightStrobeBezel : "",
          ].filter(Boolean).join(" ")}
          aria-label="Intelligence Overlay"
          // User interaction resets dwell timer
          onMouseMove={overlayVisible ? () => {
            if (typewriterDone && dwellTimerRef.current) {
              clearTimeout(dwellTimerRef.current)
              dwellTimerRef.current = setTimeout(() => slideOverlayOut(), 15_000)
            }
          } : undefined}
        >
          <div ref={insightScrollRef} className={styles.insightScrollWrap}>
            <CommandGlassPanel
              phase={presentation.phase}
              onTypewriterComplete={() => {
                presentation.requestSettle()
                setTypewriterDone(true)
              }}
            />
            {/* ── A10.2: Terrain-bound intelligence — lock-aware ── */}
            {displayExplanation && (
              <div style={{
                marginTop: 16,
                padding: "14px 18px",
                background: lockedEventId
                  ? "rgba(0,229,255,0.06)"
                  : "rgba(0,229,255,0.04)",
                borderLeft: lockedEventId
                  ? "3px solid rgba(0,229,255,0.65)"
                  : "2px solid rgba(0,229,255,0.35)",
                borderRadius: 4,
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: "border-left 0.3s ease, background 0.3s ease",
              }}>
                {/* A10.2.7: Focused Signal header + Return to Auto */}
                {lockedEventId && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase" as const,
                      color: "rgba(0,229,255,0.7)",
                      background: "rgba(0,229,255,0.08)",
                      padding: "3px 8px",
                      borderRadius: 3,
                    }}>
                      FOCUSED SIGNAL
                    </span>
                    <button
                      type="button"
                      onClick={() => setLockedEventId(null)}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 3,
                        padding: "3px 10px",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.55)",
                        cursor: "pointer",
                        letterSpacing: "0.04em",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.12)" }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
                    >
                      Return to Auto
                    </button>
                  </div>
                )}
                <div
                  id="primary-insight-anchor"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: "rgba(0,229,255,0.85)",
                    marginBottom: 6,
                  }}
                >
                  {displayExplanation.title}
                </div>
                <div style={{
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.78)",
                  marginBottom: 8,
                }}>
                  {displayExplanation.body}
                </div>
                <div style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.38)",
                  fontStyle: "italic",
                }}>
                  {displayExplanation.footnote}
                </div>
              </div>
            )}
          </div>
          {/* Close button — bottom of overlay */}
          <button
            type="button"
            className={styles.intelCollapseBtn}
            onClick={handleOverlayDismiss}
            aria-label="Dismiss insights (I)"
          >
            <span>Dismiss</span>
            <span className={styles.kbdHint}>I</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          RE-OPEN TAB — Shows when overlay is hidden and user can re-open
          ══════════════════════════════════════════════════ */}
      {!overlayVisible && !overlayMounted && activeScenario?.status === "complete" && (
        <button
          type="button"
          className={styles.insightReopenTab}
          onClick={handleOverlayOpen}
          aria-label="Show Intelligence (I)"
        >
          <span className={styles.insightReopenChevron} aria-hidden="true">&#9664;</span>
          <span className={styles.insightReopenLabel}>INSIGHT</span>
        </button>
      )}

      {/* ══ Debug HUD — only when ?debugHud=1 (reactive) ══ */}
      {debugHud && <PositionDebugHUD />}

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
