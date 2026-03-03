// src/components/studio/TimelineMetrics.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline KPI Panel
//
// Displays engine-derived metrics for the current timeline step:
// Revenue, EBITDA, Risk Index, Enterprise Value.
// Glass panel, cyan accent, institutional typography.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import type { EngineTimelinePoint } from "@/core/engine/types";

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";
const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const CYAN = "rgba(34, 211, 238, 0.85)";

const S: Record<string, React.CSSProperties> = {
  panel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    background: "rgba(6, 12, 20, 0.65)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(182, 228, 255, 0.1)",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "8px 10px",
    borderRadius: 6,
    background: "rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(182, 228, 255, 0.06)",
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(148, 180, 214, 0.55)",
    fontFamily: FONT,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: MONO,
    color: "#e2e8f0",
    letterSpacing: "-0.01em",
  },
  cardDelta: {
    fontSize: 9,
    fontFamily: MONO,
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  empty: {
    padding: "20px 12px",
    textAlign: "center" as const,
    fontSize: 11,
    color: "rgba(148, 180, 214, 0.35)",
    fontFamily: FONT,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function fmtDollar(v: number): string {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(1)}M`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function deltaColor(v: number): string {
  if (v > 0) return "rgba(34, 197, 94, 0.85)";
  if (v < 0) return "rgba(239, 68, 68, 0.85)";
  return "rgba(148, 180, 214, 0.5)";
}

function deltaStr(curr: number, prev: number): string {
  const d = curr - prev;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(2)}`;
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  currentPoint: EngineTimelinePoint | null;
  previousPoint: EngineTimelinePoint | null;
}

const TimelineMetrics: React.FC<Props> = memo(({ currentPoint, previousPoint }) => {
  if (!currentPoint) {
    return <div style={S.empty}>Generate a timeline to view metrics.</div>;
  }

  const metrics = useMemo(() => {
    const prev = previousPoint ?? currentPoint;
    return [
      {
        label: "Revenue",
        value: fmtDollar(currentPoint.revenue),
        delta: deltaStr(currentPoint.revenue, prev.revenue),
        deltaC: deltaColor(currentPoint.revenue - prev.revenue),
      },
      {
        label: "EBITDA",
        value: fmtDollar(currentPoint.ebitda),
        delta: deltaStr(currentPoint.ebitda, prev.ebitda),
        deltaC: deltaColor(currentPoint.ebitda - prev.ebitda),
      },
      {
        label: "Risk Index",
        value: fmtPct(currentPoint.riskIndex),
        delta: deltaStr(currentPoint.riskIndex, prev.riskIndex),
        deltaC: deltaColor(-(currentPoint.riskIndex - prev.riskIndex)), // lower = better
      },
      {
        label: "Enterprise Value",
        value: fmtDollar(currentPoint.enterpriseValue),
        delta: deltaStr(currentPoint.enterpriseValue, prev.enterpriseValue),
        deltaC: deltaColor(currentPoint.enterpriseValue - prev.enterpriseValue),
      },
    ];
  }, [currentPoint, previousPoint]);

  return (
    <div style={S.panel}>
      {metrics.map((m) => (
        <div key={m.label} style={S.card}>
          <span style={S.cardLabel}>{m.label}</span>
          <span style={S.cardValue}>{m.value}</span>
          <span style={{ ...S.cardDelta, color: m.deltaC }}>{m.delta}</span>
        </div>
      ))}
    </div>
  );
});

TimelineMetrics.displayName = "TimelineMetrics";
export default TimelineMetrics;
