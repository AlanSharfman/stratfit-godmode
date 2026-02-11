import React, { memo, useMemo } from "react";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { useScenarioStore } from "@/state/scenarioStore";
import { computeBaselineCompleteness } from "@/logic/confidence/baselineCompleteness";
import {
  aggregateStructuralHeatScore,
  buildBaselineModel,
  evaluateStructuralScore,
} from "@/logic/heat/structuralHeatEngine";
import styles from "@/pages/baseline/BaselinePage.module.css";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

function fmtUsdM(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

const BaselineIntelligencePanel: React.FC = memo(() => {
  const { baseline } = useSystemBaseline();
  const baseKpis = useScenarioStore((s) => s.engineResults?.base?.kpis ?? null);

  const survivalBaselinePct = useMemo(() => {
    const v = baseKpis?.riskIndex?.value;
    return clamp(typeof v === "number" ? v : 70, 0, 100);
  }, [baseKpis]);

  const ctx = useMemo(() => (baseline ? buildBaselineModel(baseline, survivalBaselinePct) : null), [baseline, survivalBaselinePct]);
  const structuralScore = useMemo(() => (ctx ? aggregateStructuralHeatScore(ctx) : 70), [ctx]);
  const heat = useMemo(() => evaluateStructuralScore(structuralScore), [structuralScore]);

  const completeness = useMemo(() => computeBaselineCompleteness(baseline), [baseline]);
  const completenessPct = Math.round(completeness.completeness01 * 100);

  const revenue = baseline?.financial.arr ?? 0;
  const margin = baseline?.financial.grossMarginPct ?? 0;
  const burn = baseline?.financial.monthlyBurn ?? 0;
  const cash = baseline?.financial.cashOnHand ?? 0;
  const runway = burn > 0 ? cash / burn : 999;

  const status = structuralScore >= 78 ? "STRONG" : structuralScore >= 62 ? "STABLE" : structuralScore >= 48 ? "WATCH" : "WEAK";
  const primaryConstraint =
    runway < 9 ? "Runway compression within 6–9 months" : margin < 45 ? "Margin stability below institutional threshold" : "Burn vs margin mismatch";

  return (
    <aside className={styles.rightPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>BASELINE INTELLIGENCE</div>
        <div className={styles.panelDots}>
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>STRUCTURAL METRICS</div>
        <div className={styles.kvGrid}>
          <div className={styles.kvRow}>
            <div className={styles.k}>Revenue</div>
            <div className={styles.v}>{fmtUsdM(revenue)}</div>
          </div>
          <div className={styles.kvRow}>
            <div className={styles.k}>Margin</div>
            <div className={styles.v}>{margin.toFixed(0)}%</div>
          </div>
          <div className={styles.kvRow}>
            <div className={styles.k}>Runway</div>
            <div className={styles.v}>{Math.round(runway)} months</div>
          </div>
          <div className={styles.kvRow}>
            <div className={styles.k}>Burn Ratio</div>
            <div className={styles.v}>{ctx ? ctx.derived.burnRatio.toFixed(1) : "—"}x</div>
          </div>
          <div className={styles.kvRow}>
            <div className={styles.k}>Risk Index</div>
            <div className={styles.v}>{Math.round(survivalBaselinePct)}%</div>
          </div>
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>SYSTEM DIAGNOSTIC</div>
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>Status:</div>
          <div className={styles.statusValue} style={{ color: `var(${heat.color})` }}>
            {status}
          </div>
        </div>
        <div className={styles.constraintRow}>
          <div className={styles.constraintLabel}>Primary Constraint:</div>
          <div className={styles.constraintValue}>{primaryConstraint}</div>
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>STRUCTURAL STORY</div>
        <div className={styles.storyText}>
          {runway < 12
            ? "Liquidity headroom is narrowing. Burn intensity is compressing optionality faster than revenue scale can absorb."
            : "Runway is supported by current capital base. Composition quality depends on margin stability and burn proportionality."}
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>KEY SIGNALS (Ranked)</div>
        <ol className={styles.signalList}>
          <li>Burn acceleration relative to ARR scale</li>
          <li>Margin volatility sensitivity</li>
          <li>Capital dependency within 9–12 months</li>
        </ol>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>TERRAIN INTERPRETATION</div>
        <div className={styles.storyText}>
          Each peak maps to Revenue → Margin → Runway → Burn → Efficiency. Valleys indicate structural fragility. Confidence width reflects certainty.
        </div>
      </div>

      <div className={styles.panelFoot}>
        <div className={styles.footLine}>
          Structural score: <span style={{ color: `var(${heat.color})` }}>{Math.round(structuralScore)}/100</span>
        </div>
        <div className={styles.footLine}>Input completeness: {completenessPct}%</div>
      </div>
    </aside>
  );
});

BaselineIntelligencePanel.displayName = "BaselineIntelligencePanel";
export default BaselineIntelligencePanel;


