// src/components/compare/DeltaIntelligenceTable.tsx
// STRATFIT — Compare: Delta table with institutional “intelligence” notes.

import React, { memo, useMemo } from "react";
import type { MetricsResult } from "@/logic/calculateMetrics";
import type { MonteCarloResult } from "@/logic/monteCarloEngine";
import styles from "./CompareView.module.css";

type Tone = "positive" | "negative" | "neutral";

function toneForDelta(delta: number, goodWhenLower = false, threshold = 0.0001): Tone {
  if (Math.abs(delta) <= threshold) return "neutral";
  const improved = goodWhenLower ? delta < 0 : delta > 0;
  return improved ? "positive" : "negative";
}

function fmtNum(n: number, decimals = 0): string {
  return n.toFixed(decimals);
}

function fmtSigned(n: number, decimals = 0, suffix = ""): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}${suffix}`;
}

function fmtSignedPct(n: number, decimals = 0): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}%`;
}

function pctDelta(from: number, to: number): number | null {
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  if (from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

function survivalPctFrom(sim: MonteCarloResult | null, metrics: MetricsResult | null): number | null {
  if (sim) return Math.round(sim.survivalRate * 100);
  if (metrics) return Math.min(100, Math.max(0, Math.round((metrics.runway / 36) * 100)));
  return null;
}

function intelligenceForRow(metric: string, delta: number, goodWhenLower: boolean): string {
  const abs = Math.abs(delta);
  const improved = goodWhenLower ? delta < 0 : delta > 0;

  // Keep notes short and “board clean”.
  if (abs < 0.25) return "No material change.";
  if (metric === "Runway" && abs >= 3) return improved ? "Liquidity headroom increases." : "Liquidity pressure increases.";
  if (metric === "Survival" && abs >= 5) return improved ? "Durability improves materially." : "Durability weakens materially.";
  if (metric === "Enterprise Value" && abs >= 1) return improved ? "Median value path expands." : "Median value path contracts.";
  if (metric === "Risk Index" && abs >= 5) return improved ? "Downside exposure reduces." : "Downside exposure increases.";
  if (improved) return "Structural profile improves.";
  return "Structural profile deteriorates.";
}

export interface DeltaIntelligenceTableProps {
  leftName: string;
  rightName: string;
  leftMetrics: MetricsResult | null;
  rightMetrics: MetricsResult | null;
  leftSim: MonteCarloResult | null;
  rightSim: MonteCarloResult | null;
}

const DeltaIntelligenceTable: React.FC<DeltaIntelligenceTableProps> = memo((props) => {
  const rows = useMemo(() => {
    const { leftMetrics: L, rightMetrics: R, leftSim, rightSim } = props;
    if (!L || !R) return null;

    const leftSurv = survivalPctFrom(leftSim, L);
    const rightSurv = survivalPctFrom(rightSim, R);

    const base = [
      {
        metric: "Runway",
        left: `${fmtNum(L.runway)}mo`,
        right: `${fmtNum(R.runway)}mo`,
        delta: R.runway - L.runway,
        deltaFmt: fmtSigned(R.runway - L.runway, 0, "mo"),
        deltaPct: fmtSignedPct(pctDelta(L.runway, R.runway) ?? 0, 0),
        deltaPctEnabled: pctDelta(L.runway, R.runway) !== null,
        goodWhenLower: false,
      },
      {
        metric: "Survival",
        left: leftSurv === null ? "—" : `${leftSurv}%`,
        right: rightSurv === null ? "—" : `${rightSurv}%`,
        delta: (rightSurv ?? 0) - (leftSurv ?? 0),
        deltaFmt: leftSurv === null || rightSurv === null ? "—" : fmtSigned((rightSurv ?? 0) - (leftSurv ?? 0), 0, "pp"),
        deltaPct: "—",
        deltaPctEnabled: false,
        goodWhenLower: false,
      },
      {
        metric: "Enterprise Value",
        left: `$${L.enterpriseValue.toFixed(1)}M`,
        right: `$${R.enterpriseValue.toFixed(1)}M`,
        delta: R.enterpriseValue - L.enterpriseValue,
        deltaFmt: `$${fmtSigned(R.enterpriseValue - L.enterpriseValue, 1, "M")}`,
        deltaPct: fmtSignedPct(pctDelta(L.enterpriseValue, R.enterpriseValue) ?? 0, 0),
        deltaPctEnabled: pctDelta(L.enterpriseValue, R.enterpriseValue) !== null,
        goodWhenLower: false,
      },
      {
        metric: "Risk Index",
        left: fmtNum(L.riskIndex),
        right: fmtNum(R.riskIndex),
        delta: R.riskIndex - L.riskIndex,
        deltaFmt: fmtSigned(R.riskIndex - L.riskIndex, 0),
        deltaPct: fmtSignedPct(pctDelta(L.riskIndex, R.riskIndex) ?? 0, 0),
        deltaPctEnabled: pctDelta(L.riskIndex, R.riskIndex) !== null,
        goodWhenLower: true,
      },
      {
        metric: "Burn Quality",
        left: fmtNum(L.burnQuality),
        right: fmtNum(R.burnQuality),
        delta: R.burnQuality - L.burnQuality,
        deltaFmt: fmtSigned(R.burnQuality - L.burnQuality, 0),
        deltaPct: fmtSignedPct(pctDelta(L.burnQuality, R.burnQuality) ?? 0, 0),
        deltaPctEnabled: pctDelta(L.burnQuality, R.burnQuality) !== null,
        goodWhenLower: false,
      },
      {
        metric: "Cash Position",
        left: fmtNum(L.cashPosition, 1),
        right: fmtNum(R.cashPosition, 1),
        delta: R.cashPosition - L.cashPosition,
        deltaFmt: `$${fmtSigned(R.cashPosition - L.cashPosition, 1, "M")}`,
        deltaPct: fmtSignedPct(pctDelta(L.cashPosition, R.cashPosition) ?? 0, 0),
        deltaPctEnabled: pctDelta(L.cashPosition, R.cashPosition) !== null,
        goodWhenLower: false,
      },
      {
        metric: "Momentum",
        left: fmtNum(L.momentum),
        right: fmtNum(R.momentum),
        delta: R.momentum - L.momentum,
        deltaFmt: fmtSigned(R.momentum - L.momentum, 0),
        deltaPct: fmtSignedPct(pctDelta(L.momentum, R.momentum) ?? 0, 0),
        deltaPctEnabled: pctDelta(L.momentum, R.momentum) !== null,
        goodWhenLower: false,
      },
      {
        metric: "Earnings Power",
        left: fmtNum(L.earningsPower),
        right: fmtNum(R.earningsPower),
        delta: R.earningsPower - L.earningsPower,
        deltaFmt: fmtSigned(R.earningsPower - L.earningsPower, 0),
        deltaPct: fmtSignedPct(pctDelta(L.earningsPower, R.earningsPower) ?? 0, 0),
        deltaPctEnabled: pctDelta(L.earningsPower, R.earningsPower) !== null,
        goodWhenLower: false,
      },
    ];

    return base.map((r) => ({
      ...r,
      tone: r.deltaFmt === "—" ? ("neutral" as Tone) : toneForDelta(r.delta, r.goodWhenLower, 0.0001),
      intelligence: intelligenceForRow(r.metric, r.delta, r.goodWhenLower),
    }));
  }, [props]);

  if (!rows) return null;

  return (
    <div className={styles.deltaWrap}>
      <div className={styles.deltaTitle}>DELTA ANALYSIS</div>

      <table className={styles.deltaTable}>
        <thead>
          <tr>
            <th>Metric</th>
            <th>{props.leftName}</th>
            <th>{props.rightName}</th>
            <th>Δ $</th>
            <th>Δ %</th>
            <th>Intelligence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.metric}>
              <td className={styles.deltaMetric}>{r.metric}</td>
              <td className={styles.deltaNum}>{r.left}</td>
              <td className={styles.deltaNum}>{r.right}</td>
              <td
                className={[
                  styles.deltaNum,
                  r.tone === "positive" ? styles.cellPositive : r.tone === "negative" ? styles.cellNegative : "",
                ].join(" ")}
              >
                {r.deltaFmt}
              </td>
              <td className={styles.deltaNum}>
                {r.deltaPctEnabled ? r.deltaPct : "—"}
              </td>
              <td className={styles.deltaIntel}>{r.intelligence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

DeltaIntelligenceTable.displayName = "DeltaIntelligenceTable";
export default DeltaIntelligenceTable;


