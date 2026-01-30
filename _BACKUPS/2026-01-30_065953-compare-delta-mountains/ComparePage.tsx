import React from "react";
import DualMountainInstrument from "./DualMountainInstrument";
import StabilityPanel from "./StabilityPanel";
import DeltaTable from "./DeltaTable";
import ExecutiveSummary from "./ExecutiveSummary";
import StrategicDeltaStrip from "./StrategicDeltaStrip";
import "./ComparePage.css";

const ComparePage: React.FC = () => {
  return (
    <div className="compare-page-root">

      <StrategicDeltaStrip
        survivalDelta={16}
        runwayDelta={3.2}
        downsideRiskImproved={true}
      />

      <section className="compare-interpretation">
        <div className="founder-interpretation">
          This strategy improves survival probability and extends liquidity
          without increasing early-stage cash compression.
        </div>

        <div className="institutional-interpretation">
          Median enterprise value expands while downside dispersion narrows
          under stress conditions.
        </div>
      </section>

      <section className="compare-mountain-section">
        <DualMountainInstrument />
      </section>

      <section className="compare-stability-section">
        <StabilityPanel />
      </section>

      <section className="compare-delta-section">
        <DeltaTable />
      </section>

      <section className="compare-summary-section">
        <ExecutiveSummary />
      </section>
    </div>
  );
};

export default ComparePage;
