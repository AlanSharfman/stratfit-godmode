// src/pages/StrategicAssessmentPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Strategic Intelligence Brief
// Institutional strategic assessment for Founders, Business Owners, Consultants,
// Investors, CFOs, and Executives.
// Deterministic output only. No GPT fluff. No gaming UI.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useSimulationStore, useSimulationStatus } from "@/state/simulationStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import BaselineMountain from "@/components/mountain/BaselineMountain";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import { useScenarioStore } from "@/state/scenarioStore";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./StrategicAssessmentPage.module.css";

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

interface StructuralDriver {
  statement: string;
  type: "strength" | "fragility" | "neutral";
}

interface LeverageOpportunity {
  leverName: string;
  evUplift: number;
  survivalDelta: number;
  explanation: string;
}

// ────────────────────────────────────────────────────────────────────────────
// STRATEGIC POSTURE PANEL
// ────────────────────────────────────────────────────────────────────────────

const StrategicPosturePanel: React.FC<{
  survivalPct: number;
  evP10: number;
  evP50: number;
  evP90: number;
  capitalSensitivity: number;
  runwayUnderStress: number;
}> = ({ survivalPct, evP10, evP50, evP90, capitalSensitivity, runwayUnderStress }) => {
  const failurePct = 100 - survivalPct;
  const dispersionRatio = evP90 / Math.max(1, evP10);

  return (
    <div className={styles.posturePanel}>
      <h2 className={styles.sectionHeader}>STRATEGIC POSTURE</h2>
      <div className={styles.postureGrid}>
        <div className={styles.postureMetric}>
          <div className={styles.postureValue}>{survivalPct}%</div>
          <div className={styles.postureLabel}>Survival Probability (36 months)</div>
          <div className={styles.postureExplanation}>
            In {failurePct}% of modeled futures, capital depletion occurs before 36 months.
          </div>
        </div>

        <div className={styles.postureMetric}>
          <div className={styles.postureValue}>
            ${evP10.toFixed(1)}M – ${evP90.toFixed(1)}M
          </div>
          <div className={styles.postureLabel}>Projected Enterprise Value Band (P10 – P90)</div>
          <div className={styles.postureExplanation}>
            Value dispersion reflects growth durability and margin resilience.
          </div>
        </div>

        <div className={styles.postureMetric}>
          <div className={styles.postureValue}>${evP50.toFixed(1)}M</div>
          <div className={styles.postureLabel}>Most Probable EV (P50)</div>
          <div className={styles.postureExplanation}>
            Median valuation across all simulated scenarios.
          </div>
        </div>

        <div className={styles.postureMetric}>
          <div className={styles.postureValue}>{capitalSensitivity.toFixed(1)}x</div>
          <div className={styles.postureLabel}>Capital Sensitivity Index</div>
          <div className={styles.postureExplanation}>
            {capitalSensitivity > 3
              ? "High capital dependency. Burn efficiency critical."
              : capitalSensitivity > 2
              ? "Moderate capital sensitivity. Standard monitoring required."
              : "Low capital sensitivity. Strong unit economics."}
          </div>
        </div>

        <div className={styles.postureMetric}>
          <div className={styles.postureValue}>{runwayUnderStress.toFixed(1)} mo</div>
          <div className={styles.postureLabel}>Runway Under Stress</div>
          <div className={styles.postureExplanation}>
            P10 runway scenario. Minimum viable planning horizon.
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// ASSESSMENT MOUNTAIN PANEL
// ────────────────────────────────────────────────────────────────────────────

const AssessmentMountainPanel: React.FC<{
  dataPoints: number[];
  survivalProbability: number;
  varianceWidth: number;
  runwayMonths: number;
}> = ({ dataPoints, survivalProbability, varianceWidth, runwayMonths }) => {
  const simulationStatus = useSimulationStatus();
  return (
    <div className={styles.mountainPanel}>
      <h3 className={styles.mountainLabel}>STRUCTURAL STATE VISUALIZATION</h3>
      <div className={styles.mountainCanvas}>
        <BaselineMountain
          dataPoints={dataPoints}
          survivalProbability={survivalProbability}
          varianceWidth={varianceWidth}
          runwayMonths={runwayMonths}
          maxHorizonMonths={36}
          computeState={simulationStatus}
          showGrid
        />
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// STRUCTURAL DIAGNOSIS PANEL
// ────────────────────────────────────────────────────────────────────────────

const StructuralDiagnosisPanel: React.FC<{
  drivers: StructuralDriver[];
}> = ({ drivers }) => {
  return (
    <div className={styles.diagnosisPanel}>
      <h2 className={styles.sectionHeader}>STRUCTURAL DIAGNOSIS</h2>
      <ul className={styles.diagnosisList}>
        {drivers.map((d, i) => (
          <li key={i} className={styles.diagnosisItem} data-type={d.type}>
            {d.statement}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// CAPITAL VIEW (COLLAPSIBLE)
// ────────────────────────────────────────────────────────────────────────────

const CapitalViewExpandablePanel: React.FC<{
  evP10: number;
  evP50: number;
  evP90: number;
  burnToValueRatio: number;
  downsideCompression: number;
  capitalEfficiency: number;
}> = ({ evP10, evP50, evP90, burnToValueRatio, downsideCompression, capitalEfficiency }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.capitalPanel}>
      <button
        type="button"
        className={styles.capitalHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className={styles.sectionHeader}>CAPITAL VIEW</h2>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {expanded && (
        <div className={styles.capitalTable}>
          <div className={styles.capitalRow}>
            <span className={styles.capitalLabel}>P10 Enterprise Value</span>
            <span className={styles.capitalValue}>${evP10.toFixed(1)}M</span>
          </div>
          <div className={styles.capitalRow}>
            <span className={styles.capitalLabel}>P50 Enterprise Value</span>
            <span className={styles.capitalValue}>${evP50.toFixed(1)}M</span>
          </div>
          <div className={styles.capitalRow}>
            <span className={styles.capitalLabel}>P90 Enterprise Value</span>
            <span className={styles.capitalValue}>${evP90.toFixed(1)}M</span>
          </div>
          <div className={styles.capitalRow}>
            <span className={styles.capitalLabel}>Burn-to-Value Ratio</span>
            <span className={styles.capitalValue}>{burnToValueRatio.toFixed(2)}x</span>
          </div>
          <div className={styles.capitalRow}>
            <span className={styles.capitalLabel}>Downside Compression Index</span>
            <span className={styles.capitalValue}>{downsideCompression.toFixed(1)}%</span>
          </div>
          <div className={styles.capitalRow}>
            <span className={styles.capitalLabel}>Capital Efficiency</span>
            <span className={styles.capitalValue}>{capitalEfficiency.toFixed(1)}x</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// STRATEGIC LEVERAGE PANEL
// ────────────────────────────────────────────────────────────────────────────

const StrategicLeveragePanel: React.FC<{
  opportunities: LeverageOpportunity[];
}> = ({ opportunities }) => {
  return (
    <div className={styles.leveragePanel}>
      <h2 className={styles.sectionHeader}>STRATEGIC LEVERAGE</h2>
      <div className={styles.leverageGrid}>
        {opportunities.slice(0, 3).map((opp, i) => (
          <div key={i} className={styles.leverageCard}>
            <div className={styles.leverageLever}>{opp.leverName}</div>
            <div className={styles.leverageImpact}>
              <span className={styles.leverageEV}>+${opp.evUplift.toFixed(1)}M median EV</span>
              <span className={styles.leverageSurvival}>
                {opp.survivalDelta >= 0 ? "+" : ""}
                {opp.survivalDelta.toFixed(0)}% survival probability
              </span>
            </div>
            <div className={styles.leverageExplanation}>{opp.explanation}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE SUMMARY STRIP
// ────────────────────────────────────────────────────────────────────────────

const IntelligenceSummaryStrip: React.FC<{
  statements: string[];
}> = ({ statements }) => {
  return (
    <div className={styles.summaryStrip}>
      <h3 className={styles.summaryHeader}>WHAT THIS MEANS</h3>
      <ul className={styles.summaryList}>
        {statements.map((s, i) => (
          <li key={i} className={styles.summaryItem}>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────────────────────

export default function StrategicAssessmentPage() {
  const { fullResult, fullVerdict, summary } = useSimulationStore();
  const { baseline: systemBaseline } = useSystemBaseline();
  const { engineResults } = useScenarioStore();

  // ── Derive mountain data points ──
  const baselineResult = engineResults?.base ?? null;
  const dataPoints = useMemo(
    () => engineResultToMountainForces(baselineResult),
    [baselineResult]
  );

  // ── Gate: require simulation ──
  if (!fullResult || !fullVerdict || !summary) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path
              d="M40 5L10 20V40C10 55 22 68 40 75C58 68 70 55 70 40V20L40 5Z"
              stroke="rgba(34, 211, 238, 0.3)"
              strokeWidth="2"
              fill="rgba(34, 211, 238, 0.05)"
            />
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>Strategic Assessment Unavailable</h2>
        <p className={styles.emptyDescription}>
          Run a simulation to generate your Strategic Intelligence Brief.
        </p>
        <button
          className={styles.emptyAction}
          onClick={() =>
            window.dispatchEvent(new CustomEvent("stratfit:navigate", { detail: "simulate" }))
          }
        >
          Run Simulation →
        </button>
      </div>
    );
  }

  // ── Derive metrics from simulation results ──
  const survivalPct = Math.round(fullResult.survivalRate * 100);
  const evP10 = (fullResult.arrPercentiles.p10 / 1000000) * 3.5; // Simplified EV = ARR × 3.5x
  const evP50 = (fullResult.arrPercentiles.p50 / 1000000) * 3.5;
  const evP90 = (fullResult.arrPercentiles.p90 / 1000000) * 3.5;
  
  // Extract baseline inputs safely
  const baselineMonthlyBurn = systemBaseline?.financial?.monthlyBurn ?? 400000;
  const baselineStartingCash = systemBaseline?.financial?.cashOnHand ?? 4000000;
  
  const capitalSensitivity = (baselineMonthlyBurn * 12) / Math.max(1, evP50 * 1000000);
  const runwayUnderStress = fullResult.runwayPercentiles.p10;

  const burnToValueRatio = (baselineMonthlyBurn * 12) / Math.max(1, evP50 * 1000000);
  const downsideCompression = ((evP50 - evP10) / Math.max(1, evP50)) * 100;
  const capitalEfficiency = evP50 / Math.max(1, baselineStartingCash / 1000000);

  // Variance width for dispersion atmosphere (0–1 scale)
  // Derived from EV dispersion ratio: wider spread → more variance
  const dispersionRatio = evP90 / Math.max(1, evP10);
  const varianceWidth = clamp01((dispersionRatio - 1) / 10); // Normalize: 1x = 0, 11x+ = 1

  // ── Structural Diagnosis (deterministic) ──
  const structuralDrivers: StructuralDriver[] = useMemo(() => {
    const drivers: StructuralDriver[] = [];
    const sens = fullResult.sensitivityFactors;

    // Growth durability
    const demandImpact = sens.find((s) => s.lever === "demandStrength")?.impact ?? 0;
    if (Math.abs(demandImpact) > 0.5) {
      drivers.push({
        statement:
          demandImpact > 0
            ? "Growth durable but capital-dependent."
            : "Growth fragility detected. Demand sensitivity high.",
        type: demandImpact > 0 ? "strength" : "fragility",
      });
    }

    // Revenue sensitivity
    const pricingImpact = sens.find((s) => s.lever === "pricingPower")?.impact ?? 0;
    if (Math.abs(pricingImpact) > 0.4) {
      drivers.push({
        statement: "Revenue sensitivity is primary fragility driver.",
        type: "fragility",
      });
    }

    // Margin stability
    const costImpact = sens.find((s) => s.lever === "costDiscipline")?.impact ?? 0;
    if (Math.abs(costImpact) > 0.3) {
      drivers.push({
        statement:
          costImpact > 0
            ? "Margin stability offsets burn pressure."
            : "Cost rigidity constrains strategic flexibility.",
        type: costImpact > 0 ? "strength" : "fragility",
      });
    }

    // Downside asymmetry
    if (downsideCompression > 40) {
      drivers.push({
        statement: "Downside asymmetry remains material.",
        type: "fragility",
      });
    }

    return drivers.length > 0
      ? drivers
      : [{ statement: "Structural profile balanced. No dominant fragility.", type: "neutral" }];
  }, [fullResult, downsideCompression]);

  // ── Strategic Leverage (top 3 opportunities) ──
  const leverageOpportunities: LeverageOpportunity[] = useMemo(() => {
    const sens = fullResult.sensitivityFactors;
    return sens
      .filter((s) => s.impact > 0.2)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 3)
      .map((s) => ({
        leverName: s.label,
        evUplift: Math.abs(s.impact) * evP50 * 0.25, // Simplified delta
        survivalDelta: Math.abs(s.impact) * 10, // Simplified survival uplift
        explanation:
          s.direction === "positive"
            ? "Strengthening this lever reduces downside dispersion."
            : "Mitigating this risk improves survival probability.",
      }));
  }, [fullResult, evP50]);

  // ── Intelligence Summary ──
  const intelligenceSummary: string[] = useMemo(() => {
    const statements: string[] = [];

    // Posture
    if (survivalPct >= 75) {
      statements.push("Current structural posture: Stable with manageable risk exposure");
    } else if (survivalPct >= 50) {
      statements.push("Current structural posture: Stable but capital-sensitive");
    } else {
      statements.push("Current structural posture: Elevated risk. Intervention recommended");
    }

    // Primary exposure
    const topRisk = fullResult.sensitivityFactors
      .filter((s) => s.direction === "negative")
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0];
    if (topRisk) {
      statements.push(`Primary exposure: ${topRisk.label}`);
    }

    // Capital strategy
    if (capitalSensitivity > 3) {
      statements.push("Capital strategy recommended: Efficiency before expansion");
    } else if (capitalSensitivity > 2) {
      statements.push("Capital strategy recommended: Balanced growth and efficiency");
    } else {
      statements.push("Capital strategy recommended: Growth-optimized deployment");
    }

    // Risk asymmetry
    if (downsideCompression > 50) {
      statements.push("Risk asymmetry: High. Downside protection critical");
    } else if (downsideCompression > 30) {
      statements.push("Risk asymmetry: Moderate. Standard risk management applies");
    } else {
      statements.push("Risk asymmetry: Low. Upside optionality preserved");
    }

    return statements;
  }, [survivalPct, fullResult, capitalSensitivity, downsideCompression]);

  return (
    <div className={styles.root}>
      <StrategicPosturePanel
        survivalPct={survivalPct}
        evP10={evP10}
        evP50={evP50}
        evP90={evP90}
        capitalSensitivity={capitalSensitivity}
        runwayUnderStress={runwayUnderStress}
      />

      <AssessmentMountainPanel
        dataPoints={dataPoints}
        survivalProbability={survivalPct}
        varianceWidth={varianceWidth}
        runwayMonths={runwayUnderStress}
      />

      <StructuralDiagnosisPanel drivers={structuralDrivers} />

      <CapitalViewExpandablePanel
        evP10={evP10}
        evP50={evP50}
        evP90={evP90}
        burnToValueRatio={burnToValueRatio}
        downsideCompression={downsideCompression}
        capitalEfficiency={capitalEfficiency}
      />

      <StrategicLeveragePanel opportunities={leverageOpportunities} />

      <IntelligenceSummaryStrip statements={intelligenceSummary} />
    </div>
  );
}

