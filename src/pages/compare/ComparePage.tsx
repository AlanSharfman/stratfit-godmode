// src/pages/compare/ComparePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Page (Phase D1 — God Mode)
//
// Split-screen synchronized terrain comparison.
// Left = Baseline (A). Right = Scenario (B).
// No delta heatmap. No third terrain. No camera drift.
// No simulation rerun on compare. Engine results read-only.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo } from "react"
import { Link, NavLink } from "react-router-dom"

import { ROUTES } from "@/routes/routeContract"
import { useBaselineStore } from "@/state/baselineStore"
import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import { usePhase1ScenarioStore, type SimulationKpis } from "@/state/phase1ScenarioStore"
import { useCompareStore } from "@/store/compareStore"
import { deriveTerrainMetrics, type TerrainMetrics } from "@/terrain/terrainFromBaseline"

import SplitTerrainView from "@/components/terrain/compare/SplitTerrainView"
import DeltaSummaryPanel from "@/components/compare/DeltaSummaryPanel"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"

/* ── Component ───────────────────────────────────────────── */

export default function ComparePage() {
  const baseline = useCanonicalBaseline()
  const baselineHydrated = useBaselineStore((s) => s.isHydrated)
  const baselineInputs = useBaselineStore((s) => s.baselineInputs)
  const hydrateBaseline = useBaselineStore((s) => s.hydrate)

  const hydrateScenarios = usePhase1ScenarioStore((s) => s.hydrate)
  const scenarioStoreHydrated = usePhase1ScenarioStore((s) => s.isHydrated)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)

  const { aId, bId, setAId, setBId, swap } = useCompareStore()

  // ── Hydrate stores ──
  useEffect(() => { hydrateBaseline() }, [hydrateBaseline])
  useEffect(() => { hydrateScenarios() }, [hydrateScenarios])

  // ── Default B to active scenario on first mount ──
  useEffect(() => {
    if (bId === null && activeScenarioId) {
      setBId(activeScenarioId)
    }
  }, [bId, activeScenarioId, setBId])

  // ── Completed scenarios for dropdowns ──
  const completedScenarios = useMemo(
    () => scenarios.filter((s) => s.status === "complete" && s.simulationResults),
    [scenarios],
  )

  // ── Resolve sides ──
  const scenarioA = useMemo(
    () => (aId ? scenarios.find((s) => s.id === aId) ?? null : null),
    [aId, scenarios],
  )
  const scenarioB = useMemo(
    () => (bId ? scenarios.find((s) => s.id === bId) ?? null : null),
    [bId, scenarios],
  )

  // ── Terrain metrics A (baseline or scenario) ──
  const metricsA = useMemo<TerrainMetrics>(() => {
    if (scenarioA?.simulationResults?.terrainMetrics) {
      const em = scenarioA.simulationResults.terrainMetrics
      return {
        elevationScale: em.elevationScale,
        roughness: em.roughness,
        ridgeIntensity: em.ridgeIntensity,
        volatility: em.volatility,
        liquidityDepth: baselineInputs
          ? Math.min(
              ((Number(baselineInputs.cash) || 0) /
                (Number(baselineInputs.burnRate) || Number(baselineInputs.monthlyBurn) || 1)) / 12,
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
    // Raw baseline derivation
    if (baselineInputs) return deriveTerrainMetrics(baselineInputs as any)
    return { elevationScale: 1, roughness: 1, liquidityDepth: 1, growthSlope: 0, volatility: 0 }
  }, [scenarioA, baselineInputs])

  // ── Terrain metrics B (scenario) ──
  const metricsB = useMemo<TerrainMetrics>(() => {
    if (scenarioB?.simulationResults?.terrainMetrics) {
      const em = scenarioB.simulationResults.terrainMetrics
      return {
        elevationScale: em.elevationScale,
        roughness: em.roughness,
        ridgeIntensity: em.ridgeIntensity,
        volatility: em.volatility,
        liquidityDepth: baselineInputs
          ? Math.min(
              ((Number(baselineInputs.cash) || 0) /
                (Number(baselineInputs.burnRate) || Number(baselineInputs.monthlyBurn) || 1)) / 12,
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
    if (baselineInputs) return deriveTerrainMetrics(baselineInputs as any)
    return { elevationScale: 1, roughness: 1, liquidityDepth: 1, growthSlope: 0, volatility: 0 }
  }, [scenarioB, baselineInputs])

  // ── Events per side ──
  const eventsA = useMemo<TerrainEvent[]>(
    () => scenarioA?.simulationResults?.events ?? [],
    [scenarioA],
  )
  const eventsB = useMemo<TerrainEvent[]>(
    () => scenarioB?.simulationResults?.events ?? [],
    [scenarioB],
  )

  // ── KPIs for delta panel ──
  const kpisA = useMemo<SimulationKpis | null>(() => {
    if (scenarioA?.simulationResults?.kpis) return scenarioA.simulationResults.kpis
    // Derive "baseline KPIs" from raw baseline inputs
    if (baseline) {
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
  }, [scenarioA, baseline])

  const kpisB = useMemo<SimulationKpis | null>(
    () => scenarioB?.simulationResults?.kpis ?? null,
    [scenarioB],
  )

  // ── Labels ──
  const labelA = aId === null
    ? "BASELINE (A)"
    : `${(scenarioA?.decision ?? "Scenario").slice(0, 20)} (A)`
  const labelB = bId === null
    ? "BASELINE (B)"
    : `${(scenarioB?.decision ?? "Scenario").slice(0, 20)} (B)`

  // ── Headline ──
  const headline = useMemo(() => {
    if (!kpisA || !kpisB) return "Select two scenarios to compare."
    const revA = kpisA.revenue
    const revB = kpisB.revenue
    const pct = revA > 0 ? (((revB - revA) / revA) * 100).toFixed(1) : "0"
    const dir = revB >= revA ? "higher" : "lower"
    return `Scenario B projects ${Math.abs(Number(pct))}% ${dir} revenue than A.`
  }, [kpisA, kpisB])

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

      {/* ═══ TOP: Compare Header ═══ */}
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
          {/* Dropdown A */}
          <div style={S.selectorGroup}>
            <span style={S.selectorLabel}>A</span>
            <select
              value={aId ?? "__baseline__"}
              onChange={(e) => setAId(e.target.value === "__baseline__" ? null : e.target.value)}
              style={S.select}
            >
              <option value="__baseline__">Baseline</option>
              {completedScenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.decision.slice(0, 30)}
                </option>
              ))}
            </select>
          </div>

          {/* Swap */}
          <button type="button" onClick={swap} style={S.swapBtn} title="Swap A ↔ B">⇄</button>

          {/* Dropdown B */}
          <div style={S.selectorGroup}>
            <span style={S.selectorLabel}>B</span>
            <select
              value={bId ?? "__baseline__"}
              onChange={(e) => setBId(e.target.value === "__baseline__" ? null : e.target.value)}
              style={S.select}
            >
              <option value="__baseline__">Baseline</option>
              {completedScenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.decision.slice(0, 30)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── Headline strip ── */}
      <div style={S.headlineStrip}>
        <span style={S.headlineText}>{headline}</span>
      </div>

      {/* ═══ BODY — Split Terrain + Delta Rail ═══ */}
      <div style={S.body}>

        {/* ── CENTER: Split Terrain ── */}
        <main style={S.center}>
          <SplitTerrainView
            metricsA={metricsA}
            metricsB={metricsB}
            eventsA={eventsA}
            eventsB={eventsB}
            labelA={labelA}
            labelB={labelB}
          />
        </main>

        {/* ── RIGHT: Delta Summary ── */}
        <aside style={S.rightRail}>
          <DeltaSummaryPanel kpisA={kpisA} kpisB={kpisB} />
        </aside>

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
const MONO = "ui-monospace, 'JetBrains Mono', monospace"
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

  selectorGroup: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },

  selectorLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "rgba(148,180,214,0.5)",
  },

  select: {
    padding: "4px 8px",
    borderRadius: 4,
    border: GLASS_BORDER,
    background: "rgba(6,12,20,0.7)",
    color: "#e2e8f0",
    fontFamily: FONT,
    fontSize: 11,
    outline: "none",
    maxWidth: 160,
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

  /* ── Body ── */
  body: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    minHeight: 0,
    overflow: "hidden",
  },

  center: {
    gridColumn: 1,
    position: "relative" as const,
    minHeight: 0,
    overflow: "hidden",
    background: VOID,
  },

  rightRail: {
    gridColumn: 2,
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
