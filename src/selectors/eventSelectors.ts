// src/selectors/eventSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline Event Beacon Generator
//
// Scans engineResults.timeline for significant events:
//   • Revenue inflection (Δ revenue > threshold)
//   • Risk spike (Δ risk > threshold)
//   • Valuation jump (Δ EV > threshold)
//
// Returns beacon positions for the terrain signal system.
// Maximum 8 beacons for performance safety.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineTimelinePoint } from "@/core/engine/types";

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type BeaconType = "revenue_inflection" | "risk_spike" | "valuation_jump" | "breakeven";

export interface TimelineBeacon {
  /** Unique id for keying */
  id: string;
  /** Timeline step index */
  stepIndex: number;
  /** Event type */
  type: BeaconType;
  /** Human-readable label */
  label: string;
  /** Short description */
  description: string;
  /** Normalized x-position on terrain (0..1 across timeline) */
  normalizedX: number;
  /** The engine point at this step */
  point: EngineTimelinePoint;
}

// ────────────────────────────────────────────────────────────────────────────
// THRESHOLDS
// ────────────────────────────────────────────────────────────────────────────

/** Minimum revenue delta (step-over-step) to trigger inflection */
const REVENUE_DELTA_THRESHOLD = 0.35;
/** Minimum risk delta (step-over-step) to trigger spike */
const RISK_DELTA_THRESHOLD = 0.06;
/** Minimum EV delta (step-over-step) to trigger valuation jump */
const EV_DELTA_THRESHOLD = 2.0;
/** Maximum beacons returned (performance safety) */
const MAX_BEACONS = 8;
/** Minimum steps between beacons of the same type to avoid clustering */
const MIN_SPACING = 2;

// ────────────────────────────────────────────────────────────────────────────
// BEACON COLORS
// ────────────────────────────────────────────────────────────────────────────

export const BEACON_COLORS: Record<BeaconType, string> = {
  revenue_inflection: "#22d3ee", // cyan
  risk_spike: "#ef4444",         // red
  valuation_jump: "#22c55e",     // green
  breakeven: "#facc15",          // yellow
};

export const BEACON_ICONS: Record<BeaconType, string> = {
  revenue_inflection: "↗",
  risk_spike: "⚠",
  valuation_jump: "◆",
  breakeven: "◎",
};

// ────────────────────────────────────────────────────────────────────────────
// SCANNER
// ────────────────────────────────────────────────────────────────────────────

export function selectTimelineBeacons(
  timeline: EngineTimelinePoint[],
): TimelineBeacon[] {
  if (timeline.length < 3) return [];

  const raw: TimelineBeacon[] = [];
  const lastByType: Record<BeaconType, number> = {
    revenue_inflection: -100,
    risk_spike: -100,
    valuation_jump: -100,
    breakeven: -100,
  };

  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1];
    const curr = timeline[i];
    const normX = i / (timeline.length - 1);

    // Revenue inflection
    const revDelta = curr.revenue - prev.revenue;
    if (
      revDelta > REVENUE_DELTA_THRESHOLD &&
      i - lastByType.revenue_inflection >= MIN_SPACING
    ) {
      raw.push({
        id: `rev-${i}`,
        stepIndex: i,
        type: "revenue_inflection",
        label: `Revenue +$${revDelta.toFixed(1)}M`,
        description: "Revenue growth acceleration detected",
        normalizedX: normX,
        point: curr,
      });
      lastByType.revenue_inflection = i;
    }

    // Risk spike
    const riskDelta = curr.riskIndex - prev.riskIndex;
    if (
      riskDelta > RISK_DELTA_THRESHOLD &&
      i - lastByType.risk_spike >= MIN_SPACING
    ) {
      raw.push({
        id: `risk-${i}`,
        stepIndex: i,
        type: "risk_spike",
        label: `Risk +${(riskDelta * 100).toFixed(0)}%`,
        description: "Risk index spike detected",
        normalizedX: normX,
        point: curr,
      });
      lastByType.risk_spike = i;
    }

    // Valuation jump
    const evDelta = curr.enterpriseValue - prev.enterpriseValue;
    if (
      evDelta > EV_DELTA_THRESHOLD &&
      i - lastByType.valuation_jump >= MIN_SPACING
    ) {
      raw.push({
        id: `ev-${i}`,
        stepIndex: i,
        type: "valuation_jump",
        label: `EV +$${evDelta.toFixed(1)}M`,
        description: "Enterprise value acceleration",
        normalizedX: normX,
        point: curr,
      });
      lastByType.valuation_jump = i;
    }

    // Breakeven
    if (
      prev.ebitda < 0 &&
      curr.ebitda >= 0 &&
      i - lastByType.breakeven >= MIN_SPACING
    ) {
      raw.push({
        id: `be-${i}`,
        stepIndex: i,
        type: "breakeven",
        label: "EBITDA Breakeven",
        description: "EBITDA crosses zero",
        normalizedX: normX,
        point: curr,
      });
      lastByType.breakeven = i;
    }
  }

  // Sort by importance: risk_spike > breakeven > revenue_inflection > valuation_jump
  const priority: Record<BeaconType, number> = {
    risk_spike: 0,
    breakeven: 1,
    revenue_inflection: 2,
    valuation_jump: 3,
  };
  raw.sort((a, b) => priority[a.type] - priority[b.type]);

  // Cap at MAX_BEACONS, then re-sort by step for spatial ordering
  const capped = raw.slice(0, MAX_BEACONS);
  capped.sort((a, b) => a.stepIndex - b.stepIndex);

  return capped;
}
