// src/components/valuation/ValuationIntelligencePanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Phase 300: Valuation Intelligence Panel
//
// Premium glass panel displaying:
//   1. Enterprise Value Distribution (P10/P25/P50/P75/P90), density bar + P50 marker
//   2. Valuation Driver Breakdown (bar chart)
//   3. Scenario Valuation Comparison (baseline vs scenario + delta %)
//   4. Method selector (DCF / Revenue Multiple)
//   5. Valuation Spider (Growth, Profitability, Capital Efficiency, Risk, Market Position)
//   6. Executive Valuation Narrative (probabilistic language)
//   7. Provenance badge (via parent page)
//   8. Valuation Waterfall (baselineEV + drivers → scenarioEV)
//
// DATA SOURCE (STRICT):
//   useValuationIntelligence() → ValuationIntelligenceOutput
//
// No simulation runs. No stores. Pure derived render.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useState } from "react";
import {
  useValuationIntelligence,
} from "@/hooks/useValuationIntelligence";
import type {
  ValuationMethod,
  ValuationSpiderAxis,
  ValuationDriver,
  WaterfallStep,
} from "@/engine/valuationIntelligenceEngine";
import styles from "./ValuationIntelligencePanel.module.css";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const fmtM = (v: number): string => {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  if (v >= 1) return `$${v.toFixed(1)}M`;
  if (v >= 0.001) return `$${(v * 1000).toFixed(0)}K`;
  return "$0";
};

const fmtDelta = (v: number): string => {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${fmtM(v)}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (inlined, institutional)
// ═══════════════════════════════════════════════════════════════════════════

// ── Valuation Spider (5-axis) ───────────────────────────────────────────
const ValuationSpider: React.FC<{ axes: ValuationSpiderAxis[] }> = memo(({ axes }) => {
  const size = 160;
  const center = size / 2;
  const maxRadius = 58;
  const levels = 4;
  const count = axes.length;
  const angleStep = (2 * Math.PI) / count;

  const getPoint = (score: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (score / 100) * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const polygonPath = axes
    .map((a, i) => {
      const p = getPoint(a.score, i);
      return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid levels */}
      {Array.from({ length: levels }, (_, li) => {
        const r = ((li + 1) / levels) * maxRadius;
        const pts = Array.from({ length: count }, (_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(" ");
        return (
          <polygon
            key={li}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Axis lines + labels */}
      {axes.map((a, i) => {
        const end = getPoint(100, i);
        const labelP = getPoint(120, i);
        return (
          <g key={a.axis}>
            <line
              x1={center} y1={center}
              x2={end.x} y2={end.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />
            <text
              x={labelP.x} y={labelP.y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: 8,
                fill: "rgba(255,255,255,0.4)",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.03em",
              }}
            >
              {a.label}
            </text>
          </g>
        );
      })}

      {/* Data polygon */}
      <path
        d={polygonPath}
        fill="rgba(34, 211, 238, 0.12)"
        stroke="rgba(34, 211, 238, 0.6)"
        strokeWidth={1.5}
      />

      {/* Data points */}
      {axes.map((a, i) => {
        const p = getPoint(a.score, i);
        return (
          <circle
            key={a.axis}
            cx={p.x} cy={p.y} r={2.5}
            fill="rgba(34, 211, 238, 0.9)"
          />
        );
      })}
    </svg>
  );
});
ValuationSpider.displayName = "ValuationSpider";

// ── Driver Bar ──────────────────────────────────────────────────────────
const DriverBar: React.FC<{ driver: ValuationDriver; maxImpact: number }> = memo(
  ({ driver, maxImpact }) => {
    const pct = maxImpact > 0 ? Math.abs(driver.impact) / maxImpact * 100 : 0;
    const color = driver.direction === "positive" ? "#34d399" : "#ef4444";

    return (
      <div className={styles.driverRow}>
        <span className={styles.driverLabel}>{driver.label}</span>
        <div className={styles.driverBarTrack}>
          <div
            className={styles.driverBarFill}
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <span className={styles.driverImpact} style={{ color }}>
          {fmtDelta(driver.impact)}
        </span>
      </div>
    );
  },
);
DriverBar.displayName = "DriverBar";

// ── Waterfall Row ───────────────────────────────────────────────────────
const WaterfallRow: React.FC<{
  step: WaterfallStep;
  maxVal: number;
}> = memo(({ step, maxVal }) => {
  const pct = maxVal > 0 ? Math.abs(step.value) / maxVal * 100 : 0;
  const color =
    step.type === "start" ? "rgba(255,255,255,0.25)" :
    step.type === "total" ? "rgba(34, 211, 238, 0.7)" :
    step.type === "positive" ? "#34d399" : "#ef4444";

  return (
    <div className={styles.waterfallRow}>
      <span className={styles.waterfallLabel}>{step.label}</span>
      <div className={styles.waterfallBarTrack}>
        <div
          className={styles.waterfallBarFill}
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: color,
            left: step.type === "negative" ? "auto" : 0,
          }}
        />
      </div>
      <span className={styles.waterfallValue} style={{ color }}>
        {step.type === "start" || step.type === "total" ? fmtM(step.value) : fmtDelta(step.value)}
      </span>
    </div>
  );
});
WaterfallRow.displayName = "WaterfallRow";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════════════════════════════

const ValuationIntelligencePanel: React.FC = memo(() => {
  const [method, setMethod] = useState<ValuationMethod>("revenue_multiple");
  const { intelligence, ready } = useValuationIntelligence(method);

  if (!ready || !intelligence) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Valuation Intelligence</span>
        </div>
        <div style={{ padding: "20px 0", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
          Run a simulation to unlock valuation intelligence.
        </div>
      </div>
    );
  }

  const { distribution, comparison, drivers, spider, waterfall, narrative, impliedMultiple } = intelligence;
  const maxDriverImpact = Math.max(...drivers.map((d) => Math.abs(d.impact)), 0.01);
  const maxWaterfallVal = Math.max(...waterfall.map((s) => Math.abs(s.value)), 0.01);

  const deltaClass =
    comparison.direction === "upside" ? styles.deltaUp :
    comparison.direction === "downside" ? styles.deltaDown :
    styles.deltaNeutral;

  // Distribution bar: normalize P10-P90 range
  const range = distribution.p90 - distribution.p10;
  const p25Pct = range > 0 ? ((distribution.p25 - distribution.p10) / range) * 100 : 20;
  const p75Pct = range > 0 ? ((distribution.p75 - distribution.p10) / range) * 100 : 80;
  const p50Pct = range > 0 ? ((distribution.p50 - distribution.p10) / range) * 100 : 50;

  return (
    <div className={styles.root}>
      {/* ── Header + Method Selector ── */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Valuation Intelligence</span>
        <div className={styles.methodSelector}>
          <button
            className={`${styles.methodBtn} ${method === "revenue_multiple" ? styles.methodBtnActive : ""}`}
            onClick={() => setMethod("revenue_multiple")}
          >
            Rev Multiple
          </button>
          <button
            className={`${styles.methodBtn} ${method === "dcf" ? styles.methodBtnActive : ""}`}
            onClick={() => setMethod("dcf")}
          >
            DCF
          </button>
        </div>
      </div>

      {/* ── 1. Enterprise Value Distribution ── */}
      <div className={styles.distributionBlock}>
        <div className={styles.evHeadline}>
          <span className={styles.evValue}>{fmtM(distribution.p50)}</span>
          <span className={styles.evLabel}>P50 Enterprise Value</span>
          <span className={styles.multipleBadge}>{impliedMultiple}x</span>
        </div>

        {/* ── Distribution Bar ── */}
        <div className={styles.distributionBar}>
          {/* P25-P75 operating range */}
          <div
            className={styles.distributionFill}
            style={{
              left: `${p25Pct}%`,
              width: `${p75Pct - p25Pct}%`,
              background: "rgba(34, 211, 238, 0.15)",
            }}
          />
          {/* P50 marker */}
          <div
            className={styles.distributionMarker}
            style={{ left: `${p50Pct}%` }}
          />
        </div>

        {/* Band labels */}
        <div className={styles.bandRow}>
          <span className={styles.bandLabel}>P10</span>
          <span className={styles.bandValue}>{fmtM(distribution.p10)}</span>
          <span style={{ flex: 1 }} />
          <span className={styles.bandLabel}>P25</span>
          <span className={styles.bandValue}>{fmtM(distribution.p25)}</span>
          <span style={{ flex: 1 }} />
          <span className={styles.bandLabel}>P75</span>
          <span className={styles.bandValue}>{fmtM(distribution.p75)}</span>
          <span style={{ flex: 1 }} />
          <span className={styles.bandLabel}>P90</span>
          <span className={styles.bandValue}>{fmtM(distribution.p90)}</span>
        </div>
      </div>

      {/* ── 3. Scenario Valuation Comparison ── */}
      <div className={styles.comparisonBlock}>
        <div className={styles.compCol}>
          <span className={styles.compLabel}>Baseline</span>
          <span className={styles.compValue}>{fmtM(comparison.baselineEV)}</span>
        </div>
        <div>
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>→</span>
        </div>
        <div className={styles.compCol}>
          <span className={styles.compLabel}>Scenario</span>
          <span className={styles.compValue}>{fmtM(comparison.scenarioEV)}</span>
        </div>
        <div className={`${styles.deltaBadge} ${deltaClass}`}>
          {comparison.direction === "upside" ? "▲" : comparison.direction === "downside" ? "▼" : "─"}
          {" "}{Math.abs(comparison.deltaPercent).toFixed(1)}%
        </div>
      </div>

      {/* ── 2. Valuation Driver Breakdown ── */}
      <div className={styles.driversBlock}>
        <div className={styles.sectionTitle}>Valuation Drivers</div>
        {drivers.map((d) => (
          <DriverBar key={d.id} driver={d} maxImpact={maxDriverImpact} />
        ))}
      </div>

      {/* ── 5. Spider Chart ── */}
      <div className={styles.spiderBlock}>
        <div className={styles.sectionTitle}>Valuation Profile</div>
        <ValuationSpider axes={spider} />
      </div>

      {/* ── 9. Waterfall ── */}
      <div className={styles.waterfallBlock}>
        <div className={styles.sectionTitle}>Valuation Waterfall</div>
        {waterfall.map((step) => (
          <WaterfallRow key={step.id} step={step} maxVal={maxWaterfallVal} />
        ))}
      </div>

      {/* ── 6. Executive Narrative ── */}
      <div className={styles.narrativeBlock}>
        <div className={styles.sectionTitle}>Executive Narrative</div>
        <p style={{ margin: "6px 0 0" }}>{narrative}</p>
      </div>
    </div>
  );
});

ValuationIntelligencePanel.displayName = "ValuationIntelligencePanel";
export default ValuationIntelligencePanel;
