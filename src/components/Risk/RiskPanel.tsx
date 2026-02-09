// src/components/risk/RiskPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Institutional Risk Panel (God Mode)
//
// DATA SOURCE (STRICT):
//   useSystemAnalysis() → SystemAnalysisSnapshot
//
// This panel does NOT read simulationStore, leverStore, valuationStore,
// or scenarioStore directly. All data flows through the canonical
// SystemAnalysisEngine via the useSystemAnalysis hook.
//
// ANTI-LEGACY: Does NOT import AIIntelligenceEnhanced,
//   AIIntelligenceWithSimulation, or scenarioStore.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { useSystemAnalysis } from "@/hooks/useSystemAnalysis";
import {
  getRiskColor,
  fmtPct,
  fmtCurrency,
  type RiskProfile,
} from "@/logic/risk/RiskEngine";
import type { ElasticityResult, TornadoBar, ShockResult } from "@/logic/sensitivity/SensitivityEngine";
import styles from "./RiskPanel.module.css";

// ── Driver labels for existing risk drivers ──
const DRIVER_LABELS: { key: keyof RiskProfile["riskDrivers"]; label: string }[] = [
  { key: "marketVolatilityImpact", label: "Market Volatility" },
  { key: "burnRateImpact", label: "Burn Rate Exposure" },
  { key: "churnImpact", label: "Churn / Retention" },
  { key: "growthVarianceImpact", label: "Growth Variance" },
  { key: "capitalStructureImpact", label: "Capital Structure" },
];

// ═══════════════════════════════════════════════════════════════════════════
// PANEL
// ═══════════════════════════════════════════════════════════════════════════

export const RiskPanel: React.FC = () => {
  const {
    analysis,
    shockResult,
    isComputingShock,
    setShockIntensity,
    shockIntensity,
  } = useSystemAnalysis();

  const [disclosureOpen, setDisclosureOpen] = useState(false);

  const handleShockChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShockIntensity(parseInt(e.target.value, 10));
    },
    [setShockIntensity]
  );

  // ── NOT COMPUTED ──
  if (!analysis.computed) {
    return (
      <div className={styles.root}>
        <div className={styles.notComputed}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            <path d="M28 16V32" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="28" cy="40" r="1.5" fill="rgba(255,255,255,0.3)" />
          </svg>
          <h2 className={styles.notComputedTitle}>Risk Profile Not Computed</h2>
          <p className={styles.notComputedText}>{analysis.reason}</p>
        </div>
      </div>
    );
  }

  const { riskProfile: risk, sensitivityMap, tornadoRanking, confidenceScore } = analysis;
  const color = getRiskColor(risk.classification);
  const sortedDrivers = [...DRIVER_LABELS].sort((a, b) => risk.riskDrivers[b.key] - risk.riskDrivers[a.key]);
  const lowSample = risk.iterationCount < 1000;
  const lowConfidence = confidenceScore.classification === "Low";

  return (
    <div className={styles.root}>
      {/* ═══ TOP STRIP ═══ */}
      <div className={styles.topStrip}>
        <div className={styles.survivalBlock}>
          <span className={styles.survivalValue} style={{ color }}>{fmtPct(risk.survivalProbability)}</span>
          <span className={styles.survivalLabel}>Survival Probability</span>
        </div>
        <div className={styles.stripSep} />
        <div className={styles.metricCol}>
          <span className={styles.metricValue} style={{ color: "rgba(239,68,68,0.85)" }}>{fmtPct(risk.failureProbability)}</span>
          <span className={styles.metricLabel}>Failure Probability</span>
        </div>
        <div className={styles.classificationBadge} style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
          {risk.classification}
        </div>
      </div>

      {/* ═══ WARNINGS ═══ */}
      {lowSample && (
        <div className={styles.warningStrip} style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", color: "#fbbf24" }}>
          <span className={styles.warningIcon}>⚠</span>
          Statistical sample size below institutional threshold ({risk.iterationCount.toLocaleString()} iterations). Recommend ≥ 1,000.
        </div>
      )}
      {lowConfidence && (
        <div className={styles.warningStrip} style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}>
          <span className={styles.warningIcon}>⚠</span>
          Low model confidence ({confidenceScore.confidenceScore.toFixed(0)}/100). Interpret cautiously.
        </div>
      )}

      {/* ═══ MIDDLE METRICS ═══ */}
      <div className={styles.middleGrid}>
        <div className={styles.metricCard}>
          <span className={styles.cardTitle}>Value at Risk (VaR 95%)</span>
          <span className={styles.cardValue} style={{ color: "#ef4444" }}>{fmtCurrency(risk.valueAtRisk95)}</span>
          <span className={styles.cardHelper}>5th percentile of enterprise value distribution</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.cardTitle}>Tail Risk Score</span>
          <span className={styles.cardValue} style={{ color: risk.tailRiskScore > 0.5 ? "#ef4444" : risk.tailRiskScore > 0.25 ? "#fbbf24" : "#34d399" }}>
            {(risk.tailRiskScore * 100).toFixed(1)}
          </span>
          <span className={styles.cardHelper}>Severity of worst 5% vs median (0 = no tail risk)</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.cardTitle}>Burn Fragility</span>
          <span className={styles.cardValue} style={{ color: risk.burnFragilityIndex > 0.3 ? "#ef4444" : risk.burnFragilityIndex > 0.1 ? "#fbbf24" : "#34d399" }}>
            {fmtPct(risk.burnFragilityIndex)}
          </span>
          <span className={styles.cardHelper}>Probability runway falls below 6 months</span>
        </div>
      </div>

      {/* ═══ VOLATILITY ═══ */}
      <div className={styles.metricCard}>
        <span className={styles.cardTitle}>Volatility Index (CV)</span>
        <span className={styles.cardValue} style={{ color: risk.volatilityIndex > 0.5 ? "#fbbf24" : "#00E0FF", fontSize: 20 }}>
          {risk.volatilityIndex.toFixed(3)}
        </span>
        <span className={styles.cardHelper}>Coefficient of variation across revenue paths. Lower = more predictable.</span>
      </div>

      {/* ═══ DISTRIBUTION CHART ═══ */}
      <DistChart risk={risk} color={color} />

      {/* ═══ RISK DRIVERS ═══ */}
      <div className={styles.driversSection}>
        <div className={styles.driversTitle}>Risk Driver Contributions</div>
        {sortedDrivers.map((d) => {
          const val = risk.riskDrivers[d.key];
          const bc = val > 0.3 ? "#ef4444" : val > 0.15 ? "#fbbf24" : "#00E0FF";
          return (
            <div key={d.key} className={styles.driverRow}>
              <span className={styles.driverLabel}>{d.label}</span>
              <div className={styles.driverBarWrap}>
                <div className={styles.driverBar} style={{ width: `${Math.round(val * 100)}%`, background: bc }} />
              </div>
              <span className={styles.driverPct}>{(val * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      {/* ═══ SENSITIVITY RANKING (Elasticity) ═══ */}
      {sensitivityMap.length > 0 && (
        <SensitivityRanking elasticities={sensitivityMap} />
      )}

      {/* ═══ TORNADO CHART ═══ */}
      {tornadoRanking.length > 0 && (
        <TornadoChart tornado={tornadoRanking} />
      )}

      {/* ═══ SHOCK SLIDER ═══ */}
      <ShockSlider
        shockIntensity={shockIntensity}
        shockResult={shockResult}
        isComputing={isComputingShock}
        onChange={handleShockChange}
        hasConfig={analysis.computed}
      />

      {/* ═══ LEGAL DISCLOSURE ═══ */}
      <div className={styles.disclosure}>
        <div className={styles.disclosureHeader} onClick={() => setDisclosureOpen((p) => !p)}>
          <span className={styles.disclosureTitle}>Risk Interpretation Notice</span>
          <span className={`${styles.disclosureChevron} ${disclosureOpen ? styles.disclosureChevronOpen : ""}`}>▼</span>
        </div>
        {disclosureOpen && (
          <div className={styles.disclosureBody}>
            This risk assessment is probabilistic and model-driven. It reflects scenario assumptions and simulation outputs. It does not constitute financial advice or guarantee of performance. Survival probability, value-at-risk, tail risk, sensitivity, and shock propagation metrics are derived from Monte Carlo simulation reruns and are subject to input sensitivity. Users are responsible for independent verification and professional advice.
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Distribution Mini Chart ──
const DistChart: React.FC<{ risk: RiskProfile; color: string }> = ({ risk, color }) => {
  const w = 400, h = 80;
  const mu = risk.survivalProbability;
  const sigma = Math.max(0.05, risk.volatilityIndex * 0.3);
  const pts: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const x = i / 50;
    const z = (x - mu) / sigma;
    pts.push(`${x * w},${h - Math.exp(-0.5 * z * z) * h * 0.85}`);
  }
  const varX = Math.max(0, Math.min(1, 0.05)) * w;
  return (
    <div className={styles.distChart}>
      <div className={styles.distTitle}>Risk Distribution</div>
      <svg className={styles.distSvg} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={`${color}10`} />
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <line x1={varX} y1={0} x2={varX} y2={h} stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
        <line x1={mu * w} y1={0} x2={mu * w} y2={h} stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2,4" />
      </svg>
    </div>
  );
};

// ── Sensitivity Ranking ──
const SensitivityRanking: React.FC<{ elasticities: ElasticityResult[] }> = ({ elasticities }) => (
  <div className={styles.sensitivitySection}>
    <div className={styles.sectionTitle}>Sensitivity Ranking (Elasticity)</div>
    {elasticities.map((e, i) => {
      const barColor = e.direction === "positive" ? "#34d399" : "#ef4444";
      return (
        <div key={e.variable} className={styles.elasticityRow}>
          <span className={styles.elasticityRank}>#{i + 1}</span>
          <span className={styles.elasticityLabel}>{e.label}</span>
          <div className={styles.elasticityBarWrap}>
            <div className={styles.elasticityBar} style={{ width: `${Math.round(e.elasticityScore * 100)}%`, background: barColor }} />
          </div>
          <span className={styles.elasticityScore}>{(e.elasticityScore * 100).toFixed(0)}%</span>
          <div className={styles.elasticityMeta}>
            <span className={styles.elasticityDelta} style={{ color: e.deltaSurvival >= 0 ? "#34d399" : "#ef4444" }}>
              ΔS {e.deltaSurvival >= 0 ? "+" : ""}{(e.deltaSurvival * 100).toFixed(1)}%
            </span>
            <span className={styles.elasticityDelta} style={{ color: e.deltaRunway >= 0 ? "#34d399" : "#ef4444" }}>
              ΔR {e.deltaRunway >= 0 ? "+" : ""}{e.deltaRunway.toFixed(1)}mo
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

// ── Tornado Chart ──
const TornadoChart: React.FC<{ tornado: TornadoBar[] }> = ({ tornado }) => {
  const maxSpread = Math.max(...tornado.map((t) => t.spread), 0.01);
  return (
    <div className={styles.tornadoSection}>
      <div className={styles.sectionTitle}>Tornado Analysis — Survival Impact (±5% perturbation)</div>
      {tornado.map((t) => {
        const halfSpread = t.spread / 2;
        const scale = 45;
        const leftW = (halfSpread / maxSpread) * scale;
        const rightW = (halfSpread / maxSpread) * scale;
        return (
          <div key={t.variable} className={styles.tornadoRow}>
            <span className={styles.tornadoLabel}>{t.label}</span>
            <div className={styles.tornadoBarContainer}>
              <div className={styles.tornadoCenter} />
              <div className={styles.tornadoBarLeft} style={{ width: `${leftW}%`, background: "#ef4444" }} />
              <div className={styles.tornadoBarRight} style={{ width: `${rightW}%`, background: "#34d399" }} />
            </div>
            <span className={styles.tornadoSpread}>
              {fmtPct(t.lowSurvival)} — {fmtPct(t.highSurvival)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Shock Slider ──
const ShockSlider: React.FC<{
  shockIntensity: number;
  shockResult: ShockResult | null;
  isComputing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasConfig: boolean;
}> = ({ shockIntensity, shockResult, isComputing, onChange, hasConfig }) => {
  if (!hasConfig) return null;

  const shockColor = shockIntensity <= 50 ? "#34d399" : shockIntensity <= 100 ? "#00E0FF" : shockIntensity <= 150 ? "#fbbf24" : "#ef4444";

  return (
    <div className={styles.shockSection}>
      <div className={styles.shockHeader}>
        <span className={styles.sectionTitle}>Shock Propagation Model</span>
      </div>
      <div className={styles.shockSliderWrap}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>0%</span>
        <input
          type="range"
          className={styles.shockSlider}
          min={0}
          max={200}
          step={5}
          value={shockIntensity}
          onChange={onChange}
        />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>200%</span>
        <span className={styles.shockValue} style={{ color: shockColor }}>{shockIntensity}%</span>
      </div>

      {isComputing && <div className={styles.shockComputing}>Recomputing…</div>}

      {shockResult && !isComputing && (
        <div className={styles.shockResults}>
          <div className={styles.shockMetric}>
            <span className={styles.shockMetricLabel}>Survival</span>
            <span className={styles.shockMetricValue} style={{ color: getRiskColor(shockResult.classification) }}>
              {fmtPct(shockResult.survivalProbability)}
            </span>
          </div>
          <div className={styles.shockMetric}>
            <span className={styles.shockMetricLabel}>Median EV</span>
            <span className={styles.shockMetricValue} style={{ color: "rgba(255,255,255,0.75)" }}>
              {fmtCurrency(shockResult.medianEV)}
            </span>
          </div>
          <div className={styles.shockMetric}>
            <span className={styles.shockMetricLabel}>Median Runway</span>
            <span className={styles.shockMetricValue} style={{ color: shockResult.medianRunway < 12 ? "#fbbf24" : "rgba(255,255,255,0.75)" }}>
              {shockResult.medianRunway.toFixed(1)} mo
            </span>
          </div>
          <div className={styles.shockMetric}>
            <span className={styles.shockMetricLabel}>Classification</span>
            <span
              className={styles.shockBadge}
              style={{
                color: getRiskColor(shockResult.classification),
                background: `${getRiskColor(shockResult.classification)}15`,
                border: `1px solid ${getRiskColor(shockResult.classification)}30`,
              }}
            >
              {shockResult.classification}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskPanel;
