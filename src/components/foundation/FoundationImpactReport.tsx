// src/components/foundation/FoundationImpactReport.tsx
// STRATFIT — Foundation Impact Report
// Shows how changing baseline affects Monte Carlo outcomes

import React, { useMemo } from "react";
import { useFoundationStore } from "@/store/foundationStore";
import { deriveElasticityFromFoundation } from "@/logic/foundationElasticity";
import { generateStructureSeed } from "@/logic/structureHash";
import "./FoundationImpactReport.css";

export function FoundationImpactReport() {
  const { baseline, draft } = useFoundationStore();

  if (!baseline) {
    return (
      <div className="fir-container">
        <div className="fir-chassis">
          <div className="fir-rim">
            <div className="fir-well">
              <div className="fir-empty">
                <div className="fir-emptyIcon">📊</div>
                <div className="fir-emptyTitle">FOUNDATION IMPACT REPORT</div>
                <div className="fir-emptyText">
                  Lock Foundation baseline to see how structural changes affect Monte Carlo simulations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate baseline elasticity
  const baselineElasticity = useMemo(() => deriveElasticityFromFoundation(baseline), [baseline]);
  const baselineSeed = useMemo(() => generateStructureSeed(baseline), [baseline]);

  // Calculate draft elasticity (if different from baseline)
  const draftElasticity = useMemo(() => deriveElasticityFromFoundation(draft), [draft]);
  const draftSeed = useMemo(() => generateStructureSeed(draft), [draft]);

  const isDirty = baselineSeed !== draftSeed;

  // Calculate deltas
  const calcDelta = (base: number, current: number) => {
    const delta = current - base;
    const pct = base !== 0 ? (delta / base) * 100 : 0;
    return { delta, pct };
  };

  const revenueVolDelta = calcDelta(baselineElasticity.revenueVolPct, draftElasticity.revenueVolPct);
  const churnVolDelta = calcDelta(baselineElasticity.churnVolPct, draftElasticity.churnVolPct);
  const burnVolDelta = calcDelta(baselineElasticity.burnVolPct, draftElasticity.burnVolPct);
  const shockProbDelta = calcDelta(baselineElasticity.shockProb, draftElasticity.shockProb);

  // Format helpers
  const fmt = (val: number) => `${(val * 100).toFixed(1)}%`;
  const fmtDelta = (delta: { delta: number; pct: number }) => {
    const sign = delta.delta >= 0 ? "+" : "";
    return `${sign}${(delta.delta * 100).toFixed(1)}% (${sign}${delta.pct.toFixed(0)}%)`;
  };

  const getDeltaColor = (delta: number, inverse: boolean = false) => {
    const isPositive = inverse ? delta < 0 : delta > 0;
    if (Math.abs(delta) < 0.001) return "rgba(156, 168, 181, 0.6)";
    return isPositive ? "#4ade80" : "#ef4444";
  };

  return (
    <div className="fir-container">
      <div className="fir-chassis">
        <div className="fir-rim">
          <div className="fir-well">
            {/* Header */}
            <div className="fir-header">
              <div className="fir-title">FOUNDATION IMPACT REPORT</div>
              <div className="fir-subtitle">Structural Changes → Simulation Behavior</div>
            </div>

            {/* Seed Comparison */}
            <div className="fir-seedSection">
              <div className="fir-seedCard">
                <div className="fir-seedLabel">BASELINE SEED</div>
                <div className="fir-seedValue">{baselineSeed.toLocaleString()}</div>
                <div className="fir-seedStatus">LOCKED</div>
              </div>
              
              <div className="fir-seedArrow">→</div>
              
              <div className={`fir-seedCard ${isDirty ? 'dirty' : ''}`}>
                <div className="fir-seedLabel">CURRENT SEED</div>
                <div className="fir-seedValue">{draftSeed.toLocaleString()}</div>
                <div className={`fir-seedStatus ${isDirty ? 'changed' : 'unchanged'}`}>
                  {isDirty ? "CHANGED" : "UNCHANGED"}
                </div>
              </div>
            </div>

            {isDirty && (
              <div className="fir-warning">
                <div className="fir-warningIcon">⚠️</div>
                <div className="fir-warningText">
                  <strong>Simulation Identity Changed:</strong> Current draft will produce different Monte Carlo results. 
                  Re-run simulations after locking to see new outcomes.
                </div>
              </div>
            )}

            {/* Impact Grid */}
            <div className="fir-grid">
              {/* Revenue Volatility */}
              <div className="fir-impactCard">
                <div className="fir-impactHeader">
                  <div className="fir-impactTitle">Revenue Volatility</div>
                  <div className="fir-impactBadge">Monthly</div>
                </div>
                <div className="fir-impactValues">
                  <div className="fir-impactRow">
                    <span className="fir-impactLabel">Baseline:</span>
                    <span className="fir-impactValue">{fmt(baselineElasticity.revenueVolPct)}</span>
                  </div>
                  <div className="fir-impactRow">
                    <span className="fir-impactLabel">Current:</span>
                    <span className="fir-impactValue">{fmt(draftElasticity.revenueVolPct)}</span>
                  </div>
                  <div className="fir-impactDelta" style={{ color: getDeltaColor(revenueVolDelta.delta, true) }}>
                    {fmtDelta(revenueVolDelta)}
                  </div>
                </div>
              </div>

              {/* Churn Volatility */}
              <div className="fir-impactCard">
                <div className="fir-impactHeader">
                  <div className="fir-impactTitle">Churn Volatility</div>
                  <div className="fir-impactBadge">Relative</div>
                </div>
                <div className="fir-impactValues">
                  <div className="fir-impactRow">
                    <span className="fir-impactLabel">Baseline:</span>
                    <span className="fir-impactValue">{fmt(baselineElasticity.churnVolPct)}</span>
                  </div>
                  <div className="fir-impactRow">
                    <span className="fir-impactLabel">Current:</span>
                    <span className="fir-impactValue">{fmt(draftElasticity.churnVolPct)}</span>
                  </div>
                  <div className="fir-impactDelta" style={{ color: getDeltaColor(churnVolDelta.delta, true) }}>
                    {fmtDelta(churnVolDelta)}
                  </div>
                </div>
              </div>

              {/* Burn Volatility */}
              <div className="fir-impactCard">
                <div className="fir-impactHeader">
                  <div className="fir-impactTitle">Burn Volatility</div>
                  <div className="fir-impactBadge">Monthly</div>
                </div>
                <div className="fir-impactValues">
                  <div className="fir-impactRow">
                    <span className="fir-impactLabel">Baseline:</span>
                    <span className="fir-impactValue">{fmt(baselineElasticity.burnVolPct)}</span>
                  </div>
                  <div className="fir-impactRow">
                    <span className="fir-impactLabel">Current:</span>
                    <span className="fir-impactValue">{fmt(draftElasticity.burnVolPct)}</span>
                  </div>
                  <div className="fir-impactDelta" style={{ color: getDeltaColor(burnVolDelta.delta, true) }}>
                    {fmtDelta(burnVolDelta)}
                  </div>
                </div>
              </div>

              {/* Shock Probability */}
              <div className="fir-impactCard">
                <div className="fir-impactHeader">
                  <div className="fir-impactTitle">Shock Probability</div>
                  <div className="fir-impactBadge">Monthly</div>
                </div>
                <div className="fir-impactValues">
                  <div className="fir-impactRow">
                    <span className="fir-impactLabel">Baseline:</span>
                    <span className="fir-impactValue">{fmt(baselineElasticity.shockProb)}</span>
                  </div>
                  <div className="fir-impactRow">
                    <span className="fir-impactLabel">Current:</span>
                    <span className="fir-impactValue">{fmt(draftElasticity.shockProb)}</span>
                  </div>
                  <div className="fir-impactDelta" style={{ color: getDeltaColor(shockProbDelta.delta, true) }}>
                    {fmtDelta(shockProbDelta)}
                  </div>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="fir-interpretation">
              <div className="fir-interpTitle">INTERPRETATION</div>
              <div className="fir-interpGrid">
                <div className="fir-interpItem">
                  <div className="fir-interpIcon">📈</div>
                  <div className="fir-interpText">
                    <strong>Increased Volatility:</strong> Wider outcome distributions, more uncertainty in projections
                  </div>
                </div>
                <div className="fir-interpItem">
                  <div className="fir-interpIcon">⚡</div>
                  <div className="fir-interpText">
                    <strong>Higher Shock Probability:</strong> More frequent tail-risk events in simulations
                  </div>
                </div>
                <div className="fir-interpItem">
                  <div className="fir-interpIcon">🎯</div>
                  <div className="fir-interpText">
                    <strong>Decreased Volatility:</strong> Tighter distributions, more predictable outcomes
                  </div>
                </div>
                <div className="fir-interpItem">
                  <div className="fir-interpIcon">🛡️</div>
                  <div className="fir-interpText">
                    <strong>Lower Shock Probability:</strong> Fewer extreme events, more stable trajectories
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

