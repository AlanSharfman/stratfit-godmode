// src/pages/compare/ComparePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Command Centre (Split ↔ Ghost Overlay)
//
// Top 60%:  Terrain area
//   Split mode  → side-by-side CompareTerrainPanels (2 or 3)
//   Ghost mode  → single canvas with translucent ghost overlays
// Bottom 40%: Analytics layer
//   Bottom-left  (60%): CompareTablePanel (KPI deltas)
//   Bottom-right (40%): CompareInsightPanel (AI narrative)
//
// Query params:  ?view=split|ghost  &n=2|3
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo } from "react"
import { Link, NavLink, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/routes/routeContract"
import { useBaselineStore } from "@/state/baselineStore"
import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import { usePhase1ScenarioStore, type SimulationKpis } from "@/state/phase1ScenarioStore"
import { useCompareStore, type ComparePair, type CompareViewMode } from "@/store/compareStore"
import { deriveTerrainMetrics, type TerrainMetrics } from "@/terrain/terrainFromBaseline"

import CompareTerrainArea from "@/components/compare/CompareTerrainArea"
import CompareGhostHeaderBar from "@/components/compare/CompareGhostHeaderBar"
import CompareTablePanel from "@/components/compare/CompareTablePanel"
import CompareInsightPanel from "@/components/compare/CompareInsightPanel"
import { type ScenarioOption } from "@/components/compare/CompareScenarioSelect"
import CommandModeStrip from "@/components/command/CommandModeStrip"
import { useCommandAutoEvaluate } from "@/hooks/useCommandAutoEvaluate"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"

/* ── Component ───────────────────────────────────────────── */

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const baseline = useCanonicalBaseline()
  const baselineHydrated = useBaselineStore((s) => s.isHydrated)
  const baselineInputs = useBaselineStore((s) => s.baselineInputs)
  const hydrateBaseline = useBaselineStore((s) => s.hydrate)

  const hydrateScenarios = usePhase1ScenarioStore((s) => s.hydrate)
  const scenarioStoreHydrated = usePhase1ScenarioStore((s) => s.isHydrated)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)

  const {
    aId, bId, cId,
    setAId, setBId, setCId,
    compareCount, setCompareCount,
    activePair, setActivePair,
    viewMode, setViewMode,
    swap, rotate,
  } = useCompareStore()

  const is3Mode = compareCount === 3

  // ── Sync query params → store on mount ──
  useEffect(() => {
    const qView = searchParams.get("view")
    if (qView === "split" || qView === "ghost") setViewMode(qView)
    const qN = searchParams.get("n")
    if (qN === "2") setCompareCount(2)
    else if (qN === "3") setCompareCount(3)
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync store → query params ──
  const syncParams = useCallback(
    (nextView: CompareViewMode, nextN: 2 | 3) => {
      setSearchParams(
        (prev) => {
          prev.set("view", nextView)
          prev.set("n", String(nextN))
          return prev
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    syncParams(viewMode, compareCount)
  }, [viewMode, compareCount, syncParams])

  // ── Hydrate stores ──
  useEffect(() => { hydrateBaseline() }, [hydrateBaseline])
  useEffect(() => { hydrateScenarios() }, [hydrateScenarios])

  // ── Default B to active scenario on first mount ──
  useEffect(() => {
    if (bId === null && activeScenarioId) setBId(activeScenarioId)
  }, [bId, activeScenarioId, setBId])

  // ── Completed scenarios for dropdowns ──
  const completedScenarios = useMemo(
    () => scenarios.filter((s) => s.status === "complete" && s.simulationResults),
    [scenarios],
  )

  const scenarioOptions = useMemo<ScenarioOption[]>(
    () => completedScenarios.map((s) => ({ id: s.id, label: s.decision.slice(0, 28) })),
    [completedScenarios],
  )

  // ── Resolve scenarios ──
  const scenarioA = useMemo(() => (aId ? scenarios.find((s) => s.id === aId) ?? null : null), [aId, scenarios])
  const scenarioB = useMemo(() => (bId ? scenarios.find((s) => s.id === bId) ?? null : null), [bId, scenarios])
  const scenarioC = useMemo(() => (cId ? scenarios.find((s) => s.id === cId) ?? null : null), [cId, scenarios])

  // ── Terrain metrics derivation helper ──
  function deriveMetrics(scenario: typeof scenarioA): TerrainMetrics {
    if (scenario?.simulationResults?.terrainMetrics) {
      const em = scenario.simulationResults.terrainMetrics
      return {
        elevationScale: em.elevationScale,
        roughness: em.roughness,
        ridgeIntensity: em.ridgeIntensity,
        volatility: em.volatility,
        liquidityDepth: baselineInputs
          ? Math.min(((Number(baselineInputs.cash) || 0) / (Number(baselineInputs.burnRate) || Number(baselineInputs.monthlyBurn) || 1)) / 12, 2)
          : 1,
        growthSlope: baselineInputs
          ? (Math.abs(Number(baselineInputs.growthRate) || 0) <= 1 ? Number(baselineInputs.growthRate) || 0 : (Number(baselineInputs.growthRate) || 0) / 100)
          : 0,
      }
    }
    if (baselineInputs) return deriveTerrainMetrics(baselineInputs as any)
    return { elevationScale: 1, roughness: 1, liquidityDepth: 1, growthSlope: 0, volatility: 0 }
  }

  const metricsA = useMemo(() => deriveMetrics(scenarioA), [scenarioA, baselineInputs])
  const metricsB = useMemo(() => deriveMetrics(scenarioB), [scenarioB, baselineInputs])
  const metricsC = useMemo(() => deriveMetrics(scenarioC), [scenarioC, baselineInputs])

  // ── Events ──
  const eventsA = useMemo<TerrainEvent[]>(() => scenarioA?.simulationResults?.events ?? [], [scenarioA])
  const eventsB = useMemo<TerrainEvent[]>(() => scenarioB?.simulationResults?.events ?? [], [scenarioB])
  const eventsC = useMemo<TerrainEvent[]>(() => scenarioC?.simulationResults?.events ?? [], [scenarioC])

  // ── KPIs ──
  function deriveKpis(scenario: typeof scenarioA): SimulationKpis | null {
    if (scenario?.simulationResults?.kpis) return scenario.simulationResults.kpis
    if (!scenario && baseline) {
      return {
        cash: baseline.cash,
        monthlyBurn: baseline.monthlyBurn,
        revenue: baseline.revenue,
        grossMargin: baseline.grossMargin,
        growthRate: baseline.growthRate,
        churnRate: baseline.churnRate,
        headcount: baseline.headcount,
        arpa: baseline.arpa,
        runway: baseline.monthlyBurn > 0 ? Math.round(baseline.cash / baseline.monthlyBurn) : null,
      }
    }
    return null
  }

  const kpisA = useMemo(() => deriveKpis(scenarioA), [scenarioA, baseline])
  const kpisB = useMemo(() => deriveKpis(scenarioB), [scenarioB, baseline])
  const kpisC = useMemo(() => deriveKpis(scenarioC), [scenarioC, baseline])

  // ── Labels ──
  const labelA = aId === null ? "Baseline" : (scenarioA?.decision ?? "Scenario").slice(0, 20)
  const labelB = bId === null ? "Baseline" : (scenarioB?.decision ?? "Scenario").slice(0, 20)
  const labelC = cId === null ? "Baseline" : (scenarioC?.decision ?? "Scenario").slice(0, 20)

  // ── Active pair KPIs (for analytics panels) ──
  const { pairKpisL, pairKpisR, pairLabelL, pairLabelR } = useMemo(() => {
    if (activePair === "AC") return { pairKpisL: kpisA, pairKpisR: kpisC, pairLabelL: labelA, pairLabelR: labelC }
    if (activePair === "BC") return { pairKpisL: kpisB, pairKpisR: kpisC, pairLabelL: labelB, pairLabelR: labelC }
    return { pairKpisL: kpisA, pairKpisR: kpisB, pairLabelL: labelA, pairLabelR: labelB }
  }, [activePair, kpisA, kpisB, kpisC, labelA, labelB, labelC])

  // ── Command Centre Auto-Evaluate ──
  const activeSimResults = scenarioB?.simulationResults ?? scenarioA?.simulationResults ?? null
  useCommandAutoEvaluate(activeSimResults)

  // ── Headline ──
  const headline = useMemo(() => {
    if (!pairKpisL || !pairKpisR) return "Select scenarios to compare."
    const revL = pairKpisL.revenue
    const revR = pairKpisR.revenue
    const pct = revL > 0 ? (((revR - revL) / revL) * 100).toFixed(1) : "0"
    const dir = revR >= revL ? "higher" : "lower"
    return `${pairLabelR} projects ${Math.abs(Number(pct))}% ${dir} revenue than ${pairLabelL}.`
  }, [pairKpisL, pairKpisR, pairLabelL, pairLabelR])

  // ── Available pairs ──
  const availablePairs: ComparePair[] = is3Mode ? ["AB", "AC", "BC"] : ["AB"]

  const isGhost = viewMode === "ghost"

  // ── Loading guards ──
  if (!scenarioStoreHydrated || !baselineHydrated) {
    return (
      <div style={S.loadingShell}>
        <div style={{ textAlign: "center" }}>
          <div style={S.spinner} />
          <span style={{ fontSize: 14, opacity: 0.6, color: "#e2e8f0" }}>Hydrating stores…</span>
          <style>{`@keyframes cmpSpin { to { transform: rotate(360deg) } }`}</style>
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
            Complete the Initiate step and run at least one scenario before using Compare.
          </p>
          <Link to={ROUTES.INITIATE} style={S.linkBtn}>Go to Initiate →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>

      {/* ═══ HEADER ═══ */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <Link to={ROUTES.POSITION} style={S.logoLink}>
            <span style={S.logoText}>STRATFIT</span>
            <span style={S.logoSub}>COMPARE</span>
          </Link>
        </div>

        <nav style={S.headerNav}>
          <NavLink to={ROUTES.INITIATE} style={S.navItem}>Initiate</NavLink>
          <NavLink to="/decision" style={S.navItem}>Decision</NavLink>
          <NavLink to={ROUTES.POSITION} style={S.navItem}>Position</NavLink>
          <NavLink to={ROUTES.STUDIO} style={S.navItem}>Studio</NavLink>
          <NavLink to={ROUTES.COMPARE} style={({ isActive }) => isActive ? S.navItemActive : S.navItem}>Compare</NavLink>
        </nav>

        <div style={S.headerRight}>
          {/* Split ↔ Ghost toggle */}
          <div style={S.viewToggle}>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              style={viewMode === "split" ? S.viewBtnActive : S.viewBtn}
              title="Split — side-by-side terrains"
            >Split</button>
            <button
              type="button"
              onClick={() => setViewMode("ghost")}
              style={viewMode === "ghost" ? S.viewBtnActive : S.viewBtn}
              title="Ghost — overlay terrains"
            >Ghost</button>
          </div>

          {/* 2/3 toggle */}
          <div style={S.countToggle}>
            <button
              type="button"
              onClick={() => setCompareCount(2)}
              style={compareCount === 2 ? S.countBtnActive : S.countBtn}
            >2</button>
            <button
              type="button"
              onClick={() => setCompareCount(3)}
              style={compareCount === 3 ? S.countBtnActive : S.countBtn}
            >3</button>
          </div>

          {/* Swap (2-mode) / Rotate (3-mode) — only in split view; ghost bar has its own */}
          {!isGhost && (
            is3Mode ? (
              <button type="button" onClick={rotate} style={S.swapBtn} title="Rotate A→B→C→A">↻</button>
            ) : (
              <button type="button" onClick={swap} style={S.swapBtn} title="Swap A ↔ B">⇄</button>
            )
          )}
        </div>
      </header>

      {/* ── Headline strip ── */}
      <div style={S.headlineStrip}>
        <span style={S.headlineText}>{headline}</span>
        {isGhost && (
          <span style={S.headlineBadge}>GHOST OVERLAY</span>
        )}
      </div>

      {/* ═══ MAIN GRID: Terrain (60%) + Analytics (40%) ═══ */}
      <div style={S.commandGrid}>

        {/* ── TOP: Terrain Area ── */}
        <div style={S.terrainRow}>
          {/* Ghost mode: compact header bar above canvas */}
          {isGhost && (
            <CompareGhostHeaderBar
              nScenarios={compareCount}
              activePair={activePair}
              selectedAId={aId}
              selectedBId={bId}
              selectedCId={cId}
              scenarioOptions={scenarioOptions}
              onSelectA={setAId}
              onSelectB={setBId}
              onSelectC={setCId}
              onPairChange={setActivePair}
              onSwap={swap}
              onRotate={rotate}
            />
          )}

          <CompareTerrainArea
            viewMode={viewMode}
            nScenarios={compareCount}
            activePair={activePair}
            selectedAId={aId}
            selectedBId={bId}
            selectedCId={cId}
            metricsA={metricsA}
            metricsB={metricsB}
            metricsC={metricsC}
            eventsA={eventsA}
            eventsB={eventsB}
            eventsC={eventsC}
            scenarioOptions={scenarioOptions}
            onSelectA={setAId}
            onSelectB={setBId}
            onSelectC={setCId}
          />
        </div>

        {/* ── BOTTOM: Analytics ── */}
        <div style={S.analyticsRow}>
          {/* Left 60%: Table */}
          <div style={S.analyticsLeft}>
            <CompareTablePanel
              kpisLeft={pairKpisL}
              kpisRight={pairKpisR}
              labelLeft={pairLabelL}
              labelRight={pairLabelR}
              activePair={activePair}
              is3Way={is3Mode}
              onPairChange={setActivePair}
            />
          </div>

          {/* Right 40%: AI Insights */}
          <div style={S.analyticsRight}>
            <CompareInsightPanel
              kpisA={pairKpisL}
              kpisB={pairKpisR}
              labelA={pairLabelL}
              labelB={pairLabelR}
              summaryA={activePair === "BC" ? scenarioB?.simulationResults?.summary : scenarioA?.simulationResults?.summary}
              summaryB={activePair === "AC" ? scenarioC?.simulationResults?.summary : activePair === "BC" ? scenarioC?.simulationResults?.summary : scenarioB?.simulationResults?.summary}
              activePair={activePair}
            />
          </div>
        </div>
      </div>

      {/* ── Command Mode Strip ── */}
      <div style={S.commandStrip}>
        <CommandModeStrip engineResults={activeSimResults} />
      </div>

      {/* Legal */}
      <div style={S.legal}>
        All projections, probabilities and scenario outcomes are generated by STRATFIT's Monte Carlo simulation engine and do not constitute financial advice.
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"
const CYAN = "rgba(34, 211, 238, 0.85)"
const CYAN_DIM = "rgba(34, 211, 238, 0.15)"
const GLASS_BORDER = "1px solid rgba(182, 228, 255, 0.1)"
const VOID = "#020814"

const S: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    background: `linear-gradient(180deg, ${VOID} 0%, #0a0e17 50%, #0f1520 100%)`,
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
    background: `linear-gradient(180deg, ${VOID} 0%, #0f1520 100%)`,
    color: "#e2e8f0",
    fontFamily: FONT,
  },

  spinner: {
    width: 24,
    height: 24,
    border: "2px solid rgba(34,211,238,0.3)",
    borderTopColor: "#22d3ee",
    borderRadius: "50%",
    animation: "cmpSpin 0.8s linear infinite",
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
    height: 48,
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
    gap: 16,
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

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  /* ── Split/Ghost view toggle ── */
  viewToggle: {
    display: "flex",
    gap: 0,
    borderRadius: 4,
    overflow: "hidden",
    border: GLASS_BORDER,
  },

  viewBtn: {
    padding: "4px 10px",
    border: "none",
    background: "rgba(0,0,0,0.3)",
    color: "rgba(148,180,214,0.5)",
    fontSize: 10,
    fontWeight: 600,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.06em",
    transition: "background 200ms ease, color 200ms ease",
    textTransform: "uppercase" as const,
  },

  viewBtnActive: {
    padding: "4px 10px",
    border: "none",
    background: "rgba(34,211,238,0.12)",
    color: CYAN,
    fontSize: 10,
    fontWeight: 800,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },

  countToggle: {
    display: "flex",
    gap: 0,
    borderRadius: 4,
    overflow: "hidden",
    border: GLASS_BORDER,
  },

  countBtn: {
    padding: "4px 12px",
    border: "none",
    background: "rgba(0,0,0,0.3)",
    color: "rgba(148,180,214,0.5)",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.06em",
    transition: "background 200ms ease, color 200ms ease",
  },

  countBtnActive: {
    padding: "4px 12px",
    border: "none",
    background: "rgba(34,211,238,0.12)",
    color: CYAN,
    fontSize: 11,
    fontWeight: 800,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.06em",
  },

  swapBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    border: `1px solid ${CYAN_DIM}`,
    background: "rgba(34,211,238,0.06)",
    color: CYAN,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: FONT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 200ms ease",
  },

  headlineStrip: {
    padding: "6px 20px",
    background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    flexShrink: 0,
  },

  headlineText: {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(148,180,214,0.55)",
    fontFamily: FONT,
    letterSpacing: "0.02em",
  },

  headlineBadge: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.16em",
    color: "rgba(129,140,248,0.7)",
    background: "rgba(129,140,248,0.08)",
    padding: "2px 8px",
    borderRadius: 3,
    marginLeft: 12,
    textTransform: "uppercase" as const,
  },

  /* ── Command Grid ── */
  commandGrid: {
    flex: 1,
    display: "grid",
    gridTemplateRows: "3fr 2fr",
    minHeight: 0,
    overflow: "hidden",
    gap: 2,
    padding: "2px",
  },

  terrainRow: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },

  analyticsRow: {
    display: "grid",
    gridTemplateColumns: "3fr 2fr",
    gap: 2,
    minHeight: 0,
    overflow: "hidden",
  },

  analyticsLeft: {
    minHeight: 0,
    overflow: "hidden",
  },

  analyticsRight: {
    minHeight: 0,
    overflow: "hidden",
  },

  commandStrip: {
    position: "absolute",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 6,
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
}
