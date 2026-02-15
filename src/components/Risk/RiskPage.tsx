// src/components/Risk/RiskPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — RISK 2.0: STRUCTURAL SHOCK PROPAGATION ENGINE
//
// 3-column layout:
//   LEFT   — σ shock slider + Transmission Map
//   CENTER — Survival Curve Comparison (baseline vs shocked)
//   RIGHT  — Risk Index Card + Commentary + Legal Disclosure
//
// Data flow:
//   simulationStore.fullResult → baseline metrics
//   riskStore.shockSigma       → computeShockedBatch → shocked metrics
//   baseline + shocked         → transmissionNodes + riskIndex
//
// No fake categories. No static radar. Derived from simulation.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRiskStore } from "@/state/riskStore";
import { useLeverStore } from "@/state/leverStore";
import { useSimulationStore } from "@/state/simulationStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import SoftGateOverlay from "@/components/common/SoftGateOverlay";

import {
  computeShockedBatch,
  buildTransmissionNodes,
  computeRiskIndex,
  type ShockedBatchResult,
  type BaselineMetrics,
  type TransmissionNode,
  type RiskIndexResult,
} from "@/logic/risk/computeRiskIndex";
import type { LeverState, SimulationConfig } from "@/logic/monteCarloEngine";

import RiskTransmissionMap from "./RiskTransmissionMap";
import SurvivalCurveComparison from "./SurvivalCurveComparison";
import RiskCommandBar from "./RiskCommandBar";

import styles from "./RiskPage.module.css";

// ── Sigma labels ─────────────────────────────────────────────────────
const SIGMA_LABELS: Record<number, string> = {
  0: "Baseline (σ = 0)",
  1: "Moderate Stress (σ = 1)",
  2: "Severe Stress (σ = 2)",
  3: "Extreme Stress (σ = 3)",
};

function getSigmaColor(sigma: number): string {
  if (sigma <= 0) return "#00E0FF";
  if (sigma <= 1) return "#fbbf24";
  if (sigma <= 2) return "#f97316";
  return "#ef4444";
}

// ── Risk Index band color ────────────────────────────────────────────
function getBandColor(band: RiskIndexResult["band"]): string {
  switch (band) {
    case "Low": return "#34d399";
    case "Moderate": return "#00E0FF";
    case "Elevated": return "#fbbf24";
    case "Critical": return "#ef4444";
  }
}

// ═════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════

const RiskPage: React.FC = () => {
  // ── Store reads ──
  const shockSigma = useRiskStore((s) => s.shockSigma);
  const setShockSigma = useRiskStore((s) => s.setShockSigma);
  const fullResult = useSimulationStore((s) => s.fullResult);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  const summary = useSimulationStore((s) => s.summary);
  const leversRaw = useLeverStore((s) => s.levers);
  const { baseline: systemBaseline } = useSystemBaseline();
  const hasBaseline = systemBaseline !== null;

  // ── Local state ──
  const [shockedBatch, setShockedBatch] = useState<ShockedBatchResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derive levers ──
  const levers: LeverState = useMemo(
    () => ({
      demandStrength: leversRaw?.demandStrength ?? 50,
      pricingPower: leversRaw?.pricingPower ?? 50,
      expansionVelocity: leversRaw?.expansionVelocity ?? 50,
      costDiscipline: leversRaw?.costDiscipline ?? 50,
      hiringIntensity: leversRaw?.hiringIntensity ?? 50,
      operatingDrag: leversRaw?.operatingDrag ?? 50,
      marketVolatility: leversRaw?.marketVolatility ?? 50,
      executionRisk: leversRaw?.executionRisk ?? 50,
      fundingPressure: leversRaw?.fundingPressure ?? 50,
    }),
    [leversRaw]
  );

  // ── Simulation config ──
  const config: SimulationConfig = useMemo(() => {
    const fin = systemBaseline?.financial;
    return {
      iterations: 200, // mini-batch for shock (fast)
      timeHorizonMonths: fullResult?.timeHorizonMonths ?? 36,
      startingCash: fin?.cashOnHand ?? 4_000_000,
      startingARR: fin?.arr ?? 4_800_000,
      monthlyBurn: fin?.monthlyBurn ?? 47_000,
    };
  }, [fullResult, systemBaseline]);

  // ── Baseline metrics from full MC result ──
  const baselineMetrics: BaselineMetrics | null = useMemo(() => {
    if (!fullResult || !summary) return null;
    // Derive churn rate from simulation paths
    const allGrowths = fullResult.allSimulations.flatMap((r) =>
      r.monthlySnapshots.map((s) => s.growthRate)
    );
    const negGrowths = allGrowths.filter((g) => g < 0);
    const churnRate =
      negGrowths.length > 0
        ? Math.abs(negGrowths.reduce((a, b) => a + b, 0) / negGrowths.length) * 100
        : 0;

    return {
      survivalRate: fullResult.survivalRate,
      medianARR: fullResult.arrPercentiles.p50,
      medianRunway: fullResult.runwayPercentiles.p50,
      medianBurn:
        fullResult.allSimulations.reduce((sum, s) => {
          const last = s.monthlySnapshots[s.monthlySnapshots.length - 1];
          return sum + (last?.burn ?? 0);
        }, 0) / fullResult.allSimulations.length,
      churnRate,
    };
  }, [fullResult, summary]);

  // ── Compute shocked batch (debounced) ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (shockSigma === 0 || !baselineMetrics) {
      setShockedBatch(null);
      setIsComputing(false);
      return;
    }

    setIsComputing(true);
    debounceRef.current = setTimeout(() => {
      const batch = computeShockedBatch(levers, config, shockSigma, 200);
      setShockedBatch(batch);
      setIsComputing(false);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [shockSigma, levers, config, baselineMetrics]);

  // ── Transmission nodes ──
  const transmissionNodes: TransmissionNode[] = useMemo(() => {
    if (!baselineMetrics || !shockedBatch) return [];
    return buildTransmissionNodes(baselineMetrics, shockedBatch);
  }, [baselineMetrics, shockedBatch]);

  // ── Risk Index ──
  const riskIndex: RiskIndexResult | null = useMemo(() => {
    if (!baselineMetrics || !shockedBatch || !fullResult) return null;
    return computeRiskIndex({
      baselineSurvival: baselineMetrics.survivalRate,
      shockedSurvival: shockedBatch.survivalRate,
      baselineRunway: baselineMetrics.medianRunway,
      shockedRunway: shockedBatch.medianRunway,
      arrP25: fullResult.arrPercentiles.p25,
      arrP50: fullResult.arrPercentiles.p50,
      arrP75: fullResult.arrPercentiles.p75,
      leverDebtExposure: levers.fundingPressure,
    });
  }, [baselineMetrics, shockedBatch, fullResult, levers.fundingPressure]);

  // ── Derived command bar ──
  const commandScore = riskIndex ? Math.round(riskIndex.score * 100) : 0;
  const commandTrend: "improving" | "stable" | "deteriorating" = useMemo(() => {
    if (!riskIndex) return "stable";
    if (riskIndex.score < 0.25) return "improving";
    if (riskIndex.score > 0.6) return "deteriorating";
    return "stable";
  }, [riskIndex]);

  // ── Slider handler ──
  const handleSigmaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShockSigma(parseFloat(e.target.value));
    },
    [setShockSigma]
  );

  // ── Empty state ──
  if (!hasSimulated || !fullResult) {
    return (
      <div className={styles.root} style={{ position: "relative" }}>
        {!hasBaseline && (
          <SoftGateOverlay message="Complete onboarding before running risk analysis." />
        )}

        <div style={{ filter: !hasBaseline ? "blur(4px)" : "none" }}>
          <RiskCommandBar score={0} trend="stable" volatility="medium" />
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Structural Risk Analysis Unavailable</div>
            <div className={styles.emptyText}>
              Run a simulation in Strategy Studio to unlock the shock propagation engine.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sigmaColor = getSigmaColor(shockSigma);
  const sigmaLabel = SIGMA_LABELS[Math.round(shockSigma)] ?? `σ = ${shockSigma.toFixed(1)}`;

  return (
    <div className={styles.root} style={{ position: "relative" }}>
      {!hasBaseline && (
        <SoftGateOverlay message="Complete onboarding before running risk analysis." />
      )}

      <div style={{ filter: !hasBaseline ? "blur(4px)" : "none" }}>
      {/* ── COMMAND BAR ─────────────────────────────────────── */}
      <RiskCommandBar
        score={commandScore}
        trend={commandTrend}
        volatility={riskIndex && riskIndex.components.varianceDispersion > 0.5 ? "high" : riskIndex && riskIndex.components.varianceDispersion > 0.2 ? "medium" : "low"}
      />

      {/* ── MAIN 3-COLUMN LAYOUT ───────────────────────────── */}
      <div className={styles.main}>
        {/* ═══ LEFT: SHOCK CONTROLLER + TRANSMISSION MAP ═══ */}
        <div className={styles.leftCol}>
          {/* Shock σ Slider */}
          <div className={styles.shockController}>
            <div className={styles.sectionTitle}>Shock Controller</div>
            <div className={styles.sigmaDisplay} style={{ color: sigmaColor }}>
              σ = {shockSigma.toFixed(1)}
            </div>
            <div className={styles.sigmaLabel}>{sigmaLabel}</div>
            <div className={styles.sigmaSliderWrap}>
              <span className={styles.sigmaTickLabel}>0</span>
              <input
                type="range"
                className={styles.sigmaSlider}
                min={0}
                max={3}
                step={0.1}
                value={shockSigma}
                onChange={handleSigmaChange}
                style={{
                  "--thumb-color": sigmaColor,
                } as React.CSSProperties}
              />
              <span className={styles.sigmaTickLabel}>3</span>
            </div>
            <div className={styles.sigmaTicks}>
              {[0, 1, 2, 3].map((t) => (
                <button
                  key={t}
                  className={`${styles.sigmaTickBtn} ${Math.round(shockSigma) === t ? styles.sigmaTickBtnActive : ""}`}
                  onClick={() => setShockSigma(t)}
                  style={Math.round(shockSigma) === t ? { color: sigmaColor, borderColor: sigmaColor } : undefined}
                >
                  {t}σ
                </button>
              ))}
            </div>
          </div>

          {/* Transmission Map */}
          <div className={styles.transmissionSection}>
            <RiskTransmissionMap
              nodes={transmissionNodes}
              isComputing={isComputing}
            />
          </div>
        </div>

        {/* ═══ CENTER: SURVIVAL DISTRIBUTION ═══ */}
        <div className={styles.centerCol}>
          <SurvivalCurveComparison
            baselineSurvivalByMonth={fullResult.survivalByMonth}
            shockedSurvivalByMonth={shockedBatch?.survivalByMonth ?? fullResult.survivalByMonth}
            baselineSurvivalRate={fullResult.survivalRate}
            shockedSurvivalRate={shockedBatch?.survivalRate ?? fullResult.survivalRate}
            timeHorizonMonths={fullResult.timeHorizonMonths}
            isComputing={isComputing}
          />

          {/* Shocked Classification Badge */}
          {shockedBatch && (
            <div className={styles.classificationStrip}>
              <span className={styles.classLabel}>Shocked Classification</span>
              <span
                className={styles.classBadge}
                style={{
                  color: shockedBatch.classification === "Critical" ? "#ef4444"
                    : shockedBatch.classification === "Fragile" ? "#fbbf24"
                    : shockedBatch.classification === "Stable" ? "#00E0FF"
                    : "#34d399",
                  background: shockedBatch.classification === "Critical" ? "rgba(239,68,68,0.1)"
                    : shockedBatch.classification === "Fragile" ? "rgba(251,191,36,0.1)"
                    : shockedBatch.classification === "Stable" ? "rgba(0,224,255,0.1)"
                    : "rgba(52,211,153,0.1)",
                  border: `1px solid ${
                    shockedBatch.classification === "Critical" ? "rgba(239,68,68,0.25)"
                    : shockedBatch.classification === "Fragile" ? "rgba(251,191,36,0.25)"
                    : shockedBatch.classification === "Stable" ? "rgba(0,224,255,0.25)"
                    : "rgba(52,211,153,0.25)"
                  }`,
                }}
              >
                {shockedBatch.classification}
              </span>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: RISK INDEX + COMMENTARY + LEGAL ═══ */}
        <div className={styles.rightCol}>
          {/* Risk Index Card */}
          {riskIndex && (
            <div className={styles.riskIndexCard}>
              <div className={styles.sectionTitle}>Risk Index</div>
              <div className={styles.riskScoreDisplay}>
                <span
                  className={styles.riskScoreValue}
                  style={{ color: getBandColor(riskIndex.band) }}
                >
                  {(riskIndex.score * 100).toFixed(0)}
                </span>
                <span className={styles.riskScoreMax}>/100</span>
              </div>
              <span
                className={styles.riskBandBadge}
                style={{
                  color: getBandColor(riskIndex.band),
                  background: `${getBandColor(riskIndex.band)}15`,
                  border: `1px solid ${getBandColor(riskIndex.band)}30`,
                }}
              >
                {riskIndex.band}
              </span>

              {/* Component Breakdown */}
              <div className={styles.componentGrid}>
                {([
                  { key: "survivalElasticity", label: "Survival Elasticity" },
                  { key: "runwayElasticity", label: "Runway Elasticity" },
                  { key: "varianceDispersion", label: "Variance Dispersion" },
                  { key: "debtSensitivity", label: "Debt Sensitivity" },
                ] as const).map(({ key, label }) => {
                  const val = riskIndex.components[key];
                  const pct = Math.min(100, val * 100);
                  const barColor = pct > 50 ? "#ef4444" : pct > 25 ? "#fbbf24" : "#00E0FF";
                  return (
                    <div key={key} className={styles.componentRow}>
                      <span className={styles.componentLabel}>{label}</span>
                      <div className={styles.componentBarWrap}>
                        <div
                          className={styles.componentBar}
                          style={{ width: `${pct}%`, background: barColor }}
                        />
                      </div>
                      <span className={styles.componentValue}>{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Reasons */}
              <div className={styles.reasonsList}>
                {riskIndex.reasons.map((r, i) => (
                  <div key={i} className={styles.reasonItem}>
                    <span className={styles.reasonBullet}>–</span>
                    <span className={styles.reasonText}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No-shock state */}
          {!riskIndex && shockSigma === 0 && (
            <div className={styles.riskIndexCard}>
              <div className={styles.sectionTitle}>Risk Index</div>
              <div className={styles.noShockHint}>
                Set σ &gt; 0 to compute the structural risk index.
              </div>
            </div>
          )}

          {/* Commentary */}
          <div className={styles.commentaryCard}>
            <div className={styles.sectionTitle}>Commentary</div>
            <div className={styles.commentaryBody}>
              {shockSigma === 0 && (
                <p className={styles.commentaryText}>
                  Baseline scenario. No perturbation applied. All metrics
                  reflect the current simulation configuration.
                </p>
              )}
              {shockSigma > 0 && shockedBatch && riskIndex && (
                <>
                  <p className={styles.commentaryText}>
                    Under {sigmaLabel.toLowerCase()}, survival probability{" "}
                    {shockedBatch.survivalRate < (baselineMetrics?.survivalRate ?? 0)
                      ? "declines"
                      : "remains stable"}{" "}
                    to{" "}
                    <strong>{(shockedBatch.survivalRate * 100).toFixed(1)}%</strong>.
                  </p>
                  {riskIndex.score > 0.5 && (
                    <p className={styles.commentaryText} style={{ color: "rgba(239,68,68,0.7)" }}>
                      Risk exposure exceeds moderate threshold. Review runway
                      elasticity and capital structure.
                    </p>
                  )}
                  {shockedBatch.classification === "Critical" && (
                    <p className={styles.commentaryText} style={{ color: "#ef4444" }}>
                      Critical fragility detected. This stress level would
                      likely result in business failure without intervention.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Legal Disclosure */}
          <div className={styles.disclosure}>
            <div
              className={styles.disclosureHeader}
              onClick={() => setDisclosureOpen((p) => !p)}
            >
              <span className={styles.disclosureTitle}>Risk Interpretation Notice</span>
              <span
                className={`${styles.disclosureChevron} ${
                  disclosureOpen ? styles.disclosureChevronOpen : ""
                }`}
              >
                ▼
              </span>
            </div>
            {disclosureOpen && (
              <div className={styles.disclosureBody}>
                This risk assessment is probabilistic and model-driven. It
                reflects scenario assumptions and simulation outputs. Shock
                propagation metrics are derived from Monte Carlo simulation
                reruns with perturbed volatility parameters and are subject to
                input sensitivity. It does not constitute financial advice.
                Users are responsible for independent verification and
                professional advice.
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RiskPage;
