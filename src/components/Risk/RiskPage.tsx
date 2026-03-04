// src/components/Risk/RiskPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — RISK INTELLIGENCE THEATRE
//
// Layout:
//   TOP (48%)  — Risk terrain with heatmap overlay + strategic markers
//   STRIP      — Risk Index · Survival · Runway · Classification · Trend
//   BOTTOM-L   — Scenario risk comparison cards (A / B / C)
//   BOTTOM-R   — AI risk narrative + interactive stress test slider
//
// Data flow:
//   phase1ScenarioStore → scenarios[] → per-scenario risk metrics
//   riskStore.shockSigma → computeShockedBatch → stressed metrics + terrain heatmap
//   baselineStore → deriveTerrainMetrics → terrain rendering
//   selectTerrainEvents → risk events on terrain surface
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRiskStore } from "@/state/riskStore";
import { useLeverStore } from "@/state/leverStore";
import { useSimulationStore } from "@/state/simulationStore";
import { useBaselineStore } from "@/state/baselineStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import { selectRiskScore } from "@/selectors/riskSelectors";
import { selectTerrainEvents } from "@/selectors/terrainSelectors";
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";
import type { TerrainEvent } from "@/domain/events/terrainEventTypes";
import SoftGateOverlay from "@/components/common/SoftGateOverlay";
import ProvenanceBadge from "@/components/system/ProvenanceBadge";
import PortalNav from "@/components/nav/PortalNav";
import TimelineSyncStrip from "@/components/timeline/TimelineSyncStrip";
import TerrainStage from "@/terrain/TerrainStage";
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig";
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere";

import {
  computeShockedBatch,
  computeRiskIndex,
  type ShockedBatchResult,
  type BaselineMetrics,
  type RiskIndexResult,
} from "@/logic/risk/computeRiskIndex";
import type { LeverState, SimulationConfig } from "@/logic/monteCarloEngine";

import styles from "./RiskPage.module.css";

// ── Constants ────────────────────────────────────────────────────────────

const SIGMA_LABELS: Record<number, string> = {
  0: "Baseline",
  1: "Moderate",
  2: "Severe",
  3: "Extreme",
};

function sigmaColor(s: number): string {
  if (s <= 0) return "#00E0FF";
  if (s <= 1) return "#fbbf24";
  if (s <= 2) return "#f97316";
  return "#ef4444";
}

function bandColor(band: string): string {
  if (band === "Low") return "#34d399";
  if (band === "Moderate") return "#00E0FF";
  if (band === "Elevated") return "#fbbf24";
  return "#ef4444";
}

function survivalColor(rate: number): string {
  if (rate >= 0.8) return "#34d399";
  if (rate >= 0.5) return "#fbbf24";
  return "#ef4444";
}

const SLOT_COLORS = ["#94b4d6", "#22c55e", "#a855f7"];

// ── Scenario risk card data ──────────────────────────────────────────────

interface ScenarioRiskCard {
  id: string;
  name: string;
  riskScore: number | null;
  survivalRate: number | null;
  runwayMonths: number | null;
  topThreats: Array<{ type: string; severity: number }>;
  band: string;
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════

const RiskPage: React.FC = () => {
  // ── Store reads ──
  const shockSigma = useRiskStore((s) => s.shockSigma);
  const setShockSigma = useRiskStore((s) => s.setShockSigma);
  const fullResult = useSimulationStore((s) => s.fullResult);
  const summary = useSimulationStore((s) => s.summary);
  const leversRaw = useLeverStore((s) => s.levers);
  const { baseline: systemBaseline } = useSystemBaseline();
  const zustandBaseline = useBaselineStore((s) => s.baseline);
  const zustandHydrated = useBaselineStore((s) => s.isHydrated);
  const hydrateBaseline = useBaselineStore((s) => s.hydrate);
  const hasBaseline = zustandBaseline !== null || systemBaseline !== null;

  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);

  // ── Local state ──
  const [shockedBatch, setShockedBatch] = useState<ShockedBatchResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [focusedScenarioId, setFocusedScenarioId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { hydrateBaseline(); }, [hydrateBaseline]);

  // Use active scenario as initial focus
  useEffect(() => {
    if (!focusedScenarioId && activeScenarioId) setFocusedScenarioId(activeScenarioId);
  }, [activeScenarioId, focusedScenarioId]);

  // ── Terrain metrics ──
  const terrainMetrics = useMemo<TerrainMetrics | undefined>(() => {
    if (!zustandBaseline && !systemBaseline) return undefined;
    const source = zustandBaseline ?? systemBaseline;
    if (!source) return undefined;
    return deriveTerrainMetrics(source as Record<string, unknown>);
  }, [zustandBaseline, systemBaseline]);

  // ── Terrain events (risk-focused) from active scenario ──
  const focusedScenario = useMemo(
    () => scenarios.find((s) => s.id === (focusedScenarioId ?? activeScenarioId)) ?? null,
    [scenarios, focusedScenarioId, activeScenarioId],
  );
  const terrainEvents = useMemo<TerrainEvent[]>(
    () => selectTerrainEvents(focusedScenario?.simulationResults ?? null),
    [focusedScenario],
  );

  // ── Levers ──
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
    [leversRaw],
  );

  const config: SimulationConfig = useMemo(() => {
    const fin = systemBaseline?.financial;
    const zb = zustandBaseline;
    return {
      iterations: 200,
      timeHorizonMonths: fullResult?.timeHorizonMonths ?? 36,
      startingCash: fin?.cashOnHand ?? zb?.cash ?? 4_000_000,
      startingARR: fin?.arr ?? zb?.revenue ?? 4_800_000,
      monthlyBurn: fin?.monthlyBurn ?? zb?.monthlyBurn ?? 47_000,
    };
  }, [fullResult, systemBaseline, zustandBaseline]);

  // ── Baseline metrics ──
  const baselineMetrics: BaselineMetrics | null = useMemo(() => {
    if (fullResult && summary) {
      const allGrowths = fullResult.allSimulations.flatMap((r: any) =>
        r.monthlySnapshots.map((s: any) => s.growthRate),
      );
      const negGrowths = allGrowths.filter((g: number) => g < 0);
      const churnRate =
        negGrowths.length > 0
          ? Math.abs(negGrowths.reduce((a: number, b: number) => a + b, 0) / negGrowths.length) * 100
          : 0;
      return {
        survivalRate: fullResult.survivalRate,
        medianARR: fullResult.arrPercentiles.p50,
        medianRunway: fullResult.runwayPercentiles.p50,
        medianBurn:
          fullResult.allSimulations.reduce((sum: number, s: any) => {
            const last = s.monthlySnapshots[s.monthlySnapshots.length - 1];
            return sum + (last?.burn ?? 0);
          }, 0) / fullResult.allSimulations.length,
        churnRate,
      };
    }
    if (!hasBaseline) return null;
    const batch = computeShockedBatch(levers, config, 0, 200);
    return {
      survivalRate: batch.survivalRate,
      medianARR: batch.medianARR,
      medianRunway: batch.medianRunway,
      medianBurn: batch.medianBurn,
      churnRate: batch.churnRate,
    };
  }, [fullResult, summary, hasBaseline, levers, config]);

  const arrPercentiles = useMemo(() => {
    if (fullResult) return fullResult.arrPercentiles;
    if (!hasBaseline) return null;
    const batch = computeShockedBatch(levers, config, 0, 200);
    const med = batch.medianARR;
    return { p25: med * 0.8, p50: med, p75: med * 1.25 };
  }, [fullResult, hasBaseline, levers, config]);

  // ── Shock computation (debounced) ──
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [shockSigma, levers, config, baselineMetrics]);

  // ── Risk Index ──
  const riskIndex: RiskIndexResult | null = useMemo(() => {
    if (!baselineMetrics || !shockedBatch || !arrPercentiles) return null;
    return computeRiskIndex({
      baselineSurvival: baselineMetrics.survivalRate,
      shockedSurvival: shockedBatch.survivalRate,
      baselineRunway: baselineMetrics.medianRunway,
      shockedRunway: shockedBatch.medianRunway,
      arrP25: arrPercentiles.p25,
      arrP50: arrPercentiles.p50,
      arrP75: arrPercentiles.p75,
      leverDebtExposure: levers.fundingPressure,
    });
  }, [baselineMetrics, shockedBatch, arrPercentiles, levers.fundingPressure]);

  // ── Scenario risk cards ──
  const scenarioCards = useMemo<ScenarioRiskCard[]>(() => {
    return scenarios.slice(0, 3).map((sc) => {
      const sim = sc.simulationResults;
      const riskScore = sim?.kpis ? selectRiskScore(sim.kpis) : null;
      const events = selectTerrainEvents(sim);
      const riskEvents = events
        .filter((e) => e.type === "risk_spike" || e.type === "liquidity_stress" || e.type === "downside_regime")
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 3);

      const survivalRate: number | null = null; // Not directly on SimulationResults — derive from riskScore
      const runwayMonths = sim?.kpis?.runway ?? null;

      let band = "—";
      if (riskScore != null) {
        if (riskScore >= 70) band = "Low";
        else if (riskScore >= 40) band = "Moderate";
        else if (riskScore >= 20) band = "Elevated";
        else band = "Critical";
      }

      return {
        id: sc.id,
        name: sc.decision || `Scenario ${sc.id.slice(0, 6)}`,
        riskScore,
        survivalRate,
        runwayMonths,
        topThreats: riskEvents.map((e) => ({ type: e.type.replace(/_/g, " "), severity: e.severity })),
        band,
      };
    });
  }, [scenarios]);

  // ── Risk narrative ──
  const riskNarrative = useMemo(() => {
    if (!baselineMetrics) return null;
    const survival = baselineMetrics.survivalRate;
    const runway = baselineMetrics.medianRunway;
    const riskEvents = terrainEvents.filter(
      (e) => e.type === "risk_spike" || e.type === "liquidity_stress" || e.type === "downside_regime",
    );
    const shocked = shockedBatch;

    const lines: string[] = [];
    lines.push(
      `The current risk landscape shows a baseline survival probability of **${(survival * 100).toFixed(1)}%** across the simulation horizon, with an estimated runway of **${Math.round(runway)} months**.`,
    );

    if (riskEvents.length > 0) {
      const top = riskEvents.sort((a, b) => b.severity - a.severity).slice(0, 3);
      lines.push(
        `The terrain surface has detected **${riskEvents.length} risk signal${riskEvents.length > 1 ? "s" : ""}** — the most significant being ${top.map((e) => `${e.description} (${(e.severity * 100).toFixed(0)}% severity)`).join(", ")}.`,
      );
    } else {
      lines.push("No concentrated risk hotspots have been detected on the current terrain surface.");
    }

    if (shocked) {
      const delta = ((survival - shocked.survivalRate) * 100).toFixed(1);
      lines.push(
        `Under **${SIGMA_LABELS[Math.round(shockSigma)] ?? `σ=${shockSigma.toFixed(1)}`} stress**, survival probability drops by **${delta} percentage points** to ${(shocked.survivalRate * 100).toFixed(1)}%. Classification: **${shocked.classification}**.`,
      );
    }

    if (scenarioCards.length >= 2) {
      const sorted = [...scenarioCards].filter((c) => c.riskScore != null).sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
      if (sorted.length >= 2) {
        lines.push(
          `Comparing scenarios: **${sorted[0].name}** has the strongest risk profile (score ${sorted[0].riskScore}), while **${sorted[sorted.length - 1].name}** carries the most structural risk (score ${sorted[sorted.length - 1].riskScore}).`,
        );
      }
    }

    lines.push("All figures are probability-weighted simulation indicators, not forecasts.");
    return lines;
  }, [baselineMetrics, terrainEvents, shockedBatch, shockSigma, scenarioCards]);

  // ── Derived command strip values ──
  const cmdRiskScore = riskIndex ? Math.round(riskIndex.score * 100) : (baselineMetrics ? 0 : null);
  const cmdSurvival = shockedBatch?.survivalRate ?? baselineMetrics?.survivalRate ?? null;
  const cmdRunway = shockedBatch?.medianRunway ?? baselineMetrics?.medianRunway ?? null;
  const cmdBand = riskIndex?.band ?? (shockedBatch?.classification ?? "—");
  const cmdTrend = useMemo(() => {
    if (!riskIndex) return "stable" as const;
    if (riskIndex.score < 0.25) return "improving" as const;
    if (riskIndex.score > 0.6) return "deteriorating" as const;
    return "stable" as const;
  }, [riskIndex]);

  // ── Sigma slider handler ──
  const handleSigma = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setShockSigma(parseFloat(e.target.value)),
    [setShockSigma],
  );

  // ── Gate: no baseline ──
  if (!hasBaseline && zustandHydrated) {
    return (
      <div className={styles.root} style={{ position: "relative" }}>
        <PortalNav />
        <SoftGateOverlay message="Complete onboarding before running risk analysis." />
        <div style={{ filter: "blur(4px)" }}>
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Risk Intelligence Unavailable</div>
            <div className={styles.emptyText}>Complete onboarding to unlock the risk terrain.</div>
          </div>
        </div>
      </div>
    );
  }

  const sc = sigmaColor(shockSigma);

  return (
    <div className={styles.root}>
      <PortalNav />
      <TimelineSyncStrip mode="risk" />

      {/* ═══ TERRAIN HERO ═══ */}
      <div className={styles.terrainHero}>
        <TerrainStage
          terrainMetrics={terrainMetrics}
          heatmapEnabled={shockSigma > 0}
          overrideEvents={terrainEvents}
          pathsEnabled={false}
          minPolarAngle={0.6}
          maxPolarAngle={1.45}
          rotateSpeed={0.4}
        >
          <CameraCompositionRig />
          <SkyAtmosphere />
        </TerrainStage>
        <div className={styles.terrainVignette} />
        <div className={styles.terrainBadge}>
          <span className={styles.terrainBadgeDot} />
          Risk Terrain {shockSigma > 0 ? `· σ${shockSigma.toFixed(1)} Stress` : "· Live"}
        </div>
      </div>

      {/* ═══ RISK COMMAND STRIP ═══ */}
      <div className={styles.commandStrip}>
        <div className={styles.cmdCell}>
          <span className={styles.cmdLabel}>Risk Index</span>
          <span className={styles.cmdValue} style={{ color: cmdRiskScore != null && cmdRiskScore > 50 ? "#ef4444" : cmdRiskScore != null && cmdRiskScore > 25 ? "#fbbf24" : "#34d399" }}>
            {cmdRiskScore != null ? cmdRiskScore : "—"}
            <span className={styles.cmdSuffix}>/100</span>
          </span>
        </div>
        <div className={styles.cmdCell}>
          <span className={styles.cmdLabel}>Survival</span>
          <span className={styles.cmdValue} style={{ color: cmdSurvival != null ? survivalColor(cmdSurvival) : "rgba(255,255,255,0.3)" }}>
            {cmdSurvival != null ? `${(cmdSurvival * 100).toFixed(0)}%` : "—"}
          </span>
        </div>
        <div className={styles.cmdCell}>
          <span className={styles.cmdLabel}>Runway</span>
          <span className={styles.cmdValue} style={{ color: cmdRunway != null && cmdRunway < 12 ? "#ef4444" : cmdRunway != null && cmdRunway < 24 ? "#fbbf24" : "#34d399" }}>
            {cmdRunway != null ? `${Math.round(cmdRunway)}mo` : "—"}
          </span>
        </div>
        <div className={styles.cmdCell}>
          <span className={styles.cmdLabel}>Classification</span>
          <span
            className={styles.cmdBadge}
            style={{
              color: bandColor(cmdBand),
              background: `${bandColor(cmdBand)}15`,
              border: `1px solid ${bandColor(cmdBand)}30`,
            }}
          >
            {cmdBand}
          </span>
        </div>
        <div className={styles.cmdCell}>
          <span className={styles.cmdLabel}>Trend</span>
          <span className={styles.cmdValue} style={{ color: cmdTrend === "improving" ? "#34d399" : cmdTrend === "deteriorating" ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
            {cmdTrend === "improving" ? "↓ Improving" : cmdTrend === "deteriorating" ? "↑ Deteriorating" : "→ Stable"}
          </span>
        </div>
      </div>

      {/* ═══ BOTTOM PANELS ═══ */}
      <div className={styles.bottomPanels}>
        {/* ── LEFT: SCENARIO RISK COMPARISON ── */}
        <div className={styles.scenarioPanel}>
          <div className={styles.panelTitle}>Scenario Risk Comparison</div>
          {scenarioCards.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, padding: "16px 0" }}>
              Create scenarios in Studio to compare risk profiles side-by-side.
            </div>
          )}
          <div className={styles.scenarioGrid}>
            {scenarioCards.map((card, i) => (
              <div
                key={card.id}
                className={`${styles.scenarioCard} ${focusedScenarioId === card.id ? styles.scenarioCardActive : ""}`}
                onClick={() => setFocusedScenarioId(card.id)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardDot} style={{ background: SLOT_COLORS[i] ?? SLOT_COLORS[0] }} />
                  <span className={styles.cardName}>{card.name}</span>
                </div>
                <div className={styles.cardMetrics}>
                  <div className={styles.cardMetric}>
                    <span className={styles.cardMetricLabel}>Risk Score</span>
                    <span className={styles.cardMetricValue} style={{ color: card.riskScore != null ? bandColor(card.band) : "rgba(255,255,255,0.25)" }}>
                      {card.riskScore ?? "—"}
                    </span>
                  </div>
                  <div className={styles.cardMetric}>
                    <span className={styles.cardMetricLabel}>Survival</span>
                    <span className={styles.cardMetricValue} style={{ color: card.survivalRate != null ? survivalColor(card.survivalRate) : "rgba(255,255,255,0.25)" }}>
                      {card.survivalRate != null ? `${(card.survivalRate * 100).toFixed(0)}%` : "—"}
                    </span>
                  </div>
                  <div className={styles.cardMetric}>
                    <span className={styles.cardMetricLabel}>Runway</span>
                    <span className={styles.cardMetricValue} style={{ color: card.runwayMonths != null && card.runwayMonths < 12 ? "#ef4444" : "rgba(255,255,255,0.7)" }}>
                      {card.runwayMonths != null ? `${Math.round(card.runwayMonths)}mo` : "—"}
                    </span>
                  </div>
                  <div className={styles.cardMetric}>
                    <span className={styles.cardMetricLabel}>Band</span>
                    <span className={styles.cardMetricValue} style={{ color: bandColor(card.band) }}>
                      {card.band}
                    </span>
                  </div>
                </div>
                {card.topThreats.length > 0 && (
                  <div className={styles.cardThreats}>
                    {card.topThreats.map((t, ti) => (
                      <div key={ti} className={styles.threatItem}>
                        <span className={styles.threatDot} style={{ background: t.severity > 0.6 ? "#ef4444" : t.severity > 0.3 ? "#fbbf24" : "#00E0FF" }} />
                        {t.type} · {(t.severity * 100).toFixed(0)}%
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: AI RISK INTELLIGENCE + STRESS TEST ── */}
        <div className={styles.intelligencePanel}>
          <div className={styles.panelTitle}>Risk Intelligence</div>

          {/* AI Narrative */}
          {riskNarrative && (
            <div className={styles.narrativeCard}>
              <div className={styles.narrativeTitle}>AI Risk Assessment</div>
              {riskNarrative.map((line, i) => (
                <p
                  key={i}
                  className={styles.narrativeText}
                  dangerouslySetInnerHTML={{
                    __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              ))}
            </div>
          )}

          {/* Stress Test */}
          <div className={styles.stressSection}>
            <div className={styles.stressHeader}>
              <span className={styles.stressTitle}>Stress Test</span>
              <span className={styles.stressSigma} style={{ color: sc }}>
                σ = {shockSigma.toFixed(1)}
              </span>
            </div>
            <div className={styles.stressSliderWrap}>
              <span className={styles.stressTickLabel}>0</span>
              <input
                type="range"
                className={styles.stressSlider}
                min={0}
                max={3}
                step={0.1}
                value={shockSigma}
                onChange={handleSigma}
                style={{ "--thumb-color": sc } as React.CSSProperties}
              />
              <span className={styles.stressTickLabel}>3</span>
            </div>
            <div className={styles.stressTicks}>
              {[0, 1, 2, 3].map((t) => (
                <button
                  key={t}
                  className={`${styles.stressTickBtn} ${Math.round(shockSigma) === t ? styles.stressTickBtnActive : ""}`}
                  onClick={() => setShockSigma(t)}
                >
                  {t === 0 ? "Base" : `${t}σ`}
                </button>
              ))}
            </div>

            {shockedBatch && (
              <div className={styles.stressResult}>
                <div className={styles.stressMetric}>
                  <span className={styles.stressMetricLabel}>Stressed Survival</span>
                  <span className={styles.stressMetricValue} style={{ color: survivalColor(shockedBatch.survivalRate) }}>
                    {(shockedBatch.survivalRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className={styles.stressMetric}>
                  <span className={styles.stressMetricLabel}>Stressed Runway</span>
                  <span className={styles.stressMetricValue} style={{ color: shockedBatch.medianRunway < 12 ? "#ef4444" : "#fbbf24" }}>
                    {Math.round(shockedBatch.medianRunway)}mo
                  </span>
                </div>
                <div className={styles.stressMetric}>
                  <span className={styles.stressMetricLabel}>Classification</span>
                  <span className={styles.stressMetricValue} style={{
                    color: shockedBatch.classification === "Critical" ? "#ef4444"
                      : shockedBatch.classification === "Fragile" ? "#fbbf24"
                      : "#34d399",
                  }}>
                    {shockedBatch.classification}
                  </span>
                </div>
                <div className={styles.stressMetric}>
                  <span className={styles.stressMetricLabel}>Survival Δ</span>
                  <span className={styles.stressMetricValue} style={{ color: "#ef4444" }}>
                    {baselineMetrics
                      ? `-${((baselineMetrics.survivalRate - shockedBatch.survivalRate) * 100).toFixed(1)}pp`
                      : "—"}
                  </span>
                </div>
              </div>
            )}

            {isComputing && (
              <div style={{ textAlign: "center", padding: "8px 0", color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                Computing shock propagation…
              </div>
            )}
          </div>

          {/* Disclosure */}
          <div className={styles.disclosure}>
            Risk assessment is probabilistic and model-derived. Shock propagation metrics are from Monte Carlo
            reruns with perturbed volatility. Not financial advice.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 0 4px" }}>
            <ProvenanceBadge />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskPage;
