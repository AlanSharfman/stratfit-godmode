// src/components/Risk/RiskPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — RISK PAGE (INSTITUTIONAL GOD MODE)
// Multi-dimensional fragility system.
// Dual-layer radar, horizon filtering, controllability, interaction map,
// survival linkage, density view, right panel.
// No new simulation runs. All metrics derived from existing stores.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from "react";
import { useRiskStore, type RiskFactor, type RiskSnapshot } from "@/state/riskStore";
import { useLeverStore } from "@/state/leverStore";
import { useSimulationStore } from "@/state/simulationStore";

import RiskCommandBar from "./RiskCommandBar";
import RiskHorizonToggle, { type RiskHorizon, type RiskViewMode } from "./RiskHorizonToggle";
import RiskRadar from "./RiskRadar";
import RiskSurvivalImpactPanel from "./RiskSurvivalImpactPanel";
import RiskDensityView from "./RiskDensityView";
import RiskRightPanel from "./RiskRightPanel";

import styles from "./RiskPage.module.css";

// ── Default levers for baseline comparison ──────────────────────────
const DEFAULT_LEVERS: Record<string, number> = {
  demandStrength: 50,
  pricingPower: 50,
  expansionVelocity: 50,
  costDiscipline: 50,
  hiringIntensity: 50,
  operatingDrag: 50,
  marketVolatility: 50,
  executionRisk: 50,
  fundingPressure: 50,
};

// ── Horizon filter helper ───────────────────────────────────────────
function getHorizonMonths(horizon: RiskHorizon): [number, number] {
  switch (horizon) {
    case "short": return [0, 6];
    case "mid": return [6, 18];
    case "long": return [18, 36];
  }
}

// ── Derive trend from baseline vs scenario ──────────────────────────
function deriveTrend(
  baselineScore: number,
  scenarioScore: number
): "improving" | "stable" | "deteriorating" {
  const diff = scenarioScore - baselineScore;
  if (diff < -5) return "improving";
  if (diff > 5) return "deteriorating";
  return "stable";
}

// ── Derive volatility from factor score variance ────────────────────
function deriveVolatility(factors: RiskFactor[]): "low" | "medium" | "high" {
  if (factors.length === 0) return "medium";
  const scores = factors.map((f) => f.score);
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev < 10) return "low";
  if (stdDev < 20) return "medium";
  return "high";
}

// ── Apply horizon weighting to factors ──────────────────────────────
const CATEGORY_HORIZON_WEIGHT: Record<string, Record<RiskHorizon, number>> = {
  runway: { short: 1.3, mid: 1.0, long: 0.7 },
  market: { short: 0.7, mid: 1.0, long: 1.3 },
  execution: { short: 0.9, mid: 1.2, long: 1.0 },
  competition: { short: 0.6, mid: 0.9, long: 1.4 },
  funding: { short: 1.2, mid: 1.1, long: 0.8 },
  churn: { short: 0.8, mid: 1.1, long: 1.1 },
};

function applyHorizonWeight(factors: RiskFactor[], horizon: RiskHorizon): RiskFactor[] {
  return factors.map((f) => {
    const weight = CATEGORY_HORIZON_WEIGHT[f.category]?.[horizon] ?? 1.0;
    return {
      ...f,
      score: Math.round(Math.min(100, Math.max(0, f.score * weight))),
    };
  });
}

// ═════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════
const RiskPage: React.FC = () => {
  const [horizon, setHorizon] = useState<RiskHorizon>("mid");
  const [viewMode, setViewMode] = useState<RiskViewMode>("radar");

  // ── Store data ──
  const riskSnapshot = useRiskStore((s) => s.riskSnapshot);
  const calculateRisk = useRiskStore((s) => s.calculateRisk);
  const levers = useLeverStore((s) => s.levers);
  const simulation = useSimulationStore((s) => s.summary);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);

  // ── Calculate risk on mount / lever change ──
  useEffect(() => {
    calculateRisk(
      levers as Record<string, number>,
      simulation
        ? {
            survivalRate: simulation.survivalRate,
            medianRunway: simulation.runwayMedian,
            medianARR: simulation.arrMedian,
            arrRange: { p10: simulation.arrP10, p90: simulation.arrP90 },
          }
        : null
    );
  }, [levers, simulation, calculateRisk]);

  // ── Compute baseline risk for dual-layer radar ──
  const baselineSnapshot: RiskSnapshot | null = useMemo(() => {
    // Use default levers as "baseline" for comparison
    return calculateRisk(
      DEFAULT_LEVERS,
      simulation
        ? {
            survivalRate: simulation.survivalRate,
            medianRunway: simulation.runwayMedian,
            medianARR: simulation.arrMedian,
          }
        : null
    );
  }, [simulation, calculateRisk]);

  // ── Apply horizon weighting ──
  const horizonFactors = useMemo(() => {
    if (!riskSnapshot) return [];
    return applyHorizonWeight(riskSnapshot.factors, horizon);
  }, [riskSnapshot, horizon]);

  const horizonBaselineFactors = useMemo(() => {
    if (!baselineSnapshot) return null;
    return applyHorizonWeight(baselineSnapshot.factors, horizon);
  }, [baselineSnapshot, horizon]);

  // ── Horizon-weighted overall score ──
  const horizonScore = useMemo(() => {
    if (horizonFactors.length === 0) return 0;
    const weights: Record<string, number> = {
      runway: 0.25, market: 0.15, execution: 0.20,
      competition: 0.10, funding: 0.20, churn: 0.10,
    };
    return Math.round(
      horizonFactors.reduce((sum, f) => sum + f.score * (weights[f.category] ?? 0.15), 0)
    );
  }, [horizonFactors]);

  const baselineScore = useMemo(() => {
    if (!baselineSnapshot) return 0;
    return baselineSnapshot.overallScore;
  }, [baselineSnapshot]);

  // ── Derived metrics ──
  const trend = useMemo(
    () => deriveTrend(baselineScore, horizonScore),
    [baselineScore, horizonScore]
  );

  const volatility = useMemo(
    () => deriveVolatility(horizonFactors),
    [horizonFactors]
  );

  // ── Simulation data for survival linkage ──
  const survivalRate = simulation?.survivalRate ?? 0.5;
  const medianRunway = simulation?.runwayMedian ?? 18;

  // ── Timeline for density view ──
  const timeline = riskSnapshot?.timeline ?? [];

  // ── Breakdown cards for BREAKDOWN view ──
  const getScoreColor = (score: number) => {
    if (score <= 30) return "#00E0FF";
    if (score <= 50) return "#fbbf24";
    if (score <= 70) return "#f97316";
    return "#FF4D4D";
  };

  // ── Empty state ──
  if (!hasSimulated || !simulation) {
    return (
      <div className={styles.root}>
        <RiskCommandBar score={0} trend="stable" volatility="medium" />
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Risk Analysis Unavailable</div>
          <div className={styles.emptyText}>
            Run a simulation in Strategy Studio to generate risk intelligence.
          </div>
        </div>
      </div>
    );
  }

  if (!riskSnapshot) {
    return (
      <div className={styles.root}>
        <RiskCommandBar score={0} trend="stable" volatility="medium" />
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Calculating Risk Profile</div>
          <div className={styles.emptyText}>Analyzing threat vectors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* ── PHASE 1: COMMAND BAR ─────────────────────────── */}
      <RiskCommandBar
        score={horizonScore}
        trend={trend}
        volatility={volatility}
      />

      {/* ── PHASE 2 + 9: HORIZON + VIEW TOGGLE ────────── */}
      <RiskHorizonToggle
        horizon={horizon}
        onHorizonChange={setHorizon}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div className={styles.main}>
        {/* ── PRIMARY (LEFT) ─────────────────────────────── */}
        <div className={styles.primary}>
          {/* RADAR VIEW */}
          {viewMode === "radar" && (
            <>
              <RiskRadar
                factors={horizonFactors}
                baselineFactors={horizonBaselineFactors}
              />
              <RiskSurvivalImpactPanel
                factors={horizonFactors}
                survivalRate={survivalRate}
                medianRunway={medianRunway}
              />
            </>
          )}

          {/* DENSITY VIEW */}
          {viewMode === "density" && (
            <>
              <RiskDensityView timeline={timeline} horizon={horizon} />
              <RiskSurvivalImpactPanel
                factors={horizonFactors}
                survivalRate={survivalRate}
                medianRunway={medianRunway}
              />
            </>
          )}

          {/* BREAKDOWN VIEW */}
          {viewMode === "breakdown" && (
            <div className={styles.breakdownGrid}>
              {horizonFactors
                .sort((a, b) => b.score - a.score)
                .map((f) => (
                  <div key={f.id} className={styles.breakdownCard}>
                    <div className={styles.breakdownCardHeader}>
                      <span className={styles.breakdownCardName}>
                        {f.label.replace(" Risk", "")}
                      </span>
                      <span
                        className={styles.breakdownCardScore}
                        style={{ color: getScoreColor(f.score) }}
                      >
                        {f.score}
                      </span>
                    </div>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{
                          width: `${f.score}%`,
                          background: getScoreColor(f.score),
                        }}
                      />
                    </div>
                    <div className={styles.breakdownCardMeta}>
                      <span
                        className={styles.riskEntryMetaItem}
                        style={{
                          color:
                            f.trend === "improving"
                              ? "#00D084"
                              : f.trend === "worsening"
                                ? "#FF4D4D"
                                : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {f.trend === "improving" ? "↓" : f.trend === "worsening" ? "↑" : "→"}{" "}
                        {f.trend.charAt(0).toUpperCase() + f.trend.slice(1)}
                      </span>
                      <span className={styles.riskEntryMetaItem}>
                        {f.controllable ? "Controllable" : "External"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ── PHASE 8: RIGHT PANEL ──────────────────────── */}
        <RiskRightPanel factors={horizonFactors} />
      </div>
    </div>
  );
};

export default RiskPage;





