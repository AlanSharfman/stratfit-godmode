import React from "react";
import "./StabilityPanel.css";

export default function StabilityPanel() {
  return (
    <div className="stability-panel">
      <div className="stability-header">
        <div className="stability-title">BUSINESS STABILITY</div>
        <div className="stability-status">Status: STABLE</div>
        <div className="stability-profile">Capital Discipline: BALANCED</div>
      </div>

      <div className="stability-grid">
        <div className="stability-row">
          <div className="label">Runway Change</div>
          <div className="value">+3.2 months</div>
          <div className="note">Within tolerance</div>
        </div>

        <div className="stability-row">
          <div className="label">Survival Probability</div>
          <div className="value">62% → 78%</div>
          <div className="note">Improving</div>
        </div>

        <div className="stability-row">
          <div className="label">Early Cash Stress Risk</div>
          <div className="value">24% → 13%</div>
          <div className="note">Low likelihood of cash strain before stability</div>
        </div>

        <div className="stability-row">
          <div className="label">Enterprise Value (EV) — Lower Case</div>
          <div className="value">+12%</div>
          <div className="note">Within tolerance</div>
        </div>
      </div>
    </div>
  );
}


