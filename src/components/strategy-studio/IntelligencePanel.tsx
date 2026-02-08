// src/components/strategy-studio/IntelligencePanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence Engine Panel
// IMPACT SUMMARY · CAPITAL EFFECT · RISK EXPOSURE · VALUATION SHIFT · EXIT READINESS
// Short 1–2 line insight. One key number highlighted.
// No emojis. No hype. No animated typing effects.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import styles from "./StrategyStudio.module.css";
import { useScenarioStore } from "@/state/scenarioStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import type { Objective } from "./TopControlBar";

interface IntelligencePanelProps {
  objective: Objective;
  advancedMode: boolean;
  scenario: string;
}

function fmtUsd(v: number): string {
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(1) + "K";
  return "$" + Math.round(v).toLocaleString();
}

function fmtPct(v: number): string {
  const sign = v > 0 ? "+" : "";
  return sign + v.toFixed(1) + "%";
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = memo(({
  objective,
  advancedMode,
  scenario,
}) => {
  const engineResults = useScenarioStore(useShallow((s) => s.engineResults));
  const { baseline } = useSystemBaseline();

  const current = engineResults?.[scenario as keyof typeof engineResults];
  const base = engineResults?.base;

  const kpis = current?.kpis;
  const baseKpis = base?.kpis;

  // ── Derived intelligence ────────────────────────────────────────────
  const intel = useMemo(() => {
    if (!kpis || !baseKpis) return null;

    const runway = kpis.runway?.value ?? 0;
    const runwayBase = baseKpis.runway?.value ?? 0;
    const runwayDelta = runway - runwayBase;

    const cash = kpis.cashPosition?.value ?? 0;
    const cashBase = baseKpis.cashPosition?.value ?? 0;
    const cashDelta = cashBase > 0 ? ((cash - cashBase) / cashBase) * 100 : 0;

    const risk = kpis.riskScore?.value ?? 0;
    const riskBase = baseKpis.riskScore?.value ?? 0;
    const riskDelta = risk - riskBase;

    const ev = kpis.enterpriseValue?.value ?? 0;
    const evBase = baseKpis.enterpriseValue?.value ?? 0;
    const evDelta = evBase > 0 ? ((ev - evBase) / evBase) * 100 : 0;

    const momentum = kpis.momentum?.value ?? 0;
    const burn = kpis.burnQuality?.value ?? 0;
    const survival = Math.min(100, Math.round((runway / 36) * 100));

    // Budget variance (from baseline onboarding data)
    const baselineBurn = baseline?.financial?.monthlyBurn ?? 0;
    const baselineArr = baseline?.financial?.arr ?? 0;
    const baselineCash = baseline?.financial?.cashOnHand ?? 0;
    const scenarioBurn = burn * 1000; // burnQuality is in K
    const scenarioArr = (momentum / 10) * 1_000_000;
    const scenarioRunway = runway;
    const baselineRunway = baselineCash > 0 && baselineBurn > 0 ? Math.floor(baselineCash / baselineBurn) : 0;

    // Exit Readiness Score (0–100)
    const survivalFactor = survival / 100;
    const evFactor = Math.min(1, ev / 100); // ev is already scaled
    const riskFactor = 1 - (risk / 100);
    const velocityFactor = Math.min(1, momentum / 80);
    const capitalFactor = Math.min(1, cash / 8);
    const exitReadiness = Math.round(
      (survivalFactor * 25 + evFactor * 25 + riskFactor * 20 + velocityFactor * 15 + capitalFactor * 15)
    );

    return {
      runway, runwayDelta,
      cash, cashDelta,
      risk, riskDelta,
      ev, evDelta,
      momentum, burn, survival,
      exitReadiness,
      // Budget
      burnVariance: baselineBurn > 0 ? ((scenarioBurn - baselineBurn) / baselineBurn) * 100 : 0,
      revenueVariance: baselineArr > 0 ? ((scenarioArr - baselineArr) / baselineArr) * 100 : 0,
      runwayVariance: baselineRunway > 0 ? scenarioRunway - baselineRunway : 0,
    };
  }, [kpis, baseKpis, baseline]);

  if (!intel) {
    return (
      <div className={styles.rightPanel}>
        <div className={styles.intelHeader}>
          <span className={styles.intelTitle}>Intelligence</span>
        </div>
        <div className={styles.intelSection}>
          <span className={styles.intelText}>Awaiting simulation data.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.intelHeader}>
        <span className={styles.intelTitle}>Intelligence</span>
      </div>

      {/* IMPACT SUMMARY */}
      <div className={styles.intelSection}>
        <div className={styles.intelSectionTitle}>Impact Summary</div>
        <div className={styles.intelValue}>{intel.survival}%</div>
        <div className={styles.intelText}>
          Survival probability at current lever configuration.
          {intel.runwayDelta !== 0 && (
            <> Runway shifted <span className={intel.runwayDelta > 0 ? styles.intelDeltaPositive : styles.intelDeltaNegative}>
              {intel.runwayDelta > 0 ? "+" : ""}{intel.runwayDelta}mo
            </span> vs baseline.</>
          )}
        </div>
      </div>

      {/* CAPITAL EFFECT */}
      <div className={styles.intelSection}>
        <div className={styles.intelSectionTitle}>Capital Effect</div>
        <div className={styles.intelValue}>{intel.runway}mo</div>
        <div className={styles.intelText}>
          Cash position {fmtUsd(intel.cash * 1_000_000)}.
          {intel.cashDelta !== 0 && (
            <> Capital shifted <span className={intel.cashDelta > 0 ? styles.intelDeltaPositive : styles.intelDeltaNegative}>
              {fmtPct(intel.cashDelta)}
            </span> from baseline.</>
          )}
        </div>
      </div>

      {/* RISK EXPOSURE */}
      <div className={styles.intelSection}>
        <div className={styles.intelSectionTitle}>Risk Exposure</div>
        <div className={styles.intelValue}>{Math.round(intel.risk)}/100</div>
        <div className={styles.intelText}>
          {intel.risk < 30 ? "Low risk profile. Defensive posture maintained." :
           intel.risk < 60 ? "Moderate risk exposure. Monitor execution variables." :
           "Elevated risk. Capital efficiency requires immediate attention."}
          {intel.riskDelta !== 0 && (
            <> Delta <span className={intel.riskDelta < 0 ? styles.intelDeltaPositive : styles.intelDeltaNegative}>
              {intel.riskDelta > 0 ? "+" : ""}{Math.round(intel.riskDelta)}
            </span> vs baseline.</>
          )}
        </div>
      </div>

      {/* VALUATION SHIFT */}
      <div className={styles.intelSection}>
        <div className={styles.intelSectionTitle}>Valuation Shift</div>
        <div className={styles.intelValue}>{fmtUsd(intel.ev * 100_000)}</div>
        <div className={styles.intelText}>
          Enterprise value estimate.
          {intel.evDelta !== 0 && (
            <> Moved <span className={intel.evDelta > 0 ? styles.intelDeltaPositive : styles.intelDeltaNegative}>
              {fmtPct(intel.evDelta)}
            </span> from baseline position.</>
          )}
        </div>
      </div>

      {/* EXIT READINESS — only when objective = EXIT */}
      {objective === "EXIT" && (
        <div className={styles.intelSection}>
          <div className={styles.intelSectionTitle}>Exit Readiness</div>
          <div className={styles.exitScore}>
            <span className={styles.exitScoreValue}>{intel.exitReadiness}</span>
            <span className={styles.exitScoreMax}>/ 100</span>
          </div>
          <div className={styles.intelText}>
            {intel.exitReadiness >= 70
              ? "Strong exit position. Proceed with confidence."
              : intel.exitReadiness >= 40
                ? "Moderate exit readiness. Address capital adequacy."
                : "Exit not advised at current trajectory."}
          </div>
        </div>
      )}

      {/* BUDGET VARIANCE — Advanced Mode only */}
      {advancedMode && (
        <div className={styles.budgetSection}>
          <div className={styles.budgetTitle}>Budget Variance</div>
          <div className={styles.budgetRow}>
            <span className={styles.budgetLabel}>Burn variance</span>
            <span className={`${styles.budgetValue} ${intel.burnVariance > 0 ? styles.intelDeltaNegative : styles.intelDeltaPositive}`}>
              {fmtPct(intel.burnVariance)}
            </span>
          </div>
          <div className={styles.budgetRow}>
            <span className={styles.budgetLabel}>Revenue variance</span>
            <span className={`${styles.budgetValue} ${intel.revenueVariance > 0 ? styles.intelDeltaPositive : styles.intelDeltaNegative}`}>
              {fmtPct(intel.revenueVariance)}
            </span>
          </div>
          <div className={styles.budgetRow}>
            <span className={styles.budgetLabel}>Runway variance</span>
            <span className={`${styles.budgetValue} ${intel.runwayVariance > 0 ? styles.intelDeltaPositive : styles.intelDeltaNegative}`}>
              {intel.runwayVariance > 0 ? "+" : ""}{intel.runwayVariance}mo
            </span>
          </div>
        </div>
      )}
    </>
  );
});

IntelligencePanel.displayName = "IntelligencePanel";





