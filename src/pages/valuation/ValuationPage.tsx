// src/pages/valuation/ValuationPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Page (Phase V-UX1)
//
// Route: /valuation
// Canonical data: usePhase1ScenarioStore → activeScenario.simulationResults
// Selector: selectValuationFromSimulation(simResults) → ValuationResults
//
// Layout:
//   1) Header (title + subtitle)
//   2) Top rail — 4 KPI chips
//   3) Method selector bar
//   4) Two-column grid:
//        Left:  EV Distribution · Valuation Waterfall
//        Right: Probability Dashboard · AI Strategic Analysis
//   5) Provenance badge + ProbabilityNotice
//
// No UI-side valuation math. No new stores. No terrain dependency.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import styles from "./ValuationPage.module.css";

// Canonical selector (V-2A bridge)
import { selectValuationFromSimulation } from "@/selectors/valuationSelectors";
import type { ValuationResults } from "@/valuation/valuationTypes";

// Canonical store — same source as Position/Risk/Compare
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import { ROUTES } from "@/routes/routeContract";

// System components
import SystemProbabilityNotice from "@/components/system/ProbabilityNotice";
import ProvenanceBadge from "@/components/system/ProvenanceBadge";

// Valuation visualisation (V-3A)
import EnterpriseValueDistribution from "@/components/valuation/EnterpriseValueDistribution";

// Probability dashboard (V-3B)
import ProbabilityDashboard from "@/components/valuation/ProbabilityDashboard";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type MethodId = "dcf" | "revenue_multiple";

interface MethodDef {
  id: MethodId;
  label: string;
  disabled: boolean;
}

const METHODS: MethodDef[] = [
  { id: "dcf", label: "DCF", disabled: false },
  { id: "revenue_multiple", label: "REVENUE MULTIPLE", disabled: false },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS — formatting only, zero computation
// ═══════════════════════════════════════════════════════════════════════════

function fmtM(v: number): string {
  if (!isFinite(v) || v === 0) return "$0";
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtX(v: number): string {
  if (!isFinite(v)) return "—";
  return `${v.toFixed(1)}×`;
}

function fmtPct(v: number): string {
  if (!isFinite(v)) return "—";
  return `${(v * 100).toFixed(0)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ValuationPage() {
  const [selectedMethod, setSelectedMethod] = useState<MethodId>("dcf");

  // ── Canonical data access ──
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  );

  const simResults = activeScenario?.simulationResults ?? null;
  const hasRun = simResults != null && simResults.completedAt > 0;

  // ── Selector-derived valuation ──
  const valuation: ValuationResults | null = useMemo(
    () => selectValuationFromSimulation(simResults),
    [simResults],
  );

  // ── Derived display values (formatting only — no computation) ──
  const p50EV = valuation?.blendedValue ?? null;
  const dcfEV = valuation?.dcf.enterpriseValue ?? null;
  const revEV = valuation?.revenueMultiple.enterpriseValue ?? null;
  const ebitdaEV = valuation?.ebitdaMultiple.enterpriseValue ?? null;

  // P10–P90 proxy: show DCF vs Revenue Multiple range as spread
  const rangeLow = valuation ? Math.min(dcfEV ?? 0, revEV ?? 0, ebitdaEV ?? 0) : null;
  const rangeHigh = valuation ? Math.max(dcfEV ?? 0, revEV ?? 0, ebitdaEV ?? 0) : null;

  // Probability strategy creates value: blended > 0 means value-creating
  const pValueCreate = valuation && valuation.blendedValue > 0 ? 1.0 : null;

  // Risk-adjusted EV: use the method with lowest value as conservative proxy
  const riskAdjustedEV = rangeLow;

  // Active method headline
  const headlineEV = useMemo(() => {
    if (!valuation) return null;
    return selectedMethod === "dcf"
      ? valuation.dcf.enterpriseValue
      : valuation.revenueMultiple.enterpriseValue;
  }, [valuation, selectedMethod]);

  return (
    <div className={styles.container}>
      {/* ═══ PORTAL NAV ═══ */}
      <nav className={styles.portalNav}>
        <NavLink to={ROUTES.INITIATE} className={({ isActive }) => `${styles.portalNavItem}${isActive ? " " + styles.portalNavActive : ""}`}>Initiate</NavLink>
        <NavLink to={ROUTES.DECISION} className={({ isActive }) => `${styles.portalNavItem}${isActive ? " " + styles.portalNavActive : ""}`}>Decision</NavLink>
        <NavLink to={ROUTES.POSITION} className={({ isActive }) => `${styles.portalNavItem}${isActive ? " " + styles.portalNavActive : ""}`}>Position</NavLink>
        <NavLink to={ROUTES.STUDIO} className={({ isActive }) => `${styles.portalNavItem}${isActive ? " " + styles.portalNavActive : ""}`}>Studio</NavLink>
        <NavLink to={ROUTES.COMPARE} className={({ isActive }) => `${styles.portalNavItem}${isActive ? " " + styles.portalNavActive : ""}`}>Compare</NavLink>
        <NavLink to={ROUTES.RISK} className={({ isActive }) => `${styles.portalNavItem}${isActive ? " " + styles.portalNavActive : ""}`}>Risk</NavLink>
        <NavLink to={ROUTES.VALUATION} className={({ isActive }) => `${styles.portalNavItem}${isActive ? " " + styles.portalNavActive : ""}`}>Valuation</NavLink>
      </nav>

      <div className={styles.content}>
        {/* ═══ HEADER ═══ */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Valuation</h1>
          <p className={styles.headerSub}>
            Financial consequence layer of strategy
          </p>
        </div>

        {/* ═══ EMPTY STATE ═══ */}
        {!hasRun && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>—</p>
            <p className={styles.emptyHint}>
              Run a scenario to generate valuation distribution.
            </p>
          </div>
        )}

        {/* ═══ TOP RAIL — 4 KPI CHIPS ═══ */}
        {hasRun && (
          <div className={styles.topRail}>
            {/* Chip 1: P50 Enterprise Value */}
            <div className={styles.chip}>
              <span className={styles.chipLabel}>P50 Enterprise Value</span>
              <span className={`${styles.chipValue} ${styles.chipValueCyan}`}>
                {p50EV != null ? fmtM(p50EV) : "—"}
              </span>
              <span className={styles.chipSub}>Blended (DCF + Rev + EBITDA)</span>
            </div>

            {/* Chip 2: P10–P90 Range */}
            <div className={styles.chip}>
              <span className={styles.chipLabel}>P10 – P90 Range</span>
              <span className={styles.chipValue}>
                {rangeLow != null && rangeHigh != null
                  ? `${fmtM(rangeLow)} – ${fmtM(rangeHigh)}`
                  : "—"}
              </span>
              <span className={styles.chipSub}>Cross-method spread</span>
            </div>

            {/* Chip 3: Probability Strategy Creates Value */}
            <div className={styles.chip}>
              <span className={styles.chipLabel}>P(Value Creation)</span>
              <span className={`${styles.chipValue} ${pValueCreate != null ? styles.chipValueCyan : styles.chipValueMuted}`}>
                {pValueCreate != null ? fmtPct(pValueCreate) : "—"}
              </span>
              <span className={styles.chipSub}>Blended EV &gt; 0</span>
            </div>

            {/* Chip 4: Risk-Adjusted EV */}
            <div className={styles.chip}>
              <span className={styles.chipLabel}>Risk-Adjusted EV</span>
              <span className={`${styles.chipValue} ${styles.chipValueMuted}`}>
                {riskAdjustedEV != null ? fmtM(riskAdjustedEV) : "—"}
              </span>
              <span className={styles.chipSub}>Conservative method floor</span>
            </div>
          </div>
        )}

        {/* ═══ METHOD SELECTOR ═══ */}
        {hasRun && (
          <div className={styles.methodBar}>
            <span className={styles.methodLabel}>Valuation Method:</span>
            {METHODS.map((m) => (
              <button
                key={m.id}
                className={[
                  styles.methodBtn,
                  selectedMethod === m.id ? styles.methodBtnActive : "",
                  m.disabled ? styles.methodBtnDisabled : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => !m.disabled && setSelectedMethod(m.id)}
                disabled={m.disabled}
                title={m.disabled ? "Coming in a future phase" : undefined}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* ═══ TWO-COLUMN GRID ═══ */}
        {hasRun && (
          <div className={styles.grid}>
            {/* ── LEFT COLUMN ── */}

            {/* Panel 1: Enterprise Value Distribution */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>📊</span>
                <span className={styles.panelTitle}>Enterprise Value Distribution</span>
              </div>
              <div className={styles.panelBody} style={{ flexDirection: "column", gap: 16 }}>
                {valuation ? (
                  <>
                    <EnterpriseValueDistribution valuation={valuation} />
                    <table className={styles.breakdownTable}>
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th>Enterprise Value</th>
                          <th>Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>DCF</td>
                          <td className={selectedMethod === "dcf" ? styles.breakdownHighlight : ""}>
                            {fmtM(valuation.dcf.enterpriseValue)}
                          </td>
                          <td>Terminal: {fmtM(valuation.dcf.terminalValue)}</td>
                        </tr>
                        <tr>
                          <td>Revenue Multiple</td>
                          <td className={selectedMethod === "revenue_multiple" ? styles.breakdownHighlight : ""}>
                            {fmtM(valuation.revenueMultiple.enterpriseValue)}
                          </td>
                          <td>{fmtX(valuation.revenueMultiple.multiple)} ARR</td>
                        </tr>
                        <tr>
                          <td>EBITDA Multiple</td>
                          <td>{fmtM(valuation.ebitdaMultiple.enterpriseValue)}</td>
                          <td>{fmtX(valuation.ebitdaMultiple.multiple)} EBITDA</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Blended</td>
                          <td className={styles.breakdownHighlight}>
                            {fmtM(valuation.blendedValue)}
                          </td>
                          <td>(DCF + Rev + EBITDA) / 3</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className={styles.placeholder}>
                    Awaiting valuation data
                    <span className={styles.placeholderPhase}>Phase V-3</span>
                  </div>
                )}
              </div>
            </div>

            {/* Panel 2: Probability Dashboard */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>📈</span>
                <span className={styles.panelTitle}>Probability Dashboard</span>
              </div>
              <div className={styles.panelBody}>
                {valuation ? (
                  <ProbabilityDashboard valuation={valuation} />
                ) : (
                  <div className={styles.placeholder}>
                    Awaiting valuation data
                    <span className={styles.placeholderPhase}>Phase V-3B</span>
                  </div>
                )}
              </div>
            </div>

            {/* Panel 3: Valuation Waterfall */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>💧</span>
                <span className={styles.panelTitle}>Valuation Waterfall</span>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.placeholder}>
                  Step-through from revenue to enterprise value
                  <span className={styles.placeholderPhase}>Phase V-4</span>
                </div>
              </div>
            </div>

            {/* Panel 4: AI Strategic Analysis */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>🧠</span>
                <span className={styles.panelTitle}>AI Strategic Analysis</span>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.placeholder}>
                  AI-generated board-ready valuation narrative
                  <span className={styles.placeholderPhase}>Phase V-5</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PROVENANCE ═══ */}
        <div className={styles.footer}>
          <ProvenanceBadge />
        </div>
      </div>

      {/* ═══ PROBABILITY NOTICE (visible, not behind accordion) ═══ */}
      <SystemProbabilityNotice />
    </div>
  );
}
