import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import PageShell from "@/components/nav/PageShell"
import CommandCenterSliderDeck, {
  type CommandCenterSliderSection,
  type CommandCenterSliderTooltip,
} from "@/components/ui/CommandCenterSliderDeck"
import TerrainZoneLegend from "@/components/terrain/TerrainZoneLegend"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { LEVER_DEFS } from "@/logic/leverTaxonomy"
import {
  usePhase1ScenarioStore,
  type SimulationKpis,
  type Phase1Scenario,
} from "@/state/phase1ScenarioStore"
import { runSimulation } from "@/engine/simulationService"

const STUDIO_LEVER_GROUPS = [
  { id: "growth", title: "Growth Vector", leverIds: ["demandStrength", "pricingPower", "expansionVelocity"] },
  { id: "efficiency", title: "Operational Engine", leverIds: ["costDiscipline", "hiringIntensity", "operatingDrag"] },
  { id: "risk", title: "Risk Pressure", leverIds: ["marketVolatility", "executionRisk"] },
] as const

type StudioLeverId = (typeof STUDIO_LEVER_GROUPS)[number]["leverIds"][number]
type StudioLeverState = Record<StudioLeverId, number>

const LEVER_DEFAULTS = LEVER_DEFS.reduce<Record<string, number>>((acc, lever) => {
  acc[lever.id] = lever.defaultValue
  return acc
}, {})

const STUDIO_DEFAULT_LEVERS: StudioLeverState = {
  demandStrength: LEVER_DEFAULTS.demandStrength ?? 60,
  pricingPower: LEVER_DEFAULTS.pricingPower ?? 50,
  expansionVelocity: LEVER_DEFAULTS.expansionVelocity ?? 45,
  costDiscipline: LEVER_DEFAULTS.costDiscipline ?? 55,
  hiringIntensity: LEVER_DEFAULTS.hiringIntensity ?? 40,
  operatingDrag: LEVER_DEFAULTS.operatingDrag ?? 35,
  marketVolatility: LEVER_DEFAULTS.marketVolatility ?? 30,
  executionRisk: LEVER_DEFAULTS.executionRisk ?? 25,
}

const STUDIO_TOOLTIP_COPY: Record<StudioLeverId, CommandCenterSliderTooltip> = {
  demandStrength: {
    description: "Strength of market pull, inbound demand, and product-market fit momentum.",
    impact: "Higher = faster revenue expansion and stronger trajectory lift.",
  },
  pricingPower: {
    description: "Ability to hold price, expand margin, and resist discount pressure in-market.",
    impact: "Higher = better gross margin and stronger monetization leverage.",
  },
  expansionVelocity: {
    description: "Speed of entering new markets, launching products, and scaling teams.",
    impact: "Higher = faster growth, more burn, higher execution load.",
  },
  costDiscipline: {
    description: "Tightness of operating control, spend management, and budget enforcement.",
    impact: "Higher = lower burn, steadier runway, more resilient execution.",
  },
  hiringIntensity: {
    description: "Rate of team expansion, recruiting pressure, and organisational ramp.",
    impact: "Higher = more capacity, more burn, more coordination load.",
  },
  operatingDrag: {
    description: "Friction from process overhead, delivery complexity, and structural inefficiency.",
    impact: "Higher = slower execution, weaker efficiency, more pressure on outcomes.",
  },
  marketVolatility: {
    description: "External instability from market shifts, customer caution, and competitive pressure.",
    impact: "Higher = wider downside range and lower confidence in the path.",
  },
  executionRisk: {
    description: "Likelihood of internal misses from capability gaps, sequencing issues, or delivery fragility.",
    impact: "Higher = more variance, weaker resilience, and more operational pressure.",
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function shift(levers: StudioLeverState, id: StudioLeverId) {
  return (levers[id] - STUDIO_DEFAULT_LEVERS[id]) / 50
}

function buildStudioKpis(baseKpis: PositionKpis, levers: StudioLeverState): PositionKpis {
  const demand = shift(levers, "demandStrength")
  const pricing = shift(levers, "pricingPower")
  const expansion = shift(levers, "expansionVelocity")
  const cost = shift(levers, "costDiscipline")
  const hiring = shift(levers, "hiringIntensity")
  const drag = shift(levers, "operatingDrag")
  const volatility = shift(levers, "marketVolatility")
  const execution = shift(levers, "executionRisk")

  const growthRatePct = clamp(
    baseKpis.growthRatePct
      + demand * 14
      + pricing * 4
      + expansion * 12
      - volatility * 8
      - execution * 6
      - drag * 4
      + hiring * 2,
    0,
    100,
  )

  const grossMarginPct = clamp(
    baseKpis.grossMarginPct
      + pricing * 10
      + cost * 12
      - drag * 10
      - volatility * 4
      - hiring * 3,
    0,
    100,
  )

  const arrMultiplier = clamp(
    1
      + demand * 0.28
      + pricing * 0.16
      + expansion * 0.12
      - volatility * 0.08
      - execution * 0.05,
    0.45,
    1.9,
  )
  const arr = Math.max(0, baseKpis.arr * arrMultiplier)
  const revenueMonthly = arr / 12

  const burnMonthly = Math.max(
    0,
    baseKpis.burnMonthly
      * clamp(
        1
          + expansion * 0.25
          + hiring * 0.28
          + execution * 0.08
          + volatility * 0.05
          - cost * 0.18
          - pricing * 0.06,
        0.45,
        1.95,
      ),
  )

  const cashOnHand = Math.max(
    0,
    baseKpis.cashOnHand + (arr - baseKpis.arr) * 0.18 - (burnMonthly - baseKpis.burnMonthly) * 6,
  )
  const runwayMonths = burnMonthly > 0 ? cashOnHand / burnMonthly : 999
  const riskIndex = clamp(
    baseKpis.riskIndex
      + demand * 6
      + pricing * 4
      + expansion * 4
      + cost * 14
      - hiring * 6
      - drag * 8
      - volatility * 18
      - execution * 20,
    0,
    100,
  )
  const churnPct = clamp(
    baseKpis.churnPct + volatility * 2.5 + execution * 1.8 + drag * 1.5 - demand * 1.2 - pricing * 0.5,
    0,
    100,
  )
  const headcount = Math.max(1, Math.round(baseKpis.headcount * clamp(1 + hiring * 0.25 + expansion * 0.08 - cost * 0.04, 0.6, 1.8)))
  const nrrPct = clamp(baseKpis.nrrPct + demand * 10 + pricing * 6 + expansion * 8 - volatility * 4 - execution * 5, 0, 200)
  const ebitdaMonthly = revenueMonthly * (grossMarginPct / 100) - burnMonthly
  const valuationMultiple = clamp(3 + growthRatePct / 10 + pricing * 1.5 + demand * 1.2 - volatility * 1.5 - execution * 1.3, 1, 20)
  const valuationEstimate = arr * valuationMultiple
  const survivalScore = clamp(Math.round(riskIndex * 0.65 + (Math.min(runwayMonths, 24) / 24) * 35), 0, 100)
  const efficiencyRatio = headcount > 0 ? arr / headcount : 0

  return {
    ...baseKpis,
    arr,
    burnMonthly,
    runwayMonths,
    ebitdaMonthly,
    riskIndex,
    cashOnHand,
    revenueMonthly,
    survivalScore,
    grossMarginPct,
    valuationEstimate,
    growthRatePct,
    churnPct,
    headcount,
    nrrPct,
    efficiencyRatio,
  }
}

/* ── Deterministic string hash (djb2) ── */
function hashStr(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return h >>> 0
}

/* ── Human-readable lever change summary ── */
function buildLeverSummary(levers: StudioLeverState): string {
  const active = (Object.entries(levers) as [StudioLeverId, number][])
    .filter(([id, v]) => Math.abs(v - STUDIO_DEFAULT_LEVERS[id]) > 5)
    .map(([id, v]) => {
      const dir = v > STUDIO_DEFAULT_LEVERS[id] ? "↑" : "↓"
      const def = LEVER_DEFS.find((l) => l.id === id)
      return `${def?.label ?? id} ${dir}`
    })
  return active.length > 0 ? `Studio: ${active.join(", ")}` : "Studio: Baseline configuration"
}

function buildStudioSections(levers: StudioLeverState): CommandCenterSliderSection[] {
  return STUDIO_LEVER_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    sliders: group.leverIds.map((leverId) => {
      const definition = LEVER_DEFS.find((lever) => lever.id === leverId)
      return {
        id: leverId,
        label: definition?.label ?? leverId,
        value: levers[leverId],
        min: 0,
        max: 100,
        step: 1,
        format: (value: number) => `${Math.round(value)}%`,
        tooltip: STUDIO_TOOLTIP_COPY[leverId],
      }
    }),
  }))
}

export default function StudioPage() {
  const { baseline } = useSystemBaseline()

  // ── Canonical store ──────────────────────────────────────────────────────
  const upsertScenario  = usePhase1ScenarioStore((s) => s.upsertScenario)
  const setActiveScenId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)
  const scenarios        = usePhase1ScenarioStore((s) => s.scenarios)
  const activeScenario   = useMemo(
    () => (activeScenarioId ? scenarios.find((s) => s.id === activeScenarioId) ?? null : null),
    [activeScenarioId, scenarios],
  )

  // ── Stable session ID — re-use existing studio session when navigating back ──
  // Uses Zustand .getState() in IIFE (valid outside React; runs once at ref init).
  const studioSessionId = useRef<string>(
    (() => {
      const aid = usePhase1ScenarioStore.getState().activeScenarioId
      return aid?.startsWith("studio_") ? aid : `studio_${Date.now()}`
    })(),
  )

  // ── Lever state — hydrated from active studio scenario on mount ──────────
  const [levers, setLevers] = useState<StudioLeverState>(() => {
    const aid = usePhase1ScenarioStore.getState().activeScenarioId
    if (!aid?.startsWith("studio_")) return STUDIO_DEFAULT_LEVERS
    const sc = usePhase1ScenarioStore.getState().scenarios.find((s) => s.id === aid)
    if (!sc?.leverValues) return STUDIO_DEFAULT_LEVERS
    const lv = sc.leverValues
    const merged: StudioLeverState = { ...STUDIO_DEFAULT_LEVERS }
    for (const key of Object.keys(STUDIO_DEFAULT_LEVERS) as StudioLeverId[]) {
      if (typeof lv[key] === "number") merged[key] = lv[key]
    }
    return merged
  })

  const baseKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])
  const sections = useMemo(() => buildStudioSections(levers), [levers])

  const setLever = useCallback((leverId: StudioLeverId, value: number) => {
    setLevers((prev) => ({ ...prev, [leverId]: value }))
  }, [])

  const modifiedKpis = useMemo<PositionKpis | null>(() => {
    if (!baseKpis) return null
    return buildStudioKpis(baseKpis, levers)
  }, [baseKpis, levers])

  const hasChanges = useMemo(
    () => Object.entries(levers).some(([leverId, value]) => value !== STUDIO_DEFAULT_LEVERS[leverId as StudioLeverId]),
    [levers],
  )

  // ── Bridge: lever changes → canonical scenario store ─────────────────────
  // Fires on every lever movement. Keeps phase1ScenarioStore in sync so
  // Position, Compare, and Boardroom all reflect live Studio adjustments.
  useEffect(() => {
    if (!modifiedKpis || !hasChanges) return

    const safeDiv = (a: number, b: number) => (b > 0.0001 ? a / b : 1)

    const simKpis: SimulationKpis = {
      cash:        modifiedKpis.cashOnHand,
      monthlyBurn: modifiedKpis.burnMonthly,
      revenue:     modifiedKpis.revenueMonthly,
      grossMargin: modifiedKpis.grossMarginPct / 100,
      growthRate:  modifiedKpis.growthRatePct  / 100,
      churnRate:   modifiedKpis.churnPct       / 100,
      headcount:   modifiedKpis.headcount,
      arpa:        baseline?.operating?.acv ?? 0,
      runway:      modifiedKpis.runwayMonths,
    }

    const scenario: Phase1Scenario = {
      id:          studioSessionId.current,
      createdAt:   Date.now(),
      decision:    buildLeverSummary(levers),
      status:      "complete",
      leverValues: { ...levers },
      simulationResults: {
        completedAt:   Date.now(),
        horizonMonths: 24,
        summary:       buildLeverSummary(levers),
        kpis:          simKpis,
        terrain: {
          seed: hashStr(studioSessionId.current),
          multipliers: {
            cash:   safeDiv(modifiedKpis.cashOnHand,    baseKpis!.cashOnHand),
            burn:   safeDiv(modifiedKpis.burnMonthly,   baseKpis!.burnMonthly),
            growth: safeDiv(modifiedKpis.growthRatePct, baseKpis!.growthRatePct),
          },
        },
      },
    }

    upsertScenario(scenario)
    setActiveScenId(studioSessionId.current)
    // Compute forward projections after KPIs are written to the store.
    runSimulation(studioSessionId.current)
  }, [modifiedKpis, hasChanges, levers, baseline, baseKpis, upsertScenario, setActiveScenId])

  const resetAll = useCallback(() => {
    setLevers({ ...STUDIO_DEFAULT_LEVERS })
    // Deactivate the studio scenario — leave it in history but stop driving downstream pages
    if (usePhase1ScenarioStore.getState().activeScenarioId === studioSessionId.current) {
      setActiveScenId(null)
    }
  }, [setActiveScenId])

  const saveAsScenario = useCallback(() => {
    if (!modifiedKpis || !hasChanges) return
    const name = prompt("Name this scenario:")
    if (!name?.trim()) return

    const safeDiv = (a: number, b: number) => (b > 0.0001 ? a / b : 1)
    const savedId = `studio_saved_${Date.now()}`

    const simKpis: SimulationKpis = {
      cash:        modifiedKpis.cashOnHand,
      monthlyBurn: modifiedKpis.burnMonthly,
      revenue:     modifiedKpis.revenueMonthly,
      grossMargin: modifiedKpis.grossMarginPct / 100,
      growthRate:  modifiedKpis.growthRatePct  / 100,
      churnRate:   modifiedKpis.churnPct       / 100,
      headcount:   modifiedKpis.headcount,
      arpa:        baseline?.operating?.acv ?? 0,
      runway:      modifiedKpis.runwayMonths,
    }

    const saved: Phase1Scenario = {
      id:          savedId,
      createdAt:   Date.now(),
      decision:    name.trim(),
      status:      "complete",
      leverValues: { ...levers },
      simulationResults: {
        completedAt:   Date.now(),
        horizonMonths: 24,
        summary:       `${name.trim()} — ${buildLeverSummary(levers)}`,
        kpis:          simKpis,
        terrain: {
          seed: hashStr(savedId),
          multipliers: {
            cash:   safeDiv(modifiedKpis.cashOnHand,    baseKpis!.cashOnHand),
            burn:   safeDiv(modifiedKpis.burnMonthly,   baseKpis!.burnMonthly),
            growth: safeDiv(modifiedKpis.growthRatePct, baseKpis!.growthRatePct),
          },
        },
      },
    }

    upsertScenario(saved)
    // Saved scenario becomes the new active; update session ID so edits continue against it
    studioSessionId.current = savedId
    setActiveScenId(savedId)
  }, [modifiedKpis, hasChanges, levers, baseline, baseKpis, upsertScenario, setActiveScenId])

  const healthChanges = useMemo(() => {
    if (!baseKpis || !modifiedKpis) return []
    return KPI_KEYS.map((kpi) => {
      const before = getHealthLevel(kpi, baseKpis)
      const after = getHealthLevel(kpi, modifiedKpis)
      return { kpi, before, after, changed: before !== after }
    })
  }, [baseKpis, modifiedKpis])

  if (!baseKpis) {
    return <PageShell><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(200,220,240,0.3)", fontSize: 14 }}>Complete initiation to use the studio</div></PageShell>
  }

  return (
    <PageShell>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: 392, flexShrink: 0, overflow: "hidden", padding: "18px 14px", background: "rgba(12,20,34,0.52)", borderRight: "1px solid rgba(34,211,238,0.06)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 6 }}>Scenario Intelligence</div>
          <div style={{ fontSize: 11, color: "rgba(200,220,240,0.28)", marginBottom: 18, lineHeight: 1.5 }}>
            Adjust the strategic levers and watch the terrain and zone health recalibrate in real time.
          </div>

          <div style={{ height: "calc(100% - 92px)", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <CommandCenterSliderDeck
              sections={sections}
              onSliderChange={(sliderId, value) => setLever(sliderId as StudioLeverId, value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={resetAll}
              style={{
                flex: 1, padding: "10px 0", background: "rgba(15,25,45,0.5)", border: "1px solid rgba(34,211,238,0.08)",
                borderRadius: 6, color: "rgba(200,220,240,0.5)", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              }}
            >Reset</button>
            <button
              onClick={saveAsScenario}
              disabled={!hasChanges}
              style={{
                flex: 1, padding: "10px 0",
                background: hasChanges ? "rgba(34,211,238,0.08)" : "rgba(15,25,45,0.3)",
                border: `1px solid ${hasChanges ? "rgba(34,211,238,0.2)" : "rgba(34,211,238,0.04)"}`,
                borderRadius: 6, color: hasChanges ? "#22d3ee" : "rgba(200,220,240,0.2)",
                fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: hasChanges ? "pointer" : "not-allowed",
              }}
            >Save Scenario</button>
          </div>
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "absolute", top: 10, left: 14, zIndex: 10, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
            background: "rgba(12,20,34,0.85)",
            color: hasChanges ? "#22d3ee" : "rgba(200,220,240,0.4)",
            border: `1px solid ${hasChanges ? "rgba(34,211,238,0.2)" : "rgba(200,220,240,0.08)"}`,
          }}>
            {hasChanges ? "LIVE RESPONSE" : "BASELINE"}
          </div>
          <TerrainStage
            progressive
            revealedKpis={revealedKpis}
            focusedKpi={null}
            zoneKpis={modifiedKpis}
            cameraPreset={POSITION_PROGRESSIVE_PRESET}
            autoRotateSpeed={0.2}
            showDependencyLines={hasChanges}
            hideMarkers
            heatmapEnabled={false}
          >
            <SkyAtmosphere />
          </TerrainStage>
          <TerrainZoneLegend kpis={modifiedKpis} revealedKpis={revealedKpis} focusedKpi={null} compact />
        </div>

        <div style={{ width: 260, flexShrink: 0, overflow: "auto", padding: "20px 14px", background: "rgba(12,20,34,0.5)", borderLeft: "1px solid rgba(34,211,238,0.04)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.45)", marginBottom: 14 }}>Zone Health</div>
          {healthChanges.map(({ kpi, before, after, changed }) => {
            const colorMap: Record<string, string> = { critical: "#6E5BFF", watch: "#9DB7D1", healthy: "#21D4FD", strong: "#B7FF3C" }
            return (
              <div key={kpi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 11, color: "rgba(200,220,240,0.5)" }}>{KPI_ZONE_MAP[kpi].label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: colorMap[before], textTransform: "uppercase" }}>{before}</span>
                  {changed ? (
                    <>
                      <span style={{ fontSize: 10, color: "rgba(200,220,240,0.2)" }}>→</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: colorMap[after], textTransform: "uppercase" }}>{after}</span>
                    </>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}