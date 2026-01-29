import React from "react";
import "./StrategicDeltaStrip.css";

interface Props {
  survivalDelta: number;
  runwayDelta: number;
  downsideRiskImproved: boolean;
}

export default function StrategicDeltaStrip({
  survivalDelta,
  runwayDelta,
  downsideRiskImproved,
}: Props) {
  const direction = survivalDelta >= 0 ? "POSITIVE" : "NEGATIVE";

  return (
    <div className="delta-strip">
      <div className="delta-left">
        <div className="delta-label">STRATEGIC DELTA</div>
        <div className={`delta-direction ${direction.toLowerCase()}`}>
          {direction}
        </div>
      </div>

      <div className="delta-metrics">
        <div className="metric">
          Survival {survivalDelta >= 0 ? "+" : ""}
          {survivalDelta}%
        </div>

        <div className="metric">
          Runway {runwayDelta >= 0 ? "+" : ""}
          {runwayDelta}m
        </div>

        <div className="metric">
          Downside EV Risk {downsideRiskImproved ? "↓" : "↑"}
        </div>
      </div>
    </div>
  );
}
