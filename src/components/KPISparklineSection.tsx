// src/components/KPISparklineSection.tsx
// STRATFIT — AVIONICS KPI INSTRUMENT STRIP
// Clean, institutional, flat telemetry — Runway · Momentum · Survival · Cash · EV · Revenue
// No particles, no starships, no dials. Bloomberg-meets-Palantir.

import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// MAIN COMPONENT — AVIONICS INSTRUMENT STRIP
// ============================================================================

export default function KPISparklineSection() {
  const { activeScenarioId, engineResults } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );

  // KPI values from engine
  const kpis = engineResults?.[activeScenarioId ?? "base"]?.kpis ?? {};
  
  // Derived metrics
  const runway = kpis.runway?.value ?? 24;
  const runwayDisplay = `${runway}`;

  const growthRaw = kpis.arrGrowthPct?.value ?? 8;
  const growthPct = growthRaw > 1 ? growthRaw : growthRaw * 100;
  const momentumDisplay = `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(0)}%`;
  
  const riskScore = kpis.riskIndex?.value ?? 30;
  const survivalPct = Math.round(100 - riskScore);
  const survivalDisplay = `${survivalPct}%`;

  const cashRaw = kpis.cashPosition?.value ?? 4200000;
  const cashDisplay = `$${(cashRaw / 1_000_000).toFixed(1)}M`;

  // Enterprise Value
  const evRaw = kpis.enterpriseValue?.value ?? 0;
  const evDisplay = evRaw > 0 ? `$${(evRaw / 1_000_000).toFixed(1)}M` : "—";

  // Burn Quality
  const burnRaw = kpis.burnQuality?.value ?? 50;
  const monthlyBurn = burnRaw > 0 ? Math.round(burnRaw * 1000) : 0;
  const burnDisplay = monthlyBurn > 0 ? `$${(monthlyBurn / 1000).toFixed(0)}K` : `${burnRaw}/100`;

  // Revenue
  const arrCurrent = kpis.arrCurrent?.display ?? "$4.0M";
  const arrNext = kpis.arrNext12?.display ?? "$4.8M";

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
