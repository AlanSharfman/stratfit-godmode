// src/components/KPISparklineSection.tsx
// STRATFIT — AVIONICS KPI INSTRUMENT STRIP
// Clean, institutional, flat telemetry — Runway · Momentum · Survival · Cash · EV · Revenue
// No particles, no starships, no dials. Bloomberg-meets-Palantir.

import React from "react";
import { useSimulationKpiSnapshot, useSelectSimulationKpis } from "@/selectors/simulationKpiSelector";

// ============================================================================
// MAIN COMPONENT — AVIONICS INSTRUMENT STRIP
// ============================================================================

export default function KPISparklineSection() {
  const { raw } = useSimulationKpiSnapshot();
  const simKpis = useSelectSimulationKpis();

  // Derived metrics from simulation — single KPI source
  const runway = simKpis?.runwayMonths ?? 24;
  const runwayDisplay = `${Math.round(runway)}`;

  const growthRaw = raw?.growthRate ?? 8;
  const growthPct = growthRaw > 1 ? growthRaw : growthRaw * 100;
  const momentumDisplay = `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(0)}%`;

  const riskScore = simKpis?.riskIndex ?? 30;
  const survivalPct = Math.round(100 - riskScore);
  const survivalDisplay = `${survivalPct}%`;

  const cashRaw = simKpis?.cashOnHand ?? 4_200_000;
  const cashDisplay = `$${(cashRaw / 1_000_000).toFixed(1)}M`;

  // Enterprise Value
  const evRaw = simKpis?.valuationEstimate ?? 0;
  const evDisplay = evRaw > 0 ? `$${(evRaw / 1_000_000).toFixed(1)}M` : "—";

  // Burn
  const burnMonthly = simKpis?.burnMonthly ?? 0;
  const burnDisplay = burnMonthly > 0 ? `$${(burnMonthly / 1_000).toFixed(0)}K` : "—";

  // Revenue
  const arrVal = simKpis?.arr ?? 0;
  const arrCurrent = arrVal > 0 ? `$${(arrVal / 1_000_000).toFixed(1)}M` : "$4.0M";
  const arrNext = arrVal > 0 ? `$${((arrVal * 1.2) / 1_000_000).toFixed(1)}M` : "$4.8M";

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
        {/* RUNWAY */}
        <KPICell label="RUNWAY" value={runwayDisplay} unit="mo" isFirst />
        <Separator />

        {/* MOMENTUM */}
        <KPICell label="MOMENTUM" value={momentumDisplay} unit="MoM" />
        <Separator />

        {/* SURVIVAL */}
        <KPICell label="SURVIVAL" value={survivalDisplay} unit="prob" />
        <Separator />

        {/* CASH POSITION */}
        <KPICell label="CASH" value={cashDisplay} unit="pos" />
        <Separator />

        {/* ENTERPRISE VALUE */}
        <KPICell label="EV" value={evDisplay} unit="val" />
        <Separator />

        {/* REVENUE (secondary — compact) */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "rgba(255, 255, 255, 0.35)",
                fontFamily: "'Inter', -apple-system, sans-serif",
              }}
            >
              REVENUE
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.5)",
                fontFamily: "'Inter', -apple-system, sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              {arrCurrent}
              <span style={{ color: "rgba(255, 255, 255, 0.2)", margin: "0 4px", fontSize: 12 }}>→</span>
              {arrNext}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KPI CELL — Single metric display
// ============================================================================

function KPICell({
  label,
  value,
  unit,
  isFirst = false,
}: {
  label: string;
  value: string;
  unit: string;
  isFirst?: boolean;
}) {
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
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "rgba(255, 255, 255, 0.4)",
          fontFamily: "'Inter', -apple-system, sans-serif",
          marginBottom: 2,
        }}
      >
        {label}
      </span>

      {/* Value + Unit */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#22d3ee",
            fontFamily: "'Inter', -apple-system, sans-serif",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.3)",
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

// ============================================================================
// SEPARATOR — Thin vertical line between cells
// ============================================================================

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
