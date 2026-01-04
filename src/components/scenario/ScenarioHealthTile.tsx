import React from "react";
import "./ScenarioHealthTile.css";

type Props = {
  scenario: "base" | "upside" | "downside";
  trend: "strengthening" | "stable" | "weakening";
};

function trendColor(trend: Props["trend"]) {
  if (trend === "strengthening") return "#00E5FF";
  if (trend === "weakening") return "#ef4444";
  return "#f59e0b";
}

function trendArrow(trend: Props["trend"]) {
  if (trend === "strengthening") return "↑";
  if (trend === "weakening") return "↓";
  return "→";
}

function slabOffset(trend: Props["trend"]) {
  // small motion only; KPI tile must stay calm
  if (trend === "strengthening") return -4;
  if (trend === "weakening") return 6;
  return 0;
}

export default function ScenarioHealthTile({ scenario, trend }: Props) {
  const c = trendColor(trend);

  return (
    <div
      className="sht"
      style={
        {
          ["--sht-accent" as any]: c,
          ["--sht-slabY" as any]: `${slabOffset(trend)}px`,
        } as React.CSSProperties
      }
    >
      <div className="sht__top">
        <div className="sht__label">SCENARIO HEALTH</div>
        <div className="sht__pill">{scenario.toUpperCase()}</div>
      </div>

      <div className="sht__mid" style={{ color: c }}>
        <span className="sht__arrow">{trendArrow(trend)}</span>
        <span className="sht__trend">{trend.toUpperCase()}</span>
      </div>

      <div className="sht__tray">
        <div className="sht__grid" />
        <div className="sht__slabWrap">
          <div className="sht__slab" />
        </div>
      </div>
    </div>
  );
}
