import React from "react";
import "./ExecutiveSummary.css";

export default function ExecutiveSummary() {
  return (
    <div className="exec-summary">
      <div className="exec-header">
        <div className="exec-title">EXECUTIVE SUMMARY</div>
        <div className="exec-verdict">VERDICT: STRATEGY WITHIN GUARDRAILS</div>
      </div>

      <div className="exec-grid">
        <div className="exec-row">
          <div className="exec-metric">Stability Integrity</div>
          <div className="exec-assessment">
            Stability remains intact under selected capital discipline.
          </div>
        </div>

        <div className="exec-row">
          <div className="exec-metric">Liquidity Position</div>
          <div className="exec-assessment">
            Runway extends while early cash stress risk declines materially.
          </div>
        </div>

        <div className="exec-row">
          <div className="exec-metric">Operational Momentum</div>
          <div className="exec-assessment">
            Momentum improves without breaching structural guardrails.
          </div>
        </div>

        <div className="exec-row">
          <div className="exec-metric">Enterprise Value Risk</div>
          <div className="exec-assessment">
            Downside Enterprise Value (EV) remains within tolerance band.
          </div>
        </div>
      </div>
    </div>
  );
}
