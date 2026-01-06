// src/components/AIIntelligenceEnhanced.tsx
// STRATFIT — AI Intelligence (Command Assessment)
// Goal: interpretation, not KPI duplication.
// Rules: no engine math changes; no KPI duplication UI; no raw numbers in content.

import React, { useMemo } from "react";
import type { ScenarioId } from "@/state/scenarioStore";
import { calculateMetrics, type LeverState } from "@/logic/calculateMetrics";
import { deriveArrGrowth } from "@/utils/arrGrowth";
import { mapScenarioIntelligence, type ScenarioMetricsSnapshot } from "@/utils/scenarioIntelligenceMapping";

type RiskSignal = {
  severity: "STABLE" | "MODERATE" | "ELEVATED" | "HIGH";
  title: string;
  driver: string;
  impact: string;
};

function snapshotFromMetrics(m: ReturnType<typeof calculateMetrics>): ScenarioMetricsSnapshot {
  // NOTE: These are derived representations for interpretation only (UI), not engine changes.
  const runwayMonths = m.runway;
  const cashPosition = m.cashPosition * 1_000_000; // calculateMetrics cash is in "M" units
  const burnRateMonthly = m.burnQuality * 1_000; // burnQuality displayed as $K
  const arr = (m.momentum / 10) * 1_000_000; // UI ARR proxy ($XM)
  const growthRate = Math.max(-0.5, Math.min(0.8, (m.momentum - 50) * 0.006));
  const arrNext12 = arr * (1 + growthRate);
  const arrGrowth = deriveArrGrowth({ arrCurrent: arr, arrNext12 });
  const arrGrowthPct = arrGrowth.arrGrowthPct === null ? NaN : arrGrowth.arrGrowthPct * 100;
  const grossMarginPct = m.earningsPower;
  const riskScore = m.riskIndex;
  const enterpriseValue = (m.enterpriseValue / 10) * 1_000_000;
  return {
    runwayMonths,
    cashPosition,
    burnRateMonthly,
    arr,
    arrGrowthPct,
    grossMarginPct,
    riskScore,
    enterpriseValue,
  };
}

export default function AIIntelligenceEnhanced(props: { levers: LeverState; scenario: ScenarioId }) {
  const { levers, scenario } = props;

  const assessment = useMemo(() => {
    const cur = snapshotFromMetrics(calculateMetrics(levers, scenario));
    const base = snapshotFromMetrics(calculateMetrics(levers, "base"));
    return mapScenarioIntelligence({ current: cur, baseline: base });
  }, [levers, scenario]);

  return (
    <div className="cold-panel sf-si">
      <div className="sf-si__header">
        <div>
          <div className="sf-si__title">AI Intelligence</div>
          <div className="sf-si__meta">
            <span className="sf-si__status">
              <span className="sf-si__dot" aria-hidden="true" />
              SYNCED
            </span>
            <span className="sf-si__sep">·</span>
            <span className="sf-si__tag">ASSESSMENT</span>
          </div>
        </div>
      </div>

      <div className="sf-si__section">
        <div className="sf-si__kicker">Observations</div>
        <div className="sf-si__brief">
          {assessment.observations.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>

      <div className="sf-si__section">
        <div className="sf-si__kicker">System State</div>
        <div className="sf-si__tiles" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <div className="sf-si__tile">
            <div className="sf-si__tileLabel">Financial</div>
            <div className="sf-si__tileValue">{assessment.systemState.financial}</div>
            <div className="sf-si__tileSub">Runway posture</div>
          </div>
          <div className="sf-si__tile">
            <div className="sf-si__tileLabel">Operational</div>
            <div className="sf-si__tileValue">{assessment.systemState.operational}</div>
            <div className="sf-si__tileSub">Load vs capacity</div>
          </div>
          <div className="sf-si__tile">
            <div className="sf-si__tileLabel">Execution</div>
            <div className="sf-si__tileValue">{assessment.systemState.execution}</div>
            <div className="sf-si__tileSub">Variance control</div>
          </div>
        </div>
      </div>

      <div className="sf-si__section">
        <div className="sf-si__kicker">Risk Signals</div>
        <div className="sf-si__brief">
          {assessment.risks.length ? (
            assessment.risks.map((r: RiskSignal, i: number) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.88)" }}>
                  {r.severity} · {r.title}
                </div>
                <div style={{ color: "rgba(255,255,255,0.72)", marginTop: 3 }}>{r.driver}</div>
                <div style={{ color: "rgba(255,255,255,0.62)", marginTop: 3 }}>{r.impact}</div>
              </div>
            ))
          ) : (
            <div>No structural risks detected at current thresholds.</div>
          )}
        </div>
      </div>

      <div className="sf-si__section">
        <div className="sf-si__kicker">Attention Signals</div>
        <ul className="sf-si__actions">
          {assessment.attention.slice(0, 3).map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>

      <details className="sf-si__trace">
        <summary>Traceability</summary>
        <div className="sf-si__traceGrid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="sf-si__traceV">
            Trace: runwayMonths, cashPosition, burnRateMonthly, arr, arrGrowthPct, grossMarginPct, riskScore, enterpriseValue.
          </div>
        </div>
      </details>
    </div>
  );
}


