// src/components/compare/CompareInsights.tsx
// STRATFIT — Compare AI Insights Panel
// Sections: SUMMARY · KEY SHIFTS · TRADEOFFS · RISK WATCHPOINTS · VALUE IMPLICATION
// Static output. No typewriter. Derived from simulation outputs.
// Institutional. Analytical. Not chatty.

import React, { useMemo } from "react";
import styles from "./ComparePage.module.css";

interface KPISet {
  runway?: { value: number };
  riskScore?: { value: number };
  riskIndex?: { value: number };
  arrCurrent?: { value: number };
  arrGrowthPct?: { value: number };
  burnQuality?: { value: number };
  cashPosition?: { value: number };
  enterpriseValue?: { value: number };
  momentum?: { value: number };
  ltvCac?: { value: number };
  qualityScore?: { value: number };
  growthStress?: { value: number };
}

interface CompareInsightsProps {
  baselineKpis: KPISet | null;
  scenarioAKpis: KPISet | null;
}

function v(kpi: { value: number } | undefined, fallback = 0): number {
  return kpi?.value ?? fallback;
}

const CompareInsights: React.FC<CompareInsightsProps> = ({
  baselineKpis,
  scenarioAKpis,
}) => {
  const b = baselineKpis;
  const a = scenarioAKpis;

  const insights = useMemo(() => {
    if (!b || !a) {
      return {
        summary: "Insufficient data to generate comparison insights. Ensure both baseline and scenario have been computed.",
        shifts: [],
        tradeoffs: [],
        risks: [],
        value: "",
      };
    }

    const runwayDelta = v(a.runway) - v(b.runway);
    const survivalDelta = v(a.riskIndex) - v(b.riskIndex);
    const riskDelta = v(a.riskScore) - v(b.riskScore);
    const evBase = v(b.enterpriseValue, 50) / 10;
    const evA = v(a.enterpriseValue, 50) / 10;
    const evDelta = evA - evBase;
    const arrGrowthDelta = v(a.arrGrowthPct) - v(b.arrGrowthPct);
    const burnDelta = v(a.burnQuality) - v(b.burnQuality);
    const ltvCacA = v(a.ltvCac, 3);
    const growthStressA = v(a.growthStress, 0.3);

    // Summary
    const survDir = survivalDelta > 0 ? "improves" : survivalDelta < 0 ? "reduces" : "maintains";
    const volDir = riskDelta > 2 ? " while increasing near-term volatility" : riskDelta < -2 ? " while reducing volatility" : "";
    const summary = `Strategy ${survDir} survival probability by ${Math.abs(survivalDelta).toFixed(0)}pp${volDir}. Runway shifts by ${runwayDelta >= 0 ? "+" : ""}${runwayDelta.toFixed(1)} months.`;

    // Key shifts
    const shifts: string[] = [];
    shifts.push(`Survival ${survivalDelta >= 0 ? "+" : ""}${survivalDelta.toFixed(0)}pp`);
    shifts.push(`Runway ${runwayDelta >= 0 ? "+" : ""}${runwayDelta.toFixed(1)} months`);
    shifts.push(`EV median ${evDelta >= 0 ? "+" : ""}$${evDelta.toFixed(1)}M`);
    if (Math.abs(arrGrowthDelta) > 1) {
      shifts.push(`ARR growth ${arrGrowthDelta >= 0 ? "+" : ""}${arrGrowthDelta.toFixed(1)}pp`);
    }

    // Tradeoffs
    const tradeoffs: string[] = [];
    if (burnDelta > 5) {
      tradeoffs.push("Higher burn rate increases runway sensitivity to revenue misses.");
    }
    if (growthStressA > 0.5) {
      tradeoffs.push("Growth fragility is elevated. Variance widens in downside scenarios.");
    }
    if (arrGrowthDelta > 10 && burnDelta > 10) {
      tradeoffs.push("Aggressive growth paired with higher burn creates a narrower margin of safety.");
    }
    if (ltvCacA < 3) {
      tradeoffs.push("Customer acquisition economics are below institutional thresholds in this scenario.");
    }
    if (tradeoffs.length === 0) {
      tradeoffs.push("Scenario maintains balanced tradeoff profile. No material structural compromise detected.");
    }

    // Risk watchpoints
    const risks: string[] = [];
    if (riskDelta > 5) {
      risks.push("Downside risk index increases. Monitor churn sensitivity above 4%.");
    }
    if (v(a.runway) < 18) {
      risks.push("Runway below 18 months. Liquidity compression risk if growth stalls.");
    }
    if (growthStressA > 0.6) {
      risks.push("Growth fragility suggests concentrated dependency on acquisition assumptions.");
    }
    if (risks.length === 0) {
      risks.push("No elevated risk watchpoints in this comparison. Downside exposure remains contained.");
    }

    // Value implication
    let valueImpl = "";
    if (evDelta > 1) {
      valueImpl = `Valuation upside expands by $${evDelta.toFixed(1)}M. ${growthStressA > 0.5 ? "Distribution width increases under stress." : "Distribution remains tight."}`;
    } else if (evDelta < -1) {
      valueImpl = `Median valuation contracts by $${Math.abs(evDelta).toFixed(1)}M. Capital preservation may offset strategic cost.`;
    } else {
      valueImpl = "Valuation trajectory is materially unchanged between scenarios. Strategic differentiation is operational, not financial.";
    }

    return { summary, shifts, tradeoffs, risks, value: valueImpl };
  }, [b, a]);

  return (
    <div className={styles.insightsRoot}>
      {/* SUMMARY */}
      <div className={styles.insightSection}>
        <div className={styles.insightHeader}>Summary</div>
        <p className={styles.insightText}>{insights.summary}</p>
      </div>

      {/* KEY SHIFTS */}
      <div className={styles.insightSection}>
        <div className={styles.insightHeader}>Key Shifts</div>
        {insights.shifts.map((s, i) => (
          <div key={i} className={styles.insightBullet}>{s}</div>
        ))}
      </div>

      {/* TRADEOFFS */}
      <div className={styles.insightSection}>
        <div className={styles.insightHeader}>Tradeoffs</div>
        {insights.tradeoffs.map((t, i) => (
          <div key={i} className={styles.insightBullet}>{t}</div>
        ))}
      </div>

      {/* RISK WATCHPOINTS */}
      <div className={styles.insightSection}>
        <div className={styles.insightHeader}>Risk Watchpoints</div>
        {insights.risks.map((r, i) => (
          <div key={i} className={styles.insightBullet}>{r}</div>
        ))}
      </div>

      {/* VALUE IMPLICATION */}
      <div className={styles.insightSection}>
        <div className={styles.insightHeader}>Value Implication</div>
        <p className={styles.insightText}>{insights.value}</p>
      </div>
    </div>
  );
};

export default CompareInsights;





