// src/components/studio/TimelineInsights.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline Intelligence Reports
//
// Detects narrative-significant events across the engine timeline:
//   • revenue inflections
//   • risk spikes
//   • valuation acceleration
// Presents as an institutional bullet timeline.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import type { EngineTimelinePoint } from "@/core/engine/types";
import type { TimelineStep } from "@/core/simulation/timelineTypes";

// ────────────────────────────────────────────────────────────────────────────
// INSIGHT TYPES
// ────────────────────────────────────────────────────────────────────────────

type InsightType = "inflection" | "risk_spike" | "acceleration" | "breakeven" | "peak";

interface TimelineInsight {
  type: InsightType;
  stepIndex: number;
  label: string;
  narrative: string;
}

// ────────────────────────────────────────────────────────────────────────────
// DETECTION ENGINE
// ────────────────────────────────────────────────────────────────────────────

function detectInsights(
  timeline: EngineTimelinePoint[],
  steps: TimelineStep[],
): TimelineInsight[] {
  const insights: TimelineInsight[] = [];
  if (timeline.length < 3) return insights;

  // Revenue inflection: growth rate change exceeds threshold
  for (let i = 2; i < timeline.length; i++) {
    const prevGrowth = timeline[i - 1].revenue - timeline[i - 2].revenue;
    const currGrowth = timeline[i].revenue - timeline[i - 1].revenue;
    if (currGrowth > prevGrowth * 1.5 && currGrowth > 0.3) {
      insights.push({
        type: "inflection",
        stepIndex: i,
        label: steps[i]?.label ?? `Step ${i}`,
        narrative: `Revenue growth accelerates beginning ${steps[i]?.label ?? `Step ${i}`}`,
      });
      break; // Only report first
    }
  }

  // Risk spike: riskIndex crosses 0.5 threshold
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].riskIndex >= 0.5 && timeline[i - 1].riskIndex < 0.5) {
      insights.push({
        type: "risk_spike",
        stepIndex: i,
        label: steps[i]?.label ?? `Step ${i}`,
        narrative: `Risk index elevates above critical threshold at ${steps[i]?.label ?? `Step ${i}`}`,
      });
      break;
    }
  }

  // EBITDA breakeven
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].ebitda >= 0 && timeline[i - 1].ebitda < 0) {
      insights.push({
        type: "breakeven",
        stepIndex: i,
        label: steps[i]?.label ?? `Step ${i}`,
        narrative: `EBITDA reaches breakeven at ${steps[i]?.label ?? `Step ${i}`}`,
      });
      break;
    }
  }

  // EV acceleration: consecutive growth rate increase
  for (let i = 2; i < timeline.length; i++) {
    const prevG = timeline[i - 1].enterpriseValue - timeline[i - 2].enterpriseValue;
    const currG = timeline[i].enterpriseValue - timeline[i - 1].enterpriseValue;
    if (currG > prevG * 1.8 && currG > 1) {
      insights.push({
        type: "acceleration",
        stepIndex: i,
        label: steps[i]?.label ?? `Step ${i}`,
        narrative: `Enterprise value acceleration detected from ${steps[i]?.label ?? `Step ${i}`}`,
      });
      break;
    }
  }

  // Peak EV
  let peakIdx = 0;
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].enterpriseValue > timeline[peakIdx].enterpriseValue) {
      peakIdx = i;
    }
  }
  if (peakIdx > 0 && peakIdx < timeline.length - 1) {
    insights.push({
      type: "peak",
      stepIndex: peakIdx,
      label: steps[peakIdx]?.label ?? `Step ${peakIdx}`,
      narrative: `Peak enterprise value reached at ${steps[peakIdx]?.label ?? `Step ${peakIdx}`}`,
    });
  }

  // Sort by step index
  insights.sort((a, b) => a.stepIndex - b.stepIndex);

  return insights;
}

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";
const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const CYAN = "rgba(34, 211, 238, 0.85)";

const TYPE_COLORS: Record<InsightType, string> = {
  inflection: "rgba(34, 211, 238, 0.85)",
  risk_spike: "rgba(239, 68, 68, 0.85)",
  acceleration: "rgba(34, 197, 94, 0.85)",
  breakeven: "rgba(250, 204, 21, 0.85)",
  peak: "rgba(168, 85, 247, 0.85)",
};

const TYPE_ICONS: Record<InsightType, string> = {
  inflection: "↗",
  risk_spike: "⚠",
  acceleration: "◆",
  breakeven: "◎",
  peak: "▲",
};

const S: Record<string, React.CSSProperties> = {
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    padding: "10px 0",
  },
  header: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(148, 180, 214, 0.55)",
    fontFamily: FONT,
    padding: "0 12px 8px",
  },
  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "8px 12px",
    borderLeft: "2px solid transparent",
    transition: "border-color 150ms ease",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: 3,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: 700,
    fontFamily: MONO,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  narrative: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "rgba(226, 240, 255, 0.7)",
    fontFamily: FONT,
  },
  empty: {
    padding: "16px 12px",
    textAlign: "center" as const,
    fontSize: 11,
    color: "rgba(148, 180, 214, 0.3)",
    fontFamily: FONT,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  engineTimeline: EngineTimelinePoint[];
  timelineSteps: TimelineStep[];
  currentStep: number;
}

const TimelineInsights: React.FC<Props> = memo(
  ({ engineTimeline, timelineSteps, currentStep }) => {
    const insights = useMemo(
      () => detectInsights(engineTimeline, timelineSteps),
      [engineTimeline, timelineSteps],
    );

    if (insights.length === 0) {
      return <div style={S.empty}>No significant events detected.</div>;
    }

    return (
      <div style={S.panel}>
        <div style={S.header}>Intelligence Timeline</div>
        {insights.map((ins, idx) => {
          const isReached = currentStep >= ins.stepIndex;
          const color = TYPE_COLORS[ins.type];
          return (
            <div
              key={idx}
              style={{
                ...S.item,
                borderLeftColor: isReached ? color : "rgba(255,255,255,0.04)",
                opacity: isReached ? 1 : 0.45,
              }}
            >
              <div
                style={{
                  ...S.dot,
                  background: isReached ? color : "rgba(255,255,255,0.12)",
                  boxShadow: isReached ? `0 0 8px ${color}` : "none",
                }}
              />
              <div style={S.content}>
                <span style={{ ...S.stepLabel, color }}>
                  {TYPE_ICONS[ins.type]} {ins.label}
                </span>
                <span style={S.narrative}>{ins.narrative}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

TimelineInsights.displayName = "TimelineInsights";
export default TimelineInsights;
