// src/pages/valuation/ValuationPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Module Shell (Phase V-2A)
//
// Route: /valuation
// Canonical data: usePhase1ScenarioStore → activeScenario.simulationResults
//   (same path as Position, Risk, Compare)
// Selector: selectValuationFromSimulation(simResults) → ValuationResults
// No UI-side valuation math. No new stores. No terrain dependency.
// 7 placeholder sections — wired in subsequent phases.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import styles from "./ValuationPage.module.css";

// V-1 selector (V-2A canonical bridge)
import { selectValuationFromSimulation } from "@/selectors/valuationSelectors";
import type { ValuationResults } from "@/valuation/valuationTypes";

// Canonical store — same source as Position/Risk/Compare
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";

// System components (reuse existing)
import SystemProbabilityNotice from "@/components/system/ProbabilityNotice";
import ProvenanceBadge from "@/components/system/ProvenanceBadge";

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
// SECTION DEFINITIONS (7 placeholders)
// ═══════════════════════════════════════════════════════════════════════════

interface SectionDef {
  key: string;
  icon: string;
  title: string;
  phase: string;
  description: string;
  full?: boolean; // span full width
}

const SECTIONS: SectionDef[] = [
  {
    key: "ev-distribution",
    icon: "📊",
    title: "Enterprise Value Distribution",
    phase: "V-3",
    description: "Probability-weighted EV curve with p10–p90 bands",
  },
  {
    key: "driver-breakdown",
    icon: "🔧",
    title: "Value Driver Breakdown",
    phase: "V-3",
    description: "Decomposition of value by growth, margin, and risk factors",
  },
  {
    key: "scenario-comparison",
    icon: "⚖️",
    title: "Scenario Comparison",
    phase: "V-4",
    description: "Side-by-side valuation across saved scenarios",
  },
  {
    key: "methods",
    icon: "📐",
    title: "Methodology Detail",
    phase: "V-3",
    description: "DCF assumptions, revenue multiples, EBITDA multiples — full transparency",
    full: true,
  },
  {
    key: "spider",
    icon: "🕸️",
    title: "Driver Spider Chart",
    phase: "V-4",
    description: "Radar visualisation of key valuation drivers vs baseline",
  },
  {
    key: "narrative",
    icon: "📝",
    title: "Executive Narrative",
    phase: "V-5",
    description: "AI-generated board-ready valuation summary",
  },
  {
    key: "waterfall",
    icon: "💧",
    title: "Value Waterfall",
    phase: "V-4",
    description: "Step-through from revenue to enterprise value",
    full: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
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

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ValuationPage() {
  // ── Method selector state ──
  const [selectedMethod, setSelectedMethod] = useState<MethodId>("dcf");

  // ── Canonical data access (same path as Position/Risk/Compare) ──
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  );

  const simResults = activeScenario?.simulationResults ?? null;
  const hasRun = simResults != null && simResults.completedAt > 0;

  // ── Derive valuation via V-2A canonical bridge selector ──
  const valuation: ValuationResults | null = useMemo(
    () => selectValuationFromSimulation(simResults),
    [simResults],
  );

  // ── Active method EV for headline ──
  const headlineEV = useMemo(() => {
    if (!valuation) return 0;
    switch (selectedMethod) {
      case "dcf":
        return valuation.dcf.enterpriseValue;
      case "revenue_multiple":
        return valuation.revenueMultiple.enterpriseValue;
      default:
        return valuation.blendedValue;
    }
  }, [valuation, selectedMethod]);

  return (
    <div className={styles.container}>
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
          <div className={styles.headline}>
            <div className={styles.headlineLabel}>Enterprise Value</div>
            <div className={styles.headlineValue}>—</div>
            <div className={styles.headlineMeta}>
              <span className={styles.metaLabel}>
                Run a scenario to generate valuation distribution.
              </span>
            </div>
          </div>
        )}

        {/* ═══ HEADLINE VALUE (active run) ═══ */}
        {hasRun && valuation && (
          <div className={styles.headline}>
            <div className={styles.headlineLabel}>
              Enterprise Value ({selectedMethod === "dcf" ? "DCF" : "Revenue Multiple"})
            </div>
            <div className={styles.headlineValue}>
              {fmtM(headlineEV)}
            </div>
            <div className={styles.headlineMeta}>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>DCF</span>
                <span className={styles.metaValue}>{fmtM(valuation.dcf.enterpriseValue)}</span>
              </span>
              <span className={styles.metaSep} />
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>Rev Multiple</span>
                <span className={styles.metaValue}>
                  {fmtM(valuation.revenueMultiple.enterpriseValue)} ({fmtX(valuation.revenueMultiple.multiple)})
                </span>
              </span>
              <span className={styles.metaSep} />
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>EBITDA Multiple</span>
                <span className={styles.metaValue}>
                  {fmtM(valuation.ebitdaMultiple.enterpriseValue)} ({fmtX(valuation.ebitdaMultiple.multiple)})
                </span>
              </span>
              <span className={styles.metaSep} />
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>Blended</span>
                <span className={styles.metaValue}>{fmtM(valuation.blendedValue)}</span>
              </span>
            </div>
          </div>
        )}

        {/* ═══ METHOD SELECTOR ═══ */}
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

        {/* ═══ BREAKDOWN TABLE (live from V-1 engine via canonical bridge) ═══ */}
        {valuation && (
          <table className={styles.breakdownTable}>
            <thead>
              <tr>
                <th>Method</th>
                <th>Enterprise Value</th>
                <th>Multiple / Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>DCF (Discounted Cash Flow)</td>
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
                <td style={{ fontWeight: 600 }}>Blended Average</td>
                <td style={{ fontWeight: 600, color: "#00E0FF" }}>
                  {fmtM(valuation.blendedValue)}
                </td>
                <td>Equal-weight (DCF + Rev + EBITDA) / 3</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* ═══ 7 PLACEHOLDER SECTIONS ═══ */}
        <div className={styles.sectionGrid}>
          {SECTIONS.map((s) => (
            <div
              key={s.key}
              className={`${styles.section} ${s.full ? styles.sectionFull : ""}`}
            >
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>{s.icon}</span>
                <span className={styles.sectionTitle}>{s.title}</span>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.placeholder}>
                  {s.description}
                  <span className={styles.placeholderPhase}>Phase {s.phase}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

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
