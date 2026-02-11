import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { useScenarioStore } from "@/state/scenarioStore";
import { computeBaselineCompleteness } from "@/logic/confidence/baselineCompleteness";
import {
  aggregateStructuralHeatScore,
  buildBaselineModel,
  evaluateStructuralMetric,
  evaluateStructuralScore,
  type HeatResult,
} from "@/logic/heat/structuralHeatEngine";
import BaselineKPICard from "./BaselineKPICard";
import styles from "./BaselineKPI.module.css";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function fmtUsdM(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

function fmtUsdK(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `$${Math.round(n / 1_000).toFixed(0)}K`;
}

export default function BaselineKPIStrip() {
  const { baseline } = useSystemBaseline();

  const { engineResults, objective, derivedKPIs } = useScenarioStore(
    useShallow((s) => ({
      engineResults: s.engineResults,
      objective: (s as any).objective,
      derivedKPIs: (s as any).derivedKPIs,
    })),
  );

  const baseKpis = engineResults?.base?.kpis ?? null;

  // Baseline Survival % (institutional): use base riskIndex directly (health 0..100)
  const survivalBaselinePct = useMemo(() => {
    const v = baseKpis?.riskIndex?.value;
    return clamp(typeof v === "number" ? v : 70, 0, 100);
  }, [baseKpis]);

  const ctx = useMemo(() => {
    if (!baseline) return null;
    return buildBaselineModel(baseline, survivalBaselinePct);
  }, [baseline, survivalBaselinePct]);

  const runwayMonths = useMemo(() => {
    if (!baseline) return 0;
    const burn = baseline.financial.monthlyBurn || 0;
    const cash = baseline.financial.cashOnHand || 0;
    return burn > 0 ? cash / burn : 999;
  }, [baseline]);

  const burnRatio = useMemo(() => (ctx ? ctx.derived.burnRatio : 0), [ctx]);

  const completeness = useMemo(() => computeBaselineCompleteness(baseline), [baseline]);

  const structuralHeatScore = useMemo(() => (ctx ? aggregateStructuralHeatScore(ctx) : 70), [ctx]);

  // Structural confidence composite (0..100):
  // - 60% structural composition quality
  // - 40% baseline input completeness
  const structuralConfidenceScore = useMemo(() => {
    const comp = clamp(Math.round(completeness.completeness01 * 100), 0, 100);
    const score = structuralHeatScore * 0.6 + comp * 0.4;
    return clamp(Math.round(score), 0, 100);
  }, [completeness.completeness01, structuralHeatScore]);

  const heatAggregate: HeatResult = useMemo(() => evaluateStructuralScore(structuralHeatScore), [structuralHeatScore]);
  const heatConfidence: HeatResult = useMemo(() => evaluateStructuralScore(structuralConfidenceScore), [structuralConfidenceScore]);

  const heatMargin = useMemo(
    () => (ctx ? evaluateStructuralMetric("margin", baseline?.financial.grossMarginPct ?? 0, ctx) : heatAggregate),
    [ctx, baseline?.financial.grossMarginPct, heatAggregate],
  );

  const heatRunway = useMemo(
    () => (ctx ? evaluateStructuralMetric("runway", runwayMonths, ctx) : heatAggregate),
    [ctx, runwayMonths, heatAggregate],
  );

  const heatBurn = useMemo(
    () => (ctx ? evaluateStructuralMetric("burnRatio", burnRatio, ctx) : heatAggregate),
    [ctx, burnRatio, heatAggregate],
  );

  const heatConc = useMemo(
    () => (ctx ? evaluateStructuralMetric("revenueConcentration", baseline?.financial.revenueConcentrationPct ?? 0, ctx) : heatAggregate),
    [ctx, baseline?.financial.revenueConcentrationPct, heatAggregate],
  );

  const heatSurvival = useMemo(
    () => (ctx ? evaluateStructuralMetric("survivalBaseline", survivalBaselinePct, ctx) : heatAggregate),
    [ctx, survivalBaselinePct, heatAggregate],
  );

  // Values
  const arr = baseline?.financial.arr ?? 0;
  const marginPct = baseline?.financial.grossMarginPct ?? 0;
  const burn = baseline?.financial.monthlyBurn ?? 0;
  const concPct = baseline?.financial.revenueConcentrationPct ?? 0;
  const cash = baseline?.financial.cashOnHand ?? 0;

  // Micro stats (objective-aware)
  const objectiveMicro = useMemo(() => {
    const tgt = (objective?.targetARR ?? 0) as number;
    const horizon = (objective?.timeHorizonMonths ?? 0) as number;
    if (tgt > 0 && horizon > 0) return `Objective: ${fmtUsdM(tgt)} in ${horizon}mo`;
    const next12 = baseKpis?.arrNext12?.display;
    return next12 ? `Next 12m: ${next12}` : "Objective not set";
  }, [objective?.targetARR, objective?.timeHorizonMonths, baseKpis]);

  const marginMicro = useMemo(() => {
    const tgt = objective?.marginTarget;
    if (typeof tgt === "number" && tgt > 0) return `Target: ${(tgt * 100).toFixed(0)}%`;
    return "Strong ≥ 60%";
  }, [objective?.marginTarget]);

  const burnMicro = useMemo(() => {
    if (derivedKPIs?.maxBurnAllowed) return `Max allowed: ${fmtUsdK(derivedKPIs.maxBurnAllowed)}/mo`;
    return `Burn ratio: ${burnRatio.toFixed(2)}x`;
  }, [derivedKPIs?.maxBurnAllowed, burnRatio]);

  const runwayMicro = useMemo(() => {
    if (derivedKPIs?.minRunwayMonths) return `Min required: ${derivedKPIs.minRunwayMonths}mo`;
    return `Cash: ${fmtUsdM(cash)}`;
  }, [derivedKPIs?.minRunwayMonths, cash]);

  const concMicro = useMemo(() => "Weak > 70%", []);

  const survivalMicro = useMemo(() => "Critical < 75%", []);

  const confidenceMicro = useMemo(() => {
    const compPct = Math.round(completeness.completeness01 * 100);
    return `Completeness: ${compPct}%`;
  }, [completeness.completeness01]);

  // Tooltips (institutional interpretation)
  const tooltipArr = useMemo(
    () => "ARR is scale, not quality. Heat here reflects composition quality (aggregate), not size.",
    [],
  );
  const tooltipMargin = useMemo(
    () => "Gross margin is structural leverage. ≥60% supports durable reinvestment without liquidity compression.",
    [],
  );
  const tooltipBurn = useMemo(
    () => "Monthly burn must be proportional to revenue capacity. Burn ratio >1.5x increases fragility.",
    [],
  );
  const tooltipRunway = useMemo(
    () => "Runway is time-to-correct. ≥18 months is structurally strong. <12 months narrows options materially.",
    [],
  );
  const tooltipConc = useMemo(
    () => "Revenue concentration increases single-point failure risk. >70% concentration is structurally weak.",
    [],
  );
  const tooltipSurvival = useMemo(
    () => "Baseline survival encodes durability under modeled variance. <75% is treated as critical.",
    [],
  );
  const tooltipConfidence = useMemo(
    () => "Structural confidence is a composite of baseline completeness and composition quality. It does not reflect market sentiment.",
    [],
  );

  return (
    <div className={styles.strip}>
      <div className={styles.grid}>
        <BaselineKPICard
          label="ARR"
          value={baseline ? fmtUsdM(arr) : "—"}
          sub={objectiveMicro}
          heat={heatAggregate}
          tooltip={tooltipArr}
        />
        <BaselineKPICard
          label="GROSS MARGIN"
          value={baseline ? `${marginPct.toFixed(0)}%` : "—"}
          sub={marginMicro}
          heat={heatMargin}
          tooltip={tooltipMargin}
        />
        <BaselineKPICard
          label="MONTHLY BURN"
          value={baseline ? fmtUsdK(burn) : "—"}
          sub={burnMicro}
          heat={heatBurn}
          tooltip={tooltipBurn}
        />
        <BaselineKPICard
          label="RUNWAY"
          value={baseline ? `${Math.round(runwayMonths)}mo` : "—"}
          sub={runwayMicro}
          heat={heatRunway}
          tooltip={tooltipRunway}
        />
        <BaselineKPICard
          label="CONCENTRATION"
          value={baseline ? `${concPct.toFixed(0)}%` : "—"}
          sub={concMicro}
          heat={heatConc}
          tooltip={tooltipConc}
        />
        <BaselineKPICard
          label="BASELINE SURVIVAL"
          value={`${Math.round(survivalBaselinePct)}%`}
          sub={survivalMicro}
          heat={heatSurvival}
          tooltip={tooltipSurvival}
        />
        <BaselineKPICard
          label="STRUCTURAL CONFIDENCE"
          value={`${structuralConfidenceScore}%`}
          sub={confidenceMicro}
          heat={heatConfidence}
          tooltip={tooltipConfidence}
        />
      </div>
    </div>
  );
}


