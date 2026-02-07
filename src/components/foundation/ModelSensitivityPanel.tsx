// src/components/foundation/ModelSensitivityPanel.tsx
// STRATFIT — Model Sensitivity Panel
// Displays Foundation-derived elasticity parameters with God Mode bezels

import React from "react";
import { useFoundationStore } from "@/store/foundationStore";
import { deriveElasticityFromFoundation } from "@/logic/foundationElasticity";
import "./ModelSensitivityPanel.css";

export function ModelSensitivityPanel() {
  const { baseline } = useFoundationStore();

  if (!baseline) {
    return (
      <div className="ms-container">
        <div className="ms-chassis">
          <div className="ms-rim">
            <div className="ms-well">
              <div className="ms-empty">
                <div className="ms-emptyIcon">🔬</div>
                <div className="ms-emptyTitle">MODEL SENSITIVITY</div>
                <div className="ms-emptyText">
                  Lock Foundation baseline to view simulation parameters
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const elasticity = deriveElasticityFromFoundation(baseline);

  // Format percentages
  const fmt = (val: number) => `${(val * 100).toFixed(1)}%`;
  const fmtCorr = (val: number) => val.toFixed(2);

  // Calculate fragility score (0-100)
  const nz = (v: string) => {
    const x = Number(String(v ?? "").replace(/,/g, "").trim());
    return Number.isFinite(x) ? x : 0;
  };
  
  const cash = nz(baseline.cash);
  const burn = nz(baseline.burn);
  const arr = nz(baseline.arr);
  const gm = nz(baseline.grossMargin) / 100;
  const debt = nz(baseline.debtOutstanding);
  const rate = nz(baseline.interestRate) / 100;
  const nextRaiseMonths = nz(baseline.nextRaiseMonths);
  
  const runway = burn > 0 ? cash / burn : 99;
  const mrr = arr > 0 ? arr / 12 : 0;
  const burnMultiple = mrr > 0 ? burn / mrr : 0;
  
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  
  const runwayFrag = clamp((12 - runway) / 12, 0, 1);
  const burnMultiFrag = clamp((burnMultiple - 1.5) / 3.0, 0, 1);
  const gmFrag = clamp((0.55 - gm) / 0.55, 0, 1);
  const raiseFrag = clamp((9 - nextRaiseMonths) / 9, 0, 1);
  const debtFrag = clamp((debt > 0 ? 0.35 : 0) + (rate > 0.12 ? 0.25 : 0), 0, 1);
  
  const fragility = clamp(
    0.34 * runwayFrag +
      0.22 * burnMultiFrag +
      0.18 * gmFrag +
      0.16 * raiseFrag +
      0.10 * debtFrag,
    0,
    1
  );
  
  const fragilityScore = Math.round(fragility * 100);
  const fragilityLabel = 
    fragilityScore < 25 ? "ROBUST" :
    fragilityScore < 50 ? "STABLE" :
    fragilityScore < 75 ? "MODERATE" : "FRAGILE";
  
  const fragilityColor =
    fragilityScore < 25 ? "#00eaff" :
    fragilityScore < 50 ? "#4ade80" :
    fragilityScore < 75 ? "#fbbf24" : "#ef4444";

  return (
    <div className="ms-container">
      <div className="ms-chassis">
        <div className="ms-rim">
          <div className="ms-well">
            {/* Header */}
            <div className="ms-header">
              <div className="ms-title">MODEL SENSITIVITY</div>
              <div className="ms-subtitle">Foundation-Derived Stochastic Parameters</div>
            </div>

            {/* Fragility Score */}
            <div className="ms-fragilityCard">
              <div className="ms-fragilityLabel">STRUCTURAL FRAGILITY</div>
              <div className="ms-fragilityScore" style={{ color: fragilityColor }}>
                {fragilityScore}
                <span className="ms-fragilityUnit">/100</span>
              </div>
              <div className="ms-fragilityRating" style={{ color: fragilityColor }}>
                {fragilityLabel}
              </div>
              <div className="ms-fragilityBar">
                <div 
                  className="ms-fragilityFill" 
                  style={{ 
                    width: `${fragilityScore}%`,
                    background: fragilityColor
                  }}
                />
              </div>
            </div>

            {/* Parameters Grid */}
            <div className="ms-grid">
              {/* Core Volatility */}
              <div className="ms-section">
                <div className="ms-sectionTitle">CORE VOLATILITY (Monthly)</div>
                <div className="ms-paramRow">
                  <div className="ms-paramLabel">Revenue Volatility</div>
                  <div className="ms-paramValue">{fmt(elasticity.revenueVolPct)}</div>
                  <div className="ms-paramRange">4–14%</div>
                </div>
                <div className="ms-paramRow">
                  <div className="ms-paramLabel">Churn Volatility</div>
                  <div className="ms-paramValue">{fmt(elasticity.churnVolPct)}</div>
                  <div className="ms-paramRange">12–40%</div>
                </div>
                <div className="ms-paramRow">
                  <div className="ms-paramLabel">Burn Volatility</div>
                  <div className="ms-paramValue">{fmt(elasticity.burnVolPct)}</div>
                  <div className="ms-paramRange">6–16%</div>
                </div>
              </div>

              {/* Tail Risk */}
              <div className="ms-section">
                <div className="ms-sectionTitle">TAIL-RISK EVENTS</div>
                <div className="ms-paramRow">
                  <div className="ms-paramLabel">Shock Probability</div>
                  <div className="ms-paramValue">{fmt(elasticity.shockProb)}</div>
                  <div className="ms-paramRange">2–12%</div>
                </div>
                <div className="ms-paramRow">
                  <div className="ms-paramLabel">Revenue Shock Severity</div>
                  <div className="ms-paramValue">{fmt(elasticity.shockSeverityRevenuePct)}</div>
                  <div className="ms-paramRange">10–26%</div>
                </div>
                <div className="ms-paramRow">
                  <div className="ms-paramLabel">Burn Shock Severity</div>
                  <div className="ms-paramValue">{fmt(elasticity.shockSeverityBurnPct)}</div>
                  <div className="ms-paramRange">8–24%</div>
                </div>
              </div>

              {/* Correlations */}
              <div className="ms-section">
                <div className="ms-sectionTitle">CORRELATIONS</div>
                <div className="ms-paramRow">
                  <div className="ms-paramLabel">Revenue ↔ Burn</div>
                  <div className="ms-paramValue">{fmtCorr(elasticity.corrRevenueBurn)}</div>
                  <div className="ms-paramRange">-0.85 to -0.15</div>
                </div>
                <div className="ms-paramRow">
                  <div className="ms-paramLabel">Revenue ↔ Churn</div>
                  <div className="ms-paramValue">{fmtCorr(elasticity.corrRevenueChurn)}</div>
                  <div className="ms-paramRange">-0.85 to -0.05</div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="ms-footer">
              <div className="ms-footerIcon">ℹ️</div>
              <div className="ms-footerText">
                These parameters are automatically derived from your Foundation baseline. 
                Higher fragility scores increase volatility and tail-risk probability in Monte Carlo simulations.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

