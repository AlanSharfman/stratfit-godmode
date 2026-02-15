// src/pages/terrain/BaselineKPIBar.tsx
// STRATFIT — Baseline KPI Bar (Structural Heat System)
// Institutional: under-glow + numeric tint only. No blocks. No flashing.

import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import {
  aggregateStructuralHeatScore,
  buildBaselineModel,
  evaluateStructuralMetric,
  evaluateStructuralScore,
  type HeatResult,
} from "@/logic/heat/structuralHeatEngine";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function rgbFromTokenVar(tokenName: string, alpha: number) {
  // CSS Color 4 — supported in modern Chromium: rgb(from var(--token) r g b / a)
  return `rgb(from var(${tokenName}) r g b / ${alpha})`;
}

function cellStyleFromHeat(heat: HeatResult) {
  const tokenVar = heat.color;
  const glow = rgbFromTokenVar(tokenVar, clamp(heat.glowOpacity, 0, 0.35));
  const border = rgbFromTokenVar(tokenVar, 0.28);
  const surface = rgbFromTokenVar(tokenVar, 0.12); // max 12% surface opacity
  const valueTint = rgbFromTokenVar(tokenVar, 0.92);

  return {
    container: {
      borderBottom: `1px solid ${border}`,
      boxShadow: `0 10px 22px -18px ${glow}, 0 0 18px -12px ${glow}`,
      background: `linear-gradient(180deg, ${surface}, rgba(0,0,0,0))`,
    } as React.CSSProperties,
    value: {
      color: valueTint,
      textShadow: `0 0 14px ${rgbFromTokenVar(tokenVar, 0.28)}`,
    } as React.CSSProperties,
  };
}

export default function BaselineKPIBar() {
  const { baseline } = useSystemBaseline();

  const { engineResults } = useScenarioStore(
    useShallow((s) => ({
      engineResults: s.engineResults,
    })),
  );

  // Survival baseline derived from BASE engine results (not scenario variants)
  const survivalBaselinePct = useMemo(() => {
    const k = engineResults?.base?.kpis;
    const riskIndex = k?.riskIndex?.value;
    // In this codebase, riskIndex is used as "danger"; survival ~= 100 - danger.
    const surv = 100 - (typeof riskIndex === "number" ? riskIndex : 30);
    return clamp(surv, 0, 100);
  }, [engineResults]);

  const ctx = useMemo(() => (baseline ? buildBaselineModel(baseline, survivalBaselinePct) : null), [baseline, survivalBaselinePct]);

  // Display values — baseline truth layer
  const runwayMonths = ctx ? ctx.derived.runwayMonths : 0;
  const runwayDisplay = baseline ? `${Math.round(runwayMonths)}` : "—";

  const grossMargin = baseline?.financial.grossMarginPct ?? 0;
  const marginDisplay = baseline ? `${grossMargin.toFixed(0)}%` : "—";

  const revConc = baseline?.financial.revenueConcentrationPct ?? 0;
  const concDisplay = baseline ? `${revConc.toFixed(0)}%` : "—";

  const burnRatio = ctx ? ctx.derived.burnRatio : 0;
  const burnRatioDisplay = baseline ? burnRatio.toFixed(burnRatio >= 2 ? 1 : 2) : "—";

  const survivalDisplay = baseline ? `${Math.round(survivalBaselinePct)}%` : "—";

  const cashRaw = baseline?.financial.cashOnHand ?? 0;
  const cashDisplay = baseline ? `$${(cashRaw / 1_000_000).toFixed(1)}M` : "—";

  const arr = baseline?.financial.arr ?? 0;
  const arrDisplay = baseline ? `$${(arr / 1_000_000).toFixed(1)}M` : "—";

  const aggregateScore = useMemo(() => (ctx ? aggregateStructuralHeatScore(ctx) : 70), [ctx]);
  const aggregateHeat = useMemo(() => {
    return evaluateStructuralScore(aggregateScore);
  }, [aggregateScore, ctx]);

  // Heat per KPI
  const heatRunway = useMemo(() => (ctx ? evaluateStructuralMetric("runway", runwayMonths, ctx) : null), [ctx, runwayMonths]);
  const heatMargin = useMemo(() => (ctx ? evaluateStructuralMetric("margin", grossMargin, ctx) : null), [ctx, grossMargin]);
  const heatBurn = useMemo(() => (ctx ? evaluateStructuralMetric("burnRatio", burnRatio, ctx) : null), [ctx, burnRatio]);
  const heatConc = useMemo(() => (ctx ? evaluateStructuralMetric("revenueConcentration", revConc, ctx) : null), [ctx, revConc]);
  const heatSurvival = useMemo(() => (ctx ? evaluateStructuralMetric("survivalBaseline", survivalBaselinePct, ctx) : null), [ctx, survivalBaselinePct]);

  // Use aggregateHeat when baseline is missing (keeps strip deterministic)
  const mk = (h: HeatResult | null) => (h ?? aggregateHeat);

  return (
    <div className="kpi-sparkline-section">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: 72,
          background: "linear-gradient(180deg, rgba(8, 12, 20, 0.95), rgba(4, 8, 14, 0.92))",
          borderRadius: 6,
          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
          overflow: "hidden",
          gap: 0,
        }}
      >
        <KPICell label="RUNWAY" value={runwayDisplay} unit="mo" heat={mk(heatRunway)} isFirst />
        <Separator />
        <KPICell label="MARGIN" value={marginDisplay} unit="GM" heat={mk(heatMargin)} />
        <Separator />
        <KPICell label="BURN RATIO" value={burnRatioDisplay} unit="x" heat={mk(heatBurn)} />
        <Separator />
        <KPICell label="CONCENTRATION" value={concDisplay} unit="rev" heat={mk(heatConc)} />
        <Separator />
        <KPICell label="SURVIVAL" value={survivalDisplay} unit="base" heat={mk(heatSurvival)} />
        <Separator />

        {/* Secondary — cash + ARR (neutral structural tint = aggregate) */}
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 14, padding: "0 16px" }}>
          <SecondaryMetric label="CASH" value={cashDisplay} heat={aggregateHeat} />
          <SecondaryMetric label="ARR" value={arrDisplay} heat={aggregateHeat} />
        </div>
      </div>
    </div>
  );
}

function KPICell({
  label,
  value,
  unit,
  heat,
  isFirst = false,
}: {
  label: string;
  value: string;
  unit: string;
  heat: HeatResult;
  isFirst?: boolean;
}) {
  const styles = cellStyleFromHeat(heat);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 16px",
        height: "100%",
        minWidth: 0,
        ...(isFirst ? {} : {}),
        ...styles.container,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "rgba(255, 255, 255, 0.40)",
          fontFamily: "'Inter', -apple-system, sans-serif",
          marginBottom: 2,
        }}
      >
        {label}
      </span>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "'Inter', -apple-system, sans-serif",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            ...styles.value,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.30)",
            fontFamily: "'Inter', -apple-system, sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function SecondaryMetric({ label, value, heat }: { label: string; value: string; heat: HeatResult }) {
  const tokenVar = heat.color;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "rgba(255, 255, 255, 0.32)",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: rgbFromTokenVar(tokenVar, 0.72),
          fontFamily: "'Inter', -apple-system, sans-serif",
          letterSpacing: "-0.01em",
          textShadow: `0 0 12px ${rgbFromTokenVar(tokenVar, 0.18)}`,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div
      style={{
        width: 1,
        height: 36,
        background: "rgba(255, 255, 255, 0.06)",
        flexShrink: 0,
      }}
    />
  );
}


