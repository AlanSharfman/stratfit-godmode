import React from "react";
import "./DeltaTable.css";

export default function DeltaTable() {
  return (
    <div className="delta-table">
      <div className="delta-title">DELTA ANALYSIS</div>

      <div className="delta-grid delta-header">
        <div>Metric</div>
        <div>Baseline</div>
        <div>Strategy</div>
        <div>Change</div>
        <div>Interpretation</div>
      </div>

      {[
        ["Runway (months)", "12.4", "15.6", "+3.2", "More time to execute"],
        ["Survival Probability", "62%", "78%", "+16%", "Higher durability"],
        ["Early Cash Stress Risk", "24%", "13%", "-11%", "Less early strain"],
        [
          "Enterprise Value (EV) — Median",
          "$42m",
          "$55m",
          "+$13m",
          "Higher upside",
        ],
        [
          "Enterprise Value (EV) — Lower",
          "$18m",
          "$20m",
          "+$2m",
          "Downside protected",
        ],
      ].map((r, idx) => (
        <div className="delta-grid delta-row" key={idx}>
          <div className="metric">{r[0]}</div>
          <div className="num">{r[1]}</div>
          <div className="num">{r[2]}</div>
          <div className="num">{r[3]}</div>
          <div className="interp">{r[4]}</div>
        </div>
      ))}
    </div>
  );
}


